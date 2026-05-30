# 🍔 AMERICAN BURGER - Sistema POS Gastronómico

![AMERICAN BURGER](https://img.shields.io/badge/AMERICAN-BURGER-FFD700?style=for-the-badge)

Sistema POS profesional, moderno y completamente funcional para gestionar tu negocio gastronómico **AMERICAN BURGER**. Diseñado específicamente para food trucks y restaurantes de comida rápida.

---

## ✨ Características Principales

✅ **Autenticación Segura**: Login con JWT y bcrypt  
✅ **Gestión de Caja**: Apertura/cierre con movimientos registrados  
✅ **POS de Ventas**: Mostrador y Delivery  
✅ **KDS**: Pantalla en tiempo real para cocina  
✅ **Inventario**: Control automático de stock  
✅ **Reportes Completos**: Ventas, gastos, utilidades  
✅ **Usuarios y Roles**: Admin, Cajero, Cocina  
✅ **Impresión Térmica**: Comandas 80mm  
✅ **Diseño Responsivo**: Interfaz moderna  
✅ **Dashboard Analytics**: Métricas en tiempo real  

---

## 📁 Estructura del Proyecto

```
american-burger-pos/
├── frontend/                          # React + Vite
│   ├── src/
│   │   ├── components/                # Componentes reutilizables
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── Logo.jsx
│   │   │   └── ...
│   │   ├── pages/                     # Páginas principales
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── POS/
│   │   │   ├── CashRegister/
│   │   │   ├── Kitchen/
│   │   │   ├── Products/
│   │   │   ├── Reports/
│   │   │   ├── Users/
│   │   │   ├── Settings/
│   │   │   ├── Diagnostics/
│   │   │   └── ...
│   │   ├── services/                  # API calls
│   │   │   ├── api.js
│   │   │   ├── authService.js
│   │   │   └── ...
│   │   ├── contexts/                  # Context API
│   │   │   ├── AuthContext.jsx
│   │   │   └── CashContext.jsx
│   │   ├── hooks/                     # Custom hooks
│   │   ├── styles/                    # CSS global
│   │   ├── assets/                    # Imágenes y logo
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── .env.example
├── backend/                           # Node.js + Express
│   ├── src/
│   │   ├── routes/                    # Rutas API
│   │   │   ├── auth.routes.js
│   │   │   ├── products.routes.js
│   │   │   ├── orders.routes.js
│   │   │   ├── cash.routes.js
│   │   │   ├── inventory.routes.js
│   │   │   ├── users.routes.js
│   │   │   ├── reports.routes.js
│   │   │   └── ...
│   │   ├── controllers/               # Lógica de negocio
│   │   ├── models/                    # Consultas a BD
│   │   ├── middleware/                # Auth, validación
│   │   │   ├── auth.js
│   │   │   ├── errorHandler.js
│   │   │   └── validation.js
│   │   ├── services/                  # Servicios
│   │   │   ├── authService.js
│   │   │   ├── orderService.js
│   │   │   ├── inventoryService.js
│   │   │   └── ...
│   │   ├── utils/                     # Utilidades
│   │   │   ├── logger.js
│   │   │   ├── printer.js
│   │   │   └── validators.js
│   │   ├── config/                    # Configuración
│   │   │   └── supabase.js
│   │   └── server.js                  # Punto de entrada
│   ├── package.json
│   └── .env.example
├── database/                          # Scripts SQL
│   ├── schema.sql                     # Estructura completa
│   └── seeds.sql                      # Datos iniciales
├── docs/                              # Documentación
│   ├── INSTALLATION.md
│   ├── DEPLOY.md
│   ├── API.md
│   └── DATABASE.md
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 🚀 Inicio Rápido

### 📋 Requisitos Previos
- Node.js 16+ y npm
- PostgreSQL / Supabase
- Git

### 1️⃣ Clonar el Repositorio

```bash
git clone https://github.com/posamericanburger-maker/american-burger-pos.git
cd american-burger-pos
```

### 2️⃣ Configurar Variables de Entorno

**Backend:**
```bash
cd backend
cp .env.example .env
```

Edita `backend/.env` con tus datos:
```env
PORT=5000
NODE_ENV=development
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:5173
```

**Frontend:**
```bash
cd ../frontend
cp .env.example .env
```

Edita `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=AMERICAN BURGER
```

### 3️⃣ Configurar Base de Datos (Supabase)

1. Ve a [Supabase](https://supabase.com) → Crear proyecto
2. Copia tu URL y claves de API
3. Ve a **SQL Editor** y copia todo el contenido de `database/schema.sql`
4. Ejecuta el SQL completo
5. Luego ejecuta `database/seeds.sql` para datos iniciales

### 4️⃣ Instalar Dependencias e Iniciar

**Backend:**
```bash
cd backend
npm install
npm run dev
```

**Frontend (en otra terminal):**
```bash
cd frontend
npm install
npm run dev
```

### 5️⃣ Acceder al Sistema

🌐 **Frontend**: http://localhost:5173  
⚙️ **Backend API**: http://localhost:5000/api

---

## 🔐 Credenciales Iniciales

```
Email: americanburgerarica@gmail.com
Contraseña: 22892360Dep
Rol: Administrador
```

⚠️ **IMPORTANTE**: Cambia la contraseña inmediatamente después del primer login

---

## 📱 Módulos Disponibles

### 🔑 1. Autenticación
- ✅ Login seguro con JWT
- ✅ Roles: Admin, Cajero, Cocina
- ✅ Recuperación de contraseña
- ✅ Auditoría de accesos
- ✅ Sesiones seguras

### 📊 2. Dashboard
- ✅ Métricas del día en tiempo real
- ✅ Ventas acumuladas
- ✅ Estado de caja
- ✅ Gráficos de desempeño
- ✅ Alertas importantes

### 💰 3. Gestión de Caja
- ✅ Apertura con monto inicial
- ✅ Registro de ingresos/egresos
- ✅ Resumen por medio de pago
- ✅ Cierre con arqueo
- ✅ Historial de movimientos
- ✅ Diferencia esperada vs real

### 🛒 4. POS - Punto de Venta

**Mostrador:**
- Venta rápida
- Carrito inteligente
- Modificación de cantidades
- Notas en productos

**Delivery:**
- Registro de clientes
- Direcciones guardadas
- Contacto WhatsApp
- Seguimiento de pedidos

**Funcionalidades:**
- Medios de pago: Efectivo, Débito, Crédito, Transferencia
- Descuentos y promociones
- Cálculo automático de totales
- Búsqueda rápida de productos
- Favoritos personalizados

### 👨‍🍳 5. KDS - Kitchen Display System
- Pantalla en tiempo real para cocina
- Estados: Pendiente → Preparando → Listo → Entregado
- Alertas visuales y sonoras
- Historial de pedidos
- Control de tiempos

### 📦 6. Gestión de Productos
- CRUD completo de productos
- Categorías y subcategorías
- Precios y promociones
- Imágenes de productos
- Productos activos/inactivos
- Búsqueda avanzada

### 🎯 7. Combos
- Crear combos personalizados
- Productos incluidos
- Precios especiales
- Stock inteligente
- Aplicar a pedidos

### 📊 8. Inventario
- Control de insumos
- Recetas por producto
- Descuento automático en ventas
- Alertas de stock bajo
- Historial de movimientos
- Reportes de consumo

### 👥 9. Clientes (Delivery)
- Registro completo
- Historial de compras
- Múltiples direcciones
- Contacto WhatsApp
- Preferencias guardadas

### 📝 10. Pedidos
- Gestión completa de pedidos
- Estados personalizables
- Historial detallado
- Búsqueda y filtros
- Anulación con justificación

### 📈 11. Reportes
- Ventas por día/fecha/rango
- Ventas por producto/categoría
- Ventas por medio de pago
- Productos más vendidos
- Análisis de gastos
- Utilidad estimada
- Exportar PDF/Excel

### 👤 12. Usuarios y Permisos
- CRUD de usuarios
- Asignación de roles
- Control de permisos
- Auditoría de actividades
- Historial de cambios

### ⚙️ 13. Configuración del Negocio
- Logo y branding
- Datos de contacto
- Nombre y dirección
- Colores personalizables
- Información para tickets
- Horarios de operación

### 🔧 14. Diagnóstico del Sistema
- Verificar conexión a BD
- Validar productos sin precio
- Estado de caja
- Control de stock
- Permisos de usuarios
- Variables de entorno
- Salud del servidor

---

## 🎨 Identidad Visual

### Colores Principales
```css
--primary-black: #000000;
--primary-yellow: #FFD700;
--primary-white: #FFFFFF;
--secondary-gray: #333333;
--accent-red: #FF4444;
--success-green: #44BB44;
```

### Tipografía
- **Títulos**: Poppins Bold
- **Textos**: Inter Regular
- **Monoespaciado**: Courier New (tickets)

---

## 💾 Base de Datos

### Tablas Principales

```sql
-- Usuarios
users (id, email, password_hash, full_name, role, active, created_at, updated_at)
roles (id, name, description, permissions, created_at)
audit_logs (id, user_id, action, details, ip_address, created_at)

-- Productos
products (id, name, description, price, cost, category_id, image_url, active, stock, created_at)
categories (id, name, description, image_url, active, created_at)
combos (id, name, price, description, products_ids, active, created_at)

-- Ventas
orders (id, type, customer_id, total, discount, payment_method, status, notes, created_at)
order_items (id, order_id, product_id, quantity, unit_price, subtotal, notes)

-- Clientes
customers (id, name, phone, email, address, city, delivery_notes, created_at)

-- Caja
cash_registers (id, user_id, opened_at, closed_at, initial_amount, final_amount, difference, notes)
cash_movements (id, register_id, type, amount, description, created_at)

-- Inventario
inventory_items (id, product_id, quantity, alert_level, last_updated)
inventory_movements (id, product_id, quantity, type, reason, notes, created_at)
recipes (id, product_id, ingredient_id, quantity, unit)
ingredients (id, name, unit, current_stock, min_stock, cost_per_unit)

-- Gastos
expenses (id, category, amount, description, user_id, created_at)
```

---

## 🔐 Seguridad

✅ Autenticación JWT con tokens seguros  
✅ Contraseñas hasheadas con bcrypt (10 rounds)  
✅ Validación de roles en cada endpoint  
✅ Sanitización de inputs  
✅ Protección contra CSRF  
✅ HTTPS recomendado en producción  
✅ Rate limiting en endpoints críticos  
✅ Auditoría completa de acciones  
✅ Variables de entorno protegidas  
✅ Manejo robusto de errores  

---

## 🚀 Deploy en Render

### Backend

1. Conecta tu repo a Render (render.com)
2. Crea nuevo **Web Service**
3. Configura:
   ```
   Build Command: cd backend && npm install && npm run build
   Start Command: npm run start
   ```
4. Añade variables de entorno (copiar desde `.env`)
5. Deploy automático

### Frontend

1. Crea nuevo **Static Site** en Render
2. Conecta repo
3. Configura:
   ```
   Build Command: cd frontend && npm install && npm run build
   Publish Directory: frontend/dist
   ```
4. Configura variable: `VITE_API_URL=<tu-backend-url>`
5. Deploy

---

## 📲 Impresión Térmica

Las comandas se generan automáticamente y son compatibles con impresoras térmicas 80mm.

**Formato de comanda:**
```
===============================
  🍔 AMERICAN BURGER 🍔
Av. Santa Maria 2248, Arica
Tel: +56 9 30809265
===============================

Pedido #1234          12:45 PM

--- PRODUCTOS ---
2x Hamburguesa         $15.000
1x Papas Fritas        $5.000
1x Bebida              $2.500

--- TOTAL ---
Subtotal:             $22.500
Descuento:             $0
TOTAL:                $22.500

Medio de Pago: EFECTIVO

===============================
Gracias por tu compra! 😊
===============================
```

---

## 📚 Documentación Adicional

- **[INSTALLATION.md](./docs/INSTALLATION.md)** - Guía completa de instalación
- **[DEPLOY.md](./docs/DEPLOY.md)** - Despliegue en Render
- **[API.md](./docs/API.md)** - Documentación de endpoints
- **[DATABASE.md](./docs/DATABASE.md)** - Estructura de BD

---

## 🛠️ Scripts Disponibles

### Backend
```bash
npm run dev         # Desarrollo con nodemon
npm run start       # Producción
npm run build       # Build
npm run seed        # Cargar datos iniciales
npm test            # Pruebas unitarias
npm run lint        # ESLint
```

### Frontend
```bash
npm run dev         # Servidor desarrollo
npm run build       # Build producción
npm run preview     # Preview del build
npm run lint        # ESLint
```

---

## 📋 Datos del Negocio

```
🏢 Nombre: AMERICAN BURGER
📍 Dirección: Av. Santa Maria 2248 Food Truck
🏙️ Ciudad: Arica
📞 Teléfono: +56 9 30809265
📧 Email: americanburgerarica@gmail.com
💵 Moneda: CLP (Pesos Chilenos)
```

---

## 📝 Changelog

### v1.0.0 (2024)
- ✅ Sistema completo funcional
- ✅ Todos los módulos implementados
- ✅ Autenticación y seguridad
- ✅ Dashboard analytics
- ✅ Integración Supabase

---

## 🤝 Contribuciones

Este sistema es de uso exclusivo para AMERICAN BURGER. Para mejoras o cambios, contacta al desarrollador.

---

## 📄 Licencia

Privado - Solo para AMERICAN BURGER

---

## 📞 Soporte

Para reportar errores o solicitar nuevas funciones, abre un issue en GitHub.

---

**v1.0.0** | Desarrollado para AMERICAN BURGER 🍔🇨🇱
