import api from './api'

export const getInsights = () => api.get('/transactions/insights/')
