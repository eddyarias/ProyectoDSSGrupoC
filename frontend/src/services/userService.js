import apiClient from '../utils/apiClient';

export const getUsers = async () => {
  const response = await apiClient.get('/admin/users');
  return response.data;
};
