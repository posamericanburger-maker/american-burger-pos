const money = (value) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(Number(value || 0))

const printHtmlHidden = (html, delay = 500) => {
  const iframe = document.createElement('iframe')

  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'
  iframe.style.opacity = '0'

  document.body.appendChild(iframe)

  const doc = iframe.contentWindow.document

  doc.open()
  doc.write(html)
  doc.close()

  setTimeout(() => {
    iframe.contentWindow.focus()
    iframe.contentWindow.print()

    setTimeout(() => {
      if (iframe.parentNode) {
        document.body.removeChild(iframe)
      }
    }, 1200)
  }, delay)
}

const getItems = (order) => order.items || order.order_items || []

const getCustomerName = (order) =>
  order.customer?.name || order.customer_name || 'Cliente'

const getCustomerPhone = (order) =>
  order.customer?.phone || order.customer_phone || ''

const getCustomerAddress = (order) =>
  order.customer?.address || order.customer_address || ''

export const printKitchenTicket = (order) => {
  const items = getItems(order)

  const productLines = items
    .map(
      (item) => `
        <div class="item">
          <div class="qty">${item.quantity} x</div>
          <div class="name">${item.name || item.product_name || item.name_snapshot}</div>
        </div>
      `
    )
    .join('')

  const html = `
    <html>
      <head>
        <title>Comanda Cocina</title>
        <style>
          @page { size: 80mm auto; margin: 0; }

          body {
            width: 80mm;
            margin: 0;
            padding: 6mm 4mm;
            font-family: Arial, monospace;
            color: #000;
            background: #fff;
          }

          .center { text-align: center; }
          .title { font-size: 24px; font-weight: 900; margin: 0; }
          .subtitle { font-size: 14px; font-weight: 700; margin-top: 4px; }
          .line { border-top: 2px dashed #000; margin: 10px 0; }

          .item {
            display: flex;
            gap: 8px;
            font-size: 20px;
            font-weight: 900;
            margin: 12px 0;
          }

          .qty { min-width: 42px; }
          .name { flex: 1; }

          .notes-title {
            font-size: 16px;
            font-weight: 900;
            margin-bottom: 4px;
          }

          .notes {
            font-size: 17px;
            font-weight: 900;
            white-space: pre-wrap;
          }

          .footer {
            font-size: 12px;
            margin-top: 10px;
          }
        </style>
      </head>

      <body>
        <div class="center">
          <h1 class="title">COMANDA</h1>
          <div class="subtitle">COCINA - PEDIDO WEB</div>
          <div class="footer">${new Date().toLocaleString('es-CL')}</div>
        </div>

        <div class="line"></div>

        <div><strong>Pedido:</strong> #${order.order_number || order.number || order.id || ''}</div>
        <div><strong>Cliente:</strong> ${getCustomerName(order)}</div>

        <div class="line"></div>

        ${productLines}

        <div class="line"></div>

        <div class="notes-title">NOTAS DEL PEDIDO:</div>
        <div class="notes">${String(order.notes || '').replace('[WEB]', '').trim() || 'SIN NOTAS'}</div>

        <div class="line"></div>

        <div class="center footer">AMERICAN BURGER</div>
      </body>
    </html>
  `

  printHtmlHidden(html, 400)
}

export const printDeliveryGuide = (order) => {
  const items = getItems(order)
  const subtotal = Number(order.subtotal || 0)
  const deliveryFee = Number(order.delivery_fee || 0)
  const total = Number(order.total || order.total_amount || 0)

  const productLines = items
    .map((item) => {
      const price = Number(item.price || item.unit_price || 0)
      const quantity = Number(item.quantity || 1)
      const lineTotal = Number(item.subtotal || price * quantity)

      return `
        <div class="product">
          <div>
            <strong>${quantity} x ${item.name || item.product_name || item.name_snapshot}</strong>
            <br />
            <span>${money(price)} c/u</span>
          </div>
          <div class="right">${money(lineTotal)}</div>
        </div>
      `
    })
    .join('')

  const html = `
    <html>
      <head>
        <title>Guía Pedido Web</title>
        <style>
          @page { size: 80mm auto; margin: 0; }

          body {
            width: 80mm;
            margin: 0;
            padding: 6mm 4mm;
            font-family: Arial, monospace;
            font-size: 12px;
            color: #000;
            background: #fff;
          }

          .center { text-align: center; }
          .brand { font-size: 22px; font-weight: 900; margin: 0; }
          .small { font-size: 11px; }
          .line { border-top: 1px dashed #000; margin: 8px 0; }
          .section-title { font-size: 13px; font-weight: 900; margin-bottom: 4px; }

          .row,
          .product {
            display: flex;
            justify-content: space-between;
            gap: 8px;
            margin: 6px 0;
          }

          .right {
            text-align: right;
            white-space: nowrap;
          }

          .total {
            font-size: 18px;
            font-weight: 900;
          }

          .important {
            font-size: 15px;
            font-weight: 900;
            white-space: pre-wrap;
          }

          .thanks {
            font-size: 12px;
            margin-top: 10px;
            text-align: center;
          }
        </style>
      </head>

      <body>
        <div class="center">
          <h1 class="brand">AMERICAN BURGER</h1>
          <div>ARICA - CHILE</div>
          <div class="small">GUÍA DE DESPACHO PEDIDO WEB</div>
        </div>

        <div class="line"></div>

        <div class="section-title">DATOS DEL NEGOCIO</div>
        <div>American Burger Arica</div>
        <div>Av. Santa María 2248</div>
        <div>Arica - Chile</div>

        <div class="line"></div>

        <div class="section-title">DATOS DEL CLIENTE</div>
        <div><strong>Nombre:</strong> ${getCustomerName(order)}</div>
        <div><strong>WhatsApp:</strong> ${getCustomerPhone(order)}</div>
        <div><strong>Dirección:</strong></div>
        <div class="important">${getCustomerAddress(order) || 'Retiro en local'}</div>

        <div class="line"></div>

        <div class="section-title">PRODUCTOS</div>
        ${productLines}

        <div class="line"></div>

        <div class="row">
          <span>Subtotal</span>
          <strong>${money(subtotal)}</strong>
        </div>

        <div class="row">
          <span>Delivery</span>
          <strong>${money(deliveryFee)}</strong>
        </div>

        <div class="row total">
          <span>TOTAL</span>
          <span>${money(total)}</span>
        </div>

        <div class="center small">Precios con IVA incluido</div>

        <div class="line"></div>

        <div class="row">
          <span>Forma de pago</span>
          <strong>${order.payment_method || 'Pendiente'}</strong>
        </div>

        <div class="line"></div>

        <div class="section-title">NOTAS</div>
        <div>${String(order.notes || '').replace('[WEB]', '').trim() || 'Sin observaciones'}</div>

        <div class="line"></div>

        <div class="thanks">
          Entregar pedido al cliente indicado<br />
          🍔 American Burger 🍔
        </div>
      </body>
    </html>
  `

  printHtmlHidden(html, 900)
}

export const printWebOrderDocuments = (order) => {
  printKitchenTicket(order)

  setTimeout(() => {
    printDeliveryGuide(order)
  }, 900)
}
