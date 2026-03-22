import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export function PrivateRoute() {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex justify-center items-center h-screen"><Spinner /></div>
  return user ? <Outlet /> : <Navigate to="/login" replace />
}

export function OwnerRoute() {
  const { user, loading, isOwner } = useAuth()
  if (loading) return <div className="flex justify-center items-center h-screen"><Spinner /></div>
  if (!user) return <Navigate to="/login" replace />
  return isOwner ? <Outlet /> : <Navigate to="/" replace />
}

function Spinner() {
  return (
    <div className="w-8 h-8 border-2 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
  )
}
