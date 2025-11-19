import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import availabilityService from '../services/availabilityService';
import { Availability, AvailabilityRequest } from '../types/availability';
import { useAuth } from '../contexts/AuthContext';
import BusinessService from '../services/businessService';
import { Business } from '../types';
import themeService from '../services/themeService';
import inventoryService from '../services/inventoryService';
import plateService from '../services/plateService';
import { Theme, Inventory, Plate } from '../types';

const AvailabilityManagement: React.FC = () => {
  const { user } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [items, setItems] = useState<Array<{ id: string; name: string; type: 'theme' | 'inventory' | 'plate' }>>([]);
  const [selectedItem, setSelectedItem] = useState<{ id: string; name: string; type: 'theme' | 'inventory' | 'plate' } | null>(null);
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availableQuantity, setAvailableQuantity] = useState<number>(0);
  const [isAvailable, setIsAvailable] = useState<boolean>(true);
  const [priceOverride, setPriceOverride] = useState<string>('');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    if (user?.userType === 'VENDOR' && user.phoneNumber) {
      fetchBusinesses();
    }
  }, [user]);

  useEffect(() => {
    if (selectedBusiness) {
      fetchItems();
    }
  }, [selectedBusiness]);

  useEffect(() => {
    if (selectedItem && selectedBusiness) {
      fetchAvailabilities();
    }
  }, [selectedItem, selectedBusiness]);

  const fetchBusinesses = async () => {
    try {
      setLoading(true);
      const vendorBusinesses = await BusinessService.getBusinessesByVendorPhoneNumber(user!.phoneNumber);
      setBusinesses(vendorBusinesses);
      if (vendorBusinesses.length > 0) {
        setSelectedBusiness(vendorBusinesses[0]);
      }
    } catch (err: any) {
      setError('Failed to fetch businesses: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async () => {
    if (!selectedBusiness) return;

    try {
      setLoading(true);
      const allItems: Array<{ id: string; name: string; type: 'theme' | 'inventory' | 'plate' }> = [];

      // Fetch themes
      try {
        const themes = await themeService.getThemesByBusinessId(selectedBusiness.businessId);
        themes.forEach(theme => {
          allItems.push({ id: theme.themeId, name: theme.themeName, type: 'theme' });
        });
      } catch (err) {
        console.error('Error fetching themes:', err);
      }

      // Fetch inventory
      try {
        const inventory = await inventoryService.getInventoryByBusinessId(selectedBusiness.businessId);
        inventory.forEach(inv => {
          allItems.push({ id: inv.inventoryId, name: inv.inventoryName, type: 'inventory' });
        });
      } catch (err) {
        console.error('Error fetching inventory:', err);
      }

      // Fetch plates
      try {
        const plates = await plateService.getPlatesByBusinessId(selectedBusiness.businessId);
        plates.forEach(plate => {
          allItems.push({ id: plate.plateId, name: plate.dishName, type: 'plate' });
        });
      } catch (err) {
        console.error('Error fetching plates:', err);
      }

      setItems(allItems);
    } catch (err: any) {
      setError('Failed to fetch items: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailabilities = async () => {
    if (!selectedItem) return;

    try {
      setLoading(true);
      const data = await availabilityService.getAvailabilitiesForItem(selectedItem.id, selectedItem.type);
      setAvailabilities(data);
    } catch (err: any) {
      setError('Failed to fetch availabilities: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAvailability = () => {
    if (!selectedItem || !selectedBusiness) {
      setError('Please select an item first');
      return;
    }
    setSelectedDate(new Date());
    setAvailableQuantity(0);
    setIsAvailable(true);
    setPriceOverride('');
    setDialogOpen(true);
  };

  const handleSaveAvailability = async () => {
    if (!selectedItem || !selectedBusiness || !selectedDate) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const request: AvailabilityRequest = {
        itemId: selectedItem.id,
        itemType: selectedItem.type,
        businessId: selectedBusiness.businessId,
        availabilityDate: format(selectedDate, 'yyyy-MM-dd'),
        availableQuantity: availableQuantity,
        isAvailable: isAvailable,
        priceOverride: priceOverride ? parseFloat(priceOverride) : undefined,
      };

      await availabilityService.createOrUpdateAvailability(request);
      setDialogOpen(false);
      fetchAvailabilities();
    } catch (err: any) {
      setError('Failed to save availability: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAvailability = async (date: string) => {
    if (!selectedItem) return;

    if (!window.confirm(`Are you sure you want to delete availability for ${date}?`)) {
      return;
    }

    try {
      setLoading(true);
      await availabilityService.deleteAvailability(selectedItem.id, selectedItem.type, date);
      fetchAvailabilities();
    } catch (err: any) {
      setError('Failed to delete availability: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getAvailabilityForDate = (date: Date): Availability | undefined => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return availabilities.find(a => a.availabilityDate === dateStr);
  };

  const monthDays = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  if (!user || user.userType !== 'VENDOR') {
    return (
      <Box p={3}>
        <Alert severity="error">This page is only accessible to vendors.</Alert>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Availability Management
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Set date-wise availability for your themes, inventory, and plates
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Business Selection */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Select Business
          </Typography>
          <Grid container spacing={2}>
            {businesses.map((business) => (
              <Grid item key={business.businessId}>
                <Button
                  variant={selectedBusiness?.businessId === business.businessId ? 'contained' : 'outlined'}
                  onClick={() => setSelectedBusiness(business)}
                >
                  {business.businessName}
                </Button>
              </Grid>
            ))}
          </Grid>
        </Paper>

        {selectedBusiness && (
          <>
            {/* Item Selection */}
            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Select Item
              </Typography>
              <Grid container spacing={2}>
                {items.map((item) => (
                  <Grid item key={`${item.id}-${item.type}`}>
                    <Button
                      variant={selectedItem?.id === item.id && selectedItem?.type === item.type ? 'contained' : 'outlined'}
                      onClick={() => setSelectedItem(item)}
                    >
                      {item.name} ({item.type})
                    </Button>
                  </Grid>
                ))}
              </Grid>
            </Paper>

            {selectedItem && (
              <>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">
                    Availability for: {selectedItem.name}
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddAvailability}
                  >
                    Add Availability
                  </Button>
                </Box>

                {/* Calendar View */}
                <Paper sx={{ p: 2, mb: 3 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}>
                      Previous Month
                    </Button>
                    <Typography variant="h6">
                      {format(currentMonth, 'MMMM yyyy')}
                    </Typography>
                    <Button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}>
                      Next Month
                    </Button>
                  </Box>

                  <Grid container spacing={1}>
                    {monthDays.map((day: Date) => {
                      const availability = getAvailabilityForDate(day);
                      const isPast = day < new Date();
                      const isToday = isSameDay(day, new Date());

                      return (
                        <Grid item xs={12} sm={6} md={4} lg={3} key={day.toISOString()}>
                          <Paper
                            sx={{
                              p: 1,
                              textAlign: 'center',
                              bgcolor: isPast
                                ? 'grey.200'
                                : availability?.isAvailable && availability.availableQuantity > 0
                                ? 'success.light'
                                : 'error.light',
                              opacity: isPast ? 0.5 : 1,
                              cursor: isPast ? 'default' : 'pointer',
                            }}
                            onClick={() => {
                              if (!isPast) {
                                const avail = availability;
                                setSelectedDate(day);
                                setAvailableQuantity(avail?.availableQuantity || 0);
                                setIsAvailable(avail?.isAvailable ?? true);
                                setPriceOverride(avail?.priceOverride?.toString() || '');
                                setDialogOpen(true);
                              }
                            }}
                          >
                            <Typography variant="caption" display="block">
                              {format(day, 'MMM dd')}
                            </Typography>
                            {availability ? (
                              <>
                                <Typography variant="body2" fontWeight="bold">
                                  Qty: {availability.availableQuantity}
                                </Typography>
                                {availability.priceOverride && (
                                  <Typography variant="caption" color="text.secondary">
                                    ₹{availability.priceOverride}
                                  </Typography>
                                )}
                              </>
                            ) : (
                              <Typography variant="caption" color="text.secondary">
                                Not set
                              </Typography>
                            )}
                          </Paper>
                        </Grid>
                      );
                    })}
                  </Grid>
                </Paper>

                {/* Table View */}
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Available Quantity</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Price Override</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {availabilities.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center">
                            No availability set. Click "Add Availability" to get started.
                          </TableCell>
                        </TableRow>
                      ) : (
                        availabilities.map((availability) => (
                          <TableRow key={availability.availabilityId}>
                            <TableCell>{format(new Date(availability.availabilityDate), 'MMM dd, yyyy')}</TableCell>
                            <TableCell>{availability.availableQuantity}</TableCell>
                            <TableCell>
                              <Chip
                                label={availability.isAvailable ? 'Available' : 'Unavailable'}
                                color={availability.isAvailable ? 'success' : 'error'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              {availability.priceOverride ? `₹${availability.priceOverride}` : '-'}
                            </TableCell>
                            <TableCell>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteAvailability(availability.availabilityDate)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
          </>
        )}

        {/* Add/Edit Availability Dialog */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            {availabilities.find(a => a.availabilityDate === (selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''))
              ? 'Edit Availability'
              : 'Add Availability'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 1 }}>
              <DatePicker
                label="Date"
                value={selectedDate}
                onChange={setSelectedDate}
                minDate={new Date()}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    margin: 'normal' as const,
                    required: true,
                  },
                }}
              />
              <TextField
                fullWidth
                type="number"
                label="Available Quantity"
                value={availableQuantity}
                onChange={(e) => setAvailableQuantity(parseInt(e.target.value) || 0)}
                margin="normal"
                required
                inputProps={{ min: 0 }}
              />
              <TextField
                fullWidth
                type="number"
                label="Price Override (Optional)"
                value={priceOverride}
                onChange={(e) => setPriceOverride(e.target.value)}
                margin="normal"
                inputProps={{ min: 0, step: 0.01 }}
                helperText="Leave empty to use default price"
              />
              <Box sx={{ mt: 2 }}>
                <Button
                  variant={isAvailable ? 'contained' : 'outlined'}
                  color={isAvailable ? 'success' : 'error'}
                  onClick={() => setIsAvailable(true)}
                  sx={{ mr: 1 }}
                >
                  Available
                </Button>
                <Button
                  variant={!isAvailable ? 'contained' : 'outlined'}
                  color={!isAvailable ? 'error' : 'inherit'}
                  onClick={() => setIsAvailable(false)}
                >
                  Unavailable
                </Button>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSaveAvailability}
              variant="contained"
              disabled={!selectedDate || loading}
            >
              {loading ? <CircularProgress size={20} /> : 'Save'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default AvailabilityManagement;

