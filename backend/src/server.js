import app from './app.js'
import { logger } from './utils/logger.js'
import { testSupabaseConnection } from './config/supabase.js'

const PORT = process.env.PORT || 5000

const startServer = async () => {
  try {
    await testSupabaseConnection()
    logger.info('Conexión a Supabase verificada')
  } catch (error) {
    logger.error('Advertencia: no se pudo verificar Supabase al iniciar:', error?.message || error)
    logger.error('El servidor seguirá iniciado para permitir diagnóstico.')
  }

  app.listen(PORT, () => {
    logger.info(`Servidor iniciado en puerto ${PORT}`)
    console.log(`
🍔 AMERICAN BURGER - Sistema POS`)
    console.log(`API ejecutándose en puerto ${PORT}`)
    console.log(`Health Check: /api/health\n`)
  })
}

startServer()
