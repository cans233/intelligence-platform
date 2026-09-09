import { useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { LoginPage } from './pages/LoginPage'

function App() {
  const [loggedIn, setLoggedIn] = useState(() => Boolean(localStorage.getItem('mock-token')))
  return <Routes>
    <Route path="/login" element={loggedIn ? <Navigate to="/dashboard" replace /> : <LoginPage onSuccess={() => setLoggedIn(true)} />} />
    <Route path="*" element={loggedIn ? <AppShell onLogout={() => { localStorage.removeItem('mock-token'); setLoggedIn(false) }} /> : <Navigate to="/login" replace />} />
  </Routes>
}

export default App
