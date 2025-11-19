import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CircularProgress, Box } from '@mui/material';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  requiredUserType?: 'VENDOR' | 'CLIENT';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole, requiredUserType }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access if required
  // If both requiredRole and requiredUserType are provided, allow access if EITHER condition is met (OR logic)
  if (requiredRole && requiredUserType) {
    const hasRequiredRole = user?.role === requiredRole;
    const hasRequiredUserType = user?.userType === requiredUserType;
    if (!hasRequiredRole && !hasRequiredUserType) {
      return <Navigate to="/unauthorized" replace />;
    }
  } else {
    // If only one is provided, use AND logic (must match)
    if (requiredRole && user?.role !== requiredRole) {
      return <Navigate to="/unauthorized" replace />;
    }
    if (requiredUserType && user?.userType !== requiredUserType) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
