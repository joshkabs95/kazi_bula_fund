import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: 'var(--bg-primary)', color: 'var(--accent-gold)',
        fontSize: 24, fontFamily: "'Playfair Display', serif"
      }}>
        Chargement...
      </div>
    )
  }

  return user ? children : <Navigate to="/login" replace />
}
