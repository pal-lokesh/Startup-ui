import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  People as PeopleIcon,
  Business as BusinessIcon,
  Store as StoreIcon,
  Palette as PaletteIcon,
  Image as ImageIcon,
} from '@mui/icons-material';
import UserService from '../services/userService';
import VendorService from '../services/vendorService';
import BusinessService from '../services/businessService';
import ThemeService from '../services/themeService';
import ImageService from '../services/imageService';
import { useAuth } from '../contexts/AuthContext';

interface DashboardStats {
  users: number;
  vendors: number;
  businesses: number;
  themes: number;
  images: number;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    users: 0,
    vendors: 0,
    businesses: 0,
    themes: 0,
    images: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        
        // Only fetch user and vendor counts for admins
        const isAdmin = user?.role === 'ADMIN';
        const promises = [
          BusinessService.getBusinessCount(),
          ThemeService.getThemeCount(),
          ImageService.getImageCount(),
        ];
        
        if (isAdmin) {
          promises.unshift(UserService.getUserCount());
          promises.splice(1, 0, VendorService.getVendorCount());
        }
        
        const results = await Promise.all(promises);
        
        const statsData = {
          users: isAdmin ? results[0] : 0,
          vendors: isAdmin ? results[1] : 0,
          businesses: isAdmin ? results[2] : results[0],
          themes: isAdmin ? results[3] : results[1],
          images: isAdmin ? results[4] : results[2],
        };

        setStats(statsData);
      } catch (err) {
        setError('Failed to fetch dashboard statistics');
        console.error('Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user?.role]);

  const isAdmin = user?.role === 'ADMIN';
  
  const statCards = [
    // Only show Total Users for admins
    ...(isAdmin ? [{
      title: 'Total Users',
      value: stats.users,
      icon: <PeopleIcon sx={{ fontSize: 40 }} />,
      color: '#1976d2',
    }] : []),
    // Only show Vendors count for admins
    ...(isAdmin ? [{
      title: 'Vendors',
      value: stats.vendors,
      icon: <BusinessIcon sx={{ fontSize: 40 }} />,
      color: '#2e7d32',
    }] : []),
    {
      title: 'Businesses',
      value: stats.businesses,
      icon: <StoreIcon sx={{ fontSize: 40 }} />,
      color: '#ed6c02',
    },
    {
      title: 'Themes',
      value: stats.themes,
      icon: <PaletteIcon sx={{ fontSize: 40 }} />,
      color: '#9c27b0',
    },
    {
      title: 'Images',
      value: stats.images,
      icon: <ImageIcon sx={{ fontSize: 40 }} />,
      color: '#d32f2f',
    },
  ];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Overview of your Record Service Management System
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={4} lg={2.4} key={index}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                <Box
                  sx={{
                    color: card.color,
                    mb: 2,
                    display: 'flex',
                    justifyContent: 'center',
                  }}
                >
                  {card.icon}
                </Box>
                <Typography variant="h4" component="div" gutterBottom>
                  {card.value}
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  {card.title}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          System Overview
        </Typography>
        <Typography variant="body1" color="text.secondary">
          This system manages users (vendors and clients) with their associated business profiles,
          themes, and images. Use the navigation menu to explore different sections of the system.
        </Typography>
      </Box>
    </Box>
  );
};

export default Dashboard;
