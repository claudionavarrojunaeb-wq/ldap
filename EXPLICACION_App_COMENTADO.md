# App.tsx Comentado (para copiar)

Este bloque contiene una version comentada del archivo `frontend/src/App.tsx`.
Es una navegacion minima basada en `window.location.pathname`.

## Objetivo

Explicar como el componente raiz decide que vista renderizar (`Login` o `Principal`) segun la ruta actual.

## Entradas

- Estado interno `pathname`.
- Eventos del navegador `popstate`.

## Salida esperada

- Si ruta es `/principal`, renderiza `Principal`.
- Si ruta es distinta, renderiza `Login`.

```tsx
import './App.css'
import Login from './Login'
import Principal from './principal'
import { useEffect, useState } from 'react'

function App() {
  // Estado local con la ruta actual del navegador
  const [pathname, setPathname] = useState(window.location.pathname)

  useEffect(() => {
    // Funcion que sincroniza el estado cuando el usuario usa atras/adelante
    const onPopState = () => setPathname(window.location.pathname)

    // Registramos listener del historial del navegador
    window.addEventListener('popstate', onPopState)

    // Cleanup al desmontar
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  return (
    <div className="App">
      {/* if ternario: selecciona vista por pathname */}
      {pathname === '/principal' ? <Principal /> : <Login />}
    </div>
  )
}

export default App
```

## Errores comunes

- Olvidar cleanup del listener de `popstate` y generar fugas de eventos.
- Cambiar ruta con `window.location.pathname` sin sincronizar estado cuando aplica.

## Ejercicios sugeridos

1. Migrar este enrutado manual a `react-router-dom`.
2. Agregar una ruta adicional `/about` y render condicional.
3. Implementar proteccion de ruta de `Principal` mediante estado de sesion.
