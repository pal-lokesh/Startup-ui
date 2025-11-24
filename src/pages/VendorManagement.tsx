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
import { Vendor, Business } from '../types';
import VendorService from '../services/vendorService';
import BusinessService from '../services/businessService';

interface VendorWithCategory extends Vendor {
  categories?: string[];
}

const VendorManagement: React.FC = () => {
  const [vendors, setVendors] = useState<VendorWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const vendorsData = await VendorService.getAllVendors();
      
      // Fetch business categories for each vendor
      const vendorsWithCategories = await Promise.all(
        vendorsData.map(async (vendor) => {
          try {
            const businesses = await BusinessService.getBusinessesByVendorPhoneNumber(vendor.phoneNumber);
            const categories = businesses.map(b => b.businessCategory).filter(Boolean);
            return { ...vendor, categories };
          } catch (err) {
            console.error(`Error fetching businesses for vendor ${vendor.phoneNumber}:`, err);
            return { ...vendor, categories: [] };
          }
        })
      );
      
      setVendors(vendorsWithCategories);
    } catch (err) {
      setError('Failed to fetch vendors');
      console.error('Error fetching vendors:', err);
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
          Vendor Management
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />}>
          Add Vendor
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
              <TableCell>Business Name</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Verified</TableCell>
              <TableCell>Created</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {vendors.map((vendor) => (
              <TableRow key={vendor.vendorId}>
                <TableCell>{vendor.businessName}</TableCell>
                <TableCell>{vendor.phoneNumber}</TableCell>
                <TableCell>{vendor.businessEmail}</TableCell>
                <TableCell>
                  {vendor.categories && vendor.categories.length > 0 ? (
                    <Box display="flex" gap={0.5} flexWrap="wrap">
                      {vendor.categories.map((category, index) => (
                        <Chip
                          key={index}
                          label={category}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No category
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    label={vendor.isVerified ? 'Verified' : 'Pending'}
                    color={vendor.isVerified ? 'success' : 'warning'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {new Date(vendor.createdAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default VendorManagement;
