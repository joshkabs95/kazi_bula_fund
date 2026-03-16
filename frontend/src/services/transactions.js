import api from './api'

export const getTransactions = (params = {}) =>
  api.get('/transactions/', { params })

export const createTransaction = (data) =>
  api.post('/transactions/', data)

export const updateTransaction = (id, data) =>
  api.put(`/transactions/${id}/`, data)

export const deleteTransaction = (id) =>
  api.delete(`/transactions/${id}/`)

export const getStats = (params = {}) =>
  api.get('/transactions/stats/', { params })
