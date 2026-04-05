import { useState } from 'react'
import { Navigate, NavLink, Route, Routes, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Dashboard } from './pages/Dashboard'
import { Records } from './pages/Records.tsx'
import { Admin } from './pages/Admin'
import './App.css'

function LoadingState() {
  return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingState />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function RoleRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode
  allowedRoles: Array<'viewer' | 'analyst' | 'admin'>
}) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingState />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <h1>💰 Finance Management</h1>
        </div>
        <div className="header-right">
          {user && (
            <>
              <div className="user-info">
                <span>{user.name}</span>
                <small>({user.role})</small>
              </div>
              <button onClick={handleLogout} className="logout-btn">
                Logout
              </button>
            </>
          )}
        </div>
      </header>

      <nav className="app-nav">
        <NavLink to="/" className="nav-link">
          Dashboard
        </NavLink>
        {(user?.role === 'analyst' || user?.role === 'admin') && (
          <NavLink to="/records" className="nav-link">
            Records
          </NavLink>
        )}
        {user?.role === 'admin' && (
          <NavLink to="/admin" className="nav-link">
            Admin
          </NavLink>
        )}
      </nav>

      <main className="app-main">
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/records"
            element={
              <RoleRoute allowedRoles={['analyst', 'admin']}>
                <Records />
              </RoleRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <RoleRoute allowedRoles={['admin']}>
                <Admin />
              </RoleRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

function AppContent() {
  const { user } = useAuth()
  const [isLogin, setIsLogin] = useState(true)

  if (user) {
    return <AppLayout />
  }

  if (isLogin) {
    return <Login onSwitchToRegister={() => setIsLogin(false)} />
  }

  return <Register onSwitchToLogin={() => setIsLogin(true)} />
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
