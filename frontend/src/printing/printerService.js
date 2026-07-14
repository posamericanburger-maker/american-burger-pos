import buildKitchenTicketHtml from './kitchenTemplate'
import buildCustomerReceiptHtml from './customerReceiptTemplate'

const API_URL =
  import.meta.env.VITE_API_URL ||
  'https://american-burger-pos-api-d8r1.onrender.com/api'

const getToken = () =>
  localStorage.getItem('token') ||
  localStorage.getItem('authToken') ||
  localStorage.getItem('access_token') ||
  ''

const buildHeaders = () => {
  const token = getToken()

  return {
    'Content-Type': 'application/json',

    ...(token
      ? {
          Authorization: `Bearer ${token}`
        }
      : {})
  }
}

const parseResponse = async (
  response
) => {
  const text =
    await response.text()

  let data = null

  try {
    data = text
      ? JSON.parse(text)
      : null
  } catch {
    data = {
      message: text
    }
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.error ||
        'Error enviando el trabajo de impresión'
    )
  }

  return data
}

const request = async (
  path,
  options = {}
) => {
  const response = await fetch(
    `${API_URL}${path}`,
    {
      ...options,

      headers: {
        ...buildHeaders(),
        ...(options.headers || {})
      }
    }
  )

  return parseResponse(response)
}

const getOrderReferenceId = (
  order = {},
  referenceId = null
) =>
  referenceId ||
  order.id ||
  order.order_id ||
  null

const getOrderNumber = (
  order = {}
) =>
  order.order_number ||
  order.number ||
  order.code ||
  order.id ||
  ''

const buildIdempotencyKey = ({
  purpose,
  referenceId,
  suffix = ''
}) => {
  if (!referenceId) {
    return null
  }

  return [
    purpose,
    'order',
    String(referenceId),
    suffix
  ]
    .filter(Boolean)
    .join(':')
}

const buildPrintPayload = ({
  purpose,
  order,
  paperWidth = 80,
  copies = 1
}) => {
  const isKitchen =
    purpose === 'kitchen'

  const html = isKitchen
    ? buildKitchenTicketHtml(order)
    : buildCustomerReceiptHtml(order)

  return {
    template: isKitchen
      ? 'kitchen_order'
      : 'customer_receipt',

    html,

    order,

    print_settings: {
      paper_width:
        Number(paperWidth) === 58
          ? 58
          : 80,

      copies: Math.max(
        1,
        Number(copies || 1)
      )
    }
  }
}

export const sendPrintJob = async ({
  purpose,
  title,
  order,
  referenceId = null,
  priority = 50,
  maxAttempts = 3,
  paperWidth = 80,
  copies = 1,
  idempotencySuffix = ''
}) => {
  if (!purpose) {
    throw new Error(
      'El propósito de impresión es obligatorio'
    )
  }

  if (!order) {
    throw new Error(
      'El pedido es obligatorio'
    )
  }

  const resolvedReferenceId =
    getOrderReferenceId(
      order,
      referenceId
    )

  const orderNumber =
    getOrderNumber(order)

  const resolvedTitle =
    title ||
    `${
      purpose === 'kitchen'
        ? 'Comanda cocina'
        : 'Recibo cliente'
    }${
      orderNumber
        ? ` #${orderNumber}`
        : ''
    }`

  const idempotencyKey =
    buildIdempotencyKey({
      purpose,

      referenceId:
        resolvedReferenceId,

      suffix:
        idempotencySuffix
    })

  return request(
    '/printing/jobs',
    {
      method: 'POST',

      body: JSON.stringify({
        purpose,

        reference_type:
          'order',

        reference_id:
          resolvedReferenceId
            ? String(
                resolvedReferenceId
              )
            : null,

        title:
          resolvedTitle,

        priority:
          Number(priority || 50),

        max_attempts:
          Math.max(
            1,
            Number(
              maxAttempts || 3
            )
          ),

        idempotency_key:
          idempotencyKey,

        payload:
          buildPrintPayload({
            purpose,
            order,
            paperWidth,
            copies
          })
      })
    }
  )
}

export const printKitchenOrder =
  async ({
    order,
    referenceId = null,
    paperWidth = 80,
    copies = 1
  }) => {
    const orderNumber =
      getOrderNumber(order)

    return sendPrintJob({
      purpose: 'kitchen',

      title:
        `Comanda cocina${
          orderNumber
            ? ` #${orderNumber}`
            : ''
        }`,

      order,
      referenceId,
      priority: 100,
      paperWidth,
      copies,

      idempotencySuffix:
        'kitchen'
    })
  }

export const printCustomerReceipt =
  async ({
    order,
    referenceId = null,
    paperWidth = 80,
    copies = 1
  }) => {
    const orderNumber =
      getOrderNumber(order)

    return sendPrintJob({
      purpose:
        'customer_receipt',

      title:
        `Recibo cliente${
          orderNumber
            ? ` #${orderNumber}`
            : ''
        }`,

      order,
      referenceId,
      priority: 60,
      paperWidth,
      copies,

      idempotencySuffix:
        'customer'
    })
  }

export const printOrderDocuments =
  async ({
    order,
    referenceId = null,
    printKitchen = true,
    printCustomer = true,
    paperWidth = 80,
    kitchenCopies = 1,
    customerCopies = 1
  }) => {
    const jobs = []

    if (printKitchen) {
      jobs.push({
        type: 'kitchen',

        promise:
          printKitchenOrder({
            order,
            referenceId,
            paperWidth,
            copies:
              kitchenCopies
          })
      })
    }

    if (printCustomer) {
      jobs.push({
        type:
          'customer_receipt',

        promise:
          printCustomerReceipt({
            order,
            referenceId,
            paperWidth,
            copies:
              customerCopies
          })
      })
    }

    if (jobs.length === 0) {
      return {
        success: true,
        total: 0,
        successful: 0,
        failed: 0,
        results: []
      }
    }

    const settledResults =
      await Promise.allSettled(
        jobs.map(
          (job) =>
            job.promise
        )
      )

    const results =
      settledResults.map(
        (result, index) => ({
          type:
            jobs[index].type,

          status:
            result.status,

          value:
            result.status ===
            'fulfilled'
              ? result.value
              : null,

          error:
            result.status ===
            'rejected'
              ? result.reason
                  ?.message ||
                String(
                  result.reason ||
                    'Error de impresión'
                )
              : null
        })
      )

    const successful =
      results.filter(
        (result) =>
          result.status ===
          'fulfilled'
      ).length

    const failed =
      results.filter(
        (result) =>
          result.status ===
          'rejected'
      ).length

    results
      .filter(
        (result) =>
          result.status ===
          'rejected'
      )
      .forEach((result) => {
        console.error(
          `Error enviando ${result.type}:`,
          result.error
        )
      })

    return {
      success:
        failed === 0,

      total:
        results.length,

      successful,
      failed,
      results
    }
  }

export const printManualReceipt =
  async ({
    order,
    paperWidth = 80,
    copies = 1
  }) =>
    sendPrintJob({
      purpose:
        'customer_receipt',

      title:
        'Recibo manual de mostrador',

      order,

      referenceId: null,

      priority: 60,

      paperWidth,
      copies
    })

const printerService = {
  sendPrintJob,
  printKitchenOrder,
  printCustomerReceipt,
  printOrderDocuments,
  printManualReceipt
}

export default printerService
