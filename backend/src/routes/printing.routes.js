import express from 'express'

const router = express.Router()

router.get('/health', (req, res) => {
  return res.json({
    success: true,
    status: 'OK',
    service: 'American Burger Printing',
    message: 'Módulo de impresión disponible',
    timestamp: new Date().toISOString()
  })
})

export default router
