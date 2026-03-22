import api from './api'

export const reviewService = {
  getForRestaurant: (restaurantId) => api.get(`/restaurants/${restaurantId}/reviews`),
  create: (restaurantId, data) => api.post(`/restaurants/${restaurantId}/reviews`, data),
  update: (reviewId, data) => api.put(`/reviews/${reviewId}`, data),
  delete: (reviewId) => api.delete(`/reviews/${reviewId}`),
}

export const userService = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  uploadAvatar: (formData) => api.post('/users/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getPreferences: () => api.get('/users/preferences'),
  updatePreferences: (data) => api.put('/users/preferences', data),
  getHistory: () => api.get('/users/history'),
}

export const aiService = {
  chat: (message, conversationHistory) =>
    api.post('/ai-assistant/chat', { message, conversation_history: conversationHistory }),
}
