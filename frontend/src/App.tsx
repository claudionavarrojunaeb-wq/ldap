import './App.css'
import Login from './Login'
import Principal from './principal'
import { useEffect, useState } from 'react'

function App() {
  const [pathname, setPathname] = useState(window.location.pathname)

  useEffect(() => {
    const onPopState = () => setPathname(window.location.pathname)
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  return (
    <div className="App">
      {pathname === '/principal' ? <Principal /> : <Login />}
    </div>
  )
}

export default App
