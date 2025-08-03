import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  ReportProblem as IncidentIcon,
  TrendingUp as TrendingUpIcon,
  Security as SecurityIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { getIncidents } from '../services/incidentService';
import { getMonthlyReport } from '../services/reportService';
import { formatDate, getRelativeTime } from '../utils/helpers';
import { INCIDENT_CRITICALITY, USER_ROLES } from '../utils/constants';

const StatCard = ({ title, value, icon, color = 'primary' }) => (
  <Card>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Avatar sx={{ bgcolor: `${color}.main`, mr: 2 }}>
          {icon}
        </Avatar>
        <Box>
          <Typography color="textSecondary" gutterBottom variant="body2">
            {title}
          </Typography>
          <Typography variant="h4">
            {value}
          </Typography>
        </Box>
      </Box>
    </CardContent>
  </Card>
);

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

const Dashboard = () => {
  const { getUserRole } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const userRole = getUserRole();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        // Fetch incidents
        const incidentsData = await getIncidents();
        setIncidents(incidentsData);

        // Fetch reports if user has permission
        if ([USER_ROLES.ANALISTA, USER_ROLES.JEFE_SOC, USER_ROLES.AUDITOR, USER_ROLES.GERENTE].includes(userRole)) {
          try {
            const reportResponse = await getMonthlyReport();
            setReportData(reportResponse);
          } catch (reportError) {
            console.log('User does not have access to reports');
          }
        }
      } catch (err) {
        setError('Error al cargar los datos del dashboard');
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userRole]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const recentIncidents = incidents
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  const openIncidents = incidents.filter(inc => inc.status !== 'Cerrado').length;
  const criticalIncidents = incidents.filter(inc => 
    inc.criticality === INCIDENT_CRITICALITY.CRITICAL || 
    inc.criticality === INCIDENT_CRITICALITY.HIGH
  ).length;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total de Incidentes"
            value={incidents.length}
            icon={<AssignmentIcon />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Incidentes Abiertos"
            value={openIncidents}
            icon={<IncidentIcon />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Incidentes Críticos"
            value={criticalIncidents}
            icon={<SecurityIcon />}
            color="error"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Este Mes"
            value={reportData?.totalIncidents || 0}
            icon={<TrendingUpIcon />}
            color="info"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Incidents */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Incidentes Recientes
            </Typography>
            {recentIncidents.length === 0 ? (
              <Typography color="textSecondary">
                No hay incidentes recientes
              </Typography>
            ) : (
              <List>
                {recentIncidents.map((incident) => (
                  <ListItem key={incident.id} divider>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1">
                            {incident.title}
                          </Typography>
                          <Chip
                            label={incident.criticality || 'Sin criticidad'}
                            color={getCriticalityColor(incident.criticality)}
                            size="small"
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            {incident.affected_asset} • {getRelativeTime(incident.created_at)}
                          </Typography>
                          <Typography variant="body2">
                            Estado: {incident.status || 'Sin estado'}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Monthly Report Summary */}
        {reportData && (
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Resumen Mensual
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Período: {formatDate(reportData.period.start)} - {formatDate(reportData.period.end)}
                </Typography>
              </Box>
              
              <Typography variant="subtitle2" gutterBottom>
                Por Estado:
              </Typography>
              {Object.entries(reportData.breakdownByStatus || {}).map(([status, count]) => (
                <Box key={status} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">{status}:</Typography>
                  <Typography variant="body2" fontWeight="bold">{count}</Typography>
                </Box>
              ))}

              <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                Por Criticidad:
              </Typography>
              {Object.entries(reportData.breakdownByCriticality || {}).map(([criticality, count]) => (
                <Box key={criticality} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">{criticality}:</Typography>
                  <Typography variant="body2" fontWeight="bold">{count}</Typography>
                </Box>
              ))}
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default Dashboard;
