import React from 'react';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  ReportProblem as IncidentIcon,
  Add as AddIcon,
  Assessment as ReportsIcon,
  People as UsersIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { hasPermission, USER_ROLES } from '../../utils/constants';

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
  ];

  const adminItems = [
    {
      text: 'Reportes',
      icon: <ReportsIcon />,
      path: '/reports',
      roles: [USER_ROLES.ANALISTA, USER_ROLES.JEFE_SOC, USER_ROLES.AUDITOR, USER_ROLES.GERENTE],
    },
    {
      text: 'Gestión de Usuarios',
      icon: <UsersIcon />,
      path: '/users',
      roles: [USER_ROLES.JEFE_SOC, USER_ROLES.GERENTE],
    },
    {
      text: 'Configuración',
      icon: <SettingsIcon />,
      path: '/settings',
      roles: [USER_ROLES.JEFE_SOC, USER_ROLES.GERENTE],
    },
  ];

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

      {adminItems.some(canAccessItem) && (
        <>
          <Divider />
          <List>
            {adminItems
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
        </>
      )}
    </>
  );
};

export default NavigationItems;
