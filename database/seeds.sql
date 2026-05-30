-- ============================================================
-- AMERICAN BURGER - Datos Iniciales (Seeds)
-- ============================================================

-- Insertar roles
INSERT INTO roles (name, description, permissions) VALUES
('admin', 'Administrador del sistema', '{"all": true}'),
('cajero', 'Cajero - Ventas y caja', '{"sales": true, "cash": true}'),
('cocina', 'Personal de cocina', '{"orders": true}')
ON CONFLICT (name) DO NOTHING;

-- Insertar usuario admin inicial
-- Contraseña: 22892360Dep (hasheada con bcrypt)
INSERT INTO users (email, password_hash, full_name, role, active) VALUES
('americanburgerarica@gmail.com', '$2a$10$YourHashedPasswordHere', 'Administrador AMERICAN BURGER', 'admin', true)
ON CONFLICT (email) DO NOTHING;

-- Insertar categorías
INSERT INTO categories (name, description, active, display_order) VALUES
('Hamburguesas', 'Nuestras deliciosas hamburguesas', true, 1),
('Papas y Acompañamientos', 'Papas fritas, aros de cebolla y más', true, 2),
('Bebidas', 'Bebidas frías y calientes', true, 3),
('Postres', 'Postres variados', true, 4),
('Promociones', 'Ofertas especiales', true, 5)
ON CONFLICT (name) DO NOTHING;

-- Insertar productos de ejemplo
INSERT INTO products (name, description, price, cost, category_id, active, stock, min_stock) 
SELECT 
    'Hamburguesa Classic', 
    'Pan de hamburguesa, carne de vacuno, lechuga, tomate, cebolla y salsa especial',
    8990,
    3000,
    (SELECT id FROM categories WHERE name = 'Hamburguesas' LIMIT 1),
    true,
    50,
    10
ON CONFLICT DO NOTHING;

INSERT INTO products (name, description, price, cost, category_id, active, stock, min_stock) 
SELECT 
    'Hamburguesa Doble',
    'Dos carnes con queso y toppings especiales',
    12990,
    4500,
    (SELECT id FROM categories WHERE name = 'Hamburguesas' LIMIT 1),
    true,
    40,
    10
ON CONFLICT DO NOTHING;

INSERT INTO products (name, description, price, cost, category_id, active, stock, min_stock) 
SELECT 
    'Papas Fritas Grande',
    'Papas fritas crujientes tamaño grande',
    5990,
    1500,
    (SELECT id FROM categories WHERE name = 'Papas y Acompañamientos' LIMIT 1),
    true,
    100,
    20
ON CONFLICT DO NOTHING;

INSERT INTO products (name, description, price, cost, category_id, active, stock, min_stock) 
SELECT 
    'Bebida Gaseosa 500ml',
    'Bebida gaseosa variedad a elegir',
    2990,
    800,
    (SELECT id FROM categories WHERE name = 'Bebidas' LIMIT 1),
    true,
    150,
    30
ON CONFLICT DO NOTHING;

-- Insertar ingredientes de ejemplo
INSERT INTO ingredients (name, unit, current_stock, min_stock, cost_per_unit) VALUES
('Carne molida 500g', 'kg', 50, 10, 8000),
('Pan de hamburguesa', 'unidad', 200, 50, 500),
('Lechuga', 'kg', 20, 5, 3000),
('Tomate', 'kg', 25, 5, 4000),
('Cebolla', 'kg', 15, 3, 2000),
('Queso cheddar', 'kg', 10, 2, 15000),
('Papas', 'kg', 100, 20, 2000),
('Aceite vegetal', 'litro', 20, 5, 5000),
('Salsa especial', 'litro', 10, 2, 12000)
ON CONFLICT DO NOTHING;

-- Insertar configuración del negocio
INSERT INTO business_settings 
(name, address, city, phone, email, currency, primary_color, secondary_color, timezone) VALUES
('AMERICAN BURGER', 'Av. Santa Maria 2248 Food Truck', 'Arica', '+56 9 30809265', 'americanburgerarica@gmail.com', 'CLP', '#000000', '#FFD700', 'America/Santiago')
ON CONFLICT DO NOTHING;
