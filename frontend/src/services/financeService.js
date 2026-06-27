const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const getToken = () => {
  return (
    localStorage.getItem('token') ||
    localStorage.getItem('authToken') ||
    ''
  )
}

const request = async (path, options = {}) => {
  const token = getToken()

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  })

  if (!res.ok) {
    throw new Error(await res.text())
  }

  return res.json()
}

export const financeService = {

  getSummary(month) {
    return request(`/finance/summary?month=${month}`)
  },

  getFixedCosts(month) {
    return request(`/finance/fixed-costs?month=${month}`)
  },

  saveFixedCosts(month, costs) {
    return request('/finance/fixed-costs', {
      method: 'POST',
      body: JSON.stringify({
        month,
        costs
      })
    })
  },

  getProductCosts() {
    return request('/finance/product-costs')
  },

  saveProductCosts(products) {
    return request('/finance/product-costs', {
      method: 'POST',
      body: JSON.stringify({
        products
      })
    })
  },

  exportExcelUrl(month) {
    return `${API_URL}/finance/export-excel?month=${month}`
  }

}
