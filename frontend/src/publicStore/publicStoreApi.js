import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://american-burger-pos-api-d8r1.onrender.com/api'

export const publicStoreApi = axios.create({
  baseURL: `${API_BASE_URL}/public-store`,
  headers: {
    'Content-Type': 'application/json'
  }
})

export const getPublicProducts = async () => {
  const response = await publicStoreApi.get('/products')
  return response.data?.products || []
}

export const createPublicOrder = async (payload) => {
  const response = await publicStoreApi.post('/orders', payload)
  return response.data
}
