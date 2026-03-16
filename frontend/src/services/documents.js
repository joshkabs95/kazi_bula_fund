import api from './api'

export const uploadDocument = (file) => {
  const form = new FormData()
  form.append('file', file)
  return api.post('/documents/upload/', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export const previewDocument = (id) =>
  api.get(`/documents/${id}/preview/`)

export const importDocument = (id, transactions) =>
  api.post(`/documents/${id}/import/`, { transactions })
