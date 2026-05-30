# Documentación de API

## Base URL

```
Development: http://localhost:5000/api
Production: https://american-burger-backend.onrender.com/api
```

## Autenticación

Todos los endpoints (excepto login) requieren JWT en el header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

## Respuestas

### Exitosa (200)
```json
{
  "success": true,
  "data": {...}
}
```

### Error (4xx, 5xx)
```json
{
  "success": false,
  "message": "Descripción del error"
}
```

## Endpoints

### 🔐 Autenticación

#### POST /auth/login
Inicia sesión de usuario

**Request:**
```json
{
  "email": "americanburgerarica@gmail.com",
  "password": "22892360Dep"
}
```

**Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "email": "americanburgerarica@gmail.com",
    "full_name": "Administrador AMERICAN BURGER",
    "role": "admin"
  }
}
```

#### POST /auth/logout
Cierra sesión (requiere autenticación)

**Response (200):**
```json
{
  "success": true,
  "message": "Sesión cerrada"
}
```

#### POST /auth/register
Registra nuevo usuario

**Request:**
```json
{
  "email": "nuevo@example.com",
  "password": "SecurePassword123!",
  "full_name": "Nombre Completo"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "user": {...}
}
```

#### GET /auth/me
Obtiene datos del usuario actual (requiere autenticación)

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "email@example.com",
    "full_name": "Nombre",
    "role": "admin"
  }
}
```

#### PUT /auth/change-password
Cambia contraseña del usuario (requiere autenticación)

**Request:**
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Contraseña cambiada exitosamente"
}
```

---

### 📦 Productos

#### GET /products
Obtiene lista de productos

**Query Parameters:**
- `category_id` (opcional): Filtrar por categoría
- `active` (opcional): true/false
- `limit` (opcional): Número de resultados (default: 50)
- `offset` (opcional): Paginación (default: 0)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Hamburguesa Classic",
      "price": 8990,
      "category_id": "uuid",
      "stock": 50
    }
  ]
}
```

#### POST /products
Crea nuevo producto (requiere rol admin)

**Request:**
```json
{
  "name": "Hamburguesa Premium",
  "description": "Descripción",
  "price": 12990,
  "cost": 4500,
  "category_id": "uuid",
  "stock": 50,
  "min_stock": 10
}
```

#### PUT /products/:id
Actualiza producto (requiere rol admin)

**Request:** (mismo que POST)

#### DELETE /products/:id
Elimina producto (requiere rol admin)

---

### 📝 Pedidos

#### POST /orders
Crea nuevo pedido (requiere rol cajero o admin)

**Request:**
```json
{
  "type": "mostrador",
  "items": [
    {
      "product_id": "uuid",
      "quantity": 2,
      "notes": "Sin tomate"
    }
  ],
  "payment_method": "efectivo",
  "discount": 0
}
```

**Response (201):**
```json
{
  "success": true,
  "order": {
    "id": "uuid",
    "order_number": 1,
    "total": 17980,
    "status": "pendiente"
  }
}
```

#### GET /orders
Obtiene lista de pedidos

**Query Parameters:**
- `status` (opcional): pendiente, preparacion, listo, entregado, anulado
- `type` (opcional): mostrador, delivery
- `date` (opcional): Fecha en formato YYYY-MM-DD
- `limit` (opcional): Número de resultados

#### GET /orders/:id
Obtiene detalles de un pedido

#### PUT /orders/:id
Actualiza estado de pedido

**Request:**
```json
{
  "status": "preparacion"
}
```

---

### 💰 Caja

#### POST /cash/open
Abre la caja (requiere rol cajero o admin)

**Request:**
```json
{
  "initial_amount": 50000
}
```

**Response (200):**
```json
{
  "success": true,
  "cash_register": {
    "id": "uuid",
    "opened_at": "2024-01-01T10:00:00Z",
    "initial_amount": 50000
  }
}
```

#### POST /cash/close
Cierra la caja (requiere rol cajero o admin)

**Request:**
```json
{
  "final_amount": 125000,
  "notes": "Cierre del turno"
}
```

#### GET /cash/movements
Obtiene movimientos de caja actual

**Response (200):**
```json
{
  "success": true,
  "movements": [
    {
      "id": "uuid",
      "type": "venta",
      "amount": 20000,
      "payment_method": "efectivo",
      "created_at": "2024-01-01T12:00:00Z"
    }
  ]
}
```

---

### 📊 Reportes

#### GET /reports/sales-day
Reporte de ventas del día

**Response (200):**
```json
{
  "success": true,
  "data": {
    "total_ventas": 250000,
    "numero_pedidos": 25,
    "ticket_promedio": 10000,
    "por_metodo_pago": {
      "efectivo": 150000,
      "debito": 100000
    }
  }
}
```

#### GET /reports/products
Productos más vendidos

#### GET /reports/payments
Resumen de pagos

---

### 👥 Usuarios

#### GET /users
Lista de usuarios (requiere rol admin)

#### POST /users
Crea nuevo usuario (requiere rol admin)

**Request:**
```json
{
  "email": "nuevo@example.com",
  "full_name": "Nombre",
  "role": "cajero"
}
```

#### PUT /users/:id
Actualiza usuario (requiere rol admin)

#### DELETE /users/:id
Elimina usuario (requiere rol admin)

---

### ⚙️ Configuración

#### GET /settings
Obtiene configuración (requiere rol admin)

**Response (200):**
```json
{
  "success": true,
  "settings": {
    "name": "AMERICAN BURGER",
    "address": "Av. Santa Maria 2248",
    "phone": "+56 9 30809265",
    "currency": "CLP",
    "logo_url": "https://..."
  }
}
```

#### PUT /settings
Actualiza configuración (requiere rol admin)

**Request:**
```json
{
  "name": "AMERICAN BURGER",
  "phone": "+56 9 30809265",
  "primary_color": "#000000",
  "secondary_color": "#FFD700"
}
```

#### POST /settings/logo
Sube nuevo logo (requiere rol admin)

**Request:** (multipart/form-data)
```
File: logo.png
```

---

### 🔍 Health Check

#### GET /health
Verifica estado del servidor

**Response (200):**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

---

## Códigos de Error

| Código | Descripción |
|--------|-------------|
| 200 | OK - Solicitud exitosa |
| 201 | Created - Recurso creado |
| 400 | Bad Request - Datos inválidos |
| 401 | Unauthorized - Token inválido o ausente |
| 403 | Forbidden - Permisos insuficientes |
| 404 | Not Found - Recurso no encontrado |
| 409 | Conflict - Recurso duplicado |
| 422 | Unprocessable Entity - Validación fallida |
| 500 | Internal Server Error - Error del servidor |

## Rate Limiting

- **Límite**: 100 requests por 15 minutos
- **Aplicado a**: Todos los endpoints
- **Header**: `X-RateLimit-Remaining`

## Paginación

Para endpoints con muchos resultados:

```bash
GET /orders?limit=20&offset=0
```

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "total": 150
  }
}
```

## Ejemplo: Flujo Completo de Venta

```bash
# 1. Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'

# Respuesta: { "token": "eyJhbGc..." }

# 2. Abrir caja
curl -X POST http://localhost:5000/api/cash/open \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{"initial_amount": 50000}'

# 3. Crear pedido
curl -X POST http://localhost:5000/api/orders \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{"type": "mostrador", "items": [{"product_id": "uuid", "quantity": 2}], "payment_method": "efectivo"}'

# 4. Ver reportes
curl -X GET http://localhost:5000/api/reports/sales-day \
  -H "Authorization: Bearer eyJhbGc..."
```

---

Para más información, revisa la documentación del código fuente.
