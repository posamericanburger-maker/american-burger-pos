# Guía de Instalación

## Requisitos Previos

- Node.js 16+ (Descargar desde https://nodejs.org/)
- npm 8+ (Incluido con Node.js)
- Git (Descargar desde https://git-scm.com/)
- Cuenta en Supabase (https://supabase.com)

## Paso 1: Clonar el Repositorio

```bash
git clone https://github.com/posamericanburger-maker/american-burger-pos.git
cd american-burger-pos
```

## Paso 2: Configurar Supabase

### 2.1 Crear Proyecto en Supabase

1. Ve a https://supabase.com
2. Inicia sesión o crea cuenta
3. Haz clic en "+ New Project"
4. Configura:
   - **Name**: american-burger-pos
   - **Database Password**: Elige una contraseña segura
   - **Region**: América del Sur (para mejor latencia)
5. Espera a que se cree el proyecto (2-3 minutos)

### 2.2 Obtener Credenciales

1. En Supabase, ve a **Settings** → **API**
2. Copia:
   - `Project URL` → `SUPABASE_URL`
   - `anon public` → `SUPABASE_ANON_KEY`
   - `service_role secret` → `SUPABASE_SERVICE_ROLE_KEY`

### 2.3 Crear Tablas de Base de Datos

1. En Supabase, ve a **SQL Editor**
2. Haz clic en "+ New Query"
3. Copia todo el contenido de `database/schema.sql`
4. Pega en el editor SQL
5. Haz clic en "Run"
6. Repite con `database/seeds.sql` para datos iniciales

## Paso 3: Configurar Backend

```bash
cd backend
cp .env.example .env
```

Edita `backend/.env` con tus datos:

```env
PORT=5000
NODE_ENV=development

# Supabase (copiar desde paso 2.2)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# JWT (genera una cadena aleatoria segura)
JWT_SECRET=tu-clave-secreta-super-segura-cambiar-en-produccion
JWT_EXPIRE=7d

# CORS
CORS_ORIGIN=http://localhost:5173

# Admin inicial
ADMIN_EMAIL=americanburgerarica@gmail.com
ADMIN_PASSWORD=22892360Dep
ADMIN_NAME=Administrador AMERICAN BURGER

# Datos del negocio
BUSINESS_NAME=AMERICAN BURGER
BUSINESS_ADDRESS=Av. Santa Maria 2248 Food Truck
BUSINESS_CITY=Arica
BUSINESS_PHONE=+56 9 30809265
BUSINESS_EMAIL=americanburgerarica@gmail.com
BUSINESS_CURRENCY=CLP

# Frontend
FRONTEND_URL=http://localhost:5173
```

Instala dependencias:

```bash
npm install
```

Inicia servidor:

```bash
npm run dev
```

Deberías ver:
```
🍔 AMERICAN BURGER - Sistema POS
API ejecutándose en: http://localhost:5000/api
Health Check: http://localhost:5000/api/health
```

## Paso 4: Configurar Frontend

```bash
cd ../frontend
cp .env.example .env
```

Edita `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=AMERICAN BURGER
VITE_BUSINESS_PHONE=+56 9 30809265
VITE_BUSINESS_EMAIL=americanburgerarica@gmail.com
```

Instala dependencias:

```bash
npm install
```

Inicia servidor:

```bash
npm run dev
```

Abrirá automáticamente en http://localhost:5173

## Paso 5: Primer Acceso

**URL**: http://localhost:5173

**Credenciales**:
```
Email: americanburgerarica@gmail.com
Password: 22892360Dep
```

⚠️ **IMPORTANTE**: Cambia la contraseña en el primer acceso

## Verificar Instalación

### Backend

```bash
curl http://localhost:5000/api/health
```

Deberías obtener:
```json
{"status":"OK","timestamp":"2024-01-01T12:00:00Z"}
```

### Conexión a Supabase

En los logs del backend verás:
```
[INFO] Conexión a Supabase verificada
```

## Solución de Problemas

### Error: `Cannot find module`

```bash
# Reinstala dependencias
rm -rf node_modules
rm package-lock.json
npm install
```

### Error: `EADDRINUSE: address already in use`

El puerto ya está en uso. Cambia en `.env`:
```env
PORT=5001  # O el puerto que quieras
```

### Error: `SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridas`

Verifica que `.env` tenga las variables de Supabase correctas.

### Error: `Token inválido`

Borra el localStorage y vuelve a iniciar sesión:
```javascript
localStorage.clear()
```

### Conexión a Supabase fallida

1. Verifica que Supabase está online
2. Verifica las credenciales en `.env`
3. Verifica que las tablas existen en Supabase

## Cambiar Contraseña de Admin

1. Inicia sesión con el admin
2. Ve a tu perfil (esquina superior derecha)
3. Busca "Cambiar Contraseña"
4. Ingresa contraseña actual y nueva
5. Confirma

## Estructura de Carpetas (resumen)

```
american-burger-pos/
├── frontend/              # React app
│   ├── src/
│   ├── index.html
│   ├── package.json
│   └── .env
├── backend/               # Express API
│   ├── src/
│   ├── package.json
│   └── .env
├── database/              # SQL scripts
│   ├── schema.sql
│   └── seeds.sql
├── docs/                  # Documentación
├── README.md
└── .env.example
```

## Próximos Pasos

1. ✅ Cambiar logo en Configuración
2. ✅ Crear primeros productos
3. ✅ Configurar categorías
4. ✅ Probar POS de mostrador
5. ✅ Abrir/cerrar caja
6. ✅ Hacer primera venta

## Soporte

Si encuentras problemas:
1. Revisa los logs en la consola
2. Consulta la documentación en `/docs`
3. Abre un issue en GitHub

---

**Instalación completada! 🎉**
