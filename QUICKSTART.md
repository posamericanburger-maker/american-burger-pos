# Guía Rápida de Inicio

## 🚀 Inicio Rápido (5 minutos)

### Opción 1: Local (Desarrollo)

```bash
# 1. Clonar
git clone https://github.com/posamericanburger-maker/american-burger-pos.git
cd american-burger-pos

# 2. Configurar .env (ver docs/INSTALLATION.md)
cd backend && cp .env.example .env && cd ..
cd frontend && cp .env.example .env && cd ..

# 3. Instalar dependencias
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# 4. Ejecutar
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev

# Abrir http://localhost:5173
```

### Opción 2: Docker (Recomendado)

```bash
# Asegurate de tener Docker instalado
docker-compose up

# Abrir http://localhost:5173
```

### Opción 3: Render (Producción)

Ver `docs/DEPLOY.md` para instrucciones completas de despliegue.

---

## 📋 Credenciales Iniciales

```
Email: americanburgerarica@gmail.com
Password: 22892360Dep
```

⚠️ Cambiar contraseña en primer acceso

---

## 📁 Archivos Importantes

| Archivo | Descripción |
|---------|-------------|
| `docs/INSTALLATION.md` | Instalación paso a paso |
| `docs/DEPLOY.md` | Despliegue en Render |
| `docs/DATABASE.md` | Estructura de base de datos |
| `docs/API.md` | Documentación de API REST |
| `database/schema.sql` | SQL de tablas |
| `database/seeds.sql` | Datos iniciales |
| `.env.example` | Variables de entorno |

---

## 🔧 Configuración de Supabase

1. Ve a https://supabase.com
2. Crea proyecto nuevo
3. Copia URL y claves
4. Ejecuta `database/schema.sql` en SQL Editor
5. Ejecuta `database/seeds.sql` para datos iniciales
6. Actualiza `.env` con tus credenciales

---

## 🎨 Branding

Para cambiar logo y colores:

1. Ir a **Configuración del Negocio**
2. Subir nuevo logo
3. Cambiar colores si lo deseas

---

## 📱 Módulos Disponibles

✅ Dashboard
✅ POS Mostrador
✅ POS Delivery
✅ Caja
✅ KDS Cocina
✅ Productos
✅ Inventario
✅ Reportes
✅ Usuarios
✅ Configuración
✅ Diagnóstico

---

## 🐛 Solución de Problemas

### Error de conexión a Supabase
```bash
# Verifica credenciales en .env
# Verifica que Supabase está online
# Verifica que las tablas existen
```

### Puerto en uso
```bash
# Cambia puerto en .env
PORT=5001
```

### Módulos no encontrados
```bash
# Reinstala dependencias
rm -rf node_modules
npm install
```

---

## 📞 Datos del Negocio

```
🍔 AMERICAN BURGER
📍 Av. Santa Maria 2248 Food Truck
🏙️  Arica
📱 +56 9 30809265
📧 americanburgerarica@gmail.com
💵 CLP (Pesos Chilenos)
```

---

## 🔐 Seguridad

✅ Autenticación JWT
✅ Contraseñas con bcrypt
✅ Validación de roles
✅ CORS configurado
✅ Auditoría completa
✅ Rate limiting

---

## 📚 Documentación Completa

Ver carpeta `docs/` para más información.

---

## 💡 Tips

1. Cambiar contraseña admin después de instalar
2. Crear productos antes de vender
3. Abrir caja cada mañana
4. Hacer reportes diarios
5. Mantener backups regulares en Supabase

---

**¡Sistema listo para usar! 🚀**
