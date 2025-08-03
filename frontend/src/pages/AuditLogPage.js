// src/pages/AuditLogPage.js
import React, { useEffect, useState } from 'react';
import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Box,
  TextField,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import apiClient from '../utils/apiClient';

const AuditLogPage = () => {
  // Estados de datos y carga
  const [logs, setLogs]               = useState([]);
  const [loading, setLoading]         = useState(true);

  // Estados de filtros
  const [userFilter, setUserFilter]   = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [startDate, setStartDate]     = useState('');
  const [endDate, setEndDate]         = useState('');

  // Estados para el modal y detalle
  const [isModalOpen, setIsModalOpen]     = useState(false);
  const [selectedLog, setSelectedLog]     = useState(null);
  const [incidentDetail, setIncidentDetail] = useState(null);

  // Opciones de acción
  const actionOptions = [
    'CREATE_INCIDENT',
    'UPDATE_INCIDENT',
    'DELETE_INCIDENT',
    'LOGIN',
    'LOGOUT'
  ];

  // Carga inicial de logs
  useEffect(() => {
    apiClient.get('/logs')
      .then(resp => {
        setLogs(resp.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Aplicar filtros
  const filteredLogs = logs
    .filter(log => !userFilter
      || log.user.toLowerCase().includes(userFilter.toLowerCase())
    )
    .filter(log => !actionFilter || log.action === actionFilter)
    .filter(log => {
      if (!startDate) return true;
      return new Date(log.timestamp) >= new Date(startDate);
    })
    .filter(log => {
      if (!endDate) return true;
      const end = new Date(endDate);
      end.setDate(end.getDate() + 1);
      return new Date(log.timestamp) < end;
    });

  // Al hacer clic en una fila, abrimos modal y pedimos el incidente completo
  const handleRowClick = log => {
    setSelectedLog(log);
    setIsModalOpen(true);
    setIncidentDetail(null);

    apiClient.get(`/incidents/${log.details.incidentId}`)
      .then(r => setIncidentDetail(r.data))
      .catch(() => setIncidentDetail(null));
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedLog(null);
    setIncidentDetail(null);
  };

  // Descargar CSV o PDF del log seleccionado
  const handleDownload = async (format) => {
    try {
      const response = await apiClient.get(
        `/logs/${selectedLog.id}/export/${format}`,
        { responseType: 'blob' }
      );

      const blob = new Blob(
        [response.data],
        { type: format === 'pdf' ? 'application/pdf' : 'text/csv' }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `log_${selectedLog.id}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error descargando:', err);
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Historial de Eventos (Logs)
      </Typography>

      {loading ? (
        <CircularProgress />
      ) : (
        <>
          {/* Panel de filtros */}
          <Box display="flex" gap={2} mb={2} flexWrap="wrap">
            <TextField
              label="Usuario"
              size="small"
              value={userFilter}
              onChange={e => setUserFilter(e.target.value)}
            />
            <TextField
              label="Acción"
              select
              size="small"
              value={actionFilter}
              onChange={e => setActionFilter(e.target.value)}
            >
              <MenuItem value="">— Todas —</MenuItem>
              {actionOptions.map(a => (
                <MenuItem key={a} value={a}>{a}</MenuItem>
              ))}
            </TextField>
            <TextField
              label="Desde"
              type="date"
              size="small"
              InputLabelProps={{ shrink: true }}
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
            <TextField
              label="Hasta"
              type="date"
              size="small"
              InputLabelProps={{ shrink: true }}
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
            />
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                setUserFilter('');
                setActionFilter('');
                setStartDate('');
                setEndDate('');
              }}
            >
              Limpiar
            </Button>
          </Box>

          {/* Tabla de logs */}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Usuario</TableCell>
                  <TableCell>Acción</TableCell>
                  <TableCell>Fecha y Hora</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredLogs.map((log, idx) => (
                  <TableRow
                    key={idx}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => handleRowClick(log)}
                  >
                    <TableCell>{log.user}</TableCell>
                    <TableCell>{log.action}</TableCell>
                    <TableCell>
                      {new Date(log.timestamp).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Modal de detalle */}
          <Dialog
            open={isModalOpen}
            onClose={handleCloseModal}
            fullWidth
            maxWidth="sm"
          >
            <DialogTitle>Detalle del Log</DialogTitle>
            <DialogContent dividers>
              {selectedLog && (
                <>
                  <Typography gutterBottom>
                    <strong>Usuario:</strong> {selectedLog.user}
                  </Typography>
                  <Typography gutterBottom>
                    <strong>Acción:</strong> {selectedLog.action}
                  </Typography>
                  <Typography gutterBottom>
                    <strong>Fecha:</strong>{' '}
                    {new Date(selectedLog.timestamp).toLocaleString()}
                  </Typography>
                  <Typography gutterBottom>
                    <strong>ID de Incidente:</strong>{' '}
                    {selectedLog.details.incidentId}
                  </Typography>
                  <Typography gutterBottom>
                    <strong>Título:</strong>{' '}
                    {selectedLog.details.title}
                  </Typography>

                  {incidentDetail ? (
                    <>
                      <Typography gutterBottom>
                        <strong>Activo Afectado:</strong>{' '}
                        {incidentDetail.affected_asset}
                      </Typography>
                      <Typography gutterBottom>
                        <strong>Criticidad:</strong>{' '}
                        {incidentDetail.criticality}
                      </Typography>
                      <Typography gutterBottom>
                        <strong>Estado:</strong>{' '}
                        {incidentDetail.status}
                      </Typography>
                      <Typography gutterBottom>
                        <strong>Fuente:</strong>{' '}
                        {incidentDetail.source}
                      </Typography>
                      {incidentDetail.evidence_url && (
                        <Box mt={1}>
                          <a
                            href={incidentDetail.evidence_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Ver evidencia
                          </a>
                        </Box>
                      )}
                    </>
                  ) : (
                    <Box display="flex" justifyContent="center" mt={2}>
                      <CircularProgress size={24} />
                    </Box>
                  )}
                </>
              )}
            </DialogContent>

            <DialogActions>
              <Button
                variant="outlined"
                onClick={() => handleDownload('pdf')}
              >
                Exportar PDF
              </Button>
              <Button
                variant="outlined"
                onClick={() => handleDownload('csv')}
              >
                Exportar CSV
              </Button>
              <Button onClick={handleCloseModal}>Cerrar</Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </Paper>
  );
};

export default AuditLogPage;
