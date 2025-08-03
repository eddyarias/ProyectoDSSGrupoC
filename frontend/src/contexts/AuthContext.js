import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { toast } from 'react-toastify';
import * as authService from '../services/authService';
import { safeJsonParse } from '../utils/helpers';

// Initial state
const initialState = {
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: true,
  mfaRequired: false,
  mfaData: null,
};

// Auth reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        session: action.payload.session,
        isAuthenticated: true,
        isLoading: false,
        mfaRequired: false,
        mfaData: null,
      };
    
    case 'LOGIN_MFA_REQUIRED':
      return {
        ...state,
        mfaRequired: true,
        mfaData: action.payload,
        isLoading: false,
      };
    
    case 'LOGOUT':
      return {
        ...initialState,
        isLoading: false,
      };
    
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        isLoading: false,
      };
    
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state on app load
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const token = localStorage.getItem('authToken');
        const userSession = safeJsonParse(localStorage.getItem('userSession'));
        
        if (token && userSession) {
          const user = userSession.user;
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: { user, session: userSession },
          });
        } else {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (credentials) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await authService.login(credentials);
      
      if (response.mfa_required) {
        dispatch({
          type: 'LOGIN_MFA_REQUIRED',
          payload: {
            factorId: response.factorId,
            challengeId: response.challengeId,
          },
        });
        return { success: true, mfaRequired: true };
      } else {
        // Store auth data
        localStorage.setItem('authToken', response.session.access_token);
        localStorage.setItem('userSession', JSON.stringify(response.session));
        localStorage.setItem('userRole', response.session.user.user_metadata.role);
        
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            user: response.session.user,
            session: response.session,
          },
        });
        
        toast.success('Inicio de sesión exitoso');
        return { success: true, mfaRequired: false };
      }
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  // Verify MFA code
  const verifyMFA = async (code) => {
    try {
      const response = await authService.verifyLogin({
        factorId: state.mfaData.factorId,
        challengeId: state.mfaData.challengeId,
        code,
      });
      
      // Store auth data
      localStorage.setItem('authToken', response.session.access_token);
      localStorage.setItem('userSession', JSON.stringify(response.session));
      localStorage.setItem('userRole', response.session.user.user_metadata.role);
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: response.session.user,
          session: response.session,
        },
      });
      
      toast.success('Autenticación MFA exitosa');
      return { success: true };
    } catch (error) {
      throw error;
    }
  };

  // Signup function
  const signup = async (userData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await authService.signup(userData);
      
      dispatch({ type: 'SET_LOADING', payload: false });
      toast.success('Registro exitoso. Inicia sessión para continuar.');
      
      return { success: true, user: response.user };
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // Clear local storage
      localStorage.removeItem('authToken');
      localStorage.removeItem('userSession');
      localStorage.removeItem('userRole');
      
      dispatch({ type: 'LOGOUT' });
      toast.success('Sesión cerrada exitosamente');
    }
  };

  // Get user role
  const getUserRole = () => {
    return state.user?.user_metadata?.role || localStorage.getItem('userRole');
  };

  // Check if user has permission
  const hasPermission = (permission) => {
    //const userRole = getUserRole();
    // This would integrate with your ROLE_PERMISSIONS from constants
    return true; // Simplified for now
  };

  // Promote user role
  const promoteRole = async (newRole) => {
    const res = await import('../services/authService');
    await res.promoteUser(newRole);
    localStorage.setItem('userRole', newRole);
    dispatch({ type: 'SET_USER', payload: { ...state.user, user_metadata: { ...state.user.user_metadata, role: newRole } } });
  };

  const value = {
    ...state,
    login,
    signup,
    logout,
    verifyMFA,
    getUserRole,
    hasPermission,
    promoteRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext;
