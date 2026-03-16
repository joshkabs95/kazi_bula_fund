import api from './api'

export const getGoals = () => api.get('/goals/')
export const createGoal = (data) => api.post('/goals/', data)
export const updateGoal = (id, data) => api.put(`/goals/${id}/`, data)
export const deleteGoal = (id) => api.delete(`/goals/${id}/`)
export const contributeToGoal = (id, data) => api.post(`/goals/${id}/contribute/`, data)
