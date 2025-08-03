import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Container,
  Paper,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const MFAVerification = () => {
  const navigate = useNavigate();
  const { verifyMFA, isLoading, mfaRequired } = useAuth();
  const [error, setError] = useState('');
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  // Redirect if MFA is not required
  React.useEffect(() => {
    if (!mfaRequired) {
      navigate('/login');
    }
  }, [mfaRequired, navigate]);

  const onSubmit = async (data) => {
    try {
      setError('');
      const result = await verifyMFA(data.code);
      
      if (result.success) {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Código MFA inválido');
    }
  };

  if (!mfaRequired) {
    return null;
  }
  

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
            <Typography component="h1" variant="h5" gutterBottom>
              Verificación de Doble Factor (MFA)
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Ingresa el código de 6 dígitos de tu aplicación de autenticación
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
              id="code"
              label="Código MFA"
              name="code"
              autoComplete="one-time-code"
              autoFocus
              inputProps={{
                maxLength: 6,
                pattern: '[0-9]*',
                inputMode: 'numeric',
              }}
              {...register('code', {
                required: 'El código MFA es requerido',
                pattern: {
                  value: /^\d{6}$/,
                  message: 'El código debe tener 6 dígitos',
                },
              })}
              error={!!errors.code}
              helperText={errors.code?.message}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={isLoading}
              startIcon={isLoading && <CircularProgress size={20} />}
            >
              {isLoading ? 'Verificando...' : 'Verificar'}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Button
                variant="text"
                onClick={() => navigate('/login')}
                disabled={isLoading}
              >
                Volver al inicio de sesión
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default MFAVerification;
