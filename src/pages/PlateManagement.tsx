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
import { Plate } from '../types';
import plateService from '../services/plateService';
import BusinessService from '../services/businessService';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const PlateManagement: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [plates, setPlates] = useState<Plate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchPlates();
    }
  }, [user]);

  const fetchPlates = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get plates for the vendor's businesses
      if (user?.userType === 'VENDOR' && user.phoneNumber) {
        // Get vendor's businesses
        const businesses = await BusinessService.getBusinessesByVendorPhoneNumber(user.phoneNumber);
        
        // Fetch plates for each business
        const allPlates: Plate[] = [];
        for (const business of businesses) {
          try {
            const businessPlates = await plateService.getPlatesByBusinessId(business.businessId);
            allPlates.push(...businessPlates);
          } catch (err) {
            console.error(`Error fetching plates for business ${business.businessId}:`, err);
          }
        }
        
        setPlates(allPlates);
      } else {
        // For admins, show all plates
        const allPlates = await plateService.getAllPlates();
        setPlates(allPlates);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch plates');
      console.error('Error fetching plates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlate = () => {
    // Navigate to vendor dashboard where they can add plates
    navigate('/vendor-dashboard');
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
          Plate Management
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddPlate}>
          Add Plate
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {plates.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No plates yet
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Start by adding your first plate to showcase your catering dishes.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddPlate}
            sx={{ mt: 2 }}
          >
            Add First Plate
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Dish Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Dish Type</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Business ID</TableCell>
                <TableCell>Created</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {plates.map((plate) => (
                <TableRow key={plate.plateId}>
                  <TableCell>{plate.dishName}</TableCell>
                  <TableCell>
                    {plate.dishDescription ? (
                      plate.dishDescription.length > 50
                        ? `${plate.dishDescription.substring(0, 50)}...`
                        : plate.dishDescription
                    ) : '-'}
                  </TableCell>
                  <TableCell>₹{plate.price}</TableCell>
                  <TableCell>
                    <Chip
                      label={plate.dishType === 'veg' ? 'Veg' : 'Non-Veg'}
                      color={plate.dishType === 'veg' ? 'success' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{plate.quantity ?? '-'}</TableCell>
                  <TableCell>{plate.businessId}</TableCell>
                  <TableCell>
                    {plate.createdAt ? new Date(plate.createdAt).toLocaleDateString() : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default PlateManagement;

