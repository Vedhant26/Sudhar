import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import { useSettingsStore } from './stores/settingsStore'
import { useEffect } from 'react'

// Pages
import Login from './pages/Login'
import CitizenLayout from './pages/citizen/CitizenLayout'
import AdminLayout from './pages/admin/AdminLayout'

function App() {
  const { isAuthenticated, user } = useAuthStore()
  const { theme } = useSettingsStore()

  // Apply theme
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  // Register service worker for PWA
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Silent fail
      })
    }
  }, [])

  return (
    <Router>
      <Routes>
        {/* Login Route */}
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/" /> : <Login />} 
        />

        {/* Citizen Routes */}
        <Route
          path="/*"
          element={
            isAuthenticated && user?.role === 'citizen' ? (
              <CitizenLayout />
            ) : isAuthenticated ? (
              <Navigate to="/admin" />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin/*"
          element={
            isAuthenticated && user?.role === 'admin' ? (
              <AdminLayout />
            ) : isAuthenticated ? (
              <Navigate to="/" />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </Router>
  )
}

export default App
