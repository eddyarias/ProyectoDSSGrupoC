import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  CloudUpload as UploadIcon,
  GetApp as ExportIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getIncidents, updateIncident, uploadEvidence, exportIncidentsPDF } from '../services/incidentService';
import { formatDate } from '../utils/helpers';
import { INCIDENT_STATUS, INCIDENT_CRITICALITY, INCIDENT_CLASSIFICATION, USER_ROLES } from '../utils/constants';

const getCriticalityColor = (criticality) => {
  switch (criticality) {
    case INCIDENT_CRITICALITY.CRITICAL:
      return 'error';
    case INCIDENT_CRITICALITY.HIGH:
      return 'warning';
    case INCIDENT_CRITICALITY.MEDIUM:
      return 'info';
    case INCIDENT_CRITICALITY.LOW:
      return 'success';
    default:
      return 'default';
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case INCIDENT_STATUS.OPEN:
      return 'error';
    case INCIDENT_STATUS.IN_PROGRESS:
      return 'warning';
    case INCIDENT_STATUS.RESOLVED:
      return 'info';
    case INCIDENT_STATUS.CLOSED:
      return 'success';
    default:
      return 'default';
  }
};

const IncidentList = () => {
  const navigate = useNavigate();
  const { getUserRole } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editDialog, setEditDialog] = useState({ open: false, incident: null });
  const [uploadDialog, setUploadDialog] = useState({ open: false, incidentId: null });
  const [selectedFile, setSelectedFile] = useState(null);

  const userRole = getUserRole();
  const canUpdate = [USER_ROLES.ANALISTA, USER_ROLES.JEFE_SOC].includes(userRole);
  const canExport = [USER_ROLES.ANALISTA, USER_ROLES.JEFE_SOC, USER_ROLES.AUDITOR, USER_ROLES.GERENTE].includes(userRole);

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getIncidents();
      setIncidents(data);
    } catch (err) {
      setError('Error al cargar los incidentes');
      console.error('Error fetching incidents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (incident) => {
    setEditDialog({ open: true, incident });
  };

  const handleUpdate = async (updateData) => {
    try {
      await updateIncident(editDialog.incident.id, updateData);
      setEditDialog({ open: false, incident: null });
      fetchIncidents();
    } catch (err) {
      setError('Error al actualizar el incidente');
    }
  };

  const handleUpload = (incidentId) => {
    setUploadDialog({ open: true, incidentId });
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    try {
      await uploadEvidence(uploadDialog.incidentId, selectedFile);
      setUploadDialog({ open: false, incidentId: null });
      setSelectedFile(null);
      fetchIncidents();
    } catch (err) {
      setError('Error al subir el archivo');
    }
  };

  const handleExport = async () => {
    try {
      const blob = await exportIncidentsPDF();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'reporte_incidentes.pdf';
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Error al exportar los incidentes');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Gestión de Incidentes
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {canExport && (
            <Button
              variant="outlined"
              startIcon={<ExportIcon />}
              onClick={handleExport}
            >
              Exportar PDF
            </Button>
          )}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/incidents/create')}
          >
            Crear Incidente
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Título</TableCell>
                <TableCell>Activo Afectado</TableCell>
                <TableCell>Criticidad</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Fecha</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {incidents.map((incident) => (
                <TableRow key={incident.id}>
                  <TableCell>{incident.id}</TableCell>
                  <TableCell>{incident.title}</TableCell>
                  <TableCell>{incident.affected_asset}</TableCell>
                  <TableCell>
                    <Chip
                      label={incident.criticality || 'Sin criticidad'}
                      color={getCriticalityColor(incident.criticality)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={incident.status || 'Sin estado'}
                      color={getStatusColor(incident.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{formatDate(incident.created_at)}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="Ver detalles">
                        <IconButton 
                          size="small"
                          onClick={() => navigate(`/incidents/${incident.id}`)}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      {canUpdate && (
                        <Tooltip title="Editar">
                          <IconButton 
                            size="small"
                            onClick={() => handleEdit(incident)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Subir evidencia">
                        <IconButton 
                          size="small"
                          onClick={() => handleUpload(incident.id)}
                        >
                          <UploadIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Edit Dialog */}
      <Dialog 
        open={editDialog.open} 
        onClose={() => setEditDialog({ open: false, incident: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Editar Incidente</DialogTitle>
        <DialogContent>
          <EditIncidentForm
            incident={editDialog.incident}
            onUpdate={handleUpdate}
            onCancel={() => setEditDialog({ open: false, incident: null })}
          />
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog 
        open={uploadDialog.open} 
        onClose={() => setUploadDialog({ open: false, incidentId: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Subir Evidencia</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <input
              type="file"
              onChange={(e) => setSelectedFile(e.target.files[0])}
              style={{ marginBottom: 16 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialog({ open: false, incidentId: null })}>
            Cancelar
          </Button>
          <Button 
            onClick={handleFileUpload}
            variant="contained"
            disabled={!selectedFile}
          >
            Subir
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Edit form component
const EditIncidentForm = ({ incident, onUpdate, onCancel }) => {
  const [formData, setFormData] = useState({
    status: incident?.status || '',
    classification: incident?.classification || '',
    criticality: incident?.criticality || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(formData);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Estado</InputLabel>
        <Select
          value={formData.status}
          label="Estado"
          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
        >
          {Object.values(INCIDENT_STATUS).map((status) => (
            <MenuItem key={status} value={status}>
              {status}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Clasificación</InputLabel>
        <Select
          value={formData.classification}
          label="Clasificación"
          onChange={(e) => setFormData({ ...formData, classification: e.target.value })}
        >
          {Object.values(INCIDENT_CLASSIFICATION).map((classification) => (
            <MenuItem key={classification} value={classification}>
              {classification}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Criticidad</InputLabel>
        <Select
          value={formData.criticality}
          label="Criticidad"
          onChange={(e) => setFormData({ ...formData, criticality: e.target.value })}
        >
          {Object.values(INCIDENT_CRITICALITY).map((criticality) => (
            <MenuItem key={criticality} value={criticality}>
              {criticality}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
        <Button onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" variant="contained">
          Actualizar
        </Button>
      </Box>
    </Box>
  );
};

export default IncidentList;
