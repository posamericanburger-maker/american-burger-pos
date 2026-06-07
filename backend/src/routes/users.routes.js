import express from 'express'
import bcrypt from 'bcryptjs'
import { supabase } from '../config/supabase.js'
import { verifyToken, verifyRole } from '../middleware/auth.js'

const router = express.Router()

const allowedRoles = ['admin', 'cajero', 'cocina']

router.get('/', verifyToken, verifyRole(['admin']), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, email, role, active, created_at, updated_at')
      .order('created_at', { ascending: false })

    if (error) throw error

    return res.json({
      success: true,
      users: data || []
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener usuarios'
    })
  }
})

router.post('/', verifyToken, verifyRole(['admin']), async (req, res) => {
  try {
    const {
      full_name,
      name,
      email,
      password,
      role = 'cajero'
    } = req.body

    const cleanName = String(full_name || name || '').trim()
    const cleanEmail = String(email || '').trim().toLowerCase()
    const cleanRole = String(role || 'cajero').toLowerCase()

    if (!cleanName) {
      return res.status(400).json({
        success: false,
        message: 'El nombre completo es obligatorio'
      })
    }

    if (!cleanEmail) {
      return res.status(400).json({
        success: false,
        message: 'El correo es obligatorio'
      })
    }

    if (!password || String(password).length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener mínimo 6 caracteres'
      })
    }

    if (!allowedRoles.includes(cleanRole)) {
      return res.status(400).json({
        success: false,
        message: 'Rol inválido'
      })
    }

    const { data: existingUser, error: existingError } = await supabase
      .from('users')
      .select('id')
      .eq('email', cleanEmail)
      .maybeSingle()

    if (existingError) throw existingError

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un usuario con ese correo'
      })
    }

    const password_hash = await bcrypt.hash(String(password), 10)

    const { data, error } = await supabase
      .from('users')
      .insert({
        full_name: cleanName,
        name: cleanName,
        email: cleanEmail,
        password_hash,
        role: cleanRole,
        active: true
      })
      .select('id, full_name, email, role, active, created_at')
      .single()

    if (error) throw error

    return res.status(201).json({
      success: true,
      message: 'Usuario creado correctamente',
      user: data
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al registrar usuario'
    })
  }
})

router.put('/:id', verifyToken, verifyRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params
    const {
      full_name,
      name,
      email,
      password,
      role,
      active
    } = req.body

    const payload = {
      updated_at: new Date().toISOString()
    }

    if (full_name !== undefined || name !== undefined) {
      const cleanName = String(full_name || name || '').trim()

      if (!cleanName) {
        return res.status(400).json({
          success: false,
          message: 'El nombre completo es obligatorio'
        })
      }

      payload.full_name = cleanName
      payload.name = cleanName
    }

    if (email !== undefined) {
      const cleanEmail = String(email || '').trim().toLowerCase()

      if (!cleanEmail) {
        return res.status(400).json({
          success: false,
          message: 'El correo es obligatorio'
        })
      }

      payload.email = cleanEmail
    }

    if (role !== undefined) {
      const cleanRole = String(role || '').toLowerCase()

      if (!allowedRoles.includes(cleanRole)) {
        return res.status(400).json({
          success: false,
          message: 'Rol inválido'
        })
      }

      payload.role = cleanRole
    }

    if (active !== undefined) {
      payload.active = Boolean(active)
    }

    if (password) {
      if (String(password).length < 6) {
        return res.status(400).json({
          success: false,
          message: 'La contraseña debe tener mínimo 6 caracteres'
        })
      }

      payload.password_hash = await bcrypt.hash(String(password), 10)
    }

    const { data, error } = await supabase
      .from('users')
      .update(payload)
      .eq('id', id)
      .select('id, full_name, email, role, active, created_at, updated_at')
      .single()

    if (error) throw error

    return res.json({
      success: true,
      message: 'Usuario actualizado correctamente',
      user: data
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al actualizar usuario'
    })
  }
})

router.delete('/:id', verifyToken, verifyRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params

    const { error } = await supabase
      .from('users')
      .update({
        active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) throw error

    return res.json({
      success: true,
      message: 'Usuario desactivado correctamente'
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al eliminar usuario'
    })
  }
})

export default router
