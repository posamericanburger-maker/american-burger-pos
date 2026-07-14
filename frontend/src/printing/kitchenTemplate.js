const escapeHtml = (value = '') =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')

const getOrderItems = (order = {}) => {
  if (Array.isArray(order.items)) {
    return order.items
  }

  if (Array.isArray(order.order_items)) {
    return order.order_items
  }

  return []
}

const getItemName = (item = {}) =>
  item.name ||
  item.product_name ||
  item.name_snapshot ||
  item.product?.name ||
  'Producto'

const getItemNotes = (item = {}) =>
  item.notes ||
  item.observations ||
  item.comment ||
  item.instructions ||
  ''

const getOrderNumber = (order = {}) =>
  order.order_number ||
  order.number ||
  order.code ||
  order.id ||
  ''

const getOrderType = (order = {}) => {
  const type = String(
    order.order_type ||
      order.type ||
      order.channel ||
      'counter'
  ).toLowerCase()

  if (type === 'delivery') {
    return 'DELIVERY'
  }

  if (
    type === 'pickup' ||
    type === 'retiro'
  ) {
    return 'RETIRO'
  }

  if (
    type === 'table' ||
    type === 'mesa'
  ) {
    return 'MESA'
  }

  return 'MOSTRADOR'
}

const formatDate = (value) => {
  const date = new Date(
    value || Date.now()
  )

  if (Number.isNaN(date.getTime())) {
    return new Date().toLocaleString(
      'es-CL'
    )
  }

  return date.toLocaleString(
    'es-CL'
  )
}

export const buildKitchenTicketHtml = (
  order = {}
) => {
  const items =
    getOrderItems(order)

  const customerName =
    order.customer_name ||
    order.customer?.name ||
    ''

  const generalNotes =
    String(
      order.notes ||
      order.observations ||
      ''
    ).trim()

  const orderNumber =
    getOrderNumber(order)

  const orderType =
    getOrderType(order)

  const createdAt =
    formatDate(
      order.created_at ||
      order.createdAt ||
      Date.now()
    )

  const productLines = items
    .map((item) => {
      const quantity = Math.max(
        1,
        Number(
          item.quantity || 1
        )
      )

      const itemName =
        getItemName(item)

      const itemNotes =
        String(
          getItemNotes(item)
        ).trim()

      return `
        <section class="product-item">
          <div class="product-main">
            <div class="product-quantity">
              ${quantity} x
            </div>

            <div class="product-name">
              ${escapeHtml(itemName)}
            </div>
          </div>

          ${
            itemNotes
              ? `
                <div class="product-note">
                  ${escapeHtml(
                    itemNotes
                  )}
                </div>
              `
              : ''
          }
        </section>
      `
    })
    .join('')

  return `
    <!doctype html>

    <html lang="es">
      <head>
        <meta charset="UTF-8" />

        <title>
          Comanda Cocina
        </title>

        <style>
          @page {
            size: 80mm auto;
            margin: 0;
          }

          * {
            box-sizing: border-box;
          }

          html,
          body {
            width: 80mm;
            margin: 0;
            padding: 0;
            background: #ffffff;
            color: #000000;
            font-family:
              Arial,
              Helvetica,
              sans-serif;
          }

          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .ticket {
            width: 72mm;
            max-width: 72mm;
            margin: 0 auto;
            padding: 3mm 2mm 5mm;
            overflow: hidden;
          }

          .center {
            text-align: center;
          }

          .title {
            margin: 0;
            font-size: 24px;
            font-weight: 900;
            line-height: 1;
          }

          .subtitle {
            margin-top: 3px;
            font-size: 14px;
            font-weight: 900;
          }

          .order-number {
            margin-top: 5px;
            font-size: 24px;
            font-weight: 900;
            line-height: 1;
          }

          .order-type {
            display: inline-block;
            margin-top: 5px;
            padding: 3px 9px;
            border: 2px solid #000000;
            font-size: 13px;
            font-weight: 900;
          }

          .date {
            margin-top: 6px;
            font-size: 11px;
            font-weight: 700;
          }

          .line {
            width: 100%;
            margin: 8px 0;
            border-top: 2px dashed #000000;
          }

          .customer-title {
            margin-bottom: 2px;
            font-size: 13px;
            font-weight: 900;
            text-align: center;
          }

          .customer-name {
            font-size: 20px;
            font-weight: 900;
            line-height: 1.15;
            text-align: center;
            text-transform: uppercase;
            overflow-wrap: anywhere;
          }

          .products-title {
            margin: 0 0 4px;
            font-size: 13px;
            font-weight: 900;
            text-align: center;
          }

          .product-item {
            width: 100%;
            padding: 6px 0;
            border-bottom: 1px dotted #000000;
            page-break-inside: avoid;
          }

          .product-item:last-child {
            border-bottom: none;
          }

          .product-main {
            display: grid;
            grid-template-columns:
              15mm minmax(0, 1fr);
            gap: 2mm;
            align-items: start;
          }

          .product-quantity {
            font-size: 20px;
            font-weight: 900;
            line-height: 1.15;
            white-space: nowrap;
          }

          .product-name {
            min-width: 0;
            font-size: 20px;
            font-weight: 900;
            line-height: 1.15;
            overflow-wrap: anywhere;
            word-break: normal;
          }

          .product-note {
            margin:
              4px 0
              0 17mm;

            padding: 4px 5px;
            border: 2px solid #000000;
            font-size: 14px;
            font-weight: 900;
            line-height: 1.2;
            overflow-wrap: anywhere;
          }

          .notes-title {
            margin-bottom: 4px;
            font-size: 14px;
            font-weight: 900;
          }

          .notes {
            padding: 5px;
            border: 2px solid #000000;
            font-size: 16px;
            font-weight: 900;
            line-height: 1.25;
            white-space: pre-wrap;
            overflow-wrap: anywhere;
          }

          .footer {
            margin-top: 8px;
            font-size: 12px;
            font-weight: 900;
            text-align: center;
          }
        </style>
      </head>

      <body>
        <main class="ticket">
          <header class="center">
            <h1 class="title">
              COMANDA
            </h1>

            <div class="subtitle">
              COCINA
            </div>

            ${
              orderNumber
                ? `
                  <div class="order-number">
                    #${escapeHtml(
                      orderNumber
                    )}
                  </div>
                `
                : ''
            }

            <div class="order-type">
              ${escapeHtml(
                orderType
              )}
            </div>

            <div class="date">
              ${escapeHtml(
                createdAt
              )}
            </div>
          </header>

          <div class="line"></div>

          ${
            customerName
              ? `
                <div class="customer-title">
                  CLIENTE
                </div>

                <div class="customer-name">
                  ${escapeHtml(
                    customerName
                  )}
                </div>

                <div class="line"></div>
              `
              : ''
          }

          <div class="products-title">
            PRODUCTOS
          </div>

          ${
            productLines ||
            `
              <div class="center">
                SIN PRODUCTOS
              </div>
            `
          }

          <div class="line"></div>

          <div class="notes-title">
            NOTAS DEL PEDIDO:
          </div>

          <div class="notes">
            ${escapeHtml(
              generalNotes ||
              'SIN NOTAS'
            )}
          </div>

          <div class="line"></div>

          <div class="footer">
            AMERICAN BURGER
          </div>
        </main>
      </body>
    </html>
  `
}

export default buildKitchenTicketHtml
