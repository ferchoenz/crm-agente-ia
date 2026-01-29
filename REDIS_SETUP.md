# Guía de Configuración Redis (Hetzner)

Para que el sistema de **Booking Safety** funcione correctamente, necesitas una instancia de Redis corriendo. Aquí tienes las dos formas más sencillas de hacerlo en tu servidor (asumiendo Ubuntu/Debian).

## Opción A: Docker (Recomendada) 🐳
Si ya usas Docker, es lo más limpio.

1. **Ejecutar Redis:**
   ```bash
   docker run -d --name redis-crm -p 6379:6379 --restart always redis:alpine
   ```

2. **Verificar que corre:**
   ```bash
   docker ps
   # Deberías ver el contenedor corriendo en el puerto 6379
   ```

## Opción B: Instalación Nativa (Ubuntu) 🐧
Si no usas Docker, instálalo directamente en el sistema operativo.

1. **Instalar:**
   ```bash
   sudo apt update
   sudo apt install redis-server -y
   ```

2. **Configurar para que inicie siempre (Systemd):**
   ```bash
   sudo systemctl enable redis-server
   sudo systemctl start redis-server
   ```

3. **Verificar estado:**
   ```bash
   sudo systemctl status redis-server
   # Debería decir "Active: active (running)"
   ```

## Paso Final: Conectar tu App 🔗

1. Ve a tu archivo `.env` en el servidor (donde tienes `GOOGLE_AI_API_KEY`, etc).
2. Agrega la variable de entorno:

   ```env
   # Si está en el mismo servidor (localhost)
   REDIS_URL=redis://localhost:6379
   
   # Opcional: Si configuraste password en Redis
   # REDIS_URL=redis://:tu_password@localhost:6379
   ```

3. **Reinicia tu aplicación** (PM2, Docker, o como la estés corriendo) para que tome el cambio.

### ¿Cómo saber si funciona?
Si el sistema arranca sin errores de "ECONNREFUSED", ¡estás listo! La funcionalidad de `BookingSafety` detectará Redis automáticamente y empezará a guardar los intentos de agendamiento allí.
