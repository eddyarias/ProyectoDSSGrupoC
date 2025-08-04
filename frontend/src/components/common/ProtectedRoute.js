import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { CircularProgress, Box } from '@mui/material';
import { hasPermission } from '../../utils/constants';

const ProtectedRoute = ({ children, requiredRole = null, requiredPermission = null }) => {
  const { isAuthenticated, isLoading, getUserRole } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const userRole = getUserRole();

  // Check permission-based access if required
  if (requiredPermission) {
    if (!hasPermission(userRole, requiredPermission)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Check role-based access if required (mantener compatibilidad)
  if (requiredRole) {
    const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    
    if (!allowedRoles.includes(userRole)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
