# Despliegue en Máquina Virtual (VM)

## Backend
1. Instala dependencias:
   ```cmd
   cd backend
   npm install
   ```
2. Configura variables de entorno (opcional):
   - CORS_ORIGIN: IP o dominio del frontend (ejemplo: `http://<IP_VM>:5000`)
   - PORT: Puerto para el backend (por defecto 3000)
3. Inicia el backend:
   ```cmd
   node index.js
   ```
   El backend escuchará en todas las interfaces (`0.0.0.0`).

## Frontend
1. Instala dependencias:
   ```cmd
   cd frontend
   npm install
   ```
2. Configura la variable de entorno para la API:
   - Crea un archivo `.env` en `frontend/` con:
     ```env
     REACT_APP_API_URL=http://<IP_VM>:3000
     ```
3. Genera el build optimizado:
   ```cmd
   npm run build
   ```
4. Instala y usa `serve` para servir el build:
   ```cmd
   npm install -g serve
   serve -s build -l 5000
   ```
   El frontend estará disponible en el puerto 5000.

## Recomendaciones
- Abre los puertos 3000 (backend) y 5000 (frontend) en la VM.
- Accede desde tu navegador usando la IP de la VM:
  - Backend: `http://<IP_VM>:3000`
  - Frontend: `http://<IP_VM>:5000`
- El frontend consumirá la API usando la IP configurada en `.env`.

## Seguridad
- En producción, reemplaza los orígenes `*` por la IP o dominio real en la configuración de CORS.
- No uses `npm start` para el frontend en producción, usa el build optimizado.

---

¿Necesitas instrucciones para instalar Node.js o configurar el firewall en la VM?
