# Ldap.js Comentado (para copiar)

Este bloque contiene una version comentada del archivo `backend/Ldap.js`.
Incluye comentarios sobre funciones, `if`, recursion, `await`, peticiones HTTP y flujo de login.

## Objetivo

Explicar el backend de autenticacion:
- API `POST /api/login`.
- Verificacion Turnstile.
- Bind LDAP con fallback de formatos de principal.
- Respuesta de exito/error para el frontend.

## Entradas

- JSON en `POST /api/login`:
  - `username`
  - `password`
  - `token`
- Variables de entorno (`LDAP_URL`, `LDAP_DOMAIN`, `LDAP_BASE_DN`, `TURNSTILE_SECRET`, etc.).

## Salida esperada

- Exito: `{ success: true, principal: <formato-que-funciono> }`.
- Error de validacion: `400`.
- Error de credenciales LDAP: `401 invalid-credentials`.

```js
const express = require('express')
const cors = require('cors')
const axios = require('axios')
const ldap = require('ldapjs')
const path = require('path')

// Carga variables de entorno desde backend/.env
// override: true fuerza estos valores sobre variables previas del proceso.
require('dotenv').config({ path: path.join(__dirname, '.env'), override: true })

const app = express()

// Middleware para parsear JSON entrante
app.use(express.json())

// CORS: permite origen configurado o cualquier origen como fallback
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }))

// Variables de entorno relevantes
const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET
const LDAP_URL = process.env.LDAP_URL || 'ldap://localhost:389'
const LDAP_DOMAIN = process.env.LDAP_DOMAIN
const LDAP_BASE_DN = process.env.LDAP_BASE_DN
const LDAP_DN_TEMPLATE = process.env.LDAP_DN_TEMPLATE || null
const PORT = process.env.PORT || 4000

console.log(`LDAP server config: LDAP_URL=${LDAP_URL} PORT=${PORT}`)

// Construye DN de usuario con prioridad de estrategias
function buildUserDN(username) {
  // if: preferimos LDAP_BASE_DN cuando existe
  if (LDAP_BASE_DN) return `uid=${username},${LDAP_BASE_DN}`

  // if: si hay template, lo usamos
  if (LDAP_DN_TEMPLATE) return LDAP_DN_TEMPLATE.replace('{{username}}', username)

  // if: fallback a UPN usuario@dominio
  if (LDAP_DOMAIN) return `${username}@${LDAP_DOMAIN}`

  // Fallback final de ejemplo
  return `uid=${username},ou=users,dc=example,dc=com`
}

// Intenta obtener nombre NetBIOS aproximado (parte izquierda del dominio FQDN)
function getDomainNetbiosName() {
  if (!LDAP_DOMAIN) return null
  const first = LDAP_DOMAIN.split('.')[0]
  return first || null
}

// Normaliza usuario de entrada para soportar:
// - usuario
// - dominio\\usuario
// - usuario@dominio
function normalizeUsername(username) {
  const raw = String(username || '').trim()

  // if: si viene vacio, devolvemos estructura vacia
  if (!raw) return { raw: '', login: '', upn: null }

  // if: formato dominio\\usuario
  if (raw.includes('\\')) {
    const parts = raw.split('\\')
    const login = parts[parts.length - 1]
    return { raw, login, upn: LDAP_DOMAIN ? `${login}@${LDAP_DOMAIN}` : null }
  }

  // if: formato usuario@dominio
  if (raw.includes('@')) {
    const login = raw.split('@')[0]
    return { raw, login, upn: raw }
  }

  // Caso simple: usuario
  return { raw, login: raw, upn: LDAP_DOMAIN ? `${raw}@${LDAP_DOMAIN}` : null }
}

// Genera candidatos de principal de bind sin duplicados
function getBindCandidates(username) {
  const candidates = []

  // Funcion helper local para insertar sin repetir
  const add = (value) => {
    if (!value) return
    if (!candidates.includes(value)) candidates.push(value)
  }

  const normalized = normalizeUsername(username)
  const login = normalized.login
  const upn = normalized.upn

  // Incluimos valor original por si ya viene en formato valido
  add(normalized.raw)

  // if: formatos DN si existe base DN
  if (LDAP_BASE_DN) {
    add(`uid=${login},${LDAP_BASE_DN}`)
    add(`cn=${login},${LDAP_BASE_DN}`)
  }

  // if: formato por template
  if (LDAP_DN_TEMPLATE) add(LDAP_DN_TEMPLATE.replace('{{username}}', login))

  // UPN usuario@dominio
  add(upn)

  // if: formato NETBIOS\\usuario
  const netbios = getDomainNetbiosName()
  if (netbios) add(`${netbios}\\${login}`)

  // Agregamos ademas resultado del builder general
  add(buildUserDN(login))

  return candidates
}

// Intenta bind recursivo probando candidato por candidato
function tryBind(client, candidates, password, index, done) {
  // if: se agotaron candidatos
  if (index >= candidates.length) {
    return done(new Error('all-bind-formats-failed'))
  }

  const bindUser = candidates[index]
  console.log(`LDAP bind attempt ${index + 1}/${candidates.length} -> url=${LDAP_URL} principal=${bindUser}`)

  client.bind(bindUser, password, (err) => {
    // if: bind exitoso
    if (!err) return done(null, bindUser)

    // Si falla, recursion al siguiente candidato
    return tryBind(client, candidates, password, index + 1, done)
  })
}

// Verifica Turnstile contra Cloudflare
async function verifyTurnstile(token) {
  // if: sin secreto => se omite validacion (escenario local/dev)
  if (!TURNSTILE_SECRET) return { success: true, skipped: true }

  try {
    const params = new URLSearchParams()
    params.append('secret', TURNSTILE_SECRET)
    params.append('response', token || '')

    // await + axios.post: llamada HTTP a siteverify
    const res = await axios.post(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      params.toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    )

    return res.data
  } catch (err) {
    return { success: false, error: err.message || String(err) }
  }
}

// Endpoint de autenticacion
app.post('/api/login', async (req, res) => {
  const { username, password, token } = req.body || {}

  // if: validacion minima de entrada
  if (!username || !password) {
    return res.status(400).json({ error: 'missing-credentials' })
  }

  // await: verificamos Turnstile antes del bind LDAP
  const verification = await verifyTurnstile(token)

  // if: challenge invalido
  if (!verification.success) {
    return res.status(400).json({ error: 'turnstile-failed', details: verification })
  }

  const client = ldap.createClient({ url: LDAP_URL })

  // Captura eventos de error del cliente LDAP (conectividad, socket, etc.)
  client.on('error', (err) => {
    console.error('LDAP client error event:', err && err.message ? err.message : err)
  })

  const candidates = getBindCandidates(username)

  // Probamos bind multi-formato
  tryBind(client, candidates, password, 0, (err, successfulPrincipal) => {
    // Cerramos sesion LDAP al terminar
    client.unbind()

    // if: no autentico ningun formato
    if (err) {
      return res.status(401).json({
        error: 'invalid-credentials',
        details: 'No se pudo autenticar con los formatos de usuario configurados.'
      })
    }

    // Exito
    return res.json({ success: true, principal: successfulPrincipal })
  })
})

app.listen(PORT, () => console.log(`LDAP auth server listening on ${PORT}`))
```

## Errores comunes

- `ECONNREFUSED`: `LDAP_URL` incorrecta o servidor LDAP no accesible.
- `invalid-credentials`: principal de bind no coincide con politica del directorio.
- `turnstile-failed`: token invalido o secreto mal configurado.
- Variables de entorno no aplicadas por ejecutar desde otro directorio sin cargar `.env` correcto.

## Ejercicios sugeridos

1. Agregar timeout y reintentos controlados en `verifyTurnstile`.
2. Registrar metricas de intentos de bind por formato para tuning.
3. Agregar endpoint de healthcheck (`GET /api/health`) que valide conectividad basica.
