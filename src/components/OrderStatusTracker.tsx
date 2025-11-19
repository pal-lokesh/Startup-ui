import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  Avatar,
  Chip,
  LinearProgress,
  Alert,
  AlertTitle,
  Grid,
  Paper,
  Divider,
} from '@mui/material';
import {
  ShoppingCart as ShoppingCartIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
  LocalShipping as ShippingIcon,
  Cancel as CancelIcon,
  AccessTime as TimeIcon,
  Store as StoreIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import { Order } from '../types/cart';
import { getOrderDisplayTitle } from '../utils/orderDisplay';

interface OrderStatusTrackerProps {
  order: Order;
  showDetails?: boolean;
}

const OrderStatusTracker: React.FC<OrderStatusTrackerProps> = ({
  order,
  showDetails = true,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'warning';
      case 'CONFIRMED': return 'info';
      case 'PREPARING': return 'primary';
      case 'READY': return 'success';
      case 'DELIVERED': return 'success';
      case 'CANCELLED': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <ShoppingCartIcon />;
      case 'CONFIRMED': return <CheckCircleIcon />;
      case 'PREPARING': return <RefreshIcon />;
      case 'READY': return <ShippingIcon />;
      case 'DELIVERED': return <CheckCircleIcon />;
      case 'CANCELLED': return <CancelIcon />;
      default: return <ShoppingCartIcon />;
    }
  };

  const getOrderSteps = () => {
    const steps = [
      { 
        label: 'Order Placed', 
        completed: true,
        description: `Order placed on ${new Date(order.orderDate).toLocaleString()}`,
        icon: <ShoppingCartIcon />,
        color: 'success'
      },
      { 
        label: 'Order Confirmed', 
        completed: order.status !== 'PENDING',
        description: order.status !== 'PENDING' ? 'Order confirmed by vendor' : 'Waiting for confirmation',
        icon: <CheckCircleIcon />,
        color: order.status !== 'PENDING' ? 'success' : 'default'
      },
      { 
        label: 'Preparing', 
        completed: ['PREPARING', 'READY', 'DELIVERED'].includes(order.status),
        description: ['PREPARING', 'READY', 'DELIVERED'].includes(order.status) ? 'Your order is being prepared' : 'Waiting to start preparation',
        icon: <RefreshIcon />,
        color: ['PREPARING', 'READY', 'DELIVERED'].includes(order.status) ? 'primary' : 'default'
      },
      { 
        label: 'Ready for Delivery', 
        completed: ['READY', 'DELIVERED'].includes(order.status),
        description: ['READY', 'DELIVERED'].includes(order.status) ? 'Order is ready for delivery' : 'Order is being prepared',
        icon: <ShippingIcon />,
        color: ['READY', 'DELIVERED'].includes(order.status) ? 'success' : 'default'
      },
      { 
        label: 'Delivered', 
        completed: order.status === 'DELIVERED',
        description: order.status === 'DELIVERED' ? 'Order has been delivered successfully' : 'Order is ready for delivery',
        icon: <CheckCircleIcon />,
        color: order.status === 'DELIVERED' ? 'success' : 'default'
      },
    ];
    
    if (order.status === 'CANCELLED') {
      return steps.map(step => ({ 
        ...step, 
        completed: false, 
        description: 'Order was cancelled',
        color: 'error'
      }));
    }
    
    return steps;
  };

  const getOrderProgress = () => {
    const steps = getOrderSteps();
    const completedSteps = steps.filter(step => step.completed).length;
    return (completedSteps / steps.length) * 100;
  };

  const getOrderStatusMessage = () => {
    switch (order.status) {
      case 'PENDING':
        return {
          severity: 'info' as const,
          title: 'Order Pending',
          message: 'Your order is pending confirmation from the vendor. You will be notified once it\'s confirmed.'
        };
      case 'CONFIRMED':
        return {
          severity: 'success' as const,
          title: 'Order Confirmed',
          message: 'Your order has been confirmed and will be prepared soon. You will receive updates on the progress.'
        };
      case 'PREPARING':
        return {
          severity: 'info' as const,
          title: 'Order Being Prepared',
          message: 'Your order is being prepared. You will be notified when it\'s ready for delivery.'
        };
      case 'READY':
        return {
          severity: 'success' as const,
          title: 'Order Ready',
          message: 'Your order is ready for delivery. It will be delivered to your address soon.'
        };
      case 'DELIVERED':
        return {
          severity: 'success' as const,
          title: 'Order Delivered',
          message: 'Your order has been delivered successfully. Thank you for your business!'
        };
      case 'CANCELLED':
        return {
          severity: 'error' as const,
          title: 'Order Cancelled',
          message: 'Your order has been cancelled. If you have any questions, please contact the vendor.'
        };
      default:
        return {
          severity: 'info' as const,
          title: 'Order Status',
          message: 'Order status is being updated.'
        };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const steps = getOrderSteps();
  const firstIncompleteStepIndex = steps.findIndex(step => !step.completed);
  const progress = getOrderProgress();
  const statusMessage = getOrderStatusMessage();

  return (
    <Box>
      {/* Order Status Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: getStatusColor(order.status) + '.main' }}>
                {getStatusIcon(order.status)}
              </Avatar>
              <Box>
                <Typography variant="h6">
                  {getOrderDisplayTitle(order)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatDate(order.orderDate)}
                </Typography>
              </Box>
            </Box>
            <Chip 
              label={order.status} 
              color={getStatusColor(order.status) as any}
              icon={getStatusIcon(order.status)}
            />
          </Box>

          <Alert severity={statusMessage.severity} sx={{ mb: 2 }}>
            <AlertTitle>{statusMessage.title}</AlertTitle>
            {statusMessage.message}
          </Alert>

          <Box sx={{ mb: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="body2" color="text.secondary">
                Progress
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {Math.round(progress)}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={progress} 
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Order Timeline */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Order Timeline
          </Typography>
          <Stepper
            orientation="horizontal"
            sx={{
              flexWrap: { xs: 'wrap', md: 'nowrap' },
              '& .MuiStepLabel-root': {
                flexDirection: 'column',
                alignItems: 'center',
                '& .MuiStepLabel-label': {
                  marginTop: 1,
                  textAlign: 'center'
                }
              }
            }}
          >
            {steps.map((step, index) => (
              <Step
                key={index}
                completed={step.completed}
                active={!step.completed && index === firstIncompleteStepIndex}
              >
                <StepLabel
                  StepIconComponent={() => (
                    <Avatar
                      sx={{
                        bgcolor: step.completed ? 'success.main' : 'grey.300',
                        width: 48,
                        height: 48,
                        border: step.completed ? '3px solid #4caf50' : '3px solid #e0e0e0',
                        boxShadow: step.completed ? '0 2px 8px rgba(76, 175, 80, 0.3)' : 'none'
                      }}
                    >
                      {step.icon}
                    </Avatar>
                  )}
                  sx={{
                    '& .MuiStepLabel-label': {
                      fontSize: '0.875rem',
                      fontWeight: step.completed ? 'bold' : 'normal',
                      color: step.completed ? 'success.main' : 'text.primary',
                      mt: 1
                    }
                  }}
                >
                  {step.label}
                </StepLabel>
                <Box sx={{ mt: 1, textAlign: 'center', px: 1 }}>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                    {step.description}
                  </Typography>
                  {step.completed && (
                    <Chip
                      label="✓"
                      size="small"
                      color="success"
                      sx={{ height: 20, fontSize: '0.7rem' }}
                    />
                  )}
                </Box>
              </Step>
            ))}
          </Stepper>
        </CardContent>
      </Card>

      {/* Order Details */}
      {showDetails && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Order Details
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Customer Information
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <ShoppingCartIcon fontSize="small" color="primary" />
                    <Typography variant="body2">
                      {order.customerName}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <PhoneIcon fontSize="small" color="primary" />
                    <Typography variant="body2">
                      {order.customerPhone}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    <EmailIcon fontSize="small" color="primary" />
                    <Typography variant="body2">
                      {order.customerEmail}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Delivery Information
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <LocationIcon fontSize="small" color="primary" />
                    <Typography variant="body2">
                      {order.deliveryAddress}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <TimeIcon fontSize="small" color="primary" />
                    <Typography variant="body2">
                      {order.deliveryDate}
                    </Typography>
                  </Box>
                  {order.specialNotes && (
                    <Box display="flex" alignItems="center" gap={1}>
                      <StoreIcon fontSize="small" color="primary" />
                      <Typography variant="body2">
                        {order.specialNotes}
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">
                Total Amount
              </Typography>
              <Typography variant="h5" color="primary" fontWeight="bold">
                ₹{order.totalAmount}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default OrderStatusTracker;
