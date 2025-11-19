import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import availabilityService from '../services/availabilityService';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import stockNotificationService from '../services/stockNotificationService';

interface DatePickerDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (date: string | undefined) => void;
  itemId: string;
  itemType: 'theme' | 'inventory' | 'plate' | 'dish';
  itemName?: string;
  businessId?: string;
  currentDate?: string;
  title?: string;
  onNotify?: (date: string) => void; // Callback when notify is clicked
}

const DatePickerDialog: React.FC<DatePickerDialogProps> = ({
  open,
  onClose,
  onConfirm,
  itemId,
  itemType,
  itemName,
  businessId,
  currentDate,
  title = 'Select Booking Date',
  onNotify,
}) => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    currentDate ? new Date(currentDate) : null
  );
  const [availableQuantity, setAvailableQuantity] = useState<number | null>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscribing, setSubscribing] = useState(false);
  const [showNotificationDialog, setShowNotificationDialog] = useState(false);
  const [isAlreadySubscribed, setIsAlreadySubscribed] = useState(false);
  const [checkingSubscription, setCheckingSubscription] = useState(false);
  const [minDate] = useState(new Date()); // Today is minimum date

  // Debounce availability check to reduce API calls
  useEffect(() => {
    if (!open) {
      // Reset state when dialog closes
      setSelectedDate(currentDate ? new Date(currentDate) : null);
      setAvailableQuantity(null);
      setError(null);
      setCheckingAvailability(false);
      setSubscribing(false);
      setShowNotificationDialog(false);
      setIsAlreadySubscribed(false);
      setCheckingSubscription(false);
      return;
    }
  }, [open, currentDate]);

  const checkAvailability = useCallback(async () => {
    if (!selectedDate) return;

    setCheckingAvailability(true);
    setError(null);
    setIsAlreadySubscribed(false);
    setCheckingSubscription(false);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const quantity = await availabilityService.getAvailableQuantity(itemId, itemType, dateStr);
      setAvailableQuantity(quantity);
      
      // If not available, check if user is already subscribed for this date
      if (quantity === 0 && user) {
        setCheckingSubscription(true);
        try {
          const subscribed = await stockNotificationService.isSubscribed(
            user.phoneNumber,
            itemId,
            itemType.toUpperCase() as 'THEME' | 'INVENTORY' | 'PLATE' | 'DISH',
            dateStr
          );
          setIsAlreadySubscribed(subscribed);
        } catch (err) {
          console.error('Error checking subscription:', err);
          // Don't block the flow if subscription check fails
        } finally {
          setCheckingSubscription(false);
        }
      }
    } catch (err: any) {
      console.error('Error checking availability:', err);
      setAvailableQuantity(0);
      setError('Failed to check availability. Please try again.');
    } finally {
      setCheckingAvailability(false);
    }
  }, [selectedDate, itemId, itemType, user]);

  // Check availability when date is selected (with debounce)
  useEffect(() => {
    if (!open || !selectedDate) {
      return;
    }

    // Debounce: wait 500ms after user stops changing date
    const timeoutId = setTimeout(() => {
      checkAvailability();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [selectedDate, itemId, itemType, open, checkAvailability]);

  const handleConfirm = () => {
    if (!selectedDate) {
      setError('Please select a booking date.');
      return;
    }

    // Final availability check before confirming
    if (availableQuantity !== null && availableQuantity > 0) {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      onConfirm(dateStr);
      onClose();
    } else {
      // Date is not available - show notification dialog only if not already subscribed
      if (isAlreadySubscribed) {
        setError('You are already subscribed for notifications on this date.');
      } else {
        setShowNotificationDialog(true);
      }
    }
  };

  const handleNotificationConfirm = () => {
    setShowNotificationDialog(false);
    handleNotifyMe();
  };

  const handleNotificationCancel = () => {
    setShowNotificationDialog(false);
    // Keep dialog open so user can select another date
  };

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
    setAvailableQuantity(null);
    setError(null);
    // Don't check immediately - let debounce handle it
  };

  const handleNotifyMe = async () => {
    if (!selectedDate || !user || !businessId || !itemName) return;
    
    // Double-check if already subscribed (in case state wasn't updated)
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    try {
      const alreadySubscribed = await stockNotificationService.isSubscribed(
        user.phoneNumber,
        itemId,
        itemType.toUpperCase() as 'THEME' | 'INVENTORY' | 'PLATE' | 'DISH',
        dateStr
      );
      
      if (alreadySubscribed) {
        setError('You are already subscribed for notifications on this date.');
        setShowNotificationDialog(false);
        setIsAlreadySubscribed(true);
        return;
      }
    } catch (err) {
      console.error('Error checking subscription before subscribing:', err);
      // Continue with subscription attempt
    }
    
    try {
      setSubscribing(true);
      
      // Subscribe to notifications for this specific date
      await stockNotificationService.subscribe(
        user.phoneNumber,
        itemId,
        itemType.toUpperCase() as 'THEME' | 'INVENTORY' | 'PLATE' | 'DISH',
        itemName,
        businessId,
        dateStr // Pass the specific date for date-wise availability
      );
      
      // Update subscription status
      setIsAlreadySubscribed(true);
      
      // Call parent's onNotify callback if provided
      if (onNotify) {
        onNotify(dateStr);
      }
      
      // Show success message and close dialog
      setError(null);
      // Close notification dialog first, then main dialog
      setShowNotificationDialog(false);
      setTimeout(() => {
        onClose();
      }, 100);
    } catch (err: any) {
      setError(err.message || 'Failed to subscribe to notifications');
      setSubscribing(false);
    }
  };

  const isDateAvailable = availableQuantity !== null && availableQuantity > 0;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <DatePicker
              label="Select Booking Date *"
              value={selectedDate}
              onChange={handleDateChange}
              minDate={minDate}
              slotProps={{
                textField: {
                  fullWidth: true,
                  margin: 'normal' as const,
                  required: true,
                },
              }}
            />

            {selectedDate && (
              <Box sx={{ mt: 2 }}>
                {checkingAvailability || checkingSubscription ? (
                  <Box display="flex" alignItems="center" gap={1}>
                    <CircularProgress size={20} />
                    <Typography variant="body2" color="text.secondary">
                      {checkingAvailability ? 'Checking availability...' : 'Checking subscription status...'}
                    </Typography>
                  </Box>
                ) : availableQuantity !== null ? (
                  <>
                    {isDateAvailable ? (
                      <Alert severity="success" sx={{ mt: 1 }}>
                        Available: {availableQuantity} item{availableQuantity !== 1 ? 's' : ''} available on{' '}
                        {format(selectedDate, 'MMM dd, yyyy')}
                      </Alert>
                    ) : (
                      <Alert severity="warning" sx={{ mt: 1 }}>
                        {isAlreadySubscribed ? (
                          <>
                            Not available on {format(selectedDate, 'MMM dd, yyyy')}. You are already subscribed for notifications on this date.
                          </>
                        ) : (
                          <>
                            Not available on {format(selectedDate, 'MMM dd, yyyy')}. Please select another date or subscribe for notifications.
                          </>
                        )}
                      </Alert>
                    )}
                  </>
                ) : null}
                {error && (
                  <Alert severity="error" sx={{ mt: 1 }}>
                    {error}
                  </Alert>
                )}
              </Box>
            )}

          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleConfirm}
            variant="contained"
            disabled={!selectedDate || checkingAvailability || checkingSubscription || subscribing}
          >
            {checkingAvailability || checkingSubscription ? 'Checking...' : 
             subscribing ? 'Subscribing...' :
             selectedDate && !isDateAvailable && availableQuantity !== null && !isAlreadySubscribed ? 'Not Available - Get Notified?' : 
             selectedDate && !isDateAvailable && availableQuantity !== null && isAlreadySubscribed ? 'Already Subscribed' :
             'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification Confirmation Dialog */}
      <Dialog
        open={showNotificationDialog}
        onClose={handleNotificationCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Item Not Available</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            This item is not available on <strong>{selectedDate ? format(selectedDate, 'MMM dd, yyyy') : ''}</strong>.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Would you like to be notified when it becomes available on this date?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleNotificationCancel} disabled={subscribing}>No, Thanks</Button>
          <Button onClick={handleNotificationConfirm} variant="contained" disabled={subscribing || isAlreadySubscribed}>
            {subscribing ? 'Subscribing...' : isAlreadySubscribed ? 'Already Subscribed' : 'Yes, Notify Me'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default DatePickerDialog;

