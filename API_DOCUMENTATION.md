# Documentación de la API - Sistema de Gestión de Incidentes (SDIS)

## 1\. Introducción

Esta es la documentación para la API del backend del Sistema de Gestión de Incidentes de Seguridad (SDIS). La API permite gestionar usuarios, incidentes y reportes, e implementa un sistema de autenticación robusto con roles y MFA.

**URL Base (Entorno Local):** `http://localhost:3000`

-----

## 2\. Autenticación

La API utiliza tokens **JWT (Bearer Tokens)** para proteger los endpoints. El flujo de autenticación puede tener uno o dos pasos, dependiendo de si el usuario ha activado la Autenticación Multifactor (MFA).

### Flujo de Login Estándar (Sin MFA)

1.  El usuario envía su `email` y `password` al endpoint `POST /api/auth/login`.
2.  El servidor valida las credenciales y devuelve un objeto `session` que contiene el `access_token`.
3.  Este `access_token` debe ser enviado en la cabecera (header) `Authorization` de todas las futuras solicitudes a endpoints protegidos.
      * **Formato del Header:** `Authorization: Bearer <tu_access_token>`

### Flujo de Login con MFA Activado

1.  El usuario envía su `email` y `password` al endpoint `POST /api/auth/login`.
2.  El servidor valida la contraseña y detecta que el usuario tiene MFA. La respuesta **no contendrá una sesión**, sino un mensaje: `{ "mfa_required": true, "factorId": "...", "challengeId": "..." }`.
3.  La aplicación frontend debe solicitar al usuario el código de 6 dígitos de su app de autenticación.
4.  La aplicación envía el `factorId`, `challengeId` y el `code` de 6 dígitos al endpoint `POST /api/auth/verify-login`.
5.  Si el código es correcto, el servidor devuelve el objeto `session` completo con el `access_token`. A partir de aquí, el flujo es normal.

-----

## 3\. Endpoints de la API

### 3.1. Autenticación y Usuarios (`/api/auth`)

#### **Registrar un nuevo usuario**

  * **Endpoint:** `POST /api/auth/signup`
  * **Descripción:** Crea un nuevo usuario con el rol por defecto de 'Usuario'.
  * **Autorización:** Pública.
  * **Request Body:**
    ```json
    {
      "email": "nuevo.usuario@ejemplo.com",
      "password": "una-contraseña-segura"
    }
    ```
  * **Success Response (201 Created):**
    ```json
    {
      "user": {
        "id": "...",
        "email": "nuevo.usuario@ejemplo.com",
        "role": "authenticated",
        // ...otros campos
      }
    }
    ```

-----

#### **Iniciar sesión**

  * **Endpoint:** `POST /api/auth/login`
  * **Descripción:** Autentica a un usuario. La respuesta varía si el usuario tiene MFA activado.
  * **Autorización:** Pública.
  * **Request Body:**
    ```json
    {
      "email": "usuario.existente@ejemplo.com",
      "password": "su-contraseña"
    }
    ```
  * **Success Response (Sin MFA - 200 OK):**
    ```json
    {
      "session": {
        "access_token": "ey...",
        "refresh_token": "...",
        "user": { ... }
      }
    }
    ```
  * **Success Response (Con MFA - 200 OK):**
    ```json
    {
      "mfa_required": true,
      "factorId": "a3a20d03-0d49-4db9-97b5-65d88eab50f9",
      "challengeId": "a1b2c3d4-..."
    }
    ```

-----

#### **Verificar Login con MFA**

  * **Endpoint:** `POST /api/auth/verify-login`
  * **Descripción:** Segundo paso del login para usuarios con MFA.
  * **Autorización:** Pública.
  * **Request Body:**
    ```json
    {
        "factorId": "EL_ID_DEL_PASO_ANTERIOR",
        "challengeId": "EL_OTRO_ID_DEL_PASO_ANTERIOR",
        "code": "123456" // El código de 6 dígitos de la app
    }
    ```
  * **Success Response (200 OK):**
    ```json
    {
      "session": {
        "access_token": "ey...",
        "refresh_token": "...",
        "user": { ... }
      }
    }
    ```
  * **Error Response (401 Unauthorized):** Si el código es incorrecto.

-----

#### **Cerrar sesión**

  * **Endpoint:** `POST /api/auth/logout`
  * **Descripción:** Invalida el `access_token` del usuario.
  * **Autorización:** Requiere Bearer Token.
  * **Success Response (200 OK):**
    ```json
    {
      "message": "Logged out successfully."
    }
    ```

-----

### 3.2. Gestión de Incidentes (`/api/incidents`)

#### **Crear un nuevo incidente**

  * **Endpoint:** `POST /api/incidents`
  * **Descripción:** Permite a un usuario autenticado registrar un nuevo incidente.
  * **Autorización:** Requiere Bearer Token (cualquier rol).
  * **Request Body:**
    ```json
    {
      "title": "Intento de acceso no autorizado",
      "description": "Se detectaron múltiples intentos de login fallidos desde la IP 1.2.3.4.",
      "source": "Logs del Firewall",
      "affected_asset": "Servidor Web Principal",
      "criticality": "Media"
    }
    ```
  * **Success Response (201 Created):** Devuelve el objeto del incidente recién creado.

-----

#### **Obtener lista de incidentes**

  * **Endpoint:** `GET /api/incidents`
  * **Descripción:** Devuelve una lista de incidentes. El resultado depende del rol del usuario.
  * **Autorización:** Requiere Bearer Token.
      * **Rol 'Usuario':** Solo ve los incidentes creados por él mismo.
      * **Otros roles:** Ven todos los incidentes.
  * **Success Response (200 OK):**
    ```json
    [
      {
        "id": 1,
        "title": "Intento de acceso no autorizado",
        // ...otros campos
      }
    ]
    ```

-----

#### **Actualizar un incidente**

  * **Endpoint:** `PATCH /api/incidents/:id`
  * **Descripción:** Modifica el estado, clasificación o criticidad de un incidente existente.
  * **Autorización:** Requiere Bearer Token.
  * **Roles Permitidos:** `Analista de Seguridad`, `Jefe de SOC`.
  * **Request Body (parcial, solo los campos a cambiar):**
    ```json
    {
      "status": "En análisis",
      "classification": "Incidente",
      "criticality": "Alta"
    }
    ```
  * **Success Response (200 OK):** Devuelve el objeto del incidente actualizado.

-----

#### **Subir archivo de evidencia**

  * **Endpoint:** `POST /api/incidents/:id/upload`
  * **Descripción:** Sube un archivo como evidencia y lo asocia a un incidente.
  * **Autorización:** Requiere Bearer Token (cualquier rol).
  * **Request Body:** No es JSON. Se debe usar `multipart/form-data`.
      * **Key:** `evidenceFile`
      * **Value:** (Seleccionar un archivo)
  * **Success Response (200 OK):**
    ```json
    {
      "message": "File uploaded and incident updated successfully.",
      "incident": {
        "id": 1,
        // ...otros campos, incluyendo evidence_url y evidence_hash
      }
    }
    ```

-----

### 3.3. Reportes y Exportaciones (`/api/reports`, `/api/incidents/export`)

#### **Obtener reporte mensual en JSON**

  * **Endpoint:** `GET /api/reports/monthly`
  * **Descripción:** Devuelve estadísticas de los incidentes de los últimos 30 días.
  * **Autorización:** Requiere Bearer Token.
  * **Roles Permitidos:** `Gerente de Riesgos`, `Jefe de SOC`, `Auditor`, `Analista de Seguridad`.
  * **Success Response (200 OK):**
    ```json
    {
      "period": {
        "start": "2025-06-28T...",
        "end": "2025-07-28T..."
      },
      "totalIncidents": 5,
      "breakdownByStatus": {
        "Nuevo": 2,
        "En análisis": 3
      },
      "breakdownByCriticality": {
        "Media": 4,
        "Alta": 1
      },
      "topAffectedAssets": [
        { "asset": "Servidor Web Principal", "count": 3 }
      ]
    }
    ```

-----

#### **Exportar incidentes a CSV**

  * **Endpoint:** `GET /api/incidents/export/csv`
  * **Descripción:** Genera y devuelve un archivo CSV con todos los incidentes.
  * **Autorización:** Requiere Bearer Token.
  * **Roles Permitidos:** `Auditor`, `Gerente de Riesgos`, `Jefe de SOC`, `Analista de Seguridad`.
  * **Success Response (200 OK):** Devuelve el contenido del archivo `incidents_export.csv`. El cliente API debería permitir guardarlo.

-----

#### **Exportar incidentes a PDF**

  * **Endpoint:** `GET /api/incidents/export/pdf`
  * **Descripción:** Genera y devuelve un archivo PDF con un reporte de todos los incidentes. Los datos del creador son anonimizados.
  * **Autorización:** Requiere Bearer Token.
  * **Roles Permitidos:** `Auditor`, `Gerente de Riesgos`, `Jefe de SOC`, `Analista de Seguridad`.
  * **Success Response (200 OK):** Devuelve el archivo `reporte_incidentes.pdf` para ser descargado.

-----

### 3.4. Administración y MFA (`/api/admin`, `/api/mfa`)

#### **Promover el rol de un usuario**

  * **Endpoint:** `POST /api/admin/promote`
  * **Descripción:** (Para desarrollo) Permite a un usuario cambiar su propio rol.
  * **Autorización:** Requiere Bearer Token.
  * **Request Body:**
    ```json
    {
      "newRole": "Analista de Seguridad" // Roles válidos: 'Usuario', 'Analista de Seguridad', 'Jefe de SOC', 'Auditor', 'Gerente de Riesgos'
    }
    ```
  * **Success Response (200 OK):** Confirma el cambio de rol.

-----

#### **Iniciar inscripción en MFA**

  * **Endpoint:** `POST /api/mfa/enroll`
  * **Descripción:** Genera un código QR para que el usuario lo escanee con su app de autenticación.
  * **Autorización:** Requiere Bearer Token.
  * **Success Response (200 OK):**
    ```json
    {
      "factorId": "a3a20d03-...",
      "qr_code_svg": "data:image/svg+xml;utf-8,..."
    }
    ```
      * **Nota para el Frontend:** El `qr_code_svg` es un Data URL que se puede asignar directamente al `src` de una etiqueta `<img>`.

-----

#### **Verificar y activar MFA**

  * **Endpoint:** `POST /api/mfa/verify`
  * **Descripción:** Finaliza el proceso de inscripción enviando un código de la app.
  * **Autorización:** Requiere Bearer Token.
  * **Request Body:**
    ```json
    {
      "factorId": "EL_ID_DEL_PASO_ANTERIOR",
      "code": "123456"
    }
    ```
  * **Success Response (200 OK):**
    ```json
    {
      "message": "¡Factor MFA verificado con éxito!",
      "session": { ... } // Devuelve una nueva sesión
    }
    ```