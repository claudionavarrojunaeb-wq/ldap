# Explicacion Linea Por Linea

Este documento describe, de forma exhaustiva, lo que hace cada linea relevante en:

- `frontend/src/Login.tsx`
- `frontend/src/App.tsx`
- `backend/Ldap.js`

## 1) `frontend/src/Login.tsx`

### Imports y definiciones globales

1. `import React, { useEffect, useState } from 'react'`
   - Importa React y dos hooks.
   - `useState` guarda estado local del formulario.
   - `useEffect` ejecuta logica al montar/desmontar el componente.

2. `import { FaEyeSlash } from 'react-icons/fa'`
   - Importa el icono del ojo tachado para alternar visibilidad de contrasena.

3. `import './App.css'`
   - Carga estilos compartidos de la vista.

4. `declare global { ... }`
   - Extiende el tipo global `Window` en TypeScript.
   - Permite declarar `window.onTurnstileToken` sin usar `any`.

5. `const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined`
   - Lee la site key de Turnstile desde variables de entorno de Vite.
   - Si no existe, la UI muestra mensaje de configuracion faltante.

### Funcion auxiliar Turnstile

6. `function loadTurnstileScript() { ... }`
   - Encapsula la inyeccion del script de Cloudflare Turnstile.

7. `if (document.querySelector('script[data-cf-turnstile]')) return`
   - Evita insertar el script mas de una vez.

8. `const s = document.createElement('script')`
   - Crea nodo `<script>` en runtime.

9. `s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'`
   - Define la URL oficial del API de Turnstile.

10. `s.async = true`
    - Permite carga asincrona sin bloquear render.

11. `s.defer = true`
    - Difere ejecucion del script tras parseo HTML.

12. `s.setAttribute('data-cf-turnstile', '1')`
    - Marca el script para poder detectarlo luego y no duplicarlo.

13. `document.head.appendChild(s)`
    - Inserta efectivamente el script en `<head>`.

### Componente principal Login

14. `const Login: React.FC = () => {`
    - Declara componente funcional tipado.

15. `const [username, setUsername] = useState('')`
    - Guarda el texto del usuario.

16. `const [password, setPassword] = useState('')`
    - Guarda la contrasena.

17. `const [show, setShow] = useState(false)`
    - Controla si el input password se muestra como texto o oculto.

18. `const [token, setToken] = useState('')`
    - Guarda token devuelto por Turnstile.

19. `const [msg, setMsg] = useState('')`
    - Guarda mensaje de estado/resultado para el usuario.

20. `const [loading, setLoading] = useState(false)`
    - Controla estado de envio para desactivar boton y mostrar feedback.

### Efecto de montaje/desmontaje

21. `useEffect(() => { ... }, [])`
    - Se ejecuta una sola vez al montar.

22. `loadTurnstileScript()`
    - Garantiza disponibilidad del script Turnstile.

23. `window.onTurnstileToken = (t: string) => setToken(t)`
    - Registra callback global que Turnstile invoca para entregar token.

24. `return () => { ... }`
    - Cleanup al desmontar componente.

25. `window.onTurnstileToken = undefined`
    - Limpia callback global para evitar referencias colgantes.

26. `catch { /* ignore */ }`
    - Si ocurre error al limpiar, lo ignora de forma segura.

### Envio de formulario

27. `const handleSubmit = async (e: React.FormEvent) => {`
    - Handler asincrono del submit.

28. `e.preventDefault()`
    - Evita recarga completa de pagina por submit nativo.

29. `setMsg('')`
    - Limpia mensajes anteriores.

30. `setLoading(true)`
    - Activa estado de carga.

31. `const res = await fetch('/api/login', { ... })`
    - Llama al backend via ruta relativa proxificada por Vite.

32. `method: 'POST'`
    - Define operacion de autenticacion.

33. `headers: { 'Content-Type': 'application/json' }`
    - Informa tipo de body.

34. `body: JSON.stringify({ username, password, token })`
    - Envia credenciales y token Turnstile al backend.

35. `const data = await res.json()`
    - Parsea respuesta JSON.

36. `if (!res.ok) { setMsg(...) }`
    - Si backend responde error HTTP, muestra razon de fallo.

37. `else { setMsg('Autenticacion correcta'); window.location.pathname = '/principal' }`
    - Si backend valida credenciales, muestra exito y redirige a vista principal.

38. `catch (err) { setMsg(String(err)) }`
    - Captura errores de red/ejecucion y los muestra.

39. `finally { setLoading(false) }`
    - Siempre desactiva estado de carga.

### Render JSX

40. `<div className="login-container">`
    - Contenedor general visual del login.

41. `<form className="login-form" onSubmit={handleSubmit}>`
    - Formulario conectado al handler.

42. `<h2>Iniciar sesion</h2>`
    - Titulo visible del modulo.

43. Bloque usuario (`field-row`)
    - `label` asociada con `htmlFor="username"`.
    - `input` controlado por estado `username`.

44. Bloque contrasena (`field-row` + `password-row`)
    - `input` controlado por estado `password`.
    - `type={show ? 'text' : 'password'}` alterna visibilidad.
    - Boton con `FaEyeSlash` cambia `show`.
    - `aria-label` mejora accesibilidad para lectores de pantalla.

45. Render condicional Turnstile
    - Si `SITE_KEY` existe, renderiza `<div className="cf-turnstile" ...>`.
    - Si no existe, avisa que falta configuracion.

46. Boton submit
    - `disabled={loading}` evita envios multiples.
    - Texto dinamico entre `Entrando...` y `Entrar`.

47. Mensaje final
    - `{msg && <p ...>{msg}</p>}` solo pinta si hay contenido.

48. `export default Login`
    - Exporta componente para uso en `App.tsx`.

## 2) `frontend/src/App.tsx`

1. `import './App.css'`
   - Aplica estilos base compartidos de la aplicacion.

2. `import Login from './Login'`
   - Importa vista de autenticacion.

3. `import Principal from './principal'`
   - Importa vista posterior al login.

4. `import { useEffect, useState } from 'react'`
   - Hooks para estado y escucha de cambios de historial.

5. `function App() {`
   - Componente raiz del frontend.

6. `const [pathname, setPathname] = useState(window.location.pathname)`
   - Captura path actual inicial (`/` o `/principal`).

7. `useEffect(() => { ... }, [])`
   - Registra y libera listener de navegacion.

8. `const onPopState = () => setPathname(window.location.pathname)`
   - Actualiza estado al usar atras/adelante del navegador.

9. `window.addEventListener('popstate', onPopState)`
   - Activa escucha de cambios de historial.

10. `return () => window.removeEventListener('popstate', onPopState)`
    - Limpieza para evitar fugas al desmontar.

11. Render condicional:
    - `{pathname === '/principal' ? <Principal /> : <Login />}`
    - Si path es `/principal`, muestra pagina principal.
    - En otro caso, muestra login.

12. `export default App`
    - Exporta componente raiz para `main.tsx`.

## 3) `backend/Ldap.js`

### Bootstrap y configuracion

1. `const express = require('express')`
   - Framework HTTP para exponer API.

2. `const cors = require('cors')`
   - Middleware CORS para permitir frontend local.

3. `const axios = require('axios')`
   - Cliente HTTP para verificar Turnstile en Cloudflare.

4. `const ldap = require('ldapjs')`
   - Cliente LDAP para autenticacion contra servidor corporativo.

5. `const path = require('path')`
   - Utilidad para construir ruta de `.env` en forma robusta.

6. `require('dotenv').config({ path: path.join(__dirname, '.env'), override: true })`
   - Carga variables de entorno desde `backend/.env`.
   - `override: true` fuerza esos valores sobre variables previas.

7. `const app = express()`
   - Instancia principal del servidor.

8. `app.use(express.json())`
   - Habilita parseo de JSON entrante.

9. `app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }))`
   - Permite origen configurado o cualquiera como fallback.

10. Declaracion de constantes de entorno (`TURNSTILE_SECRET`, `LDAP_URL`, `LDAP_DOMAIN`, `LDAP_BASE_DN`, `LDAP_DN_TEMPLATE`, `PORT`)
    - Centraliza configuracion de autenticacion.

11. `console.log(...)` de configuracion LDAP
    - Muestra host/puerto usados para diagnostico temprano.

### Construccion y normalizacion de principal LDAP

12. `buildUserDN(username)`
    - Construye DN segun prioridad:
      1) `LDAP_BASE_DN`
      2) `LDAP_DN_TEMPLATE`
      3) formato UPN `usuario@dominio`
      4) fallback fijo de ejemplo

13. `getDomainNetbiosName()`
    - Extrae nombre NetBIOS aproximado desde `LDAP_DOMAIN` (primer segmento).

14. `normalizeUsername(username)`
    - Acepta entradas tipo `usuario`, `dominio\usuario`, `usuario@dominio`.
    - Devuelve objeto normalizado con `raw`, `login` y posible `upn`.

15. `getBindCandidates(username)`
    - Genera lista de candidatos de bind sin duplicados.
    - Incluye varios formatos para aumentar compatibilidad LDAP/AD:
      - valor original
      - `uid=login,baseDN`
      - `cn=login,baseDN`
      - template personalizado
      - UPN
      - `NETBIOS\login`
      - salida de `buildUserDN`.

16. `tryBind(client, candidates, password, index, done)`
    - Intenta bind recursivo sobre todos los candidatos.
    - Si uno funciona, retorna exito inmediato.
    - Si todos fallan, retorna error `all-bind-formats-failed`.

### Verificacion Turnstile

17. `verifyTurnstile(token)`
    - Si no hay secreto configurado, omite validacion (modo desarrollo).
    - Si hay secreto, POST a endpoint oficial de Cloudflare.
    - Retorna respuesta de verificacion o error controlado.

### Endpoint de login

18. `app.post('/api/login', async (req, res) => { ... })`
    - Endpoint unico de autenticacion.

19. `const { username, password, token } = req.body || {}`
    - Extrae payload esperado del frontend.

20. Validacion minima de credenciales
    - Si faltan usuario o password, responde 400 `missing-credentials`.

21. Verificacion Turnstile previa
    - Si falla, responde 400 `turnstile-failed`.

22. `const client = ldap.createClient({ url: LDAP_URL })`
    - Crea cliente LDAP contra servidor configurado.

23. `client.on('error', ...)`
    - Captura y registra errores de capa de transporte/eventos del cliente.

24. `const candidates = getBindCandidates(username)`
    - Prepara estrategias de principal para autenticacion.

25. `tryBind(..., (err, successfulPrincipal) => { ... })`
    - Ejecuta bind multi-formato.

26. `client.unbind()`
    - Cierra sesion LDAP tras terminar intento.

27. Manejo de error final
    - Si no autentica ningun formato: 401 `invalid-credentials`.

28. Manejo de exito
    - Responde `{ success: true, principal: successfulPrincipal }`.
    - Devuelve principal ganador para diagnostico/auditoria funcional.

### Arranque servidor

29. `app.listen(PORT, () => console.log(...))`
    - Inicia servidor HTTP y deja mensaje de confirmacion en consola.

## Conclusiones Operativas

- Frontend y backend estan acoplados por `POST /api/login`.
- Turnstile se integra del lado cliente (token) y servidor (siteverify).
- La autenticacion LDAP es resiliente porque intenta varios formatos de principal.
- El flujo de UX es: login exitoso -> redireccion a `/principal`.
