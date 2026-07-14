const escapeHtml = (value = '') =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')

const getOrderItems = (
  order = {}
) => {
  if (
    Array.isArray(order.items)
  ) {
    return order.items
  }

  if (
    Array.isArray(
      order.order_items
    )
  ) {
    return order.order_items
  }

  return []
}

const getItemName = (
  item = {}
) =>
  item.name ||
  item.product_name ||
  item.name_snapshot ||
  item.product?.name ||
  'Producto'

const getItemNotes = (
  item = {}
) =>
  item.notes ||
  item.observations ||
  item.comment ||
  item.instructions ||
  ''

const getOrderNumber = (
  order = {}
) =>
  order.order_number ||
  order.number ||
  order.code ||
  order.id ||
  ''

const getOrderType = (
  order = {}
) => {
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
      .toLocaleString(
        'es-CL'
      )
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

const normalizeItem = (
  item = {}
) => ({
  quantity: Math.max(
    1,
    Number(
      item.quantity || 1
    )
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

  const productLines =
    items
      .map((item) => `
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
                    item.notes
                      .toUpperCase()
                  )}
                </div>
              `
              : ''
          }
        </section>
      `)
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
            box-sizing:
              border-box;
          }

          html {
            width: 80mm;
            margin: 0;
            padding: 0;
            background: #ffffff;
          }

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

            -webkit-print-color-adjust:
              exact;

            print-color-adjust:
              exact;
          }

          .ticket {
            width: 66mm;
            max-width: 66mm;

            margin:
              0
              0
              0
              2mm;

            padding:
              1.5mm
              1mm
              3mm
              1mm;

            overflow: hidden;
          }

          .header-row {
            display: grid;

            grid-template-columns:
              minmax(0, 1fr)
              auto;

            gap: 2mm;
            align-items: center;
          }

          .title {
            min-width: 0;
            margin: 0;

            font-size: 15px;
            font-weight: 900;
            line-height: 1;

            overflow-wrap:
              anywhere;
          }

          .order-number {
            font-size: 17px;
            font-weight: 900;
            line-height: 1;
            white-space: nowrap;
          }

          .order-info {
            display: grid;

            grid-template-columns:
              auto
              minmax(0, 1fr);

            gap: 2mm;
            align-items: center;

            margin-top: 3px;
          }

          .order-type {
            padding: 2px 5px;

            border:
              1.5px solid
              #000000;

            font-size: 9px;
            font-weight: 900;
            line-height: 1;
            white-space: nowrap;
          }

          .date {
            min-width: 0;

            font-size: 8.5px;
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
              13mm
              minmax(0, 1fr);

            gap: 2mm;
            align-items: start;
          }

          .customer-title {
            font-size: 9px;
            font-weight: 900;
          }

          .customer-name {
            min-width: 0;

            font-size: 12px;
            font-weight: 900;
            line-height: 1.1;

            text-align: right;
            text-transform:
              uppercase;

            overflow-wrap:
              anywhere;
          }

          .products-title {
            margin: 0 0 2px;

            font-size: 9px;
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
              8mm
              minmax(0, 1fr);

            gap: 1.5mm;
            align-items: start;
          }

          .product-quantity {
            font-size: 12px;
            font-weight: 900;
            line-height: 1.08;
            white-space: nowrap;
          }

          .product-name {
            min-width: 0;

            font-size: 12px;
            font-weight: 900;
            line-height: 1.08;

            overflow-wrap:
              anywhere;

            word-break:
              break-word;
          }

          .product-note {
            max-width: 54mm;

            margin:
              2px 0
              0 9.5mm;

            padding:
              2px 3px;

            border-left:
              2px solid
              #000000;

            font-size: 9.5px;
            font-weight: 900;
            line-height: 1.12;

            overflow-wrap:
              anywhere;

            word-break:
              break-word;
          }

          .notes {
            width: 100%;

            padding: 3px;

            border:
              1.5px solid
              #000000;

            font-size: 10px;
            font-weight: 900;
            line-height: 1.15;

            white-space:
              pre-wrap;

            overflow-wrap:
              anywhere;

            word-break:
              break-word;
          }

          .notes-label {
            margin-right: 3px;
            font-size: 8.5px;
            font-weight: 900;
          }

          .footer {
            width: 100%;
            margin-top: 4px;

            font-size: 8.5px;
            font-weight: 900;
            text-align: center;
          }

          .empty {
            padding: 3px 0;

            font-size: 10px;
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
