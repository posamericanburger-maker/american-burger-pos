import express from 'express'
import { verifyToken, verifyRole } from '../middleware/auth.js'

const router = express.Router()

// Rutas de usuarios
router.get('/', verifyToken, verifyRole(['admin']), (req, res) => res.json({ message: 'Usuarios' }))
router.post('/', verifyToken, verifyRole(['admin']), (req, res) => res.json({ message: 'Crear usuario' }))
router.put('/:id', verifyToken, verifyRole(['admin']), (req, res) => res.json({ message: 'Actualizar usuario' }))
router.delete('/:id', verifyToken, verifyRole(['admin']), (req, res) => res.json({ message: 'Eliminar usuario' }))

export default router
