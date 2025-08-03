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
import { isValidEmail } from '../../utils/helpers';
import { useNavigate, Link as RouterLink } from 'react-router-dom';

const LoginForm = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const [error, setError] = useState('');
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    try {
      setError('');
      const result = await login(data);
      
      if (result.success && !result.mfaRequired) {
        navigate('/dashboard');
      } else if (result.mfaRequired) {
        navigate('/mfa-verify');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
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
              Iniciar Sesión
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
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
              autoComplete="current-password"
              {...register('password', {
                required: 'La contraseña es requerida',
                minLength: {
                  value: 8,
                  message: 'La contraseña debe tener al menos 8 caracteres',
                },
              })}
              error={!!errors.password}
              helperText={errors.password?.message}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={isLoading}
              startIcon={isLoading && <CircularProgress size={20} />}
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Link component={RouterLink} to="/signup" variant="body2">
                ¿No tienes una cuenta? Regístrate
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default LoginForm;
