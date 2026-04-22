import api from './api'

export const authService = {
  login: (data) => api.post('/auth/login', data),
  signup: (data) => api.post('/auth/signup', data),
  ownerLogin: (data) => api.post('/auth/owner/login', data),
  ownerSignup: (data) => api.post('/auth/owner/signup', data),
  logout: async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // Local cleanup still runs even if backend logout fails.
    } finally {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  },
  getMe: () => api.get('/auth/me'),
}
