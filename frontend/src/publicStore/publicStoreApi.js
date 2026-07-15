import axios from 'axios'

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  'https://american-burger-pos-api-d8r1.onrender.com/api'

export const publicStoreApi = axios.create({
  baseURL: `${API_BASE_URL}/public-store`,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000
})

const normalizeText = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

const parseBoolean = (
  value,
  defaultValue = true
) => {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return defaultValue
  }

  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'number') {
    return value !== 0
  }

  const normalized = normalizeText(value)

  if (
    [
      'true',
      '1',
      'si',
      'sí',
      'yes',
      'open',
      'opened',
      'abierta',
      'abierto',
      'active',
      'activo',
      'enabled'
    ].includes(normalized)
  ) {
    return true
  }

  if (
    [
      'false',
      '0',
      'no',
      'closed',
      'cerrada',
      'cerrado',
      'inactive',
      'inactivo',
      'disabled'
    ].includes(normalized)
  ) {
    return false
  }

  return defaultValue
}

const messageIndicatesClosedStore = (
  message = ''
) => {
  const normalized = normalizeText(message)

  return [
    'caja esta cerrada',
    'caja cerrada',
    'no esta recibiendo pedidos',
    'no estamos recibiendo pedidos',
    'pedidos cerrados',
    'tienda cerrada',
    'local cerrado',
    'no se pueden recibir pedidos'
  ].some((text) =>
    normalized.includes(text)
  )
}

const getStoreOpenValue = (data = {}) =>
  data.store_open ??
  data.storeOpen ??
  data.is_open ??
  data.isOpen ??
  data.cash_open ??
  data.cashOpen ??
  data.cash_session_open ??
  data.cashSessionOpen ??
  data.accepting_orders ??
  data.acceptingOrders ??
  data.orders_enabled ??
  data.ordersEnabled ??
  data.open

const getStoreMessage = (data = {}) =>
  String(
    data.message ??
      data.store_message ??
      data.storeMessage ??
      data.notice ??
      data.warning ??
      data.status_message ??
      data.statusMessage ??
      ''
  ).trim()

export const getPublicProducts = async () => {
  const response =
    await publicStoreApi.get('/products')

  const responseData = response?.data

  /*
   * Compatibilidad por si el backend devuelve
   * directamente un arreglo de productos.
   */
  if (Array.isArray(responseData)) {
    return {
      products: responseData,
      storeOpen: true,
      storeMessage: ''
    }
  }

  const data =
    responseData &&
    typeof responseData === 'object'
      ? responseData
      : {}

  const products = Array.isArray(
    data.products
  )
    ? data.products
    : Array.isArray(data.data)
      ? data.data
      : Array.isArray(data.items)
        ? data.items
        : []

  const storeMessage =
    getStoreMessage(data)

  const explicitStoreOpen =
    getStoreOpenValue(data)

  /*
   * Si el backend incluye un estado específico,
   * utilizamos ese valor.
   *
   * Si no lo incluye, revisamos el mensaje.
   */
  const storeOpen =
    explicitStoreOpen !== undefined &&
    explicitStoreOpen !== null
      ? parseBoolean(
          explicitStoreOpen,
          true
        )
      : !messageIndicatesClosedStore(
          storeMessage
        )

  return {
    products,
    storeOpen,
    storeMessage
  }
}

export const createPublicOrder = async (
  payload
) => {
  const response =
    await publicStoreApi.post(
      '/orders',
      payload
    )

  return response.data
}
