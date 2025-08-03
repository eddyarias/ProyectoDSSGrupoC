import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Container,
} from '@mui/material';
// Removed unused imports
import { useForm } from 'react-hook-form';
import { enrollMFA, verifyMFA } from '../services/authService';
import { useNavigate } from 'react-router-dom';

const steps = [
  'Configurar MFA',
  'Escanear Código QR',
  'Verificar Código',
];

const MFASetup = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [qrCode, setQrCode] = useState('');
  const [factorId, setFactorId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const handleEnrollMFA = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await enrollMFA();
      setQrCode(response.qr_code_svg);
      setFactorId(response.factorId);
      setActiveStep(1);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al configurar MFA');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setError('');
      
      await verifyMFA({
        factorId,
        code: data.code,
      });
      
      setSuccess('¡MFA configurado exitosamente!');
      setActiveStep(2);
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Código MFA inválido');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Configurar Autenticación de Doble Factor
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
              La autenticación de doble factor (MFA) añade una capa adicional de seguridad a tu cuenta.
              Necesitarás una aplicación de autenticación como Google Authenticator o Authy.
            </Typography>
            <Button
              variant="contained"
              onClick={handleEnrollMFA}
              disabled={loading}
              startIcon={loading && <CircularProgress size={20} />}
            >
              {loading ? 'Configurando...' : 'Iniciar Configuración'}
            </Button>
          </Box>
        );

      case 1:
        return (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Escanea el Código QR
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
              Abre tu aplicación de autenticación y escanea el siguiente código QR:
            </Typography>
            
            {qrCode && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                <div dangerouslySetInnerHTML={{ __html: qrCode }} />
              </Box>
            )}

            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              Una vez escaneado, tu aplicación generará códigos de 6 dígitos cada 30 segundos.
            </Typography>

            <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
              <TextField
                required
                fullWidth
                id="code"
                label="Código de Verificación (6 dígitos)"
                name="code"
                autoComplete="one-time-code"
                inputProps={{
                  maxLength: 6,
                  pattern: '[0-9]*',
                  inputMode: 'numeric',
                }}
                sx={{ mb: 2 }}
                {...register('code', {
                  required: 'El código es requerido',
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
                variant="contained"
                disabled={loading}
                startIcon={loading && <CircularProgress size={20} />}
              >
                {loading ? 'Verificando...' : 'Verificar Código'}
              </Button>
            </Box>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom color="success.main">
              ¡MFA Configurado Exitosamente!
            </Typography>
            <Typography variant="body1">
              Tu cuenta ahora está protegida con autenticación de doble factor.
              A partir de ahora, necesitarás ingresar un código de tu aplicación
              de autenticación cada vez que inicies sesión.
            </Typography>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Container component="main" maxWidth="md">
      <Box
        sx={{
          marginTop: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

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

          {renderStepContent()}

          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Button
              variant="text"
              onClick={() => navigate('/dashboard')}
              disabled={loading}
            >
              {activeStep === 2 ? 'Ir al Dashboard' : 'Configurar más tarde'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default MFASetup;
