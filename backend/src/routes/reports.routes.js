import express from 'express'
import { verifyToken, verifyRole } from '../middleware/auth.js'

const router = express.Router()

// Rutas de reportes
router.get('/sales-day', verifyToken, (req, res) => res.json({ message: 'Ventas hoy' }))
router.get('/sales-range', verifyToken, (req, res) => res.json({ message: 'Ventas por rango' }))
router.get('/products', verifyToken, (req, res) => res.json({ message: 'Productos más vendidos' }))
router.get('/payments', verifyToken, (req, res) => res.json({ message: 'Resumen pagos' }))

export default router
