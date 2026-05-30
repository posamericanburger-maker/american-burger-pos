import express from 'express'
import { verifyToken, verifyRole } from '../middleware/auth.js'

const router = express.Router()

// Rutas de caja
router.post('/open', verifyToken, verifyRole(['cajero', 'admin']), (req, res) => res.json({ message: 'Abrir caja' }))
router.post('/close', verifyToken, verifyRole(['cajero', 'admin']), (req, res) => res.json({ message: 'Cerrar caja' }))
router.get('/movements', verifyToken, (req, res) => res.json({ message: 'Movimientos caja' }))
router.post('/movement', verifyToken, verifyRole(['cajero', 'admin']), (req, res) => res.json({ message: 'Registrar movimiento' }))

export default router
