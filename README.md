# ProyectoDSSGrupoC

Sistema de Gestión de Incidentes (SDIS) - Proyecto del Grupo C

## 🚨 IMPORTANTE: Configuración de Seguridad

**NUNCA subas archivos .env al repositorio**. Los secretos y credenciales deben mantenerse seguros y privados.

## 📋 Configuración del Proyecto

### 1. Configuración del Backend

1. Navega al directorio del backend:
   ```bash
   cd backend
   ```

2. Crea el .env

3. Edita el archivo `.env` con tus credenciales reales:
   ```
   SUPABASE_URL=tu_url_de_supabase
   SUPABASE_KEY=tu_clave_anon_de_supabase
   SUPABASE_SERVICE_KEY=tu_clave_service_role_de_supabase
   GMAIL_USER=tu_correo_gmail
   GMAIL_APP_PASSWORD=tu_contraseña_de_aplicación_gmail
   ```

4. Instala las dependencias:
   ```bash
   npm install
   ```

### 2. Configuración del Frontend

1. Navega al directorio del frontend:
   ```bash
   cd frontend
   ```

2. Crea el .env

3. Edita el archivo `.env` si es necesario (normalmente no requiere cambios para desarrollo local).

4. Instala las dependencias:
   ```bash
   npm install
   ```

## 🚀 Ejecución del Proyecto

### Backend
```bash
cd backend
node index.js
```

### Frontend
```bash
cd frontend
npm start
```

## 🔐 Seguridad

- Los archivos `.env` están incluidos en `.gitignore` para evitar que se suban al repositorio
- Usa archivos `.env.example` como plantillas para configurar tu entorno local
- Nunca compartas tus credenciales reales en el código fuente

## 📁 Estructura del Proyecto

```
ProyectoDSSGrupoC/
├── backend/          # Servidor Node.js/Express
├── frontend/         # Aplicación React
├── .gitignore       # Archivos y directorios ignorados por Git
└── README.md        # Este archivo
```
