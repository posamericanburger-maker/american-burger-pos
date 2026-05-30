import { supabase } from '../config/supabase.js'
import { hashPassword, comparePassword } from '../utils/helpers.js'
import { generateToken } from '../middleware/auth.js'
import { logger } from '../utils/logger.js'

export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email y contraseña requeridos' })
    }

    // Buscar usuario
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (userError || !users) {
      logger.warn(`Intento de login fallido: ${email}`)
      return res.status(401).json({ message: 'Credenciales inválidas' })
    }

    // Verificar contraseña
    const passwordMatch = await comparePassword(password, users.password_hash)
    if (!passwordMatch) {
      logger.warn(`Contraseña incorrecta para: ${email}`)
      return res.status(401).json({ message: 'Credenciales inválidas' })
    }

    // Generar token
    const token = generateToken(users)

    // Registrar login en auditoría
    await supabase.from('audit_logs').insert({
      user_id: users.id,
      action: 'LOGIN',
      details: `Login desde ${req.ip}`,
      ip_address: req.ip,
    })

    logger.info(`Login exitoso: ${email}`)

    res.json({
      success: true,
      token,
      user: {
        id: users.id,
        email: users.email,
        full_name: users.full_name,
        role: users.role,
      },
    })
  } catch (error) {
    logger.error('Error en login:', error)
    res.status(500).json({ message: 'Error al iniciar sesión' })
  }
}

export const register = async (req, res) => {
  try {
    const { email, password, full_name } = req.body

    // Validar
    if (!email || !password || !full_name) {
      return res.status(400).json({ message: 'Todos los campos son requeridos' })
    }

    // Verificar si existe
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existing) {
      return res.status(400).json({ message: 'Email ya registrado' })
    }

    // Hash password
    const password_hash = await hashPassword(password)

    // Crear usuario
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        email,
        password_hash,
        full_name,
        role: 'cajero',
      })
      .select()
      .single()

    if (error) throw error

    logger.info(`Nuevo usuario registrado: ${email}`)

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      user,
    })
  } catch (error) {
    logger.error('Error en registro:', error)
    res.status(500).json({ message: 'Error al registrar usuario' })
  }
}

export const logout = async (req, res) => {
  try {
    // Registrar logout
    await supabase.from('audit_logs').insert({
      user_id: req.user.id,
      action: 'LOGOUT',
      details: 'Logout',
      ip_address: req.ip,
    })

    logger.info(`Logout: ${req.user.email}`)

    res.json({ success: true, message: 'Sesión cerrada' })
  } catch (error) {
    logger.error('Error en logout:', error)
    res.status(500).json({ message: 'Error al cerrar sesión' })
  }
}

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body

    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' })
    }

    // Aquí iría lógica de email
    logger.info(`Solicitud de recuperación: ${email}`)

    res.json({ success: true, message: 'Revisa tu email para instrucciones' })
  } catch (error) {
    logger.error('Error en forgot password:', error)
    res.status(500).json({ message: 'Error al procesar solicitud' })
  }
}

export const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body

    const password_hash = await hashPassword(newPassword)

    const { data: user, error } = await supabase
      .from('users')
      .update({ password_hash })
      .eq('email', email)
      .select()
      .single()

    if (error) throw error

    logger.info(`Contraseña reseteada: ${email}`)

    res.json({ success: true, message: 'Contraseña actualizada' })
  } catch (error) {
    logger.error('Error reseteando password:', error)
    res.status(500).json({ message: 'Error al resetear contraseña' })
  }
}

export const getCurrentUser = async (req, res) => {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('id, email, full_name, role')
      .eq('id', req.user.id)
      .single()

    res.json({ success: true, user })
  } catch (error) {
    logger.error('Error obteniendo usuario actual:', error)
    res.status(500).json({ message: 'Error al obtener usuario' })
  }
}

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    const { data: user } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', req.user.id)
      .single()

    const match = await comparePassword(currentPassword, user.password_hash)
    if (!match) {
      return res.status(401).json({ message: 'Contraseña actual incorrecta' })
    }

    const password_hash = await hashPassword(newPassword)

    await supabase
      .from('users')
      .update({ password_hash })
      .eq('id', req.user.id)

    logger.info(`Contraseña cambiada: ${req.user.email}`)

    res.json({ success: true, message: 'Contraseña cambiada exitosamente' })
  } catch (error) {
    logger.error('Error cambiando password:', error)
    res.status(500).json({ message: 'Error al cambiar contraseña' })
  }
}
