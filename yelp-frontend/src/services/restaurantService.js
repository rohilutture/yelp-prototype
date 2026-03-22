import api from './api'
 
export const restaurantService = {
  getAll: (params) => api.get('/restaurants', { params }),
  getById: (id) => api.get(`/restaurants/${id}`),
  create: (data) => api.post('/restaurants', data, {
  headers: { 'Content-Type': 'multipart/form-data' }
}),
  update: (id, data) => api.put(`/restaurants/${id}`, data),
  delete: (id) => api.delete(`/restaurants/${id}`),
  search: (params) => api.get('/restaurants/search', { params }),
  getFavourites: () => api.get('/restaurants/favourites'),
  toggleFavourite: (id) => api.post(`/restaurants/favourites/${id}`),
  claim: (id) => api.post(`/restaurants/${id}/claim`),
}