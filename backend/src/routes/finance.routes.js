import express from 'express'
import XLSX from 'xlsx'
import { supabase } from '../config/supabase.js'

const router = express.Router()

const IVA_RATE = 0.19
const TARGET_PROFIT = 1000000
const WORKING_DAYS = 26
const FIXED_COSTS_TOTAL = 2210000

const productCosts = [
  { product_name: 'Cheese Burger', final_cost: 2775 },
  { product_name: 'Bacon Cheese Burger', final_cost: 3069 },
  { product_name: 'BBQ Burger', final_cost: 3294 },
  { product_name: 'American Burger', final_cost: 3184 },
  { product_name: 'California Burger', final_cost: 3360 },
  { product_name: 'Crispy Burger', final_cost: 2618 },
  { product_name: 'Veggie Burger', final_cost: 3138 },
  { product_name: 'Oklahoma Burger', final_cost: 3735 },
  { product_name: 'Buffalo Burger', final_cost: 4939 },
  { product_name: 'Alitas BBQ', final_cost: 4147 },
  { product_name: 'Alitas Crispy', final_cost: 4147 },
  { product_name: 'Crispy Tenders', final_cost: 3976 },
  { product_name: 'American Fries', final_cost: 2758 },
  { product_name: 'Cheese Fries', final_cost: 2330 },
  { product_name: 'Papas fritas', final_cost: 1100 },
  { product_name: 'Aros de Cebolla', final_cost: 1438 },
  { product_name: 'Te o Café', final_cost: 400 },
  { product_name: 'Bebida en Lata 330cc', final_cost: 915 },
  { product_name: 'Cheedar', final_cost: 450 },
  { product_name: 'Ingredientes especiales', final_cost: 500 },
  { product_name: 'Arma tu Combo', final_cost: 1100 }
]

const productAliases = {
  'american burger': 'American Burger',
  'american burger.': 'American Burger',

  'bacon cheese burger': 'Bacon Cheese Burger',
  'bacon cheese burger.': 'Bacon Cheese Burger',

  'cheese burger': 'Cheese Burger',
  'cheese burger.': 'Cheese Burger',

  'bbq burger': 'BBQ Burger',
  'bbq burger.': 'BBQ Burger',

  'california burger': 'California Burger',
  'california burger.': 'California Burger',

  'crispy burger': 'Crispy Burger',
  'crispy burger.': 'Crispy Burger',

  'veggie burger': 'Veggie Burger',
  'veggie burger.': 'Veggie Burger',

  'oklahoma burger': 'Oklahoma Burger',
  'oklahoma burger.': 'Oklahoma Burger',

  'buffalo burger': 'Buffalo Burger',
  'bufalo burger': 'Buffalo Burger',
  'búfalo burger': 'Buffalo Burger',
  'búfalo burger.': 'Buffalo Burger',
  'bufalo burger.': 'Buffalo Burger',

  'alitas bbq': 'Alitas BBQ',
  'alitas bbq.': 'Alitas BBQ',

  'alitas crispy': 'Alitas Crispy',
  'alitas crispy.': 'Alitas Crispy',

  'crispy tenders': 'Crispy Tenders',
  'crispy tenders.': 'Crispy Tenders',

  'american fries': 'American Fries',
  'american fries.': 'American Fries',

  'cheese fries': 'Cheese Fries',
  'cheese fries.': 'Cheese Fries',

  'papas fritas': 'Papas fritas',
  'papas fritas.': 'Papas fritas',
  'papas fritas clasicas': 'Papas fritas',
  'papas fritas clásicas': 'Papas fritas',

  'aros de cebolla': 'Aros de Cebolla',
  'aros de cebolla.': 'Aros de Cebolla',

  'te o cafe': 'Te o Café',
  'te o café': 'Te o Café',

  'bebida lata': 'Bebida en Lata 330cc',
  'bebida en lata': 'Bebida en Lata 330cc',
  'bebida en lata 330cc': 'Bebida en Lata 330cc',
  'bebida lata 330cc': 'Bebida en Lata 330cc',

  'cheedar': 'Cheedar',
  'cheddar': 'Cheedar',

  'ingredientes especiales': 'Ingredientes especiales',
  'ingredientes especiales.': 'Ingredientes especiales',

  'arma tu combo': 'Arma tu Combo',
  'arma tu combo.': 'Arma tu Combo'
}

const numberValue = (value) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

const normalize = (value) => {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\.$/, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

const canonicalName = (name) => {
  const raw = String(name || '').trim()
  const normalized = normalize(raw)
  return productAliases[normalized] || raw.replace(/\.$/, '').trim()
}

const getMonthRange = (month) => {
  const safeMonth = month || new Date().toISOString().slice(0, 7)
  const start = `${safeMonth}-01T00:00:00.000Z`
  const date = new Date(start)
  date.setUTCMonth(date.getUTCMonth() + 1)
  const end = date.toISOString()
  return { safeMonth, start, end }
}

const getOrders = async (start, end) => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .gte('created_at', start)
    .lt('created_at', end)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

const getOrderItemsByOrders = async (orderIds) => {
  if (!orderIds.length) return []

  const { data, error } = await supabase
    .from('order_items')
    .select('*')
    .in('order_id', orderIds)

  if (error) {
    console.error('Error leyendo order_items:', error.message)
    return []
  }

  return data || []
}

const orderTotal = (order) => {
  return numberValue(
    order.total ||
      order.total_amount ||
      order.amount ||
      order.grand_total ||
      order.final_total ||
      0
  )
}

const itemName = (item) => {
  return String(
    item.product_name ||
      item.name ||
      item.description ||
      item.name_snapshot ||
      item.product ||
      ''
  ).trim()
}

const itemQuantity = (item) => {
  return numberValue(item.quantity || item.qty || 1) || 1
}

const itemSaleTotal = (item) => {
  const qty = itemQuantity(item)

  return numberValue(
    item.total ||
      item.subtotal ||
      item.line_total ||
      numberValue(item.unit_price || item.price || item.sale_price) * qty ||
      0
  )
}

const calculateFinance = async (month) => {
  const { safeMonth, start, end } = getMonthRange(month)

  const orders = await getOrders(start, end)
  const orderIds = orders.map((order) => order.id).filter(Boolean)
  const orderItems = await getOrderItemsByOrders(orderIds)

  const productCostMap = new Map()

  for (const product of productCosts) {
    productCostMap.set(normalize(product.product_name), product)
  }

  const totalSales = orders.reduce((sum, order) => {
    return sum + orderTotal(order)
  }, 0)

  const profitabilityMap = new Map()
  let totalVariableCost = 0

  for (const item of orderItems) {
    const originalName = itemName(item)
    const cleanName = canonicalName(originalName)
    const qty = itemQuantity(item)
    const saleTotal = itemSaleTotal(item)

    const productCost = productCostMap.get(normalize(cleanName))
    const finalCost = productCost ? numberValue(productCost.final_cost) : 0
    const costTotal = finalCost * qty

    totalVariableCost += costTotal

    const key = cleanName || 'Producto sin nombre'

    if (!profitabilityMap.has(key)) {
      profitabilityMap.set(key, {
        producto: key,
        cantidad: 0,
        ventas: 0,
        costo: 0,
        contribucion: 0,
        margen: 0
      })
    }

    const row = profitabilityMap.get(key)

    row.cantidad += qty
    row.ventas += saleTotal
    row.costo += costTotal
    row.contribucion = row.ventas - row.costo
    row.margen = row.ventas > 0 ? row.contribucion / row.ventas : 0
  }

  const netSales = totalSales / (1 + IVA_RATE)
  const ivaDebit = totalSales - netSales

  const ivaCreditEstimated =
    totalVariableCost - totalVariableCost / (1 + IVA_RATE)

  const ivaToPayEstimated = Math.max(ivaDebit - ivaCreditEstimated, 0)

  const grossProfit = totalSales - totalVariableCost
  const operatingProfit = grossProfit - FIXED_COSTS_TOTAL
  const averageMargin = totalSales > 0 ? grossProfit / totalSales : 0

  const breakEvenMonthly =
    averageMargin > 0 ? FIXED_COSTS_TOTAL / averageMargin : 0

  const breakEvenDaily =
    WORKING_DAYS > 0 ? breakEvenMonthly / WORKING_DAYS : 0

  const status =
    totalSales >= breakEvenMonthly && breakEvenMonthly > 0
      ? 'SOBRE EQUILIBRIO'
      : totalSales >= breakEvenMonthly * 0.85 && breakEvenMonthly > 0
        ? 'CERCA DEL EQUILIBRIO'
        : totalSales > 0
          ? 'BAJO EQUILIBRIO'
          : 'SIN DATOS'

  return {
    month: safeMonth,
    settings: {
      ivaRate: IVA_RATE,
      targetProfit: TARGET_PROFIT,
      workingDays: WORKING_DAYS
    },
    summary: {
      totalSales,
      netSales,
      ivaDebit,
      ivaCreditEstimated,
      ivaToPayEstimated,
      totalVariableCost,
      totalFixedCosts: FIXED_COSTS_TOTAL,
      grossProfit,
      operatingProfit,
      averageMargin,
      breakEvenMonthly,
      breakEvenDaily,
      targetProfit: TARGET_PROFIT,
      salesForTargetProfit:
        averageMargin > 0
          ? (FIXED_COSTS_TOTAL + TARGET_PROFIT) / averageMargin
          : 0,
      status
    },
    fixedCosts: [
      {
        concept: 'Costos fijos mensuales',
        amount: FIXED_COSTS_TOTAL,
        notes: 'Valor fijo temporal'
      }
    ],
    productCosts,
    profitability: Array.from(profitabilityMap.values()),
    orders,
    orderItems
  }
}

router.get('/summary', async (req, res) => {
  const result = await calculateFinance(req.query.month)
  res.json(result)
})

router.get('/fixed-costs', async (req, res) => {
  res.json([
    {
      concept: 'Costos fijos mensuales',
      amount: FIXED_COSTS_TOTAL,
      notes: 'Valor fijo temporal'
    }
  ])
})

router.post('/fixed-costs', async (req, res) => {
  res.json({
    message: 'Costos fijos temporales activos',
    data: []
  })
})

router.get('/product-costs', async (req, res) => {
  res.json(productCosts)
})

router.post('/product-costs', async (req, res) => {
  res.json({
    message: 'Costos de productos temporales activos',
    data: productCosts
  })
})

router.get('/export-excel', async (req, res) => {
  const result = await calculateFinance(req.query.month)

  const wb = XLSX.utils.book_new()

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([
      ['Indicador', 'Valor'],
      ['Mes', result.month],
      ['Ventas totales', result.summary.totalSales],
      ['Ventas netas', result.summary.netSales],
      ['IVA débito estimado', result.summary.ivaDebit],
      ['IVA crédito estimado', result.summary.ivaCreditEstimated],
      ['IVA a pagar estimado', result.summary.ivaToPayEstimated],
      ['Costo variable', result.summary.totalVariableCost],
      ['Costos fijos', result.summary.totalFixedCosts],
      ['Utilidad bruta', result.summary.grossProfit],
      ['Utilidad operativa', result.summary.operatingProfit],
      ['Margen promedio', result.summary.averageMargin],
      ['Punto equilibrio mensual', result.summary.breakEvenMonthly],
      ['Punto equilibrio diario', result.summary.breakEvenDaily],
      ['Meta utilidad', result.summary.targetProfit],
      ['Ventas para meta utilidad', result.summary.salesForTargetProfit],
      ['Estado negocio', result.summary.status]
    ]),
    'Dashboard'
  )

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(result.fixedCosts || []),
    'Costos Fijos'
  )

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(result.productCosts || []),
    'Costos Productos'
  )

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(result.profitability || []),
    'Rentabilidad'
  )

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(result.orders || []),
    'Ventas'
  )

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(result.orderItems || []),
    'Detalle Productos'
  )

  const buffer = XLSX.write(wb, {
    type: 'buffer',
    bookType: 'xlsx'
  })

  res.setHeader(
    'Content-Disposition',
    `attachment; filename="respaldo_finanzas_american_burger_${result.month}.xlsx"`
  )

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  )

  res.send(buffer)
})

router.get('/debug', async (req, res) => {
  const { safeMonth, start, end } = getMonthRange(req.query.month)
  const orders = await getOrders(start, end)
  const orderIds = orders.map((order) => order.id).filter(Boolean)
  const orderItems = await getOrderItemsByOrders(orderIds)

  res.json({
    VERSION: 'FINANCE ALIASES V3',
    month: safeMonth,
    start,
    end,
    ordersCount: orders.length,
    orderItemsCount: orderItems.length,
    sampleOrder: orders[0] || null,
    sampleOrderItem: orderItems[0] || null,
    supabaseUrl: process.env.SUPABASE_URL
  })
})

export default router
