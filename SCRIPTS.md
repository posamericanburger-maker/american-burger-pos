# Scripts y Utilidades

## Backend Scripts

### Desarrollo
```bash
cd backend
npm run dev          # Inicia servidor con hot-reload
npm run start        # Inicia servidor en producción
npm run seed         # Carga datos iniciales
npm test             # Ejecuta pruebas
npm run lint         # Verifica código
```

### Comandos Útiles

```bash
# Ver logs en vivo
npm run dev -- --debug

# Ejecutar con puerto diferente
PORT=5001 npm run dev
```

## Frontend Scripts

### Desarrollo
```bash
cd frontend
npm run dev          # Inicia servidor dev
npm run build        # Build para producción
npm run preview      # Previsualizar build
npm run lint         # ESLint
```

## Utilidades de Base de Datos

### Exportar datos desde Supabase
```sql
-- Exportar ventas del día
SELECT * FROM orders 
WHERE DATE(created_at) = CURRENT_DATE
ORDER BY created_at DESC;

-- Productos más vendidos
SELECT p.name, SUM(oi.quantity) as vendido
FROM order_items oi
JOIN products p ON oi.product_id = p.id
GROUP BY p.id
ORDER BY vendido DESC;

-- Total ingresos por método
SELECT payment_method, SUM(total) as total
FROM orders
WHERE DATE(created_at) = CURRENT_DATE
GROUP BY payment_method;
```

## Scripts de Inicialización

### Crear usuario admin
```bash
# En el backend, ejecutar:
node scripts/createAdmin.js
```

### Reset de base de datos
```bash
# En Supabase:
# 1. Ir a SQL Editor
# 2. Ejecutar database/schema.sql
# 3. Ejecutar database/seeds.sql
```

## Variables de Entorno

### Backend (.env)
```env
# Servidor
PORT=5000
NODE_ENV=development

# Base de datos
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Autenticación
JWT_SECRET=tu-clave-segura
JWT_EXPIRE=7d

# CORS
CORS_ORIGIN=http://localhost:5173
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=AMERICAN BURGER
VITE_BUSINESS_PHONE=+56 9 30809265
VITE_BUSINESS_EMAIL=americanburgerarica@gmail.com
```

## Monitoreo

### Health Check
```bash
curl http://localhost:5000/api/health
```

### Logs del Backend
```bash
# En desarrollo
npm run dev

# En producción (Render)
# Ir a https://dashboard.render.com -> tu servicio -> Logs
```

## Deployment

### Local a GitHub
```bash
git add .
git commit -m "descripción del cambio"
git push origin main
```

### Auto-deploy a Render
1. Conectar repo en Render
2. Render automáticamente redepliegue con cada push

## Mantenimiento

### Backup de Base de Datos
```bash
# En Supabase:
# Settings -> Backups -> Crear backup manual
```

### Limpiar archivos innecesarios
```bash
# Backend
rm -rf node_modules
rm package-lock.json
npm install --production

# Frontend
rm -rf node_modules
rm dist
npm install
npm run build
```

## Troubleshooting

### Puerto en uso
```bash
# Linux/Mac
lsof -i :5000
kill -9 <PID>

# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Limpiar caché
```bash
# Frontend
rm -rf .vite
rm -rf dist

# Backend
rm -rf node_modules
```

### Reiniciar servicios
```bash
# Todo
npm run restart

# O manualmente
Ctrl+C (en ambas terminales)
npm run dev
```
