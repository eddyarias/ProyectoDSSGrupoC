import apiClient from '../utils/apiClient';
import { API_ENDPOINTS } from '../config/api';

/**
 * Resend verification email
 * @param {string} email
 */
export const resendVerificationEmail = async (email) => {
  const response = await apiClient.post(API_ENDPOINTS.EMAIL.RESEND, { email });
  return response.data;
};

/**
 * Check if email is verified
 * @param {string} email
 */
export const checkEmailVerified = async (email) => {
  const response = await apiClient.get(API_ENDPOINTS.EMAIL.STATUS + `?email=${encodeURIComponent(email)}`);
  return response.data;
};

/**
 * User signup
 * @param {Object} userData - User registration data
 * @returns {Promise} API response
 */
export const signup = async (userData) => {
  const response = await apiClient.post(API_ENDPOINTS.AUTH.SIGNUP, userData);
  return response.data;
};

/**
 * User login
 * @param {Object} credentials - Login credentials
 * @returns {Promise} API response
 */
export const login = async (credentials) => {
  const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
  return response.data;
};

/**
 * Verify MFA login
 * @param {Object} verificationData - MFA verification data
 * @returns {Promise} API response
 */
export const verifyLogin = async (verificationData) => {
  const response = await apiClient.post(API_ENDPOINTS.AUTH.VERIFY_LOGIN, verificationData);
  return response.data;
};

/**
 * User logout
 * @returns {Promise} API response
 */
export const logout = async () => {
  const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
  return response.data;
};

/**
 * Enroll in MFA
 * @returns {Promise} API response with QR code
 */
export const enrollMFA = async () => {
  const response = await apiClient.post(API_ENDPOINTS.MFA.ENROLL);
  return response.data;
};

/**
 * Verify MFA enrollment
 * @param {Object} verificationData - MFA verification data
 * @returns {Promise} API response
 */
export const verifyMFA = async (verificationData) => {
  const response = await apiClient.post(API_ENDPOINTS.MFA.VERIFY, verificationData);
  return response.data;
};

/**
 * Delete MFA factor (cancel setup)
 * @param {string} factorId
 * @returns {Promise} API response
 */
export const deleteMFA = async (factorId) => {
  const response = await apiClient.post(API_ENDPOINTS.MFA.DELETE, { factorId });
  return response.data;
};

/**
 * List MFA factors for the current user
 * @returns {Promise} API response with user's MFA factors
 */
export const listMFAFactors = async () => {
  const response = await apiClient.get(API_ENDPOINTS.MFA.FACTORS);
  return response.data;
};

/**
 * Promote user role (admin only)
 * @param {string} newRole - New role to assign
 * @returns {Promise} API response
 */
export const promoteUser = async (newRole) => {
  const response = await apiClient.post(API_ENDPOINTS.ADMIN.PROMOTE, { newRole });
  return response.data;
};

// Exportar objeto authService con todas las funciones agrupadas
export const authService = {
  signup,
  login,
  verifyLogin,
  logout,
  mfa: {
    enrollMFA,
    verifyMFA,
    deleteMFA,
    listMFAFactors,
  },
  admin: {
    promoteUser,
  },
};
