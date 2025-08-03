import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  CircularProgress,
  Container,
  Paper,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import { isValidEmail, validatePassword } from '../../utils/helpers';
import { useNavigate, Link as RouterLink } from 'react-router-dom';

const SignupForm = () => {
  const navigate = useNavigate();
  const { signup, isLoading } = useAuth();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const password = watch('password');

  const onSubmit = async (data) => {
    try {
      setError('');
      setSuccess('');
      
      // Remove confirmPassword from data before sending
      const { confirmPassword, ...userData } = data;
      
      const result = await signup(userData);
      
      if (result.success) {
        setSuccess('Registro exitoso. Inicia sesión para continuar.');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrar usuario');
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography component="h1" variant="h4" gutterBottom>
              SDIS - Sistema de Gestión de Incidentes
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Crear Cuenta
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Correo Electrónico"
              name="email"
              autoComplete="email"
              autoFocus
              {...register('email', {
                required: 'El correo electrónico es requerido',
                validate: (value) =>
                  isValidEmail(value) || 'Formato de correo electrónico inválido',
              })}
              error={!!errors.email}
              helperText={errors.email?.message}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Contraseña"
              type="password"
              id="password"
              autoComplete="new-password"
              {...register('password', {
                required: 'La contraseña es requerida',
                validate: (value) => {
                  const validation = validatePassword(value);
                  return validation.isValid || validation.message;
                },
              })}
              error={!!errors.password}
              helperText={errors.password?.message}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirmar Contraseña"
              type="password"
              id="confirmPassword"
              autoComplete="new-password"
              {...register('confirmPassword', {
                required: 'La confirmación de contraseña es requerida',
                validate: (value) =>
                  value === password || 'Las contraseñas no coinciden',
              })}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={isLoading}
              startIcon={isLoading && <CircularProgress size={20} />}
            >
              {isLoading ? 'Registrando...' : 'Crear Cuenta'}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Link component={RouterLink} to="/login" variant="body2">
                ¿Ya tienes una cuenta? Inicia sesión
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default SignupForm;
