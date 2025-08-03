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
  MALWARE: 'Malware',
  PHISHING: 'Phishing',
  INTRUSION: 'Intrusión',
  DATA_BREACH: 'Fuga de Datos',
  DOS: 'Denegación de Servicio',
  UNAUTHORIZED_ACCESS: 'Acceso No Autorizado',
  OTHER: 'Otro',
};

// Role permissions
export const ROLE_PERMISSIONS = {
  [USER_ROLES.USUARIO]: {
    canCreateIncidents: true,
    canViewOwnIncidents: true,
    canViewAllIncidents: false,
    canUpdateIncidents: false,
    canDeleteIncidents: false,
    canAccessReports: false,
    canExportData: false,
    canManageUsers: false,
  },
  [USER_ROLES.ANALISTA]: {
    canCreateIncidents: true,
    canViewOwnIncidents: true,
    canViewAllIncidents: true,
    canUpdateIncidents: true,
    canDeleteIncidents: false,
    canAccessReports: true,
    canExportData: true,
    canManageUsers: false,
  },
  [USER_ROLES.JEFE_SOC]: {
    canCreateIncidents: true,
    canViewOwnIncidents: true,
    canViewAllIncidents: true,
    canUpdateIncidents: true,
    canDeleteIncidents: true,
    canAccessReports: true,
    canExportData: true,
    canManageUsers: true,
  },
  [USER_ROLES.AUDITOR]: {
    canCreateIncidents: false,
    canViewOwnIncidents: false,
    canViewAllIncidents: true,
    canUpdateIncidents: false,
    canDeleteIncidents: false,
    canAccessReports: true,
    canExportData: true,
    canManageUsers: false,
  },
  [USER_ROLES.GERENTE]: {
    canCreateIncidents: false,
    canViewOwnIncidents: false,
    canViewAllIncidents: true,
    canUpdateIncidents: false,
    canDeleteIncidents: false,
    canAccessReports: true,
    canExportData: true,
    canManageUsers: true,
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
