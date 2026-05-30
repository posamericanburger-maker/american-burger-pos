import express from 'express'
import { verifyToken, verifyRole } from '../middleware/auth.js'

const router = express.Router()

// Rutas de inventario
router.get('/', verifyToken, (req, res) => res.json({ message: 'Inventario' }))
router.post('/movement', verifyToken, verifyRole(['admin']), (req, res) => res.json({ message: 'Registrar movimiento' }))
router.get('/alerts', verifyToken, (req, res) => res.json({ message: 'Alertas stock' }))

export default router
