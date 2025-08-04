import apiClient from '../utils/apiClient';

export const getUsers = async () => {
  const response = await apiClient.get('/admin/users');
  return response.data;
};

// Cambiar rol de un usuario (Jefe de SOC)
export async function changeUserRole(userId, newRole) {
  const res = await apiClient.post(`/users/${userId}/change-role`, { newRole });
  return res.data;
}