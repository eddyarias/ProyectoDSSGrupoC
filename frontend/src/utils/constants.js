// User roles
export const USER_ROLES = {
  USUARIO: 'Usuario',
  ANALISTA: 'Analista de Seguridad',
  JEFE_SOC: 'Jefe de SOC',
  AUDITOR: 'Auditor',
  GERENTE: 'Gerente de Riesgos',
};

// Incident status options
export const INCIDENT_STATUS = {
  OPEN: 'Abierto',
  IN_PROGRESS: 'En Progreso',
  RESOLVED: 'Resuelto',
  CLOSED: 'Cerrado',
};

// Incident criticality levels
export const INCIDENT_CRITICALITY = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  CRITICAL: 'Crítica',
};

// Incident classifications
export const INCIDENT_CLASSIFICATION = {
  EVENT: 'Evento',
  INCIDENT: 'Incidente',
  BREACH: 'Brecha'
};

// Role permissions
export const ROLE_PERMISSIONS = {
  [USER_ROLES.USUARIO]: {
    canCreateIncidents: true,     // Solo los usuarios pueden crear incidentes
    canViewOwnIncidents: true,
    canViewAllIncidents: false,
    canUpdateIncidents: false,
    canDeleteIncidents: false,
    canAccessReports: false,
    canExportData: false,
    canManageUsers: false,
    canClassifyIncidents: false,
    canChangeIncidentStatus: false,
    canCloseIncidents: false,
  },
  [USER_ROLES.ANALISTA]: {
    canCreateIncidents: false,    // Los analistas NO pueden crear incidentes
    canViewOwnIncidents: false,
    canViewAllIncidents: true,    // Ver todos los incidentes y trazabilidad
    canUpdateIncidents: true,     // Puede actualizar incidentes
    canDeleteIncidents: false,
    canAccessReports: true,       // PUEDE ver reportes
    canExportData: false,         // NO puede exportar datos
    canManageUsers: false,
    canClassifyIncidents: true,   // Clasificar como Evento/Incidente/Brecha
    canChangeIncidentStatus: true, // Cambiar estados (Nuevo → En análisis → Contenido → Cerrado)
    canCloseIncidents: false,     // NO puede autorizar/cerrar (solo cambiar estados)
  },
  [USER_ROLES.JEFE_SOC]: {
    canCreateIncidents: false,    // Los jefes SOC NO pueden crear incidentes
    canViewOwnIncidents: false,
    canViewAllIncidents: true,
    canUpdateIncidents: true,
    canDeleteIncidents: false,
    canAccessReports: true,       // Consultar reportes y métricas
    canExportData: false,         // NO puede exportar datos
    canManageUsers: true,         // Ver usuarios
    canClassifyIncidents: false,  // NO clasifica (eso es del analista)
    canChangeIncidentStatus: false, // NO cambia estados (eso es del analista)
    canCloseIncidents: true,      // Autorizar/cerrar incidentes y validar flujo
  },
  [USER_ROLES.AUDITOR]: {
    canCreateIncidents: false,
    canViewOwnIncidents: false,
    canViewAllIncidents: true,
    canUpdateIncidents: false,
    canDeleteIncidents: false,
    canAccessReports: true,       // PUEDE ver reportes
    canExportData: false,         // NO puede exportar datos
    canManageUsers: false,
    canClassifyIncidents: false,
    canChangeIncidentStatus: false,
    canCloseIncidents: false,
  },
  [USER_ROLES.GERENTE]: {
    canCreateIncidents: false,    // Los gerentes NO pueden crear incidentes
    canViewOwnIncidents: false,
    canViewAllIncidents: false,   // NO puede ver todos los incidentes (solo reportes)
    canUpdateIncidents: false,
    canDeleteIncidents: false,
    canAccessReports: true,       // Ver/Generar reporte mensual
    canExportData: true,          // Exportar CSV/PDF con anonimización
    canManageUsers: false,
    canClassifyIncidents: false,
    canChangeIncidentStatus: false,
    canCloseIncidents: false,
  },
};

// Utility function to check permissions
export const hasPermission = (userRole, permission) => {
  return ROLE_PERMISSIONS[userRole]?.[permission] || false;
};

// Date format options
export const DATE_FORMAT_OPTIONS = {
  short: {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  },
  long: {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  },
};

// File upload constraints
export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
};
