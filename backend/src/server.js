import app from './app.js'
import { logger } from './utils/logger.js'
import { testSupabaseConnection } from './config/supabase.js'

const PORT = process.env.PORT || 5000

const startServer = async () => {
  try {
    // Test database connection
    await testSupabaseConnection()
    logger.info('Conexión a Supabase verificada')

    app.listen(PORT, () => {
      logger.info(`Servidor iniciado en puerto ${PORT}`)
      console.log(`
🍔 AMERICAN BURGER - Sistema POS`)
      console.log(`API ejecutándose en: http://localhost:${PORT}/api`)
      console.log(`Health Check: http://localhost:${PORT}/api/health\n`)
    })
  } catch (error) {
    logger.error('Error al iniciar servidor:', error)
    process.exit(1)
  }
}

startServer()
