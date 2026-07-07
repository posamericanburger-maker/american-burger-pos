import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import 'express-async-errors'

import authRoutes from './routes/auth.routes.js'
import productRoutes from './routes/products.routes.js'
import orderRoutes from './routes/orders.routes.js'
import externalOrdersRoutes from './routes/external-orders.routes.js'
import cashRoutes from './routes/cash.routes.js'
import inventoryRoutes from './routes/inventory.routes.js'
import userRoutes from './routes/users.routes.js'
import reportRoutes from './routes/reports.routes.js'
import settingsRoutes from './routes/settings.routes.js'
import categoriesRoutes from './routes/categories.routes.js'
import customersRoutes from './routes/customers.routes.js'
import suppliersRoutes from './routes/suppliers.routes.js'
import financeRoutes from './routes/finance.routes.js'
import publicStoreRoutes from './routes/public-store.routes.js'
import accountingRoutes from './routes/accounting.routes.js'

import { errorHandler } from './middleware/errorHandler.js'
import { logger } from './utils/logger.js'

const app = express()

app.use(helmet())

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}))

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100000,
  message: 'Demasiadas solicitudes desde esta IP'
})

app.use(limiter)

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb', extended: true }))

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`)
  next()
})

app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/external-orders', externalOrdersRoutes)
app.use('/api/cash', cashRoutes)
app.use('/api/inventory', inventoryRoutes)
app.use('/api/users', userRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/categories', categoriesRoutes)
app.use('/api/customers', customersRoutes)
app.use('/api/suppliers', suppliersRoutes)
app.use('/api/finance', financeRoutes)
app.use('/api/public-store', publicStoreRoutes)
app.use('/api/accounting', accountingRoutes)

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

app.use((req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' })
})

app.use(errorHandler)

export default app
