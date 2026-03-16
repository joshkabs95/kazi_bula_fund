import api from './api'

export const login = async (email, password) => {
  const res = await api.post('/auth/login/', { email, password })
  localStorage.setItem('access_token', res.data.access)
  localStorage.setItem('refresh_token', res.data.refresh)
  return res.data
}

export const register = async (data) => {
  const res = await api.post('/auth/register/', data)
  localStorage.setItem('access_token', res.data.access)
  localStorage.setItem('refresh_token', res.data.refresh)
  return res.data
}

export const logout = async () => {
  try {
    const refresh = localStorage.getItem('refresh_token')
    await api.post('/auth/logout/', { refresh })
  } finally {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  }
}

export const getMe = () => api.get('/auth/me/')
