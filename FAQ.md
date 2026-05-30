# Preguntas Frecuentes

## Instalación y Configuración

### ¿Cuál es el requisito mínimo de Node.js?
Node.js 16 o superior. Recomendamos la versión LTS (18+).

### ¿Puedo usar otra base de datos en lugar de Supabase?
Sí, pero necesitarías modificar la configuración. Supabase es recomendado por ser PostgreSQL administrado.

### ¿Cómo cambio las variables de entorno?
Copia `.env.example` a `.env` y edita los valores. Nunca subas el archivo `.env` a GitHub.

### ¿Necesito Docker para ejecutar?
No es obligatorio. Puedes ejecutar localmente con Node.js. Docker es opcional para facilitar deployment.

---

## Seguridad

### ¿Las contraseñas están encriptadas?
Sí, con bcrypt (10 rounds). Las contraseñas nunca se almacenan en texto plano.

### ¿Es seguro el JWT?
Sí, JWT es seguro si:
- La clave secreta es suficientemente fuerte
- Solo se transmite por HTTPS en producción
- El token tiene expiration time

### ¿Cómo reseteo la contraseña de admin?
Va a Settings en Supabase, busca la tabla `users`, edita la contraseña. (No recomendado en producción)

### ¿Qué información se audita?
- Login/Logout
- Creación/Modificación de registros
- Eliminación de datos
- Cambios de caja
- Ventas

---

## POS y Ventas

### ¿Puedo vender sin abrir caja?
No. El sistema obliga a abrir caja antes de hacer cualquier venta.

### ¿Se puede anular una venta?
Sí, pero solo administrador puede hacerlo. Se descuenta del inventario automáticamente.

### ¿Qué pasa si se cierra el navegador durante una venta?
La venta se guarda parcialmente. Al reabrir, puedes continuarla o descartarla.

### ¿Cuáles son los medios de pago soportados?
- Efectivo
- Débito
- Crédito
- Transferencia

Para integraciones de pago externas (Stripe, etc), consulta documentación.

---

## Inventario

### ¿Cómo descuento insumos automáticamente?
Crea recetas para cada producto. Al vender, el sistema descuenta los insumos automáticamente.

### ¿Qué pasa si no hay stock?
El sistema alerta pero permite vender (para casos de ajuste manual). Se recomienda gestionar bien el inventario.

### ¿Puedo importar datos de inventario?
Actualmente no hay importador. Debes crear productos manualmente o vía API.

---

## Reportes

### ¿En qué formatos puedo exportar reportes?
PDF por ahora. Próximamente Excel/CSV.

### ¿Puedo ver reportes históricos?
Sí. Ve a Reportes y selecciona el rango de fechas deseado.

### ¿Cómo calcula la utilidad estimada?
Total ventas - Total costo de productos - Gastos registrados.

---

## Deployment

### ¿Cuánto cuesta desplegar en Render?
Plan Starter es gratis con limitaciones. Plans pagos desde $7/mes.

### ¿Puedo usar otro hosting?
Sí. El código es agnóstico a la plataforma. Render es recomendado por facilidad.

### ¿Cómo actualizo el código en producción?
Haz push a GitHub. Render automáticamente redepliegue.

### ¿Cómo hago backups?
Supabase realiza backups automáticos diarios. Puedes hacer backups manuales en Settings.

---

## Mantenimiento

### ¿Con qué frecuencia debo hacer backups?
Supabase los hace automáticamente. Se recomienda backup manual 1x mes.

### ¿Cómo updateo dependencias?
```bash
npm update
npm audit fix
```

### ¿Debo hacer maintenance del código?
Periódicamente revisa logs de errores y actualiza dependencias.

---

## Soporte Técnico

### ¿Dónde reporto bugs?
Abre un issue en GitHub con descripción del problema y pasos para reproducir.

### ¿Cuál es el tiempo de respuesta?
Datos técnicos: 24-48 horas. Emergencias: ASAP.

### ¿Hay documentación adicional?
Sí, ver carpeta `/docs` con guías detalladas.

### ¿Puedo customizar el sistema?
Sí. El código es tuyo. Puedes hacer cualquier cambio que necesites.

---

## Performance

### ¿Cuántos usuarios simultáneos soporta?
Plataforma Starter: ~50-100 usuarios concurrentes.
Plan pago: Escalable según necesidad.

### ¿Es lento en conexiones lentas?
El sitio está optimizado. Funciona con conexiones 3G+.

### ¿Cómo mejoro performance?
1. Upgrade a plan pago en Render
2. Implementar CDN
3. Optimizar imágenes
4. Cachear datos frecuentes

---

## Caracteristicas Futuras

### ¿Cuándo tendremos app móvil?
En desarrollo. Estimado Q3 2024.

### ¿Integración con plataformas delivery?
En roadmap para próxima versión.

### ¿Whatsapp Bot?
En desarrollo para Q4 2024.

---

## Otros

### ¿Puedo vender el sistema a otros negocios?
No. El código es privado y exclusivo para AMERICAN BURGER.

### ¿Qué pasa con mis datos?
Tus datos están en tu cuenta de Supabase. Ni nosotros ni nadie más puede acceder sin tu permiso.

### ¿Hay política de privacidad?
La privacidad de clientes debe ser manejada por tu negocio. El sistema no comparte datos.

### ¿Puedo usar dominio propio?
Sí. Configura el dominio en Render (Settings -> Custom Domain).

---

**¿No encuentras tu pregunta? Abre un issue en GitHub.**
