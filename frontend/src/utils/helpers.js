export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('es-CL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
  }).format(amount)
}

export const formatTime = (time) => {
  return new Date(time).toLocaleTimeString('es-CL', {
    hour: '2-digit',
    minute: '2-digit',
  })
}
