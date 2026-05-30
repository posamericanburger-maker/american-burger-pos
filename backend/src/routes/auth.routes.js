import express from 'express'
import { verifyToken, verifyRole } from '../middleware/auth.js'
import * as authController from '../controllers/auth.controller.js'

const router = express.Router()

router.post('/login', authController.login)
router.post('/register', authController.register)
router.post('/logout', verifyToken, authController.logout)
router.post('/forgot-password', authController.forgotPassword)
router.post('/reset-password', authController.resetPassword)
router.get('/me', verifyToken, authController.getCurrentUser)
router.put('/change-password', verifyToken, authController.changePassword)

export default router
