const escapeHtml = (value = '') =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')

const money = (value = 0) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(Number(value || 0))

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

const getPaymentMethod = (order = {}) => {
  const method = String(
    order.payment_method ||
      order.paymentMethod ||
      ''
  ).toLowerCase()

  const labels = {
    cash: 'EFECTIVO',
    efectivo: 'EFECTIVO',

    debit: 'DÉBITO',
    debito: 'DÉBITO',
    débito: 'DÉBITO',

    credit: 'CRÉDITO',
    credito: 'CRÉDITO',
    crédito: 'CRÉDITO',

    transfer: 'TRANSFERENCIA',
    transferencia: 'TRANSFERENCIA',

    pending: 'PENDIENTE',
    pendiente: 'PENDIENTE'
  }

  return (
    labels[method] ||
    String(
      order.payment_method_text ||
        order.payment_method ||
        'NO INFORMADO'
    ).toUpperCase()
  )
}

const formatDateParts = (value) => {
  const date = new Date(
    value || Date.now()
  )

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return {
      date: '-',
      time: '-'
    }
  }

  return {
    date: date.toLocaleDateString(
      'es-CL',
      {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }
    ),

    time: date.toLocaleTimeString(
      'es-CL',
      {
        hour: '2-digit',
        minute: '2-digit'
      }
    )
  }
}

const getItemUnitPrice = (item = {}) =>
  Number(
    item.unit_price ||
      item.price ||
      item.unitPrice ||
      0
  )

const getItemQuantity = (item = {}) =>
  Math.max(
    1,
    Number(
      item.quantity || 1
    )
  )

const getItemSubtotal = (item = {}) => {
  const quantity =
    getItemQuantity(item)

  const unitPrice =
    getItemUnitPrice(item)

  return Number(
    item.subtotal ||
      item.total ||
      quantity * unitPrice
  )
}

export const buildCustomerReceiptHtml = (
  order = {}
) => {
  const items =
    getOrderItems(order)

  const orderNumber =
    getOrderNumber(order)

  const orderType =
    getOrderType(order)

  const paymentMethod =
    getPaymentMethod(order)

  const customerName =
    order.customer_name ||
    order.customer?.name ||
    ''

  const customerPhone =
    order.customer_phone ||
    order.customer?.phone ||
    ''

  const deliveryAddress =
    order.delivery_address ||
    order.address ||
    order.customer?.address ||
    ''

  const {
    date,
    time
  } = formatDateParts(
    order.created_at ||
      order.createdAt ||
      Date.now()
  )

  const subtotal = Number(
    order.subtotal ||
      order.net_total ||
      order.total ||
      0
  )

  const deliveryFee = Number(
    order.delivery_fee ||
      order.deliveryFee ||
      0
  )

  const discount = Number(
    order.discount ||
      order.discount_amount ||
      0
  )

  const total = Number(
    order.total ||
      order.total_amount ||
      order.grand_total ||
      subtotal +
        deliveryFee -
        discount
  )

  const productLines = items
    .map((item) => {
      const quantity =
        getItemQuantity(item)

      const itemName =
        getItemName(item)

      const itemNotes =
        String(
          getItemNotes(item)
        ).trim()

      const unitPrice =
        getItemUnitPrice(item)

      const itemSubtotal =
        getItemSubtotal(item)

      return `
        <section class="product-item">
          <div class="product-row">
            <div class="product-quantity">
              ${quantity}x
            </div>

            <div class="product-information">
              <div class="product-name">
                ${escapeHtml(itemName)}
              </div>

              ${
                quantity > 1
                  ? `
                    <div class="product-unit-price">
                      ${escapeHtml(
                        money(unitPrice)
                      )} c/u
                    </div>
                  `
                  : ''
              }
            </div>

            <div class="product-price">
              ${escapeHtml(
                money(itemSubtotal)
              )}
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
          Comprobante de pedido
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
            padding: 3mm 2mm 5mm;
            overflow: hidden;
            font-size: 12px;
            line-height: 1.25;
          }

          .center {
            text-align: center;
          }

          .brand {
            margin: 0;
            font-size: 22px;
            font-weight: 900;
            line-height: 1;
            letter-spacing: 0.2px;
          }

          .ticket-title {
            margin-top: 4px;
            font-size: 15px;
            font-weight: 900;
            line-height: 1.1;
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
            font-size: 12px;
            font-weight: 900;
          }

          .line {
            width: 100%;
            margin: 7px 0;
            border-top: 1px dashed #000000;
          }

          .strong-line {
            width: 100%;
            margin: 7px 0;
            border-top: 2px solid #000000;
          }

          .meta {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
          }

          .meta td {
            padding: 2px 0;
            vertical-align: top;
            overflow-wrap: anywhere;
          }

          .meta-label {
            width: 30%;
            font-weight: 900;
          }

          .meta-value {
            width: 70%;
            text-align: right;
            font-weight: 900;
          }

          .customer-block {
            margin-top: 6px;
            padding: 5px;
            border: 1px solid #000000;
          }

          .customer-row {
            display: grid;
            grid-template-columns:
              22mm minmax(0, 1fr);
            gap: 2mm;
            margin: 2px 0;
          }

          .customer-label {
            font-weight: 900;
          }

          .customer-value {
            min-width: 0;
            text-align: right;
            font-weight: 700;
            overflow-wrap: anywhere;
          }

          .products-title {
            margin: 0 0 3px;
            font-size: 13px;
            font-weight: 900;
            text-align: center;
          }

          .product-item {
            width: 100%;
            padding: 5px 0;
            border-bottom: 1px dotted #000000;
            page-break-inside: avoid;
          }

          .product-item:last-child {
            border-bottom: none;
          }

          .product-row {
            display: grid;
            grid-template-columns:
              10mm minmax(0, 1fr) 20mm;
            gap: 2mm;
            align-items: start;
          }

          .product-quantity {
            font-size: 15px;
            font-weight: 900;
            line-height: 1.15;
            white-space: nowrap;
          }

          .product-information {
            min-width: 0;
          }

          .product-name {
            min-width: 0;
            font-size: 14px;
            font-weight: 900;
            line-height: 1.15;
            overflow-wrap: anywhere;
          }

          .product-unit-price {
            margin-top: 2px;
            font-size: 10px;
            font-weight: 700;
          }

          .product-price {
            font-size: 13px;
            font-weight: 900;
            line-height: 1.15;
            text-align: right;
            white-space: nowrap;
          }

          .product-note {
            margin:
              3px 0
              0 12mm;

            padding: 3px 4px;
            border-left: 3px solid #000000;
            font-size: 11px;
            font-weight: 900;
            line-height: 1.2;
            overflow-wrap: anywhere;
          }

          .summary {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
          }

          .summary td {
            padding: 2px 0;
          }

          .summary-label {
            width: 55%;
            font-weight: 900;
          }

          .summary-value {
            width: 45%;
            text-align: right;
            font-weight: 900;
            white-space: nowrap;
          }

          .total-row td {
            padding-top: 5px;
            border-top: 2px solid #000000;
            font-size: 19px;
            font-weight: 900;
          }

          .footer {
            margin-top: 8px;
            font-size: 10px;
            font-weight: 700;
            line-height: 1.35;
            text-align: center;
          }

          .footer-brand {
            margin-top: 3px;
            font-size: 13px;
            font-weight: 900;
          }
        </style>
      </head>

      <body>
        <main class="ticket">
          <header class="center">
            <h1 class="brand">
              AMERICAN BURGER
            </h1>

            <div class="ticket-title">
              COMPROBANTE DE PEDIDO
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
          </header>

          <div class="line"></div>

          <table class="meta">
            <tbody>
              <tr>
                <td class="meta-label">
                  FECHA
                </td>

                <td class="meta-value">
                  ${escapeHtml(date)}
                </td>
              </tr>

              <tr>
                <td class="meta-label">
                  HORA
                </td>

                <td class="meta-value">
                  ${escapeHtml(time)}
                </td>
              </tr>

              <tr>
                <td class="meta-label">
                  PAGO
                </td>

                <td class="meta-value">
                  ${escapeHtml(
                    paymentMethod
                  )}
                </td>
              </tr>
            </tbody>
          </table>

          ${
            customerName ||
            customerPhone ||
            deliveryAddress
              ? `
                <section class="customer-block">
                  ${
                    customerName
                      ? `
                        <div class="customer-row">
                          <div class="customer-label">
                            CLIENTE
                          </div>

                          <div class="customer-value">
                            ${escapeHtml(
                              customerName
                            )}
                          </div>
                        </div>
                      `
                      : ''
                  }

                  ${
                    customerPhone
                      ? `
                        <div class="customer-row">
                          <div class="customer-label">
                            TELÉFONO
                          </div>

                          <div class="customer-value">
                            ${escapeHtml(
                              customerPhone
                            )}
                          </div>
                        </div>
                      `
                      : ''
                  }

                  ${
                    deliveryAddress
                      ? `
                        <div class="customer-row">
                          <div class="customer-label">
                            DIRECCIÓN
                          </div>

                          <div class="customer-value">
                            ${escapeHtml(
                              deliveryAddress
                            )}
                          </div>
                        </div>
                      `
                      : ''
                  }
                </section>
              `
              : ''
          }

          <div class="strong-line"></div>

          <div class="products-title">
            DETALLE DEL PEDIDO
          </div>

          ${
            productLines ||
            `
              <div class="center">
                SIN PRODUCTOS
              </div>
            `
          }

          <div class="strong-line"></div>

          <table class="summary">
            <tbody>
              <tr>
                <td class="summary-label">
                  SUBTOTAL
                </td>

                <td class="summary-value">
                  ${escapeHtml(
                    money(subtotal)
                  )}
                </td>
              </tr>

              ${
                deliveryFee > 0
                  ? `
                    <tr>
                      <td class="summary-label">
                        DELIVERY
                      </td>

                      <td class="summary-value">
                        ${escapeHtml(
                          money(
                            deliveryFee
                          )
                        )}
                      </td>
                    </tr>
                  `
                  : ''
              }

              ${
                discount > 0
                  ? `
                    <tr>
                      <td class="summary-label">
                        DESCUENTO
                      </td>

                      <td class="summary-value">
                        -${escapeHtml(
                          money(
                            discount
                          )
                        )}
                      </td>
                    </tr>
                  `
                  : ''
              }

              <tr class="total-row">
                <td class="summary-label">
                  TOTAL
                </td>

                <td class="summary-value">
                  ${escapeHtml(
                    money(total)
                  )}
                </td>
              </tr>
            </tbody>
          </table>

          <footer class="footer">
            PRECIOS CON IVA INCLUIDO
            <br />

            GRACIAS POR TU COMPRA

            <div class="footer-brand">
              AMERICAN BURGER
            </div>

            ARICA - CHILE
            <br />

            @americanburgerarica
          </footer>
        </main>
      </body>
    </html>
  `
}

export default buildCustomerReceiptHtml
