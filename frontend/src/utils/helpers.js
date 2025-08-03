import { DATE_FORMAT_OPTIONS } from './constants';

/**
 * Format date to readable string
 * @param {string|Date} date - Date to format
 * @param {string} format - Format type ('short' or 'long')
 * @returns {string} Formatted date string
 */
export const formatDate = (date, format = 'short') => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return '';
  
  return dateObj.toLocaleDateString('es-ES', DATE_FORMAT_OPTIONS[format]);
};

/**
 * Get relative time string (e.g., "hace 2 horas")
 * @param {string|Date} date - Date to compare
 * @returns {string} Relative time string
 */
export const getRelativeTime = (date) => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now - dateObj) / 1000);
  
  if (diffInSeconds < 60) return 'hace unos segundos';
  if (diffInSeconds < 3600) return `hace ${Math.floor(diffInSeconds / 60)} minutos`;
  if (diffInSeconds < 86400) return `hace ${Math.floor(diffInSeconds / 3600)} horas`;
  if (diffInSeconds < 2592000) return `hace ${Math.floor(diffInSeconds / 86400)} días`;
  
  return formatDate(dateObj);
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} Validation result with isValid and message
 */
export const validatePassword = (password) => {
  if (!password) {
    return { isValid: false, message: 'La contraseña es requerida' };
  }
  
  if (password.length < 8) {
    return { isValid: false, message: 'La contraseña debe tener al menos 8 caracteres' };
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    return { isValid: false, message: 'La contraseña debe contener al menos una letra minúscula' };
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    return { isValid: false, message: 'La contraseña debe contener al menos una letra mayúscula' };
  }
  
  if (!/(?=.*\d)/.test(password)) {
    return { isValid: false, message: 'La contraseña debe contener al menos un número' };
  }
  
  return { isValid: true, message: 'Contraseña válida' };
};

/**
 * Format file size to readable string
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Debounce function to limit function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Generate a random ID
 * @returns {string} Random ID
 */
export const generateId = () => {
  return Math.random().toString(36).substr(2, 9);
};

/**
 * Capitalize first letter of each word
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
export const capitalizeWords = (str) => {
  if (!str) return '';
  return str.replace(/\b\w/g, (l) => l.toUpperCase());
};

/**
 * Safe JSON parse
 * @param {string} jsonString - JSON string to parse
 * @param {*} defaultValue - Default value if parsing fails
 * @returns {*} Parsed JSON or default value
 */
export const safeJsonParse = (jsonString, defaultValue = null) => {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    return defaultValue;
  }
};
