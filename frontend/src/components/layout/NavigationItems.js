import React from 'react';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  ReportProblem as IncidentIcon,
  Add as AddIcon,
  Assessment as ReportsIcon,
  People as UsersIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { USER_ROLES } from '../../utils/constants';

const NavigationItems = ({ userRole }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navigationItems = [
    {
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/dashboard',
      roles: [USER_ROLES.USUARIO, USER_ROLES.ANALISTA, USER_ROLES.JEFE_SOC, USER_ROLES.AUDITOR, USER_ROLES.GERENTE],
    },
    {
      text: 'Incidentes',
      icon: <IncidentIcon />,
      path: '/incidents',
      roles: [USER_ROLES.USUARIO, USER_ROLES.ANALISTA, USER_ROLES.JEFE_SOC, USER_ROLES.AUDITOR, USER_ROLES.GERENTE],
    },
    {
      text: 'Crear Incidente',
      icon: <AddIcon />,
      path: '/incidents/create',
      roles: [USER_ROLES.USUARIO, USER_ROLES.ANALISTA, USER_ROLES.JEFE_SOC],
    },
    {
      text: 'Reportes',
      icon: <ReportsIcon />,
      path: '/reports',
      roles: [USER_ROLES.ANALISTA, USER_ROLES.JEFE_SOC, USER_ROLES.AUDITOR, USER_ROLES.GERENTE],
    },
    {
    text: 'Logs de Auditoría',
    icon: <HistoryIcon />,
    path: '/audit-logs',
    roles: [USER_ROLES.AUDITOR], // Solo visible para auditores
    },
    {
      text: 'Gestión de Usuarios',
      icon: <UsersIcon />,
      path: '/users',
      roles: [USER_ROLES.JEFE_SOC, USER_ROLES.GERENTE],
    },
    // ...
    
  ];

  // adminItems ya no es necesario, todo está en navigationItems

  const handleNavigation = (path) => {
    navigate(path);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const canAccessItem = (item) => {
    return item.roles.includes(userRole);
  };

  return (
    <>
      <List>
        {navigationItems
          .filter(canAccessItem)
          .map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={isActive(item.path)}
                onClick={() => handleNavigation(item.path)}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
      </List>

      {/* adminItems eliminado, todo está en navigationItems */}
    </>
  );
};

export default NavigationItems;
