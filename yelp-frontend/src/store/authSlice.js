import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { authService } from '../services/authService'

const initialUser = (() => {
  try {
    return JSON.parse(localStorage.getItem('user'))
  } catch {
    return null
  }
})()

const initialState = {
  user: initialUser,
  token: localStorage.getItem('token'),
  loading: false,
  initialized: false,
  error: null,
}

export const initializeAuth = createAsyncThunk('auth/initialize', async (_, { rejectWithValue }) => {
  const token = localStorage.getItem('token')
  if (!token) return null
  try {
    const { data } = await authService.getMe()
    return data
  } catch (err) {
    return rejectWithValue(err.response?.data?.detail || 'Failed to restore session')
  }
})

export const loginUser = createAsyncThunk('auth/login', async ({ credentials, isOwner }, { rejectWithValue }) => {
  try {
    const fn = isOwner ? authService.ownerLogin : authService.login
    const { data } = await fn(credentials)
    return data
  } catch (err) {
    return rejectWithValue(err.response?.data?.detail || 'Login failed')
  }
})

export const signupUser = createAsyncThunk('auth/signup', async ({ info, isOwner }, { rejectWithValue }) => {
  try {
    const fn = isOwner ? authService.ownerSignup : authService.signup
    const { data } = await fn(info)
    return data
  } catch (err) {
    return rejectWithValue(err.response?.data?.detail || 'Signup failed')
  }
})

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  await authService.logout()
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearLocalAuth(state) {
      state.user = null
      state.token = null
      state.error = null
      state.initialized = true
    },
    clearAuthError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeAuth.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.loading = false
        state.initialized = true
        state.user = action.payload
        state.token = localStorage.getItem('token')
      })
      .addCase(initializeAuth.rejected, (state) => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        state.loading = false
        state.initialized = true
        state.user = null
        state.token = null
      })
      .addCase(loginUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        state.token = action.payload.access_token
        state.initialized = true
        localStorage.setItem('token', action.payload.access_token)
        localStorage.setItem('user', JSON.stringify(action.payload.user))
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(signupUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(signupUser.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        state.token = action.payload.access_token
        state.initialized = true
        localStorage.setItem('token', action.payload.access_token)
        localStorage.setItem('user', JSON.stringify(action.payload.user))
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null
        state.token = null
        state.error = null
        state.initialized = true
      })
  },
})

export const { clearLocalAuth, clearAuthError } = authSlice.actions
export const selectAuth = (state) => state.auth
export const selectCurrentUser = (state) => state.auth.user
export const selectIsOwner = (state) => state.auth.user?.role === 'owner'
export const selectAuthLoading = (state) => state.auth.loading || !state.auth.initialized

export default authSlice.reducer
