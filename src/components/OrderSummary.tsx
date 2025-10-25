import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Avatar,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  ShoppingCart as ShoppingCartIcon,
  CheckCircle as CheckCircleIcon,
  LocalShipping as ShippingIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  AccessTime as TimeIcon,
  AttachMoney as MoneyIcon,
  Store as StoreIcon,
} from '@mui/icons-material';
import { Order } from '../types/cart';

interface OrderSummaryProps {
  orders: Order[];
}

const OrderSummary: React.FC<OrderSummaryProps> = ({ orders }) => {
  const getOrderStats = () => {
    const totalOrders = orders.length;
    const deliveredOrders = orders.filter(o => o.status === 'DELIVERED').length;
    const pendingOrders = orders.filter(o => ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'].includes(o.status)).length;
    const cancelledOrders = orders.filter(o => o.status === 'CANCELLED').length;
    const totalSpent = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

    return {
      totalOrders,
      deliveredOrders,
      pendingOrders,
      cancelledOrders,
      totalSpent,
      averageOrderValue,
      deliveryRate: totalOrders > 0 ? (deliveredOrders / totalOrders) * 100 : 0,
    };
  };

  const getRecentOrders = () => {
    return orders
      .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
      .slice(0, 5);
  };

  const getBusinessStats = () => {
    const businessMap = new Map();
    
    orders.forEach(order => {
      order.orderItems?.forEach(item => {
        const businessName = item.businessName;
        if (businessMap.has(businessName)) {
          const existing = businessMap.get(businessName);
          businessMap.set(businessName, {
            ...existing,
            orderCount: existing.orderCount + 1,
            totalSpent: existing.totalSpent + (item.itemPrice * item.quantity),
          });
        } else {
          businessMap.set(businessName, {
            businessName,
            orderCount: 1,
            totalSpent: item.itemPrice * item.quantity,
          });
        }
      });
    });

    return Array.from(businessMap.values())
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5);
  };

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const stats = getOrderStats();
  const recentOrders = getRecentOrders();
  const businessStats = getBusinessStats();

  if (orders.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <ShoppingCartIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No orders yet
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Start exploring businesses and place your first order!
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      {/* Order Statistics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 1 }}>
                  <ShoppingCartIcon />
                </Avatar>
                <Typography variant="h6">Total Orders</Typography>
              </Box>
              <Typography variant="h3" color="primary">
                {stats.totalOrders}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                All time orders
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar sx={{ bgcolor: 'success.main', mr: 1 }}>
                  <CheckCircleIcon />
                </Avatar>
                <Typography variant="h6">Delivered</Typography>
              </Box>
              <Typography variant="h3" color="success.main">
                {stats.deliveredOrders}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {stats.deliveryRate.toFixed(1)}% delivery rate
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar sx={{ bgcolor: 'info.main', mr: 1 }}>
                  <TimeIcon />
                </Avatar>
                <Typography variant="h6">In Progress</Typography>
              </Box>
              <Typography variant="h3" color="info.main">
                {stats.pendingOrders}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active orders
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar sx={{ bgcolor: 'warning.main', mr: 1 }}>
                  <MoneyIcon />
                </Avatar>
                <Typography variant="h6">Total Spent</Typography>
              </Box>
              <Typography variant="h3" color="warning.main">
                {formatCurrency(stats.totalSpent)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Avg: {formatCurrency(stats.averageOrderValue)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Orders */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Orders
              </Typography>
              <List>
                {recentOrders.map((order, index) => (
                  <React.Fragment key={order.orderId}>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: getStatusColor(order.status) + '.main' }}>
                          <ShoppingCartIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="body1">
                              Order #{order.orderId}
                            </Typography>
                            <Chip 
                              label={order.status} 
                              color={getStatusColor(order.status) as any}
                              size="small"
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {formatDate(order.orderDate)} • {order.orderItems?.length || 0} items
                            </Typography>
                            <Typography variant="body2" color="primary" fontWeight="bold">
                              {formatCurrency(order.totalAmount)}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < recentOrders.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Business Statistics */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top Businesses
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Business</TableCell>
                      <TableCell align="right">Orders</TableCell>
                      <TableCell align="right">Spent</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {businessStats.map((business, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <StoreIcon fontSize="small" color="primary" />
                            <Typography variant="body2">
                              {business.businessName}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">
                            {business.orderCount}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="bold">
                            {formatCurrency(business.totalSpent)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Order Status Distribution */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Order Status Distribution
              </Typography>
              <Grid container spacing={2}>
                {[
                  { status: 'DELIVERED', count: stats.deliveredOrders, color: 'success' },
                  { status: 'PENDING', count: orders.filter(o => o.status === 'PENDING').length, color: 'warning' },
                  { status: 'CONFIRMED', count: orders.filter(o => o.status === 'CONFIRMED').length, color: 'info' },
                  { status: 'PREPARING', count: orders.filter(o => o.status === 'PREPARING').length, color: 'primary' },
                  { status: 'READY', count: orders.filter(o => o.status === 'READY').length, color: 'success' },
                  { status: 'CANCELLED', count: stats.cancelledOrders, color: 'error' },
                ].map((item) => {
                  const percentage = stats.totalOrders > 0 ? (item.count / stats.totalOrders) * 100 : 0;
                  return (
                    <Grid item xs={12} sm={6} md={4} key={item.status}>
                      <Paper variant="outlined" sx={{ p: 2 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                          <Typography variant="body2" fontWeight="medium">
                            {item.status}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {item.count}
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={percentage} 
                          color={item.color as any}
                          sx={{ height: 6, borderRadius: 3 }}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                          {percentage.toFixed(1)}%
                        </Typography>
                      </Paper>
                    </Grid>
                  );
                })}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default OrderSummary;
