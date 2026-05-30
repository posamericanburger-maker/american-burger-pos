import { createClient } from '@supabase/supabase-js'
import { logger } from '../utils/logger.js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridas')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

export const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('users').select('count()')
    if (error) throw error
    logger.info('Conexión a Supabase exitosa')
    return true
  } catch (error) {
    logger.error('Error conectando a Supabase:', error.message)
    throw error
  }
}
