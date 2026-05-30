# Documentación de Base de Datos

## Estructura de Base de Datos

### 1. Tablas de Usuarios y Autenticación

#### `users`
```sql
id (UUID) - Identificador único
email (VARCHAR) - Email único del usuario
password_hash (VARCHAR) - Contraseña hasheada con bcrypt
full_name (VARCHAR) - Nombre completo
role (VARCHAR) - Rol: 'admin', 'cajero', 'cocina'
active (BOOLEAN) - Estado del usuario
created_at (TIMESTAMP) - Fecha de creación
updated_at (TIMESTAMP) - Fecha de última actualización
```

#### `roles`
```sql
id (UUID) - Identificador único
name (VARCHAR) - Nombre único del rol
description (TEXT) - Descripción
permissions (JSONB) - Permisos en formato JSON
created_at (TIMESTAMP) - Fecha de creación
```

#### `audit_logs`
```sql
id (UUID) - Identificador único
user_id (UUID FK) - Referencia al usuario
action (VARCHAR) - Acción realizada (LOGIN, LOGOUT, CREATE, UPDATE, DELETE, etc)
details (TEXT) - Detalles de la acción
ip_address (VARCHAR) - Dirección IP
created_at (TIMESTAMP) - Fecha de creación
```

### 2. Tablas de Productos y Categorías

#### `categories`
```sql
id (UUID) - Identificador único
name (VARCHAR) - Nombre único
description (TEXT) - Descripción
image_url (TEXT) - URL de imagen
active (BOOLEAN) - Activa/Inactiva
display_order (INT) - Orden de visualización
created_at (TIMESTAMP) - Fecha de creación
```

#### `products`
```sql
id (UUID) - Identificador único
name (VARCHAR) - Nombre del producto
description (TEXT) - Descripción
price (DECIMAL) - Precio de venta
cost (DECIMAL) - Costo del producto
category_id (UUID FK) - Referencia a categoría
image_url (TEXT) - URL de imagen
active (BOOLEAN) - Activo/Inactivo
stock (INT) - Cantidad en stock
min_stock (INT) - Stock mínimo para alertas
created_at (TIMESTAMP) - Fecha de creación
```

#### `combos`
```sql
id (UUID) - Identificador único
name (VARCHAR) - Nombre del combo
description (TEXT) - Descripción
price (DECIMAL) - Precio especial
products_ids (UUID[]) - Array de IDs de productos
active (BOOLEAN) - Activo/Inactivo
created_at (TIMESTAMP) - Fecha de creación
```

### 3. Tablas de Ventas

#### `orders`
```sql
id (UUID) - Identificador único
order_number (INT) - Número secuencial de orden
type (VARCHAR) - 'mostrador' o 'delivery'
customer_id (UUID FK) - Referencia a cliente
total (DECIMAL) - Total de la venta
discount (DECIMAL) - Descuento aplicado
payment_method (VARCHAR) - 'efectivo', 'debito', 'credito', 'transferencia'
status (VARCHAR) - Estado: pendiente, preparacion, listo, entregado, anulado
notes (TEXT) - Notas de la orden
created_by (UUID FK) - Usuario que creó la orden
created_at (TIMESTAMP) - Fecha de creación
```

#### `order_items`
```sql
id (UUID) - Identificador único
order_id (UUID FK) - Referencia a orden
product_id (UUID FK) - Referencia a producto
quantity (INT) - Cantidad
unit_price (DECIMAL) - Precio unitario
subtotal (DECIMAL) - Subtotal
notes (TEXT) - Notas del item
created_at (TIMESTAMP) - Fecha de creación
```

### 4. Tablas de Clientes (Delivery)

#### `customers`
```sql
id (UUID) - Identificador único
name (VARCHAR) - Nombre del cliente
phone (VARCHAR) - Teléfono
email (VARCHAR) - Email
address (TEXT) - Dirección
city (VARCHAR) - Ciudad
delivery_notes (TEXT) - Notas de entrega
whatsapp_contact (VARCHAR) - Contacto WhatsApp
created_at (TIMESTAMP) - Fecha de creación
```

#### `delivery_orders`
```sql
id (UUID) - Identificador único
customer_id (UUID FK) - Referencia a cliente
order_id (UUID FK) - Referencia a orden
status (VARCHAR) - Estado: pendiente, en_preparacion, listo, entregado, anulado
delivery_address (TEXT) - Dirección de entrega
delivery_notes (TEXT) - Notas de entrega
created_at (TIMESTAMP) - Fecha de creación
```

### 5. Tablas de Caja

#### `cash_registers`
```sql
id (UUID) - Identificador único
user_id (UUID FK) - Usuario que abrió
opened_at (TIMESTAMP) - Hora de apertura
closed_at (TIMESTAMP) - Hora de cierre
initial_amount (DECIMAL) - Monto inicial
final_amount (DECIMAL) - Monto final
difference (DECIMAL) - Diferencia (arqueo)
notes (TEXT) - Notas
created_at (TIMESTAMP) - Fecha de creación
```

#### `cash_movements`
```sql
id (UUID) - Identificador único
register_id (UUID FK) - Referencia a caja
type (VARCHAR) - 'ingreso', 'egreso', 'venta'
amount (DECIMAL) - Monto
description (TEXT) - Descripción
payment_method (VARCHAR) - Medio de pago
created_at (TIMESTAMP) - Fecha de creación
```

### 6. Tablas de Inventario

#### `ingredients`
```sql
id (UUID) - Identificador único
name (VARCHAR) - Nombre único del insumo
unit (VARCHAR) - Unidad: 'kg', 'litro', 'unidad', etc
current_stock (DECIMAL) - Stock actual
min_stock (DECIMAL) - Stock mínimo para alerta
cost_per_unit (DECIMAL) - Costo unitario
created_at (TIMESTAMP) - Fecha de creación
```

#### `recipes`
```sql
id (UUID) - Identificador único
product_id (UUID FK) - Referencia a producto
ingredient_id (UUID FK) - Referencia a insumo
quantity (DECIMAL) - Cantidad necesaria
unit (VARCHAR) - Unidad de medida
created_at (TIMESTAMP) - Fecha de creación
```

#### `inventory_items`
```sql
id (UUID) - Identificador único
product_id (UUID FK) - Referencia a producto
quantity (INT) - Cantidad en stock
alert_level (INT) - Nivel de alerta
last_updated (TIMESTAMP) - Última actualización
```

#### `inventory_movements`
```sql
id (UUID) - Identificador único
product_id (UUID FK) - Referencia a producto
quantity (INT) - Cantidad movida
type (VARCHAR) - 'entrada', 'salida', 'ajuste', 'venta'
reason (VARCHAR) - Razón del movimiento
notes (TEXT) - Notas
user_id (UUID FK) - Usuario que registró
created_at (TIMESTAMP) - Fecha de creación
```

### 7. Tabla de Gastos

#### `expenses`
```sql
id (UUID) - Identificador único
category (VARCHAR) - Categoría del gasto
amount (DECIMAL) - Monto del gasto
description (TEXT) - Descripción
user_id (UUID FK) - Usuario que registró
created_at (TIMESTAMP) - Fecha de creación
```

### 8. Tabla de Configuración

#### `business_settings`
```sql
id (UUID) - Identificador único
name (VARCHAR) - Nombre del negocio
address (VARCHAR) - Dirección
city (VARCHAR) - Ciudad
phone (VARCHAR) - Teléfono
email (VARCHAR) - Email
currency (VARCHAR) - Moneda (CLP)
logo_url (TEXT) - URL del logo
primary_color (VARCHAR) - Color principal
secondary_color (VARCHAR) - Color secundario
timezone (VARCHAR) - Zona horaria
created_at (TIMESTAMP) - Fecha de creación
updated_at (TIMESTAMP) - Fecha de actualización
```

## Relaciones

```
users
  ├── audit_logs (1:N)
  ├── orders (1:N) - created_by
  ├── cash_registers (1:N)
  └── inventory_movements (1:N)

categories
  └── products (1:N)

products
  ├── order_items (1:N)
  ├── recipes (1:N)
  └── inventory_items (1:N)

combos
  └── (contiene array de product_ids)

orders
  ├── order_items (1:N)
  ├── customers (N:1) - para delivery
  └── delivery_orders (1:1)

ingredients
  └── recipes (1:N)

cash_registers
  └── cash_movements (1:N)
```

## Índices Creados

- `idx_users_email` - Búsqueda rápida por email
- `idx_users_role` - Búsqueda por rol
- `idx_products_category` - Búsqueda productos por categoría
- `idx_orders_created_at` - Filtrado de órdenes por fecha
- `idx_orders_status` - Búsqueda por estado
- `idx_orders_type` - Búsqueda por tipo (mostrador/delivery)
- `idx_order_items_order_id` - Búsqueda items de orden
- `idx_cash_movements_register_id` - Búsqueda movimientos por caja
- `idx_inventory_movements_created_at` - Búsqueda movimientos por fecha
- `idx_audit_logs_user_id` - Búsqueda auditoría por usuario
- `idx_audit_logs_action` - Búsqueda auditoría por acción
- `idx_audit_logs_created_at` - Búsqueda auditoría por fecha

## Notas de Seguridad

1. **Contraseñas**: Se hashean con bcrypt (10 rounds)
2. **Row Level Security (RLS)**: Se recomienda habilitar en Supabase
3. **Auditoría**: Todas las acciones se registran en `audit_logs`
4. **Datos Sensibles**: No se almacenan datos de tarjetas de crédito
5. **Backups**: Realizar backups regulares en Supabase

## Procedimientos para Queries Comunes

### Venta del día
```sql
SELECT SUM(total) as total_ventas, COUNT(*) as numero_pedidos
FROM orders
WHERE DATE(created_at) = CURRENT_DATE
AND status != 'anulado';
```

### Top 5 Productos Vendidos
```sql
SELECT p.name, SUM(oi.quantity) as total_vendido
FROM order_items oi
JOIN products p ON oi.product_id = p.id
WHERE DATE(oi.created_at) = CURRENT_DATE
GROUP BY p.id
ORDER BY total_vendido DESC
LIMIT 5;
```

### Estado de Caja Actual
```sql
SELECT *
FROM cash_registers
WHERE closed_at IS NULL
ORDER BY opened_at DESC
LIMIT 1;
```

### Movimientos de Caja Hoy
```sql
SELECT *
FROM cash_movements
WHERE register_id = $1
AND DATE(created_at) = CURRENT_DATE
ORDER BY created_at DESC;
```
