import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Context
import { AuthProvider } from './contexts/AuthContext';

// Components
import ProtectedRoute from './components/common/ProtectedRoute';
import Layout from './components/layout/Layout';

// Pages
import LoginForm from './components/auth/LoginForm';
import SignupForm from './components/auth/SignupForm';
import MFAVerification from './components/auth/MFAVerification';
import Dashboard from './pages/Dashboard';
import IncidentList from './pages/IncidentList';
import CreateIncident from './pages/CreateIncident';
import MFASetup from './pages/MFASetup';
import ReportPage from './pages/ReportPage';
import UserManagementPage from './pages/UserManagementPage';

// Theme configuration
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
  },
});

// Unauthorized page component
const UnauthorizedPage = () => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      textAlign: 'center',
    }}
  >
    <h1>Acceso No Autorizado</h1>
    <p>No tienes permisos para acceder a esta página.</p>
  </Box>
);

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginForm />} />
            <Route path="/signup" element={<SignupForm />} />
            <Route path="/mfa-verify" element={<MFAVerification />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* Protected routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/incidents"
              element={
                <ProtectedRoute>
                  <Layout>
                    <IncidentList />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/incidents/create"
              element={
                <ProtectedRoute>
                  <Layout>
                    <CreateIncident />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/mfa-setup"
              element={
                <ProtectedRoute>
                  <Layout>
                    <MFASetup />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ReportPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute>
                  <Layout>
                    <UserManagementPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
        
        {/* Toast notifications */}
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
