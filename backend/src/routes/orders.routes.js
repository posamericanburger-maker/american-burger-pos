import express from 'express'
import { verifyToken, verifyRole } from '../middleware/auth.js'

const router = express.Router()

// Rutas de pedidos
router.get('/', verifyToken, (req, res) => res.json({ message: 'Pedidos' }))
router.post('/', verifyToken, verifyRole(['cajero', 'admin']), (req, res) => res.json({ message: 'Crear pedido' }))
router.get('/:id', verifyToken, (req, res) => res.json({ message: 'Ver pedido' }))
router.put('/:id', verifyToken, verifyRole(['cajero', 'admin']), (req, res) => res.json({ message: 'Actualizar pedido' }))

export default router
