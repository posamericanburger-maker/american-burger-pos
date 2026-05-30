import { createClient } from '@supabase/supabase-js'
import { logger } from '../utils/logger.js'

const supabaseUrl = process.env.SUPABASE_URL?.trim().replace(/\/$/, '')
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim().replace(/\s+/g, '')

if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridas')
}

// Diagnóstico seguro: NO muestra la clave completa
logger.info('SUPABASE_URL configurada:', supabaseUrl)
logger.info('SUPABASE_SERVICE_ROLE_KEY detectada:', {
  length: supabaseKey.length,
  startsWith: supabaseKey.slice(0, 6),
  endsWith: supabaseKey.slice(-6)
})

export const supabase = createClient(supabaseUrl, supabaseKey)

export const testSupabaseConnection = async () => {
  try {
    const { error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    if (error) throw error

    logger.info('Conexión a Supabase exitosa')
    return true
  } catch (error) {
    logger.error('Error conectando a Supabase:', error.message)
    logger.error('Detalle Supabase:', {
      message: error.message,
      hint: error.hint,
      code: error.code
    })
    throw error
  }
}
