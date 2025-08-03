# Despliegue en Máquina Virtual (VM) Ubuntu EC2

## Backend
1. Instala dependencias:
    ```bash
    cd backend
    npm install
    ```
2. Configura variables de entorno (opcional):
    - CORS_ORIGIN: IP o dominio del frontend (ejemplo: `http://<IP_EC2>:5000`)
    - PORT: Puerto para el backend (por defecto 3000)
3. Inicia el backend:
    ```bash
    node index.js
    ```
    El backend escuchará en todas las interfaces (`0.0.0.0`).

## Frontend
1. Instala dependencias:
    ```bash
    cd frontend
    npm install
    ```
2. Configura la variable de entorno para la API:
    - Crea un archivo `.env` en `frontend/` con:
      ```env
      REACT_APP_API_URL=http://<IP_EC2>:3000
      ```
3. Genera el build optimizado:
    ```bash
    npm run build
    ```
4. Instala y usa `serve` para servir el build:
    ```bash
    npm install -g serve
    serve -s build -l 5000
    ```
    El frontend estará disponible en el puerto 5000.

## Recomendaciones
- Abre los puertos 3000 (backend) y 5000 (frontend) en el grupo de seguridad de la instancia EC2.
- Accede desde tu navegador usando la IP pública de la EC2:
  - Backend: `http://<IP_EC2>:3000`
  - Frontend: `http://<IP_EC2>:5000`
- El frontend consumirá la API usando la IP configurada en `.env`.

## Seguridad
- En producción, reemplaza los orígenes `*` por la IP o dominio real en la configuración de CORS.
- No uses `npm start` para el frontend en producción, usa el build optimizado.

---

## Instalación de Node.js en Ubuntu EC2

1. Actualiza el sistema:
    ```bash
    sudo apt update
    sudo apt upgrade
    ```
2. Instala Node.js y npm:
    ```bash
    sudo apt install nodejs npm
    ```
3. Verifica la instalación:
    ```bash
    node -v
    npm -v
    ```

## Configuración de puertos en EC2

1. Ve a la consola de AWS EC2.
2. Selecciona tu instancia y ve a "Grupos de seguridad".
3. Edita las reglas de entrada y agrega:
    - Puerto TCP 3000 (backend)
    - Puerto TCP 5000 (frontend)
4. Permite el tráfico desde tu IP o desde cualquier IP (0.0.0.0/0) según tus necesidades.

Ahora tu instancia EC2 Ubuntu está lista para recibir conexiones externas en los puertos necesarios.
