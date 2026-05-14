# Login.tsx Comentado (para copiar)

Este bloque contiene una version comentada del archivo `frontend/src/Login.tsx`.
El archivo original queda limpio; esta version es para estudio y documentacion.

## Objetivo

Explicar el flujo completo de autenticacion en cliente:
- Captura de usuario y contrasena.
- Integracion de Cloudflare Turnstile.
- Envio al backend con `fetch` + `await`.
- Manejo de estados de UI (`loading`, `msg`) y redireccion al exito.

## Entradas

- `username`: texto del usuario.
- `password`: texto de contrasena.
- `token`: token de Turnstile.
- `VITE_TURNSTILE_SITE_KEY`: variable de entorno para renderizar el challenge.

## Salida esperada

- Si login falla: muestra mensaje de error.
- Si login es exitoso: muestra mensaje de exito y redirige a `/principal`.

```tsx
import React, { useEffect, useState } from 'react'
import { FaEyeSlash } from 'react-icons/fa'
import './App.css'

// Extendemos el tipo global Window para registrar el callback de Turnstile
// sin usar `any`.
declare global {
  interface Window {
    onTurnstileToken?: (token: string) => void
  }
}

// Site key de Cloudflare Turnstile tomada desde variables de entorno de Vite.
const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined

// Carga el script de Turnstile una sola vez.
function loadTurnstileScript() {
  // if: si ya existe el script, no lo volvemos a insertar.
  if (document.querySelector('script[data-cf-turnstile]')) return

  const s = document.createElement('script')
  s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
  s.async = true
  s.defer = true
  s.setAttribute('data-cf-turnstile', '1')
  document.head.appendChild(s)
}

const Login: React.FC = () => {
  // Estados del formulario
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  // Controla si el password se muestra en texto plano
  const [show, setShow] = useState(false)

  // Token de Turnstile
  const [token, setToken] = useState('')

  // Mensaje visible para exito o error
  const [msg, setMsg] = useState('')

  // Estado de carga para bloquear boton y evitar doble envio
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Cargamos script Turnstile al montar componente
    loadTurnstileScript()

    // Registramos callback global; Cloudflare invoca esta funcion
    // cuando el usuario completa el challenge.
    window.onTurnstileToken = (t: string) => setToken(t)

    // Cleanup al desmontar componente
    return () => {
      try {
        window.onTurnstileToken = undefined
      } catch {
        // ignore
      }
    }
  }, [])

  // Maneja submit del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg('')
    setLoading(true)

    try {
      // fetch + await:
      // Enviamos credenciales y token al backend para autenticar.
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, token })
      })

      // await: esperamos JSON de respuesta
      const data = await res.json()

      // if: si backend responde error HTTP
      if (!res.ok) {
        setMsg(data.error || 'Error en login')
      } else {
        // Login valido
        setMsg('Autenticación correcta')

        // Redireccion simple sin router
        window.location.pathname = '/principal'
      }
    } catch (err) {
      // Error de red o excepcion no controlada
      setMsg(String(err))
    } finally {
      // Siempre quitamos estado loading
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2>Iniciar sesión</h2>

        <div className="field-row">
          <label htmlFor="username" className="field-label">Usuario</label>
          <input
            id="username"
            className="input-field"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div className="field-row">
          <label htmlFor="password" className="field-label">Contraseña</label>
          <div className="password-row">
            <input
              id="password"
              className="input-field"
              type={show ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="eye-button"
              aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              <FaEyeSlash size={18} />
            </button>
          </div>
        </div>

        {/* if en render: mostramos widget Turnstile solo si hay SITE_KEY */}
        {SITE_KEY ? (
          <div style={{ marginTop: 12 }}>
            <div
              className="cf-turnstile"
              data-sitekey={SITE_KEY}
              data-callback="onTurnstileToken"
            ></div>
          </div>
        ) : (
          <div style={{ color: 'orange', marginTop: 12 }}>
            Turnstile no configurado (VITE_TURNSTILE_SITE_KEY faltante)
          </div>
        )}

        <button type="submit" disabled={loading} className="submit-button">
          {loading ? 'Entrando...' : 'Entrar'}
        </button>

        {/* if en render: solo muestra parrafo si hay mensaje */}
        {msg && <p style={{ marginTop: 10 }}>{msg}</p>}
      </form>
    </div>
  )
}

export default Login
```

## Errores comunes

- No definir `VITE_TURNSTILE_SITE_KEY` y esperar que aparezca el widget.
- No tener proxy `/api` configurado en Vite y obtener `Failed to fetch`.
- No desactivar boton durante `loading` y disparar multiples requests.

## Ejercicios sugeridos

1. Agregar validacion de campos vacios antes del `fetch`.
2. Mostrar mensajes amigables por codigo de error (`missing-credentials`, `turnstile-failed`, etc.).
3. Reemplazar `window.location.pathname` por React Router y `navigate('/principal')`.
