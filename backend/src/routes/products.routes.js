import express from 'express'
import { verifyToken, verifyRole } from '../middleware/auth.js'

const router = express.Router()

// Rutas de productos
router.get('/', verifyToken, (req, res) => res.json({ message: 'Productos' }))
router.post('/', verifyToken, verifyRole(['admin']), (req, res) => res.json({ message: 'Crear producto' }))
router.put('/:id', verifyToken, verifyRole(['admin']), (req, res) => res.json({ message: 'Actualizar producto' }))
router.delete('/:id', verifyToken, verifyRole(['admin']), (req, res) => res.json({ message: 'Eliminar producto' }))

export default router
