import { createContext, useContext, useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  initializeAuth,
  loginUser,
  logoutUser,
  selectAuth,
  signupUser,
} from '../store/authSlice'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const dispatch = useDispatch()
  const { user, loading, initialized } = useSelector(selectAuth)

  useEffect(() => {
    dispatch(initializeAuth())
  }, [dispatch])

  const value = useMemo(() => ({
    user,
    loading: loading || !initialized,
    isOwner: user?.role === 'owner',
    login: async (credentials, isOwner = false) => {
      const result = await dispatch(loginUser({ credentials, isOwner }))
      if (loginUser.fulfilled.match(result)) return result.payload.user
      throw new Error(result.payload || 'Login failed')
    },
    signup: async (info, isOwner = false) => {
      const result = await dispatch(signupUser({ info, isOwner }))
      if (signupUser.fulfilled.match(result)) return result.payload.user
      throw new Error(result.payload || 'Signup failed')
    },
    logout: () => dispatch(logoutUser()),
  }), [dispatch, initialized, loading, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
