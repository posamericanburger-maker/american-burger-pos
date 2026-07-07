import express from 'express'
import { supabase } from '../config/supabase.js'

const router = express.Router()

const num = (value) => Number(value || 0)

const getMonthRange = (query = {}) => {
  const now = new Date()
  const year = Number(query.year || now.getFullYear())
  const month = Number(query.month || now.getMonth() + 1)

  const from = new Date(year, month - 1, 1)
  const to = new Date(year, month, 0)

  return {
    year,
    month,
    fromDate: from.toISOString().slice(0, 10),
    toDate: to.toISOString().slice(0, 10),
    fromISO: from.toISOString(),
    toISO: new Date(year, month, 0, 23, 59, 59).toISOString()
  }
}

const ivaFromGross = (gross) => Math.round(num(gross) * 19 / 119)
const netFromGross = (gross) => num(gross) - ivaFromGross(gross)

const isExpenseMovement = (movement) => {
  const type = String(movement.type || '').toLowerCase()
  return ['expense', 'gasto', 'withdrawal', 'retiro'].includes(type)
}

const normalizeExpense = (movement) => {
  const gross = num(movement.total_amount || movement.amount || 0)
  const documentType = String(movement.document_type || 'BOLETA').toUpperCase()
  const isInvoice = documentType === 'FACTURA'

  const iva =
    movement.iva_amount !== null && movement.iva_amount !== undefined
      ? num(movement.iva_amount)
      : isInvoice
        ? ivaFromGross(gross)
        : 0

  const net =
    movement.net_amount !== null && movement.net_amount !== undefined
      ? num(movement.net_amount)
      : gross - iva

  return {
    id: movement.id,
    source: 'cash_movements',
    cash_session_id: movement.cash_session_id,
    user_id: movement.user_id,
    type: movement.type,
    supplier_id: movement.supplier_id || null,
    supplier_name: movement.supplier_name || '',
    document_type: documentType,
    document_number: movement.document_number || '',
    description: movement.description || movement.reason || '',
    category: movement.category || 'Caja',
    payment_method: movement.payment_method || 'cash',
    expense_date: String(movement.created_at || '').slice(0, 10),
    created_at: movement.created_at,
    net_amount: net,
    iva_amount: iva,
    total_amount: gross,
    notes: movement.notes || ''
  }
}

const getOpenCashSession = async () => {
  const { data, error } = await supabase
    .from('cash_sessions')
    .select('*')
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data
}

const loadMonthlyData = async (query = {}) => {
  const range = getMonthRange(query)

  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('*')
    .gte('created_at', range.fromISO)
    .lte('created_at', range.toISO)

  if (ordersError) throw ordersError

  const { data: movements, error: movementsError } = await supabase
    .from('cash_movements')
    .select('*')
    .gte('created_at', range.fromISO)
    .lte('created_at', range.toISO)
    .order('created_at', { ascending: false })

  if (movementsError) throw movementsError

  const expenses = (movements || [])
    .filter(isExpenseMovement)
    .map(normalizeExpense)

  return {
    range,
    orders: orders || [],
    movements: movements || [],
    expenses
  }
}

const getFoodCostStatus = (foodCostPercent, finalCost) => {
  if (finalCost <= 0) {
    return { status: 'SIN COSTO', level: 'gray' }
  }

  if (foodCostPercent < 35) {
    return { status: 'EXCELENTE', level: 'green' }
  }

  if (foodCostPercent < 40) {
    return { status: 'BUENO', level: 'green' }
  }

  if (foodCostPercent < 45) {
    return { status: 'REVISAR', level: 'yellow' }
  }

  return { status: 'CRÍTICO', level: 'red' }
}

router.get('/dashboard', async (req, res) => {
  try {
    const { range, orders, expenses } = await loadMonthlyData(req.query)

    const totalSales = orders.reduce((sum, order) => {
      return sum + num(order.total || order.total_amount || order.amount)
    }, 0)

    const totalExpenses = expenses.reduce((sum, item) => {
      return sum + num(item.total_amount)
    }, 0)

    const ivaDebit = ivaFromGross(totalSales)
    const netSales = netFromGross(totalSales)

    const ivaCredit = expenses.reduce((sum, item) => {
      return sum + num(item.iva_amount)
    }, 0)

    const netExpenses = totalExpenses - ivaCredit
    const ivaToPay = ivaDebit - ivaCredit
    const estimatedProfit = netSales - netExpenses

    const salesByPayment = {}
    const expensesByCategory = {}
    const expensesBySupplier = {}

    orders.forEach((order) => {
      const method = order.payment_method || order.paymentMethod || 'Sin método'
      const amount = num(order.total || order.total_amount || order.amount)
      salesByPayment[method] = (salesByPayment[method] || 0) + amount
    })

    expenses.forEach((expense) => {
      const category = expense.category || 'Sin categoría'
      const supplier = expense.supplier_name || 'Sin proveedor'

      expensesByCategory[category] =
        (expensesByCategory[category] || 0) + num(expense.total_amount)

      expensesBySupplier[supplier] =
        (expensesBySupplier[supplier] || 0) + num(expense.total_amount)
    })

    const alerts = []

    if (ivaToPay > 0) {
      alerts.push({
        type: 'IVA',
        level: 'warning',
        title: 'IVA estimado a pagar',
        message: `Según ventas y gastos de Caja, el IVA estimado a pagar es $${ivaToPay.toLocaleString('es-CL')}.`
      })
    }

    if (expenses.length === 0) {
      alerts.push({
        type: 'GASTOS',
        level: 'info',
        title: 'Sin gastos registrados',
        message: 'Este mes no tienes gastos registrados en Caja o Contabilidad.'
      })
    }

    if (totalSales > 0 && estimatedProfit <= 0) {
      alerts.push({
        type: 'UTILIDAD',
        level: 'danger',
        title: 'Utilidad baja o negativa',
        message: 'Las ventas del mes no están cubriendo los gastos registrados.'
      })
    }

    res.json({
      period: {
        year: range.year,
        month: range.month,
        from: range.fromDate,
        to: range.toDate
      },
      sales: {
        gross: totalSales,
        net: netSales,
        iva_debit: ivaDebit,
        orders_count: orders.length,
        by_payment_method: salesByPayment
      },
      expenses: {
        gross: totalExpenses,
        net: netExpenses,
        iva_credit: ivaCredit,
        count: expenses.length,
        by_category: expensesByCategory,
        by_supplier: expensesBySupplier
      },
      taxes: {
        iva_debit: ivaDebit,
        iva_credit: ivaCredit,
        iva_to_pay: ivaToPay
      },
      result: {
        gross_profit_estimated: estimatedProfit,
        margin_percent:
          totalSales > 0
            ? Number(((estimatedProfit / totalSales) * 100).toFixed(2))
            : 0
      },
      alerts
    })
  } catch (error) {
    console.error('Accounting dashboard error:', error)
    res.status(500).json({
      message: 'Error generando dashboard contable',
      error: error.message
    })
  }
})

router.get('/expenses', async (req, res) => {
  try {
    const { from, to } = req.query

    let query = supabase
      .from('cash_movements')
      .select('*')
      .order('created_at', { ascending: false })

    if (from) query = query.gte('created_at', `${from}T00:00:00.000Z`)
    if (to) query = query.lte('created_at', `${to}T23:59:59.999Z`)

    const { data, error } = await query

    if (error) throw error

    const expenses = (data || [])
      .filter(isExpenseMovement)
      .map(normalizeExpense)

    res.json(expenses)
  } catch (error) {
    console.error('Accounting expenses list error:', error)
    res.status(500).json({
      message: 'Error cargando gastos desde Caja',
      error: error.message
    })
  }
})

router.get('/expenses/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('cash_movements')
      .select('*')
      .eq('id', req.params.id)
      .single()

    if (error) throw error

    res.json(normalizeExpense(data))
  } catch (error) {
    console.error('Accounting expense detail error:', error)
    res.status(500).json({
      message: 'Error cargando detalle del gasto',
      error: error.message
    })
  }
})

router.post('/expenses', async (req, res) => {
  try {
    const body = req.body || {}
    const totalAmount = num(body.total_amount || body.amount)

    if (totalAmount <= 0) {
      return res.status(400).json({
        message: 'El monto debe ser mayor a 0'
      })
    }

    const session = await getOpenCashSession()

    if (!session) {
      return res.status(400).json({
        message: 'Debes abrir caja antes de registrar gastos'
      })
    }

    const documentType = String(body.document_type || 'BOLETA').toUpperCase()
    const isInvoice = documentType === 'FACTURA'

    const ivaAmount =
      body.iva_amount !== undefined && body.iva_amount !== ''
        ? num(body.iva_amount)
        : isInvoice
          ? ivaFromGross(totalAmount)
          : 0

    const netAmount =
      body.net_amount !== undefined && body.net_amount !== ''
        ? num(body.net_amount)
        : totalAmount - ivaAmount

    const payload = {
      cash_session_id: session.id,
      user_id: body.user_id || null,
      type: 'expense',
      amount: totalAmount,
      total_amount: totalAmount,
      net_amount: netAmount,
      iva_amount: ivaAmount,
      supplier_id: body.supplier_id || null,
      supplier_name: body.supplier_name || '',
      document_type: documentType,
      document_number: body.document_number || '',
      category: body.category || '',
      payment_method: body.payment_method || 'cash',
      description: body.description || '',
      notes: body.notes || '',
      reason: body.description || body.notes || 'Gasto registrado desde Contabilidad'
    }

    const { data, error } = await supabase
      .from('cash_movements')
      .insert(payload)
      .select()
      .single()

    if (error) throw error

    res.status(201).json(normalizeExpense(data))
  } catch (error) {
    console.error('Accounting expense create error:', error)
    res.status(500).json({
      message: 'Error registrando gasto conectado a Caja',
      error: error.message
    })
  }
})

router.put('/expenses/:id', async (req, res) => {
  try {
    const body = req.body || {}
    const totalAmount = num(body.total_amount || body.amount)
    const documentType = String(body.document_type || 'BOLETA').toUpperCase()
    const isInvoice = documentType === 'FACTURA'

    const ivaAmount =
      body.iva_amount !== undefined && body.iva_amount !== ''
        ? num(body.iva_amount)
        : isInvoice
          ? ivaFromGross(totalAmount)
          : 0

    const netAmount =
      body.net_amount !== undefined && body.net_amount !== ''
        ? num(body.net_amount)
        : totalAmount - ivaAmount

    const payload = {
      amount: totalAmount,
      total_amount: totalAmount,
      net_amount: netAmount,
      iva_amount: ivaAmount,
      supplier_id: body.supplier_id || null,
      supplier_name: body.supplier_name || '',
      document_type: documentType,
      document_number: body.document_number || '',
      category: body.category || '',
      payment_method: body.payment_method || 'cash',
      description: body.description || '',
      notes: body.notes || '',
      reason: body.description || body.notes || 'Gasto actualizado desde Contabilidad'
    }

    const { data, error } = await supabase
      .from('cash_movements')
      .update(payload)
      .eq('id', req.params.id)
      .select()
      .single()

    if (error) throw error

    res.json(normalizeExpense(data))
  } catch (error) {
    console.error('Accounting expense update error:', error)
    res.status(500).json({
      message: 'Error actualizando gasto',
      error: error.message
    })
  }
})

router.delete('/expenses/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('cash_movements')
      .delete()
      .eq('id', req.params.id)

    if (error) throw error

    res.json({ ok: true })
  } catch (error) {
    console.error('Accounting expense delete error:', error)
    res.status(500).json({
      message: 'Error eliminando gasto',
      error: error.message
    })
  }
})

router.get('/iva', async (req, res) => {
  try {
    const { range, orders, expenses } = await loadMonthlyData(req.query)

    const grossSales = orders.reduce((sum, order) => {
      return sum + num(order.total || order.total_amount || order.amount)
    }, 0)

    const ivaDebit = ivaFromGross(grossSales)

    const ivaCredit = expenses.reduce((sum, expense) => {
      return sum + num(expense.iva_amount)
    }, 0)

    const purchasesGross = expenses.reduce((sum, expense) => {
      return sum + num(expense.total_amount)
    }, 0)

    res.json({
      period: {
        year: range.year,
        month: range.month,
        from: range.fromDate,
        to: range.toDate
      },
      iva_debit: ivaDebit,
      iva_credit: ivaCredit,
      iva_to_pay: ivaDebit - ivaCredit,
      sales_gross: grossSales,
      purchases_gross: purchasesGross
    })
  } catch (error) {
    console.error('Accounting IVA error:', error)
    res.status(500).json({
      message: 'Error calculando IVA',
      error: error.message
    })
  }
})

router.get('/profit-loss', async (req, res) => {
  try {
    const { range, orders, expenses } = await loadMonthlyData(req.query)

    const grossSales = orders.reduce((sum, order) => {
      return sum + num(order.total || order.total_amount || order.amount)
    }, 0)

    const ivaDebit = ivaFromGross(grossSales)
    const netSales = grossSales - ivaDebit

    const grossExpenses = expenses.reduce((sum, expense) => {
      return sum + num(expense.total_amount)
    }, 0)

    const ivaCredit = expenses.reduce((sum, expense) => {
      return sum + num(expense.iva_amount)
    }, 0)

    const netExpenses = grossExpenses - ivaCredit
    const utility = netSales - netExpenses

    res.json({
      period: {
        year: range.year,
        month: range.month,
        from: range.fromDate,
        to: range.toDate
      },
      income_statement: {
        gross_sales: grossSales,
        iva_debit: ivaDebit,
        net_sales: netSales,
        gross_expenses: grossExpenses,
        iva_credit: ivaCredit,
        net_expenses: netExpenses,
        estimated_profit: utility,
        margin_percent:
          grossSales > 0 ? Number(((utility / grossSales) * 100).toFixed(2)) : 0
      }
    })
  } catch (error) {
    console.error('Accounting profit-loss error:', error)
    res.status(500).json({
      message: 'Error generando estado de resultados',
      error: error.message
    })
  }
})

router.get('/alerts', async (req, res) => {
  try {
    const { orders, expenses } = await loadMonthlyData(req.query)

    const totalSales = orders.reduce((sum, order) => {
      return sum + num(order.total || order.total_amount || order.amount)
    }, 0)

    const totalExpenses = expenses.reduce((sum, expense) => {
      return sum + num(expense.total_amount)
    }, 0)

    const ivaDebit = ivaFromGross(totalSales)
    const ivaCredit = expenses.reduce((sum, expense) => {
      return sum + num(expense.iva_amount)
    }, 0)

    const alerts = []

    if (totalSales === 0) {
      alerts.push({
        type: 'VENTAS',
        level: 'info',
        title: 'Sin ventas en el periodo',
        message: 'No hay ventas registradas para este mes.'
      })
    }

    if (expenses.length === 0) {
      alerts.push({
        type: 'GASTOS',
        level: 'warning',
        title: 'No hay gastos registrados',
        message: 'Registra gastos desde Caja o Contabilidad para calcular costos e IVA crédito.'
      })
    }

    if (ivaDebit - ivaCredit > 0) {
      alerts.push({
        type: 'IVA',
        level: 'warning',
        title: 'IVA estimado pendiente',
        message: `El IVA estimado a pagar es $${(ivaDebit - ivaCredit).toLocaleString('es-CL')}.`
      })
    }

    if (totalExpenses > totalSales && totalSales > 0) {
      alerts.push({
        type: 'UTILIDAD',
        level: 'danger',
        title: 'Gastos mayores a ventas',
        message: 'Los gastos registrados superan las ventas del periodo.'
      })
    }

    res.json(alerts)
  } catch (error) {
    console.error('Accounting alerts error:', error)
    res.status(500).json({
      message: 'Error generando alertas',
      error: error.message
    })
  }
})

router.get('/food-cost', async (req, res) => {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories (
          id,
          name
        ),
        recipe:product_recipes (
          id,
          product_id,
          inventory_item_id,
          quantity,
          unit,
          recipe_section,
          inventory:inventory_item_id (
            id,
            name,
            unit,
            stock,
            current_stock,
            unit_cost,
            last_purchase_price,
            average_cost
          )
        )
      `)
      .eq('active', true)
      .order('name', { ascending: true })

    if (error) throw error

    const foodCostProducts = (products || []).map((product) => {
      const price = num(product.price)

      const laborMinutes = num(product.labor_minutes)
      const laborCost = num(product.labor_cost)
      const fixedCost = num(product.fixed_cost)
      const variationPercent =
        product.variation_percent === null || product.variation_percent === undefined
          ? 5
          : num(product.variation_percent)

      const ingredients = (product.recipe || []).map((item) => {
        const inventory = item.inventory || {}
        const quantity = num(item.quantity)

        const unitCost = num(
          inventory.average_cost ||
            inventory.unit_cost ||
            inventory.last_purchase_price ||
            0
        )

        const totalCost = quantity * unitCost
        const section = String(item.recipe_section || 'MATERIA_PRIMA').toUpperCase()

        return {
          id: item.id,
          inventory_item_id: item.inventory_item_id,
          name: inventory.name || 'Insumo',
          unit: item.unit || inventory.unit || '',
          quantity,
          unit_cost: unitCost,
          total_cost: totalCost,
          section
        }
      })

      const materialIngredients = ingredients.filter(
        (item) => item.section === 'MATERIA_PRIMA'
      )

      const packagingIngredients = ingredients.filter(
        (item) => item.section === 'EMPAQUE'
      )

      const otherIngredients = ingredients.filter(
        (item) =>
          item.section !== 'MATERIA_PRIMA' &&
          item.section !== 'EMPAQUE'
      )

      const materialCost = materialIngredients.reduce(
        (sum, item) => sum + num(item.total_cost),
        0
      )

      const packagingCost = packagingIngredients.reduce(
        (sum, item) => sum + num(item.total_cost),
        0
      )

      const otherRecipeCost = otherIngredients.reduce(
        (sum, item) => sum + num(item.total_cost),
        0
      )

      const subtotalBeforeVariation =
        materialCost + packagingCost + laborCost + fixedCost + otherRecipeCost

      const variationCost = subtotalBeforeVariation * (variationPercent / 100)
      const finalCost = subtotalBeforeVariation + variationCost
      const margin = price - finalCost

      const foodCostPercent =
        price > 0 ? Number(((finalCost / price) * 100).toFixed(2)) : 0

      const { status, level } = getFoodCostStatus(foodCostPercent, finalCost)

      return {
        id: product.id,
        name: product.name,
        category: product.category?.name || 'Sin categoría',
        price,

        recipe_cost: finalCost,
        final_cost: finalCost,
        margin,
        food_cost_percent: foodCostPercent,
        status,
        level,

        professional_cost: {
          material_cost: materialCost,
          packaging_cost: packagingCost,
          labor_minutes: laborMinutes,
          labor_cost: laborCost,
          fixed_cost: fixedCost,
          other_recipe_cost: otherRecipeCost,
          subtotal_before_variation: subtotalBeforeVariation,
          variation_percent: variationPercent,
          variation_cost: variationCost,
          final_cost: finalCost
        },

        ingredients,
        material_ingredients: materialIngredients,
        packaging_ingredients: packagingIngredients,
        other_ingredients: otherIngredients
      }
    })

    const productsWithCost = foodCostProducts.filter((p) => p.final_cost > 0)

    const averageFoodCost =
      productsWithCost.length > 0
        ? Number(
            (
              productsWithCost.reduce(
                (sum, p) => sum + num(p.food_cost_percent),
                0
              ) / productsWithCost.length
            ).toFixed(2)
          )
        : 0

    const totalSalesPrice = productsWithCost.reduce((sum, p) => sum + num(p.price), 0)
    const totalFinalCost = productsWithCost.reduce(
      (sum, p) => sum + num(p.final_cost),
      0
    )

    const weightedFoodCost =
      totalSalesPrice > 0
        ? Number(((totalFinalCost / totalSalesPrice) * 100).toFixed(2))
        : 0

    const criticalProducts = foodCostProducts.filter(
      (p) => p.final_cost > 0 && p.food_cost_percent >= 45
    )

    const reviewProducts = foodCostProducts.filter(
      (p) => p.final_cost > 0 && p.food_cost_percent >= 40 && p.food_cost_percent < 45
    )

    const excellentProducts = foodCostProducts.filter(
      (p) => p.final_cost > 0 && p.food_cost_percent < 40
    )

    res.json({
      success: true,
      mode: 'PROFESSIONAL_FOOD_COST',
      summary: {
        products_count: foodCostProducts.length,
        products_with_cost: productsWithCost.length,
        average_food_cost: averageFoodCost,
        weighted_food_cost: weightedFoodCost,
        critical_count: criticalProducts.length,
        review_count: reviewProducts.length,
        excellent_count: excellentProducts.length
      },
      products: foodCostProducts
    })
  } catch (error) {
    console.error('Professional food cost error:', error)
    res.status(500).json({
      success: false,
      message: 'Error calculando Food Cost profesional',
      error: error.message
    })
  }
})

export default router
