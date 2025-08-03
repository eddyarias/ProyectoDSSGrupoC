import apiClient from '../utils/apiClient';
import { API_ENDPOINTS } from '../config/api';

/**
 * Get monthly report
 * @returns {Promise} API response with report data
 */
export const getMonthlyReport = async () => {
  const response = await apiClient.get(API_ENDPOINTS.REPORTS.MONTHLY);
  return response.data;
};
