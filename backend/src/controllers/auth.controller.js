import { supabase } from '../config/supabase.js'
import { hashPassword, comparePassword } from '../utils/helpers.js'
import { generateToken } from '../middleware/auth.js'
import { logger } from '../utils/logger.js'

export const login = async (req, res) => {
try {
const { email, password } = req.body

```
if (!email || !password) {
  return res.status(400).json({ message: 'Email y contraseña requeridos' })
}

const emailNormalizado = email.trim().toLowerCase()
const adminEmail = (process.env.ADMIN_INITIAL_EMAIL || '').trim().toLowerCase()
const adminPassword = process.env.ADMIN_INITIAL_PASSWORD || ''
const adminName = process.env.ADMIN_INITIAL_NAME || 'Administrador American Burger'

let { data: user, error: userError } = await supabase
  .from('users')
  .select('*')
  .eq('email', emailNormalizado)
  .maybeSingle()

if ((!user || userError) && emailNormalizado === adminEmail && password === adminPassword) {
  const password_hash = await hashPassword(password)

  const { data: newAdmin, error: insertError } = await supabase
    .from('users')
    .insert({
      email: emailNormalizado,
      password_hash,
      full_name: adminName,
      role: 'admin',
      active: true
    })
    .select()
    .single()

  if (insertError) {
    logger.error('Error creando admin de emergencia:', insertError)
    throw insertError
  }

  user = newAdmin
}

if (!user) {
  logger.warn(`Intento de login fallido, usuario no encontrado: ${emailNormalizado}`)
  return res.status(401).json({ message: 'Credenciales inválidas' })
}

if (user.active === false) {
  logger.warn(`Usuario inactivo: ${emailNormalizado}`)
  return res.status(401).json({ message: 'Usuario inactivo' })
}

let passwordMatch = await comparePassword(password, user.password_hash)

if (!passwordMatch && emailNormalizado === adminEmail && password === adminPassword) {
  const password_hash = await hashPassword(password)

  const { data: fixedAdmin, error: updateError } = await supabase
    .from('users')
    .update({
      password_hash,
      full_name: adminName,
      role: 'admin',
      active: true,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id)
    .select()
    .single()

  if (updateError) {
    logger.error('Error reparando admin:', updateError)
    throw updateError
  }

  user = fixedAdmin
  passwordMatch = true
}

if (!passwordMatch) {
  logger.warn(`Contraseña incorrecta para: ${emailNormalizado}`)
  return res.status(401).json({ message: 'Credenciales inválidas' })
}

const token = generateToken(user)

try {
  await supabase.from('audit_logs').insert({
    user_id: user.id,
    action: 'LOGIN',
    details: `Login desde ${req.ip}`,
    ip_address: req.ip
  })
} catch (auditError) {
  logger.warn('No se pudo registrar auditoría de login:', auditError?.message || auditError)
}

logger.info(`Login exitoso: ${emailNormalizado}`)

res.json({
  success: true,
  token,
  user: {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    role: user.role
  }
})
```

} catch (error) {
logger.error('Error en login:', error)
res.status(500).json({ message: 'Error al iniciar sesión' })
}
}

export const register = async (req, res) => {
try {
const { email, password, full_name } = req.body

```
if (!email || !password || !full_name) {
  return res.status(400).json({ message: 'Todos los campos son requeridos' })
}

const emailNormalizado = email.trim().toLowerCase()

const { data: existing } = await supabase
  .from('users')
  .select('id')
  .eq('email', emailNormalizado)
  .maybeSingle()

if (existing) {
  return res.status(400).json({ message: 'Email ya registrado' })
}

const password_hash = await hashPassword(password)

const { data: user, error } = await supabase
  .from('users')
  .insert({
    email: emailNormalizado,
    password_hash,
    full_name,
    role: 'cajero',
    active: true
  })
  .select()
  .single()

if (error) throw error

logger.info(`Nuevo usuario registrado: ${emailNormalizado}`)

res.status(201).json({
  success: true,
  message: 'Usuario registrado exitosamente',
  user
})
```

} catch (error) {
logger.error('Error en registro:', error)
res.status(500).json({ message: 'Error al registrar usuario' })
}
}

export const logout = async (req, res) => {
try {
try {
await supabase.from('audit_logs').insert({
user_id: req.user.id,
action: 'LOGOUT',
details: 'Logout',
ip_address: req.ip
})
} catch (auditError) {
logger.warn('No se pudo registrar auditoría de logout:', auditError?.message || auditError)
}

```
logger.info(`Logout: ${req.user.email}`)

res.json({ success: true, message: 'Sesión cerrada' })
```

} catch (error) {
logger.error('Error en logout:', error)
res.status(500).json({ message: 'Error al cerrar sesión' })
}
}

export const forgotPassword = async (req, res) => {
try {
const { email } = req.body

```
if (!email) {
  return res.status(400).json({ message: 'Email requerido' })
}

const emailNormalizado = email.trim().toLowerCase()

const { data: user } = await supabase
  .from('users')
  .select('id')
  .eq('email', emailNormalizado)
  .maybeSingle()

if (!user) {
  return res.status(404).json({ message: 'Usuario no encontrado' })
}

logger.info(`Solicitud de recuperación: ${emailNormalizado}`)

res.json({ success: true, message: 'Revisa tu email para instrucciones' })
```

} catch (error) {
logger.error('Error en forgot password:', error)
res.status(500).json({ message: 'Error al procesar solicitud' })
}
}

export const resetPassword = async (req, res) => {
try {
const { email, newPassword } = req.body

```
if (!email || !newPassword) {
  return res.status(400).json({ message: 'Email y nueva contraseña requeridos' })
}

const emailNormalizado = email.trim().toLowerCase()
const password_hash = await hashPassword(newPassword)

const { data: user, error } = await supabase
  .from('users')
  .update({
    password_hash,
    active: true,
    updated_at: new Date().toISOString()
  })
  .eq('email', emailNormalizado)
  .select()
  .single()

if (error) throw error

logger.info(`Contraseña reseteada: ${emailNormalizado}`)

res.json({ success: true, message: 'Contraseña actualizada', user })
```

} catch (error) {
logger.error('Error reseteando password:', error)
res.status(500).json({ message: 'Error al resetear contraseña' })
}
}

export const getCurrentUser = async (req, res) => {
try {
const { data: user, error } = await supabase
.from('users')
.select('id, email, full_name, role')
.eq('id', req.user.id)
.single()

```
if (error) throw error

res.json({ success: true, user })
```

} catch (error) {
logger.error('Error obteniendo usuario actual:', error)
res.status(500).json({ message: 'Error al obtener usuario' })
}
}

export const changePassword = async (req, res) => {
try {
const { currentPassword, newPassword } = req.body

```
if (!currentPassword || !newPassword) {
  return res.status(400).json({ message: 'Contraseña actual y nueva contraseña requeridas' })
}

const { data: user, error: userError } = await supabase
  .from('users')
  .select('password_hash')
  .eq('id', req.user.id)
  .single()

if (userError) throw userError

const match = await comparePassword(currentPassword, user.password_hash)

if (!match) {
  return res.status(401).json({ message: 'Contraseña actual incorrecta' })
}

const password_hash = await hashPassword(newPassword)

const { error: updateError } = await supabase
  .from('users')
  .update({
    password_hash,
    updated_at: new Date().toISOString()
  })
  .eq('id', req.user.id)

if (updateError) throw updateError

logger.info(`Contraseña cambiada: ${req.user.email}`)

res.json({ success: true, message: 'Contraseña cambiada exitosamente' })
```

} catch (error) {
logger.error('Error cambiando password:', error)
res.status(500).json({ message: 'Error al cambiar contraseña' })
}
}
