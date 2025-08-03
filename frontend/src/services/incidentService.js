import apiClient from '../utils/apiClient';
import { API_ENDPOINTS } from '../config/api';

/**
 * Get all incidents (filtered by user role)
 * @returns {Promise} API response with incidents
 */
export const getIncidents = async () => {
  const response = await apiClient.get(API_ENDPOINTS.INCIDENTS.BASE);
  return response.data;
};

/**
 * Create a new incident
 * @param {Object} incidentData - Incident data
 * @returns {Promise} API response
 */
export const createIncident = async (incidentData) => {
  const response = await apiClient.post(API_ENDPOINTS.INCIDENTS.BASE, incidentData);
  return response.data;
};

/**
 * Update an incident
 * @param {string} id - Incident ID
 * @param {Object} updateData - Data to update
 * @returns {Promise} API response
 */
export const updateIncident = async (id, updateData) => {
  const response = await apiClient.patch(API_ENDPOINTS.INCIDENTS.UPDATE(id), updateData);
  return response.data;
};

/**
 * Upload evidence file for an incident
 * @param {string} id - Incident ID
 * @param {File} file - Evidence file
 * @returns {Promise} API response
 */
export const uploadEvidence = async (id, file) => {
  const formData = new FormData();
  formData.append('evidenceFile', file);
  
  const response = await apiClient.post(
    API_ENDPOINTS.INCIDENTS.UPLOAD(id),
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
};

/**
 * Export incidents to PDF
 * @returns {Promise} Blob response
 */
export const exportIncidentsPDF = async () => {
  const response = await apiClient.get(API_ENDPOINTS.INCIDENTS.EXPORT_PDF, {
    responseType: 'blob',
  });
  return response.data;
};
