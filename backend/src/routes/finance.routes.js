import express from 'express'
import XLSX from 'xlsx'
import { supabase } from '../config/supabase.js'

const router = express.Router()
const db = supabase.schema('public')
const IVA_RATE_DEFAULT = 0.19

const numberValue = (value) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

const getMonthRange = (month) => {
  const safeMonth = month || new Date().toISOString().slice(0, 7)
  const start = `${safeMonth}-01T00:00:00.000Z`
  const date = new Date(start)
  date.setUTCMonth(date.getUTCMonth() + 1)
  const end = date.toISOString()
  return { safeMonth, start, end }
}

const getSettings = async () => {
  const { data, error } = await db.from('finance_settings').select('*')
  if (error) throw error

  const settings = {}
  for (const row of data || []) {
    settings[row.key] = numberValue(row.value)
  }

  return {
    ivaRate: settings.iva_rate || IVA_RATE_DEFAULT,
    targetProfit: settings.target_profit || 1000000,
    workingDays: settings.working_days || 26
  }
}

const getFixedCosts = async (month) => {
  const { data, error } = await db
    .from('finance_fixed_costs')
    .select('*')
    .eq('month', month)
    .order('concept')

  if (error) throw error
  return data || []
}

const getProductCosts = async () => {
  const { data, error } = await db
    .from('finance_product_costs')
    .select('*')
    .eq('active', true)
    .order('product_name')

  if (error) throw error
  return data || []
}

const getOrders = async (start, end) => {
  const { data, error } = await db
    .from('orders')
    .select('*')
    .gte('created_at', start)
    .lt('created_at', end)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

const getOrderItems = async (start, end) => {
  const { data, error } = await db
    .from('order_items')
    .select('*')
    .gte('created_at', start)
    .lt('created_at', end)

  if (error) return []
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

const calculateFinance = async (month) => {
  const { safeMonth, start, end } = getMonthRange(month)

  const settings = await getSettings()
  const orders = await getOrders(start, end)
  const orderItems = await getOrderItems(start, end)
  const fixedCosts = await getFixedCosts(safeMonth)
  const productCosts = await getProductCosts()

  const productCostMap = new Map()

  for (const product of productCosts) {
    productCostMap.set(
      String(product.product_name || '').trim().toLowerCase(),
      product
    )
  }

  const totalSales = orders.reduce((sum, order) => {
    return sum + orderTotal(order)
  }, 0)

  const netSales = totalSales / (1 + settings.ivaRate)
  const ivaDebit = totalSales - netSales

  const totalFixedCosts = fixedCosts.reduce((sum, item) => {
    return sum + numberValue(item.amount)
  }, 0)

  let totalVariableCost = 0
  const profitabilityMap = new Map()

  for (const item of orderItems) {
    const name = String(
      item.product_name ||
        item.name ||
        item.description ||
        item.name_snapshot ||
        ''
    ).trim()

    const qty = numberValue(item.quantity || item.qty || 1)

    const itemTotal = numberValue(
      item.total ||
        item.subtotal ||
        numberValue(item.unit_price || item.price) * qty ||
        0
    )

    const productCost = productCostMap.get(name.toLowerCase())
    const finalCost = productCost ? numberValue(productCost.final_cost) : 0
    const costTotal = finalCost * qty

    totalVariableCost += costTotal

    const key = name || 'Producto sin nombre'

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
    row.ventas += itemTotal
    row.costo += costTotal
    row.contribucion = row.ventas - row.costo
    row.margen = row.ventas > 0 ? row.contribucion / row.ventas : 0
  }

  const ivaCreditEstimated =
    totalVariableCost - totalVariableCost / (1 + settings.ivaRate)

  const ivaToPayEstimated = Math.max(ivaDebit - ivaCreditEstimated, 0)

  const grossProfit = totalSales - totalVariableCost
  const operatingProfit = grossProfit - totalFixedCosts
  const averageMargin = totalSales > 0 ? grossProfit / totalSales : 0

  const breakEvenMonthly =
    averageMargin > 0 ? totalFixedCosts / averageMargin : 0

  const breakEvenDaily =
    settings.workingDays > 0 ? breakEvenMonthly / settings.workingDays : 0

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
    settings,
    summary: {
      totalSales,
      netSales,
      ivaDebit,
      ivaCreditEstimated,
      ivaToPayEstimated,
      totalVariableCost,
      totalFixedCosts,
      grossProfit,
      operatingProfit,
      averageMargin,
      breakEvenMonthly,
      breakEvenDaily,
      targetProfit: settings.targetProfit,
      salesForTargetProfit:
        averageMargin > 0
          ? (totalFixedCosts + settings.targetProfit) / averageMargin
          : 0,
      status
    },
    fixedCosts,
    productCosts,
    profitability: Array.from(profitabilityMap.values()),
    orders
  }
}

router.get('/summary', async (req, res) => {
  const result = await calculateFinance(req.query.month)
  res.json(result)
})

router.get('/fixed-costs', async (req, res) => {
  const month = req.query.month || new Date().toISOString().slice(0, 7)
  const data = await getFixedCosts(month)
  res.json(data)
})

router.post('/fixed-costs', async (req, res) => {
  const { month, costs } = req.body

  if (!month || !Array.isArray(costs)) {
    return res.status(400).json({
      message: 'Debe enviar month y costs[]'
    })
  }

  const { error: deleteError } = await db
    .from('finance_fixed_costs')
    .delete()
    .eq('month', month)

  if (deleteError) throw deleteError

  const rows = costs
    .filter((item) => item?.concept)
    .map((item) => ({
      month,
      concept: item.concept,
      amount: numberValue(item.amount),
      notes: item.notes || null
    }))

  if (rows.length === 0) {
    return res.json({
      message: 'Costos fijos guardados correctamente',
      data: []
    })
  }

  const { data, error } = await db
    .from('finance_fixed_costs')
    .insert(rows)
    .select()

  if (error) throw error

  res.json({
    message: 'Costos fijos guardados correctamente',
    data
  })
})

router.get('/product-costs', async (req, res) => {
  const data = await getProductCosts()
  res.json(data)
})

router.post('/product-costs', async (req, res) => {
  const { products } = req.body

  if (!Array.isArray(products)) {
    return res.status(400).json({
      message: 'Debe enviar products[]'
    })
  }

  const rows = products
    .filter((product) => product?.product_name)
    .map((product) => ({
      product_name: product.product_name,
      sale_price: numberValue(product.sale_price),
      final_cost: numberValue(product.final_cost),
      category: product.category || null,
      active: product.active !== false
    }))

  const { data, error } = await db
    .from('finance_product_costs')
    .upsert(rows, { onConflict: 'product_name' })
    .select()

  if (error) throw error

  res.json({
    message: 'Costos de productos guardados correctamente',
    data
  })
})

router.get('/export-excel', async (req, res) => {
  const result = await calculateFinance(req.query.month)

  const wb = XLSX.utils.book_new()

  const dashboard = [
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
  ]

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet(dashboard),
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

router.get('/debug', (req, res) => {
  res.json({
    VERSION: 'FINANCE V99',
    FECHA: new Date().toISOString(),
    MENSAJE: 'SI VES ESTO, RENDER ESTA EJECUTANDO EL CODIGO NUEVO',
    SUPABASE_URL: process.env.SUPABASE_URL
  })
})

export default router
