import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';

// Pages
import Dashboard from './pages/Dashboard';
import VendorDashboard from './pages/VendorDashboard';
import UserManagement from './pages/UserManagement';
import VendorManagement from './pages/VendorManagement';
import BusinessManagement from './pages/BusinessManagement';
import ThemeManagement from './pages/ThemeManagement';
import ImageManagement from './pages/ImageManagement';
import ExploreThemes from './pages/ExploreThemes';
import ClientExplore from './pages/ClientExploreNew';
import ClientDashboard from './pages/ClientDashboard';
import Unauthorized from './pages/Unauthorized';

// Components
import Navigation from './components/Navigation';
import Login from './components/Login';
import Signup from './components/Signup';
import ProtectedRoute from './components/ProtectedRoute';

// Context
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';

// Create Material-UI theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

// Main App Content Component
const AppContent: React.FC = () => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div>Loading...</div>
      </Box>
    );
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Navigation />
      <Box component="main" sx={{ flexGrow: 1, p: 3, marginTop: 8 }}>
        <Routes>
          <Route path="/" element={
            <Navigate to={
              user && user.userType === 'CLIENT' 
                ? '/explore' 
                : user && user.userType === 'VENDOR' 
                ? '/vendor-dashboard' 
                : user && user.role === 'ADMIN'
                ? '/dashboard'
                : '/explore'
            } replace />
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute requiredRole="ADMIN">
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/vendor-dashboard" element={
            <ProtectedRoute>
              <VendorDashboard />
            </ProtectedRoute>
          } />
          <Route path="/users" element={
            <ProtectedRoute requiredRole="ADMIN">
              <UserManagement />
            </ProtectedRoute>
          } />
          <Route path="/vendors" element={
            <ProtectedRoute requiredRole="ADMIN">
              <VendorManagement />
            </ProtectedRoute>
          } />
          <Route path="/businesses" element={
            <ProtectedRoute requiredRole="ADMIN">
              <BusinessManagement />
            </ProtectedRoute>
          } />
          <Route path="/themes" element={
            <ProtectedRoute requiredRole="ADMIN">
              <ThemeManagement />
            </ProtectedRoute>
          } />
          <Route path="/explore" element={
            <ProtectedRoute>
              <ClientExplore />
            </ProtectedRoute>
          } />
          <Route path="/client-dashboard" element={
            <ProtectedRoute>
              <ClientDashboard />
            </ProtectedRoute>
          } />
          <Route path="/images" element={
            <ProtectedRoute>
              <ImageManagement />
            </ProtectedRoute>
          } />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="*" element={
            <Navigate to={
              user && user.userType === 'CLIENT' 
                ? '/explore' 
                : user && user.userType === 'VENDOR' 
                ? '/vendor-dashboard' 
                : user && user.role === 'ADMIN'
                ? '/dashboard'
                : '/explore'
            } replace />
          } />
        </Routes>
      </Box>
    </Box>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <CartProvider>
          <Router>
            <AppContent />
          </Router>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
