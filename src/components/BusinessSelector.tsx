import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Business as BusinessIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { Business } from '../types';
import BusinessService from '../services/businessService';
import BusinessManagementForm from './BusinessManagementForm';

interface BusinessSelectorProps {
  userPhoneNumber: string;
  selectedBusiness: Business | null;
  onBusinessSelect: (business: Business) => void;
  onBusinessesChange: (businesses: Business[]) => void;
}

const BusinessSelector: React.FC<BusinessSelectorProps> = ({
  userPhoneNumber,
  selectedBusiness,
  onBusinessSelect,
  onBusinessesChange,
}) => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [businessFormOpen, setBusinessFormOpen] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedBusinessForMenu, setSelectedBusinessForMenu] = useState<Business | null>(null);

  useEffect(() => {
    fetchBusinesses();
  }, [userPhoneNumber]);

  const fetchBusinesses = async () => {
    try {
      setLoading(true);
      setError(null);
      const businessesData = await BusinessService.getBusinessesByVendorPhoneNumber(userPhoneNumber);
      setBusinesses(businessesData);
      onBusinessesChange(businessesData);
      
      // Auto-select first business if none selected
      if (businessesData.length > 0 && !selectedBusiness) {
        onBusinessSelect(businessesData[0]);
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        // No businesses found - this is normal for new vendors
        setBusinesses([]);
        onBusinessesChange([]);
      } else {
        setError('Failed to fetch businesses');
        console.error('Error fetching businesses:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddBusiness = () => {
    setEditingBusiness(null);
    setBusinessFormOpen(true);
  };

  const handleEditBusiness = (business: Business) => {
    setEditingBusiness(business);
    setBusinessFormOpen(true);
    setAnchorEl(null);
  };

  const handleDeleteBusiness = (business: Business) => {
    // TODO: Implement delete confirmation dialog
    console.log('Delete business:', business);
    setAnchorEl(null);
  };

  const handleBusinessSuccess = (updatedBusiness: Business) => {
    if (editingBusiness) {
      // Update existing business
      const updatedBusinesses = businesses.map(business =>
        business.businessId === updatedBusiness.businessId ? updatedBusiness : business
      );
      setBusinesses(updatedBusinesses);
      onBusinessesChange(updatedBusinesses);
      
      // Update selected business if it was the one being edited
      if (selectedBusiness?.businessId === updatedBusiness.businessId) {
        onBusinessSelect(updatedBusiness);
      }
    } else {
      // Add new business
      const updatedBusinesses = [...businesses, updatedBusiness];
      setBusinesses(updatedBusinesses);
      onBusinessesChange(updatedBusinesses);
      
      // Auto-select the new business
      onBusinessSelect(updatedBusiness);
    }
    setBusinessFormOpen(false);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, business: Business) => {
    setAnchorEl(event.currentTarget);
    setSelectedBusinessForMenu(business);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedBusinessForMenu(null);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">
          My Businesses ({businesses.length})
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddBusiness}
        >
          Add Business
        </Button>
      </Box>

      {businesses.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <BusinessIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No businesses created yet
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Create your first business profile to start showcasing your services.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddBusiness}
            >
              Create Your First Business
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {businesses.map((business) => (
            <Grid item xs={12} sm={6} md={4} key={business.businessId}>
              <Card 
                sx={{ 
                  height: '100%',
                  cursor: 'pointer',
                  border: selectedBusiness?.businessId === business.businessId ? 2 : 1,
                  borderColor: selectedBusiness?.businessId === business.businessId ? 'primary.main' : 'divider',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 4,
                  },
                }}
                onClick={() => onBusinessSelect(business)}
              >
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                    <Typography variant="h6" component="h3" noWrap sx={{ flexGrow: 1, mr: 1 }}>
                      {business.businessName}
                    </Typography>
                    <Box display="flex" alignItems="center">
                      <Chip 
                        label={business.isActive ? 'Active' : 'Inactive'} 
                        color={business.isActive ? 'success' : 'default'}
                        size="small"
                        sx={{ mr: 1 }}
                      />
                      <IconButton 
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMenuOpen(e, business);
                        }}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </Box>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {business.businessDescription}
                  </Typography>
                  
                  <Box mb={2}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Category:</strong> {business.businessCategory}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Phone:</strong> {business.businessPhone}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Email:</strong> {business.businessEmail}
                    </Typography>
                  </Box>
                  
                  <Typography variant="caption" color="text.secondary">
                    Created: {new Date(business.createdAt).toLocaleDateString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Business Management Form */}
      <BusinessManagementForm
        open={businessFormOpen}
        onClose={() => setBusinessFormOpen(false)}
        business={editingBusiness}
        onSuccess={handleBusinessSuccess}
      />

      {/* Business Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleEditBusiness(selectedBusinessForMenu!)}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Business</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleDeleteBusiness(selectedBusinessForMenu!)}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete Business</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default BusinessSelector;
