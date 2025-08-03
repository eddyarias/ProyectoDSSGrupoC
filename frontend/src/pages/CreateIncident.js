import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  MenuItem,
  Alert,
  CircularProgress,
  Grid,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { createIncident } from '../services/incidentService';
import { INCIDENT_CRITICALITY, INCIDENT_CLASSIFICATION } from '../utils/constants';

const CreateIncident = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // Format the date for the backend
      const incidentData = {
        ...data,
        detected_at: data.detected_at || new Date().toISOString(),
      };

      await createIncident(incidentData);
      setSuccess('Incidente creado exitosamente. Redirigiendo...');
      reset();
      
      setTimeout(() => {
        navigate('/incidents');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear el incidente');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/incidents');
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom align="center">
        Crear Nuevo Incidente
      </Typography>

      <Paper sx={{ p: 3, maxWidth: 900, margin: 'auto', mt: 4 }}>
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
          <Grid container spacing={2} direction="column">
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                id="title"
                label="Título del Incidente"
                name="title"
                {...register('title', {
                  required: 'El título es requerido',
                  minLength: {
                    value: 5,
                    message: 'El título debe tener al menos 5 caracteres',
                  },
                })}
                error={!!errors.title}
                helperText={errors.title?.message}
                sx={{ mb: 2 }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                multiline
                rows={4}
                id="description"
                label="Descripción"
                name="description"
                {...register('description', {
                  required: 'La descripción es requerida',
                  minLength: {
                    value: 10,
                    message: 'La descripción debe tener al menos 10 caracteres',
                  },
                })}
                error={!!errors.description}
                helperText={errors.description?.message}
                sx={{ mb: 2 }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                id="affected_asset"
                label="Activo Afectado"
                name="affected_asset"
                placeholder="ej: Servidor Web, Base de Datos, Red Corporativa"
                {...register('affected_asset', {
                  required: 'El activo afectado es requerido',
                })}
                error={!!errors.affected_asset}
                helperText={errors.affected_asset?.message}
                sx={{ mb: 2 }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                id="source"
                label="Fuente del Incidente"
                name="source"
                placeholder="ej: SIEM, Usuario, Monitoreo Automático"
                {...register('source')}
                sx={{ mb: 2 }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                select
                required
                fullWidth
                id="criticality"
                label="Criticidad"
                name="criticality"
                defaultValue=""
                {...register('criticality', {
                  required: 'La criticidad es requerida',
                })}
                error={!!errors.criticality}
                helperText={errors.criticality?.message}
                sx={{ mb: 2 }}
              >
                {Object.values(INCIDENT_CRITICALITY).map((criticality) => (
                  <MenuItem key={criticality} value={criticality}>
                    {criticality}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <TextField
                select
                required
                fullWidth
                id="classification"
                label="Clasificación"
                name="classification"
                defaultValue=""
                {...register('classification', {
                  required: 'La clasificación es requerida',
                })}
                error={!!errors.classification}
                helperText={errors.classification?.message}
                sx={{ mb: 2 }}
              >
                {Object.values(INCIDENT_CLASSIFICATION).map((classification) => (
                  <MenuItem key={classification} value={classification}>
                    {classification}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <TextField
                type="datetime-local"
                fullWidth
                id="detected_at"
                label="Fecha y Hora de Detección"
                name="detected_at"
                InputLabelProps={{
                  shrink: true,
                }}
                defaultValue={new Date().toISOString().slice(0, 16)}
                {...register('detected_at')}
                sx={{ mb: 2 }}
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
                <Button
                  variant="outlined"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  startIcon={loading && <CircularProgress size={20} />}
                >
                  {loading ? 'Creando...' : 'Crear Incidente'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
};

export default CreateIncident;
