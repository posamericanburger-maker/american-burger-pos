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

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return new Date()
      .toLocaleString('es-CL')
  }

  return date.toLocaleString(
    'es-CL',
    {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }
  )
}

const normalizeItem = (item = {}) => ({
  quantity: Math.max(
    1,
    Number(item.quantity || 1)
  ),

  name:
    getItemName(item),

  notes:
    String(
      getItemNotes(item)
    ).trim()
})

export const buildKitchenTicketHtml = (
  order = {}
) => {
  const items =
    getOrderItems(order)
      .map(normalizeItem)

  const customerName =
    String(
      order.customer_name ||
      order.customer?.name ||
      ''
    ).trim()

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
      return `
        <section class="product-item">
          <div class="product-main">
            <div class="product-quantity">
              ${item.quantity}x
            </div>

            <div class="product-name">
              ${escapeHtml(
                String(
                  item.name
                ).toUpperCase()
              )}
            </div>
          </div>

          ${
            item.notes
              ? `
                <div class="product-note">
                  ${escapeHtml(
                    item.notes.toUpperCase()
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
            -webkit-print-color-adjust:
              exact;

            print-color-adjust:
              exact;
          }

          .ticket {
            width: 72mm;
            max-width: 72mm;
            margin: 0 auto;
            padding:
              1.5mm
              1.5mm
              3mm;

            overflow: hidden;
          }

          .center {
            text-align: center;
          }

          .header-row {
            display: flex;
            align-items: center;
            justify-content:
              space-between;
            gap: 2mm;
          }

          .title {
            margin: 0;
            font-size: 16px;
            font-weight: 900;
            line-height: 1;
          }

          .order-number {
            font-size: 18px;
            font-weight: 900;
            line-height: 1;
            white-space: nowrap;
          }

          .order-info {
            display: flex;
            align-items: center;
            justify-content:
              space-between;
            gap: 2mm;
            margin-top: 3px;
          }

          .order-type {
            display: inline-block;
            padding: 2px 6px;
            border: 1.5px solid
              #000000;
            font-size: 10px;
            font-weight: 900;
            line-height: 1.1;
          }

          .date {
            font-size: 9px;
            font-weight: 700;
            text-align: right;
            white-space: nowrap;
          }

          .line {
            width: 100%;
            margin: 4px 0;
            border-top:
              1.5px dashed
              #000000;
          }

          .customer {
            display: grid;
            grid-template-columns:
              15mm minmax(0, 1fr);
            gap: 2mm;
            align-items: start;
          }

          .customer-title {
            font-size: 10px;
            font-weight: 900;
          }

          .customer-name {
            min-width: 0;
            font-size: 13px;
            font-weight: 900;
            line-height: 1.1;
            text-align: right;
            text-transform: uppercase;
            overflow-wrap: anywhere;
          }

          .products-title {
            margin: 0 0 2px;
            font-size: 10px;
            font-weight: 900;
            text-align: center;
          }

          .product-item {
            width: 100%;
            padding: 2.5px 0;
            border-bottom:
              1px dotted
              #000000;
            page-break-inside:
              avoid;
          }

          .product-item:last-child {
            border-bottom: none;
          }

          .product-main {
            display: grid;
            grid-template-columns:
              9mm minmax(0, 1fr);
            gap: 1.5mm;
            align-items: start;
          }

          .product-quantity {
            font-size: 13px;
            font-weight: 900;
            line-height: 1.08;
            white-space: nowrap;
          }

          .product-name {
            min-width: 0;
            font-size: 13px;
            font-weight: 900;
            line-height: 1.08;
            overflow-wrap: anywhere;
            word-break: normal;
          }

          .product-note {
            margin:
              2px 0
              0 10.5mm;

            padding:
              2px 3px;

            border-left:
              2px solid
              #000000;

            font-size: 10px;
            font-weight: 900;
            line-height: 1.12;
            overflow-wrap: anywhere;
          }

          .notes {
            padding: 3px;
            border:
              1.5px solid
              #000000;

            font-size: 11px;
            font-weight: 900;
            line-height: 1.15;
            white-space: pre-wrap;
            overflow-wrap: anywhere;
          }

          .notes-label {
            margin-right: 3px;
            font-size: 9px;
            font-weight: 900;
          }

          .footer {
            margin-top: 4px;
            font-size: 9px;
            font-weight: 900;
            text-align: center;
          }

          .empty {
            padding: 3px 0;
            font-size: 11px;
            font-weight: 900;
            text-align: center;
          }
        </style>
      </head>

      <body>
        <main class="ticket">
          <header>
            <div class="header-row">
              <h1 class="title">
                COMANDA COCINA
              </h1>

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
            </div>

            <div class="order-info">
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
            </div>
          </header>

          ${
            customerName
              ? `
                <div class="line"></div>

                <div class="customer">
                  <div class="customer-title">
                    CLIENTE
                  </div>

                  <div class="customer-name">
                    ${escapeHtml(
                      customerName
                    )}
                  </div>
                </div>
              `
              : ''
          }

          <div class="line"></div>

          <div class="products-title">
            PRODUCTOS
          </div>

          ${
            productLines ||
            `
              <div class="empty">
                SIN PRODUCTOS
              </div>
            `
          }

          ${
            generalNotes
              ? `
                <div class="line"></div>

                <div class="notes">
                  <span class="notes-label">
                    NOTAS:
                  </span>

                  ${escapeHtml(
                    generalNotes
                      .toUpperCase()
                  )}
                </div>
              `
              : ''
          }

          <div class="footer">
            AMERICAN BURGER
          </div>
        </main>
      </body>
    </html>
  `
}

export default buildKitchenTicketHtml
