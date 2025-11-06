import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';

// Import responsive theme and styles
import createResponsiveTheme from './theme/responsiveTheme';
import './styles/responsive.css';

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
import ClientChat from './pages/ClientChat';
import VendorChat from './pages/VendorChat';
import ClientRatings from './pages/ClientRatings';
import Unauthorized from './pages/Unauthorized';
import SuperAdminDashboard from './pages/SuperAdminDashboard';

// Components
import Navigation from './components/Navigation';
import Login from './components/Login';
import Signup from './components/Signup';
import ProtectedRoute from './components/ProtectedRoute';

// Context
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';

// Create responsive Material-UI theme
const theme = createResponsiveTheme();

// Main App Content Component
const AppContent: React.FC = () => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        fontSize: 'clamp(1rem, 2vw, 1.5rem)',
        padding: 'clamp(1rem, 2vw, 2rem)'
      }}>
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
    <Box sx={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
      <Navigation />
      <Box component="main" sx={{ 
        flexGrow: 1, 
        padding: { 
          xs: 'clamp(0.5rem, 2vw, 1rem)', 
          sm: 'clamp(1rem, 2vw, 1.5rem)', 
          md: 'clamp(1.5rem, 3vw, 2rem)' 
        },
        marginTop: { 
          xs: 'clamp(56px, 8vh, 64px)', 
          sm: 'clamp(64px, 8vh, 72px)' 
        },
        width: '100%',
        maxWidth: '100vw',
        overflowX: 'hidden'
      }}>
        <Routes>
          <Route path="/" element={
            <Navigate to={
              user && user.role === 'SUPER_ADMIN'
                ? '/super-admin-dashboard'
                : user && user.userType === 'CLIENT' 
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
          <Route path="/super-admin-dashboard" element={
            <ProtectedRoute requiredRole="SUPER_ADMIN">
              <SuperAdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/vendor-dashboard" element={
            <ProtectedRoute requiredUserType="VENDOR">
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
          <Route path="/client-chat" element={
            <ProtectedRoute>
              <ClientChat />
            </ProtectedRoute>
          } />
          <Route path="/client-ratings" element={
            <ProtectedRoute>
              <ClientRatings />
            </ProtectedRoute>
          } />
          <Route path="/vendor-chat" element={
            <ProtectedRoute>
              <VendorChat />
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
              user && user.role === 'SUPER_ADMIN'
                ? '/super-admin-dashboard'
                : user && user.userType === 'CLIENT' 
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
