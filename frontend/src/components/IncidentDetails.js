import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from '@mui/material';

const IncidentDetails = ({ incident, onClose, onEdit, canEdit, show }) => {
  if (!incident) return null;

  const handleDownloadEvidence = (url) => {
    window.open(url, '_blank');
  };

  return (
    <Dialog open={show} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Detalles del Incidente</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1"><strong>ID:</strong> {incident.id}</Typography>
          <Typography variant="subtitle1"><strong>Título:</strong> {incident.title}</Typography>
          <Typography variant="body1"><strong>Descripción:</strong> {incident.description}</Typography>
          <Typography variant="body2"><strong>Fuente:</strong> {incident.source}</Typography>
          <Typography variant="body2"><strong>Activo afectado:</strong> {incident.affected_asset}</Typography>
          <Typography variant="body2"><strong>Criticidad:</strong> {incident.criticality}</Typography>
          <Typography variant="body2"><strong>Estado:</strong> {incident.status}</Typography>
          <Typography variant="body2"><strong>Clasificación:</strong> {incident.classification}</Typography>
          {incident.resolution && (
            <Typography variant="body2" sx={{ mt: 2 }}><strong>Resolución:</strong> {incident.resolution}</Typography>
          )}
          {incident.evidence_url && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2"><strong>Evidencia:</strong></Typography>
              {/* Mostrar nombre y extensión del archivo */}
              <Typography variant="body2" sx={{ mb: 1 }}>
                {(() => {
                  try {
                    const urlParts = incident.evidence_url.split('/');
                    const fileName = urlParts[urlParts.length - 1];
                    return fileName;
                  } catch {
                    return 'Archivo';
                  }
                })()}
              </Typography>
              <Button variant="outlined" onClick={() => handleDownloadEvidence(incident.evidence_url)}>
                Descargar archivo
              </Button>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        {canEdit && (
          <Button variant="contained" onClick={onEdit}>Editar</Button>
        )}
        <Button variant="outlined" onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
};

export default IncidentDetails;
