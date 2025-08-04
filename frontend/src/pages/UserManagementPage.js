import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  Button,
} from '@mui/material';
import { getUsers, changeUserRole } from '../services/userService';
import { toast } from 'react-toastify'; // ✅ agregado

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editedRoles, setEditedRoles] = useState({}); // Cambios temporales de roles

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await getUsers();
        setUsers(data);
      } catch (err) {
        setError('Error al cargar los usuarios');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleRoleChange = (userId, newRole) => {
    setEditedRoles({
      ...editedRoles,
      [userId]: newRole,
    });
  };

  const handleSave = async (userId) => {
    const newRole = editedRoles[userId];
    if (!newRole) return;

    try {
      await changeUserRole(userId, newRole);

      // Refrescar usuarios después de actualizar
      const updatedUsers = await getUsers();
      setUsers(updatedUsers);

      // Limpiar el cambio guardado
      setEditedRoles((prev) => {
        const copy = { ...prev };
        delete copy[userId];
        return copy;
      });

      toast.success(`Rol actualizado a ${newRole}`); // ✅ Notificación de éxito
    } catch (err) {
      toast.error('Error al actualizar el rol'); // ✅ Notificación de error
    }
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Gestión de Usuarios
      </Typography>
      <Paper sx={{ p: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Rol</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.id}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Select
                      value={editedRoles[user.id] || user.user_metadata?.role || 'Usuario'}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      size="small"
                      sx={{ minWidth: 180 }}
                    >
                      <MenuItem value="Usuario">Usuario</MenuItem>
                      <MenuItem value="Analista de Seguridad">Analista de Seguridad</MenuItem>
                      <MenuItem value="Auditor">Auditor</MenuItem>
                      <MenuItem value="Jefe de SOC">Jefe de SOC</MenuItem>
                      <MenuItem value="Gerente de Riesgos">Gerente de Riesgos</MenuItem>
                    </Select>
                  </TableCell>
                  <TableCell>{user.confirmed_at ? 'Activo' : 'Pendiente'}</TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => handleSave(user.id)}
                      disabled={!editedRoles[user.id]} // Deshabilitado si no hay cambios
                    >
                      Guardar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default UserManagementPage;
