import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';
import { getMonthlyReport } from '../services/reportService';

const ReportPage = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await getMonthlyReport();
        setReport(data);
      } catch (err) {
        setError('Error al cargar el reporte');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, []);

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!report) return null;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Reportes Mensuales</Typography>
      
      {/* Estadísticas generales */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Resumen del Mes</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
          <Box>
            <Typography variant="h4" color="primary">{report.totalIncidents}</Typography>
            <Typography variant="body2">Total de Incidentes</Typography>
          </Box>
          <Box>
            <Typography variant="h4" color="success.main">{report.resolvedIncidents}</Typography>
            <Typography variant="body2">Resueltos</Typography>
          </Box>
          <Box>
            <Typography variant="h4" color="warning.main">{report.pendingIncidents}</Typography>
            <Typography variant="body2">Pendientes</Typography>
          </Box>
        </Box>
      </Paper>

      {/* Distribución por criticidad */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Distribución por Criticidad</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 2 }}>
          {Object.entries(report.breakdownByCriticality).map(([criticality, count]) => (
            <Box key={criticality} sx={{ textAlign: 'center', p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
              <Typography variant="h5" color="primary">{count}</Typography>
              <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>{criticality}</Typography>
            </Box>
          ))}
        </Box>
      </Paper>

      {/* Distribución por estado */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Distribución por Estado</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 2 }}>
          {Object.entries(report.breakdownByStatus).map(([status, count]) => (
            <Box key={status} sx={{ textAlign: 'center', p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
              <Typography variant="h5" color="secondary">{count}</Typography>
              <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>{status}</Typography>
            </Box>
          ))}
        </Box>
      </Paper>
    </Box>
  );
};

export default ReportPage;
