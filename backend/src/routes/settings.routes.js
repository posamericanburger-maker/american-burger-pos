import express from 'express'
import { verifyToken, verifyRole } from '../middleware/auth.js'

const router = express.Router()

// Rutas de configuración
router.get('/', verifyToken, verifyRole(['admin']), (req, res) => res.json({ message: 'Configuración' }))
router.put('/', verifyToken, verifyRole(['admin']), (req, res) => res.json({ message: 'Actualizar configuración' }))
router.post('/logo', verifyToken, verifyRole(['admin']), (req, res) => res.json({ message: 'Actualizar logo' }))
router.get('/diagnostics', verifyToken, verifyRole(['admin']), (req, res) => res.json({ message: 'Diagnóstico' }))

export default router
