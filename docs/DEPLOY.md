# Guía de Despliegue en Render

## Requisitos

- Cuenta en Render (https://render.com)
- Repositorio en GitHub
- Variables de entorno configuradas

## Paso 1: Conectar Repositorio a Render

### 1.1 Crear cuenta en Render

1. Ve a https://render.com
2. Haz clic en "Sign up"
3. Conéctate con GitHub (recomendado)
4. Autoriza a Render para acceder a tu repositorio

### 1.2 Verificar repositorio

1. En tu perfil de Render, ve a "Connected services"
2. Asegúrate que tu repo `american-burger-pos` esté conectado

## Paso 2: Desplegar Backend

### 2.1 Crear Web Service para Backend

1. En Render, haz clic en "+ New"
2. Selecciona "Web Service"
3. Selecciona tu repositorio `american-burger-pos`
4. Configura:

| Campo | Valor |
|-------|-------|
| **Name** | american-burger-backend |
| **Runtime** | Node |
| **Build Command** | `cd backend && npm install && npm run build` |
| **Start Command** | `npm run start` |
| **Plan** | Starter (gratis) o pago según necesidad |

### 2.2 Agregar variables de entorno

1. En la configuración del servicio, ve a "Environment"
2. Agrega todas las variables de `.env`:

```env
PORT=5000
NODE_ENV=production
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
JWT_SECRET=tu-clave-super-segura-cambiar
JWT_EXPIRE=7d
CORS_ORIGIN=https://tu-frontend-url.onrender.com
BUSINESS_NAME=AMERICAN BURGER
BUSINESS_ADDRESS=Av. Santa Maria 2248 Food Truck
BUSINESS_CITY=Arica
BUSINESS_PHONE=+56 9 30809265
BUSINESS_EMAIL=americanburgerarica@gmail.com
BUSINESS_CURRENCY=CLP
FRONTEND_URL=https://tu-frontend-url.onrender.com
```

### 2.3 Desplegar

1. Haz clic en "Create Web Service"
2. Espera a que se depliegue (2-5 minutos)
3. Te proporcionará una URL como: `https://american-burger-backend.onrender.com`
4. Verifica que funciona: `https://american-burger-backend.onrender.com/api/health`

## Paso 3: Desplegar Frontend

### 3.1 Crear Static Site para Frontend

1. En Render, haz clic en "+ New"
2. Selecciona "Static Site"
3. Selecciona tu repositorio
4. Configura:

| Campo | Valor |
|-------|-------|
| **Name** | american-burger-frontend |
| **Build Command** | `cd frontend && npm install && npm run build` |
| **Publish Directory** | `frontend/dist` |

### 3.2 Agregar variables de entorno

1. Ve a "Environment"
2. Agrega:

```env
VITE_API_URL=https://american-burger-backend.onrender.com/api
VITE_APP_NAME=AMERICAN BURGER
VITE_BUSINESS_PHONE=+56 9 30809265
VITE_BUSINESS_EMAIL=americanburgerarica@gmail.com
```

### 3.3 Desplegar

1. Haz clic en "Create Static Site"
2. Espera a que se depliegue (2-3 minutos)
3. Te proporcionará una URL como: `https://american-burger-frontend.onrender.com`

## Paso 4: Actualizar CORS en Backend

Ahora que tienes las URLs finales, actualiza en el backend:

1. Ve a tu Web Service del backend
2. Ve a "Environment"
3. Edita `CORS_ORIGIN`:
   ```env
   CORS_ORIGIN=https://american-burger-frontend.onrender.com
   ```
4. Edita `FRONTEND_URL`:
   ```env
   FRONTEND_URL=https://american-burger-frontend.onrender.com
   ```
5. Guarda y Render redesplegará automáticamente

## Paso 5: Verificar Despliegue

### Prueba el Backend

```bash
curl https://american-burger-backend.onrender.com/api/health
```

Deberías obtener:
```json
{"status":"OK","timestamp":"2024-01-01T12:00:00Z"}
```

### Prueba el Frontend

1. Abre https://american-burger-frontend.onrender.com
2. Deberías ver la pantalla de login
3. Inicia sesión con:
   - Email: `americanburgerarica@gmail.com`
   - Password: `22892360Dep`

## Configurar Dominio Personalizado (Opcional)

### Para Backend

1. Ve a tu Web Service
2. Ve a "Settings"
3. Busca "Custom Domain"
4. Ingresa tu dominio: `api.tudominio.com`
5. Sigue las instrucciones de DNS

### Para Frontend

1. Ve a tu Static Site
2. Ve a "Settings"
3. Busca "Custom Domain"
4. Ingresa tu dominio: `app.tudominio.com` o `tudominio.com`
5. Sigue las instrucciones de DNS

## Monitoreo y Logs

### Ver Logs en Vivo

1. En Render, selecciona tu servicio
2. Ve a "Logs"
3. Verás todos los logs en tiempo real

### Configurar Alertas

1. Ve a "Settings" de tu servicio
2. Busca "Notifications"
3. Configura email para alertas de error

## Actualizar Después de Cambios

### Opción 1: Deploy Automático

Render automáticamente redepliegue cuando hagas push a GitHub.

### Opción 2: Deploy Manual

1. En tu servicio, haz clic en "Manual Deploy"
2. Selecciona la rama (main)
3. Haz clic en "Deploy"

## Solución de Problemas

### Error: `Build failed`

1. Revisa los logs de build
2. Verifica que `npm install` funciona localmente
3. Verifica las dependencias en `package.json`

### Error: `Cannot find module`

```bash
# Localmente, verifica
npm install
npm run build
```

### Error: `CORS error`

Asegúrate que `CORS_ORIGIN` en backend coincide con tu URL de frontend.

### Conexión a Supabase fallida

1. Verifica que `SUPABASE_URL` y las claves son correctas
2. Verifica que Supabase está online
3. Prueba conectar desde tu máquina local

### Sitio lento

1. Render Starter es gratis pero tiene limitaciones
2. Actualiza a un plan pago para mejor performance
3. Considera usar CDN para el frontend

## Costo Estimado

| Servicio | Plan | Costo/Mes |
|----------|------|----------|
| Backend (Web Service) | Starter | Gratis (con límites) |
| Frontend (Static Site) | Gratis | Gratis |
| **Total** | | **Gratis o $12+** |

## Backups en Supabase

Render no hace backups de la BD, eso lo hace Supabase:

1. En Supabase, ve a "Database" → "Backups"
2. Configura backups automáticos diarios
3. Puedes restaurar desde cualquier backup

## Próximos Pasos

1. ✅ Cambia la contraseña de admin
2. ✅ Carga tu logo en configuración
3. ✅ Configura productos
4. ✅ Haz tu primera venta
5. ✅ Configura dominio personalizado

## Documentación Útil

- [Render Docs](https://render.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [GitHub Actions para auto-deploy](https://render.com/docs/github)

---

**¡Despliegue completado! 🚀**

Tu sistema POS está ahora en producción y accesible online.
