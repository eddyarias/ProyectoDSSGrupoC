// API Configuration
// Para producción, configura REACT_APP_API_URL en tu VM, por ejemplo:
// REACT_APP_API_URL=http://<IP_VM>:3000
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    SIGNUP: `${API_BASE_URL}/auth/signup`,
    LOGIN: `${API_BASE_URL}/auth/login`,
    VERIFY_LOGIN: `${API_BASE_URL}/auth/verify-login`,
    LOGOUT: `${API_BASE_URL}/auth/logout`,
  },
  
  // MFA
  MFA: {
    ENROLL: `${API_BASE_URL}/mfa/enroll`,
    VERIFY: `${API_BASE_URL}/mfa/verify`,
  },
  
  // Incidents
  INCIDENTS: {
    BASE: `${API_BASE_URL}/incidents`,
    UPLOAD: (id) => `${API_BASE_URL}/incidents/${id}/upload`,
    UPDATE: (id) => `${API_BASE_URL}/incidents/${id}`,
    EXPORT_PDF: `${API_BASE_URL}/incidents/export/pdf`,
  },
  
  // Admin
  ADMIN: {
    PROMOTE: `${API_BASE_URL}/admin/promote`,
  },
  
  // Reports
  REPORTS: {
    MONTHLY: `${API_BASE_URL}/reports/monthly`,
  },
};

export default API_BASE_URL;
