import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { Theme } from '../types';
import ThemeService from '../services/themeService';

const ThemeManagement: React.FC = () => {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchThemes();
  }, []);

  const fetchThemes = async () => {
    try {
      setLoading(true);
      const data = await ThemeService.getAllThemes();
      setThemes(data);
    } catch (err) {
      setError('Failed to fetch themes');
      console.error('Error fetching themes:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Theme Management
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />}>
          Add Theme
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Theme Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Price Range</TableCell>
              <TableCell>Business ID</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {themes.map((theme) => (
              <TableRow key={theme.themeId}>
                <TableCell>{theme.themeName}</TableCell>
                <TableCell>{theme.themeCategory}</TableCell>
                <TableCell>{theme.priceRange}</TableCell>
                <TableCell>{theme.businessId}</TableCell>
                <TableCell>
                  <Chip
                    label={theme.isActive ? 'Active' : 'Inactive'}
                    color={theme.isActive ? 'success' : 'error'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {new Date(theme.createdAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ThemeManagement;
