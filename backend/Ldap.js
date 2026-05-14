const express = require('express');
const cors = require('cors');
const axios = require('axios');
const ldap = require('ldapjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env'), override: true });

const app = express();
app.use(express.json());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));

const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET;
const LDAP_URL = process.env.LDAP_URL || 'ldap://localhost:389';
const LDAP_DOMAIN = process.env.LDAP_DOMAIN;
const LDAP_BASE_DN = process.env.LDAP_BASE_DN;
const LDAP_DN_TEMPLATE = process.env.LDAP_DN_TEMPLATE || null;
const LDAP_DEFAULT_OU = process.env.LDAP_DEFAULT_OU || 'users';
const LDAP_DEFAULT_DC1 = process.env.LDAP_DEFAULT_DC1 || 'example';
const LDAP_DEFAULT_DC2 = process.env.LDAP_DEFAULT_DC2 || 'com';
const PORT = process.env.PORT || 4000;

console.log(`LDAP server config: LDAP_URL=${LDAP_URL} PORT=${PORT}`);

function buildUserDN(username) {
  // Prefer explicit base DN when provided, then template, then domain-style UPN
  if (LDAP_BASE_DN) return `uid=${username},${LDAP_BASE_DN}`;
  if (LDAP_DN_TEMPLATE) return LDAP_DN_TEMPLATE.replace('{{username}}', username);
  if (LDAP_DOMAIN) return `${username}@${LDAP_DOMAIN}`;
  return `uid=${username},ou=${LDAP_DEFAULT_OU},dc=${LDAP_DEFAULT_DC1},dc=${LDAP_DEFAULT_DC2}`;
}

function getDomainNetbiosName() {
  if (!LDAP_DOMAIN) return null;
  const first = LDAP_DOMAIN.split('.')[0];
  return first || null;
}

function normalizeUsername(username) {
  const raw = String(username || '').trim();
  if (!raw) return { raw: '', login: '', upn: null };

  if (raw.includes('\\')) {
    const parts = raw.split('\\');
    const login = parts[parts.length - 1];
    return { raw, login, upn: LDAP_DOMAIN ? `${login}@${LDAP_DOMAIN}` : null };
  }

  if (raw.includes('@')) {
    const login = raw.split('@')[0];
    return { raw, login, upn: raw };
  }

  return { raw, login: raw, upn: LDAP_DOMAIN ? `${raw}@${LDAP_DOMAIN}` : null };
}

function getBindCandidates(username) {
  const candidates = [];
  const add = (value) => {
    if (!value) return;
    if (!candidates.includes(value)) candidates.push(value);
  };

  const normalized = normalizeUsername(username);
  const login = normalized.login;
  const upn = normalized.upn;

  add(normalized.raw);

  if (LDAP_BASE_DN) {
    add(`uid=${login},${LDAP_BASE_DN}`);
    add(`cn=${login},${LDAP_BASE_DN}`);
  }

  if (LDAP_DN_TEMPLATE) add(LDAP_DN_TEMPLATE.replace('{{username}}', login));
  add(upn);

  const netbios = getDomainNetbiosName();
  if (netbios) add(`${netbios}\\${login}`);

  add(buildUserDN(login));
  return candidates;
}

function tryBind(client, candidates, password, index, done) {
  if (index >= candidates.length) {
    return done(new Error('all-bind-formats-failed'));
  }

  const bindUser = candidates[index];
  console.log(`LDAP bind attempt ${index + 1}/${candidates.length} -> url=${LDAP_URL} principal=${bindUser}`);

  client.bind(bindUser, password, (err) => {
    if (!err) return done(null, bindUser);
    return tryBind(client, candidates, password, index + 1, done);
  });
}

async function verifyTurnstile(token) {
  if (!TURNSTILE_SECRET) return { success: true, skipped: true };
  try {
    const params = new URLSearchParams();
    params.append('secret', TURNSTILE_SECRET);
    params.append('response', token || '');
    const res = await axios.post('https://challenges.cloudflare.com/turnstile/v0/siteverify', params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    return res.data;
  } catch (err) {
    return { success: false, error: err.message || String(err) };
  }
}

app.post('/api/login', async (req, res) => {
  const { username, password, token } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'missing-credentials' });

  const verification = await verifyTurnstile(token);
  if (!verification.success) {
    return res.status(400).json({ error: 'turnstile-failed', details: verification });
  }

  const client = ldap.createClient({ url: LDAP_URL });
  client.on('error', (err) => {
    console.error('LDAP client error event:', err && err.message ? err.message : err);
  });
  const candidates = getBindCandidates(username);

  tryBind(client, candidates, password, 0, (err, successfulPrincipal) => {
    client.unbind();
    if (err) {
      return res.status(401).json({
        error: 'invalid-credentials',
        details: 'No se pudo autenticar con los formatos de usuario configurados.'
      });
    }
    return res.json({ success: true, principal: successfulPrincipal });
  });
});

app.listen(PORT, () => console.log(`LDAP auth server listening on ${PORT}`));
