import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AUTH_STATE_EVENT, clearAccessToken, getAccessToken } from './api/client'
import { AppShell } from './components/AppShell'
import { LoginPage } from './pages/LoginPage'

function App() {
  const [loggedIn, setLoggedIn] = useState(() => Boolean(getAccessToken()))
  useEffect(() => {
    const update = () => setLoggedIn(Boolean(getAccessToken()))
    window.addEventListener(AUTH_STATE_EVENT, update)
    return () => window.removeEventListener(AUTH_STATE_EVENT, update)
  }, [])
  return <Routes>
    <Route path="/login" element={loggedIn ? <Navigate to="/dashboard" replace /> : <LoginPage onSuccess={() => setLoggedIn(true)} />} />
    <Route path="*" element={loggedIn ? <AppShell onLogout={() => { clearAccessToken(); setLoggedIn(false) }} /> : <Navigate to="/login" replace />} />
  </Routes>
}

export default App
