import apiClient from '../utils/apiClient';
import { API_ENDPOINTS } from '../config/api';

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
 * Promote user role (admin only)
 * @param {string} newRole - New role to assign
 * @returns {Promise} API response
 */
export const promoteUser = async (newRole) => {
  const response = await apiClient.post(API_ENDPOINTS.ADMIN.PROMOTE, { newRole });
  return response.data;
};
