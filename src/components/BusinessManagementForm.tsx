import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Business, BusinessFormData } from '../types';
import BusinessService from '../services/businessService';
import { useAuth } from '../contexts/AuthContext';

interface BusinessManagementFormProps {
  open: boolean;
  onClose: () => void;
  business: Business | null;
  onSuccess: (business: Business) => void;
}

const BusinessManagementForm: React.FC<BusinessManagementFormProps> = ({
  open,
  onClose,
  business,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<BusinessFormData>({
    phoneNumber: '',
    businessName: '',
    businessDescription: '',
    businessCategory: '',
    businessAddress: '',
    businessPhone: '',
    businessEmail: '',
    website: '',
    socialMediaLinks: '',
    operatingHours: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const businessCategories = [
    'Tent_house',
    'caters'
  ];

  useEffect(() => {
    if (business) {
      setFormData({
        phoneNumber: business.phoneNumber,
        businessName: business.businessName,
        businessDescription: business.businessDescription,
        businessCategory: business.businessCategory,
        businessAddress: business.businessAddress,
        businessPhone: business.businessPhone,
        businessEmail: business.businessEmail,
        website: business.website || '',
        socialMediaLinks: business.socialMediaLinks || '',
        operatingHours: business.operatingHours || '',
      });
    } else {
      // For new business creation, pre-populate with user's phone number
      setFormData({
        phoneNumber: user?.phoneNumber || '',
        businessName: '',
        businessDescription: '',
        businessCategory: '',
        businessAddress: '',
        businessPhone: user?.phoneNumber || '',
        businessEmail: user?.email || '',
        website: '',
        socialMediaLinks: '',
        operatingHours: '',
      });
    }
    setError(null);
  }, [business, open, user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.businessName || !formData.businessDescription || !formData.businessCategory) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let updatedBusiness: Business;
      
      if (business) {
        // Update existing business
        updatedBusiness = await BusinessService.updateBusiness(business.businessId, formData);
      } else {
        // Create new business
        updatedBusiness = await BusinessService.createBusiness(formData);
      }

      onSuccess(updatedBusiness);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save business details');
      console.error('Error saving business:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  return (
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {business ? 'Edit Business Details' : 'Create Business Profile'}
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                name="businessName"
                label="Business Name"
                value={formData.businessName}
                onChange={handleInputChange}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal" required>
                <InputLabel>Business Category</InputLabel>
                <Select
                  name="businessCategory"
                  value={formData.businessCategory}
                  onChange={handleSelectChange}
                  label="Business Category"
                >
                  {businessCategories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                multiline
                rows={3}
                name="businessDescription"
                label="Business Description"
                value={formData.businessDescription}
                onChange={handleInputChange}
                margin="normal"
                placeholder="Describe your business and services..."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                name="businessAddress"
                label="Business Address"
                value={formData.businessAddress}
                onChange={handleInputChange}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                name="businessPhone"
                label="Business Phone"
                value={formData.businessPhone}
                onChange={handleInputChange}
                margin="normal"
                placeholder="+1 (555) 123-4567"
                disabled={!business} // Disable for new business creation
                helperText={!business ? "This will be set to your account phone number" : ""}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                name="businessEmail"
                label="Business Email"
                type="email"
                value={formData.businessEmail}
                onChange={handleInputChange}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="website"
                label="Website"
                value={formData.website}
                onChange={handleInputChange}
                margin="normal"
                placeholder="https://www.yourbusiness.com"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="socialMediaLinks"
                label="Social Media Links"
                value={formData.socialMediaLinks}
                onChange={handleInputChange}
                margin="normal"
                placeholder="Instagram, Facebook, Twitter handles"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="operatingHours"
                label="Operating Hours"
                value={formData.operatingHours}
                onChange={handleInputChange}
                margin="normal"
                placeholder="e.g., Mon-Fri: 9AM-6PM, Sat: 10AM-4PM"
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Saving...' : (business ? 'Update Business' : 'Create Business')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BusinessManagementForm;
