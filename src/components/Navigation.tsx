import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  Badge,
  Paper,
  ListItemAvatar,
  CircularProgress,
  Typography as MuiTypography,
  Chip,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  Store as StoreIcon,
  Palette as PaletteIcon,
  Image as ImageIcon,
  Menu as MenuIcon,
  AccountCircle,
  Logout,
  ShoppingCart as CartIcon,
  Explore as ExploreIcon,
  Chat as ChatIcon,
  Notifications as NotificationIcon,
  Star as StarIcon,
  CalendarToday as CalendarIcon,
  Restaurant as RestaurantIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useVendorNotifications } from '../contexts/VendorNotificationContext';
import Cart from './Cart';
import notificationService from '../services/notificationService';
import chatService from '../services/chatService';
import BusinessService from '../services/businessService';
import { Notification } from '../types/notification';

// Responsive drawer width - scales with viewport
// Note: drawerWidth constant removed as we now use clamp() directly in sx props

const Navigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { getCartItemCount, isCartOpen, openCart, closeCart } = useCart();
  const { 
    notifications: clientNotifications, 
    unreadCount: clientNotificationCount, 
    loading: loadingNotifications,
    markAsRead 
  } = useNotifications();
  const {
    notifications: vendorNotifications,
    unreadCount: vendorNotificationCount,
    loading: loadingVendorNotifications,
    markAsRead: markVendorNotificationAsRead,
    refreshNotifications: refreshVendorNotifications,
  } = useVendorNotifications();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [notificationMenuAnchor, setNotificationMenuAnchor] = React.useState<null | HTMLElement>(null);
  const [vendorNotificationMenuAnchor, setVendorNotificationMenuAnchor] = React.useState<null | HTMLElement>(null);
  const [unreadChatCount, setUnreadChatCount] = React.useState(0);
  const [isCateringBusiness, setIsCateringBusiness] = React.useState(false);
  const [isTentBusiness, setIsTentBusiness] = React.useState(false);
  const [vendorCategories, setVendorCategories] = React.useState<string[]>([]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationMenuAnchor(event.currentTarget);
  };

  const handleNotificationMenuClose = () => {
    setNotificationMenuAnchor(null);
  };

  const handleVendorNotificationMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setVendorNotificationMenuAnchor(event.currentTarget);
    // Refresh vendor notifications when menu opens
    if (user && user.userType === 'VENDOR') {
      refreshVendorNotifications();
    }
  };

  const handleVendorNotificationMenuClose = () => {
    setVendorNotificationMenuAnchor(null);
  };

  const handleVendorNotificationClick = async (notification: Notification) => {
    try {
      await markVendorNotificationAsRead(notification.notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
    
    // Close the dropdown
    handleVendorNotificationMenuClose();
    
    // Navigate to notifications tab (index 0) with the notification ID to highlight it
    navigate('/vendor-orders-notifications', { 
      state: { 
        activeTab: 0, // Notifications tab
        notificationId: notification.notificationId,
        orderId: notification.orderId 
      } 
    });
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Always mark as read when notification is clicked/opened
    // The backend will handle if it's already read
    try {
      await markAsRead(notification.notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Continue navigation even if marking as read fails
    }
    
    // Close the dropdown
    handleNotificationMenuClose();
    
    // If notification has an orderId, navigate to My Orders tab to show all orders
    // Otherwise, navigate to Notifications tab
    if (notification.orderId) {
      navigate('/client-dashboard', { 
        state: { 
          activeTab: 1, // My Orders tab - show all orders
          orderId: notification.orderId, // Keep orderId for reference but don't auto-open dialog
          notificationId: notification.notificationId
        } 
      });
    } else {
      navigate('/client-dashboard', { 
        state: { 
          activeTab: 2, // Notifications tab
          notificationId: notification.notificationId
        } 
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleUserMenuClose();
  };

  // VendorNotificationContext handles all vendor notification fetching and syncing
  // No need for separate useEffect hooks here

  // NotificationContext handles all notification fetching and syncing
  // No need for separate useEffect hooks here

  // Fetch unread chat messages for both clients and vendors
  React.useEffect(() => {
    if (user) {
      const fetchUnreadChatCount = async () => {
        try {
          const count = await chatService.getTotalUnreadCount(user.phoneNumber);
          setUnreadChatCount(count);
        } catch (error) {
          console.error('Error fetching unread chat count:', error);
        }
      };
      
      fetchUnreadChatCount();
      // Refresh every 15 seconds for chat messages
      const interval = setInterval(fetchUnreadChatCount, 15000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Fetch vendor's business to determine if it's a catering or tent business
  React.useEffect(() => {
    if (user && user.userType === 'VENDOR' && user.phoneNumber) {
      const fetchVendorBusiness = async () => {
        try {
          const businesses = await BusinessService.getBusinessesByVendorPhoneNumber(user.phoneNumber);
          // Check if any business is catering type
          const hasCateringBusiness = businesses.some(b => b.businessCategory === 'caters');
          setIsCateringBusiness(hasCateringBusiness);
          
          // Check if any business is tent type
          const hasTentBusiness = businesses.some(b => {
            const category = b.businessCategory?.toLowerCase() || '';
            return category === 'tent_house' || category === 'tent' || 
                   (category.includes('tent') && !category.includes('cater'));
          });
          setIsTentBusiness(hasTentBusiness);
          
          // Store all business categories for vendor profile
          const categories = businesses.map(b => b.businessCategory).filter(Boolean);
          setVendorCategories(categories);
        } catch (error) {
          console.error('Error fetching vendor business:', error);
          setIsCateringBusiness(false);
          setIsTentBusiness(false);
          setVendorCategories([]);
        }
      };
      
      fetchVendorBusiness();
    } else {
      setIsCateringBusiness(false);
      setIsTentBusiness(false);
      setVendorCategories([]);
    }
  }, [user]);

  const baseItems = [
    { text: 'Explore', icon: <PaletteIcon />, path: '/explore' },
  ];

  const clientItems = [
    { text: 'My Orders', icon: <DashboardIcon />, path: '/client-dashboard' },
    { 
      text: unreadChatCount > 0 ? `Chat (${unreadChatCount})` : 'Chat', 
      icon: <ChatIcon />, 
      path: '/client-chat' 
    },
    { text: 'My Ratings', icon: <StarIcon />, path: '/client-ratings' },
    { text: 'Explore', icon: <PaletteIcon />, path: '/explore' },
  ];

  // Vendor menu items - dynamically change Theme to Plate for catering businesses
  // Add Inventory for tent businesses
  const getVendorItems = () => {
    const baseVendorItems = [
      { text: 'Dashboard', icon: <DashboardIcon />, path: '/vendor-dashboard' },
      { text: 'Business', icon: <BusinessIcon />, path: '/vendor-dashboard' },
      // Theme and Inventory options disabled - removed from navigation
      // { text: isCateringBusiness ? 'Plate' : 'Theme', icon: <PaletteIcon />, path: isCateringBusiness ? '/plates' : '/themes' },
      // Dish tab removed for catering businesses
      // { text: 'Inventory', icon: <InventoryIcon />, path: '/vendor-dashboard', activeTab: 2 } - disabled
      { text: 'Availability', icon: <CalendarIcon />, path: '/availability' },
    ];
    return baseVendorItems;
  };

  const vendorItems = getVendorItems();

  const adminItems = [
    { text: 'Users', icon: <PeopleIcon />, path: '/users' },
    { text: 'Vendors', icon: <BusinessIcon />, path: '/vendors' },
    { text: 'Businesses', icon: <StoreIcon />, path: '/businesses' },
    { text: 'Themes', icon: <PaletteIcon />, path: '/themes' },
    { text: 'Images', icon: <ImageIcon />, path: '/images' },
  ];

  // Determine menu items based on user role and type
  // Priority: SUPER_ADMIN > VENDOR (by userType) > CLIENT > ADMIN/VENDOR_ADMIN > default
  // IMPORTANT: Check userType BEFORE role to ensure vendors always get vendor menu
  let menuItems = baseItems;
  
  if (user) {
    if (user.role === 'SUPER_ADMIN') {
      // Super admin sees everything
      menuItems = [
        { text: 'Super Admin Dashboard', icon: <DashboardIcon />, path: '/super-admin-dashboard' },
        ...baseItems,
        ...adminItems
      ];
    } else if (user.userType === 'VENDOR') {
      // Vendors ONLY see vendor-specific items (check userType FIRST before role)
      menuItems = vendorItems;
    } else if (user.userType === 'CLIENT') {
      // Clients see client-specific items
      menuItems = clientItems;
    } else if (user.role === 'ADMIN' || user.role === 'VENDOR_ADMIN') {
      // Admin sees admin dashboard and admin items (only if not VENDOR userType)
      menuItems = [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
        ...baseItems,
        ...adminItems
      ];
    }
  }

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Record Service
        </Typography>
      </Toolbar>
      <List>
        {menuItems.map((item) => {
          const hasActiveTab = (item as any).activeTab !== undefined;
          const isSelected = hasActiveTab 
            ? location.pathname === item.path && (location.state as any)?.activeTab === (item as any).activeTab
            : location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                component={hasActiveTab ? 'div' : Link}
                to={hasActiveTab ? undefined : item.path}
                onClick={hasActiveTab ? () => {
                  setMobileOpen(false); // Close mobile drawer
                  const targetTab = (item as any).activeTab;
                  console.log('Navigating to:', item.path, 'with activeTab:', targetTab);
                  // Force navigation with state - add timestamp to ensure state change is detected
                  navigate(item.path, { 
                    state: { 
                      activeTab: targetTab,
                      _timestamp: Date.now() // Force state update
                    },
                    replace: false // Always push to ensure state is updated
                  });
                } : undefined}
                selected={isSelected}
              >
                <ListItemIcon>
                  {item.path.includes('chat') && unreadChatCount > 0 ? (
                    <Badge badgeContent={unreadChatCount} color="error">
                      {item.icon}
                    </Badge>
                  ) : (
                    item.icon
                  )}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </div>
  );

  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - clamp(240px, 30vw, 280px))` },
          ml: { sm: 'clamp(240px, 30vw, 280px)' },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography 
            variant="h6" 
            noWrap 
            component="div" 
            sx={{ 
              flexGrow: 1,
              fontSize: { xs: 'clamp(0.875rem, 3vw, 1rem)', sm: 'clamp(1rem, 2vw, 1.25rem)' }
            }}
          >
            User Management System
          </Typography>
          {user && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {/* Notification Icon for Clients */}
              {user.userType === 'CLIENT' && (
                <>
                  <IconButton
                    color="inherit"
                    onClick={handleNotificationMenuOpen}
                    sx={{ mr: 1 }}
                  >
                    <Badge badgeContent={clientNotificationCount > 0 ? clientNotificationCount : undefined} color="error">
                      <NotificationIcon />
                    </Badge>
                  </IconButton>
                  <Menu
                    anchorEl={notificationMenuAnchor}
                    open={Boolean(notificationMenuAnchor)}
                    onClose={handleNotificationMenuClose}
                    PaperProps={{
                      sx: {
                        width: 400,
                        maxHeight: 500,
                        mt: 1.5,
                      },
                    }}
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'right',
                    }}
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'right',
                    }}
                  >
                    <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                      <MuiTypography variant="h6" component="div">
                        Notifications
                      </MuiTypography>
                    </Box>
                    {loadingNotifications ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                        <CircularProgress size={24} />
                      </Box>
                    ) : clientNotifications.length === 0 ? (
                      <Box sx={{ p: 3, textAlign: 'center' }}>
                        <MuiTypography variant="body2" color="text.secondary">
                          No notifications
                        </MuiTypography>
                      </Box>
                    ) : (
                      <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                        {clientNotifications.map((notification) => (
                          <MenuItem
                            key={notification.notificationId}
                            onClick={() => handleNotificationClick(notification)}
                            sx={{
                              borderLeft: !notification.isRead ? '4px solid #1976d2' : '4px solid transparent',
                              bgcolor: !notification.isRead ? 'action.hover' : 'inherit',
                              '&:hover': {
                                bgcolor: 'action.selected',
                              },
                            }}
                          >
                            <ListItemAvatar>
                              <Avatar sx={{ bgcolor: notification.isRead ? 'grey.300' : 'primary.main' }}>
                                <NotificationIcon />
                              </Avatar>
                            </ListItemAvatar>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <MuiTypography variant="body2" noWrap sx={{ fontWeight: notification.isRead ? 'normal' : 'bold' }}>
                                {notification.message}
                              </MuiTypography>
                              <MuiTypography variant="caption" color="text.secondary" display="block">
                                {formatDate(notification.createdAt)}
                              </MuiTypography>
                              <MuiTypography variant="caption" color="text.secondary" display="block">
                                {notification.businessName}
                              </MuiTypography>
                              {notification.notificationType === 'STOCK_AVAILABLE' && notification.deliveryDate && (
                                <MuiTypography variant="caption" color="primary" display="block" sx={{ fontWeight: 'bold' }}>
                                  Available Date: {new Date(notification.deliveryDate).toLocaleDateString()}
                                </MuiTypography>
                              )}
                            </Box>
                            {!notification.isRead && (
                              <Box
                                sx={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: '50%',
                                  bgcolor: 'primary.main',
                                  ml: 1,
                                }}
                              />
                            )}
                          </MenuItem>
                        ))}
                      </Box>
                    )}
                    {clientNotifications.length > 0 && (
                      <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider', textAlign: 'center' }}>
                        <MenuItem
                          onClick={() => {
                            handleNotificationMenuClose();
                            navigate('/client-dashboard');
                          }}
                          sx={{ justifyContent: 'center' }}
                        >
                          View All Notifications
                        </MenuItem>
                      </Box>
                    )}
                  </Menu>
                </>
              )}
              
              {/* Cart Icon for Clients */}
              {user.userType === 'CLIENT' && (
                <IconButton
                  color="inherit"
                  onClick={openCart}
                  sx={{ mr: 1 }}
                >
                  <Badge badgeContent={getCartItemCount() > 0 ? getCartItemCount() : 0} color="error">
                    <CartIcon />
                  </Badge>
                </IconButton>
              )}
              
              {/* Notification Icon for Vendors */}
              {user.userType === 'VENDOR' && (
                <>
                  <IconButton
                    color="inherit"
                    onClick={handleVendorNotificationMenuOpen}
                    sx={{ mr: 1 }}
                  >
                    <Badge badgeContent={vendorNotificationCount > 0 ? vendorNotificationCount : undefined} color="error">
                      <NotificationIcon />
                    </Badge>
                  </IconButton>
                  <Menu
                    anchorEl={vendorNotificationMenuAnchor}
                    open={Boolean(vendorNotificationMenuAnchor)}
                    onClose={handleVendorNotificationMenuClose}
                    PaperProps={{
                      sx: {
                        width: 400,
                        maxHeight: 500,
                        mt: 1.5,
                      },
                    }}
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'right',
                    }}
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'right',
                    }}
                  >
                    <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                      <MuiTypography variant="h6" component="div">
                        Notifications
                      </MuiTypography>
                    </Box>
                    {loadingVendorNotifications ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                        <CircularProgress size={24} />
                      </Box>
                    ) : vendorNotifications.length === 0 ? (
                      <Box sx={{ p: 3, textAlign: 'center' }}>
                        <MuiTypography variant="body2" color="text.secondary">
                          No notifications
                        </MuiTypography>
                      </Box>
                    ) : (
                      <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                        {vendorNotifications.slice(0, 10).map((notification) => (
                          <MenuItem
                            key={notification.notificationId}
                            onClick={() => handleVendorNotificationClick(notification)}
                            sx={{
                              borderLeft: !notification.isRead ? '4px solid #1976d2' : '4px solid transparent',
                              bgcolor: !notification.isRead ? 'action.hover' : 'inherit',
                              '&:hover': {
                                bgcolor: 'action.selected',
                              },
                            }}
                          >
                            <ListItemAvatar>
                              <Avatar sx={{ bgcolor: notification.isRead ? 'grey.300' : 'primary.main' }}>
                                <NotificationIcon />
                              </Avatar>
                            </ListItemAvatar>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <MuiTypography variant="body2" noWrap sx={{ fontWeight: notification.isRead ? 'normal' : 'bold' }}>
                                {notification.message}
                              </MuiTypography>
                              <MuiTypography variant="caption" color="text.secondary" display="block">
                                {formatDate(notification.createdAt)}
                              </MuiTypography>
                              {notification.orderId && (
                                <MuiTypography variant="caption" color="text.secondary" display="block">
                                  {notification.businessName}
                                </MuiTypography>
                              )}
                            </Box>
                            {!notification.isRead && (
                              <Box
                                sx={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: '50%',
                                  bgcolor: 'primary.main',
                                  ml: 1,
                                }}
                              />
                            )}
                          </MenuItem>
                        ))}
                      </Box>
                    )}
                    {vendorNotifications.length > 0 && (
                      <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider', textAlign: 'center' }}>
                        <MenuItem
                          onClick={() => {
                            handleVendorNotificationMenuClose();
                            // For catering vendors, navigate to Notifications tab (index 4) in dashboard
                            // For other vendors, navigate to separate orders page
                            if (isCateringBusiness) {
                              navigate('/vendor-dashboard', { state: { activeTab: 4 } });
                            } else {
                              navigate('/vendor-orders-notifications');
                            }
                          }}
                          sx={{ justifyContent: 'center' }}
                        >
                          View All Notifications
                        </MenuItem>
                      </Box>
                    )}
                  </Menu>
                </>
              )}
              
              {/* Chat Icon for Both Clients and Vendors */}
              <IconButton
                color="inherit"
                onClick={() => navigate(user.userType === 'CLIENT' ? '/client-chat' : '/vendor-chat')}
                sx={{ mr: 1 }}
              >
                <Badge badgeContent={unreadChatCount > 0 ? unreadChatCount : 0} color="error">
                  <ChatIcon />
                </Badge>
              </IconButton>
              <Typography 
                variant="body2" 
                sx={{ 
                  mr: { xs: 1, sm: 2 },
                  fontSize: { xs: 'clamp(0.75rem, 2vw, 0.875rem)', sm: 'clamp(0.875rem, 1.5vw, 1rem)' },
                  display: { xs: 'none', sm: 'block' }
                }}
              >
                Welcome, {user.firstName}
              </Typography>
              <IconButton
                size="large"
                edge="end"
                aria-label="account of current user"
                aria-controls="user-menu"
                aria-haspopup="true"
                onClick={handleUserMenuOpen}
                color="inherit"
              >
              <Avatar sx={{ 
                width: { xs: 'clamp(28px, 4vw, 32px)', sm: 'clamp(32px, 4vw, 40px)' },
                height: { xs: 'clamp(28px, 4vw, 32px)', sm: 'clamp(32px, 4vw, 40px)' },
                fontSize: { xs: 'clamp(0.875rem, 2vw, 1rem)', sm: 'clamp(1rem, 2vw, 1.25rem)' }
              }}>
                {user.firstName.charAt(0).toUpperCase()}
              </Avatar>
              </IconButton>
              <Menu
                id="user-menu"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleUserMenuClose}
              >
                <MenuItem disabled>
                  <Typography variant="body2" color="text.secondary">
                    {user.email}
                  </Typography>
                </MenuItem>
                <MenuItem disabled>
                  <Typography variant="body2" color="text.secondary">
                    Role: {user.userType}
                  </Typography>
                </MenuItem>
                {user.userType === 'VENDOR' && vendorCategories.length > 0 && (
                  <MenuItem disabled>
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Category:
                      </Typography>
                      <Box display="flex" gap={0.5} flexWrap="wrap" mt={0.5}>
                        {vendorCategories.map((category, index) => (
                          <Chip
                            key={index}
                            label={category}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </Box>
                  </MenuItem>
                )}
                <Divider />
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <Logout fontSize="small" />
                  </ListItemIcon>
                  Logout
                </MenuItem>
              </Menu>
            </Box>
          )}
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ 
          width: { sm: 'clamp(240px, 30vw, 280px)' }, 
          flexShrink: { sm: 0 } 
        }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: 'clamp(240px, 70vw, 280px)',
              padding: 'clamp(0.5rem, 1vw, 1rem)'
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: 'clamp(240px, 30vw, 280px)',
              padding: 'clamp(0.5rem, 1vw, 1rem)'
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Cart open={isCartOpen} onClose={closeCart} />
    </>
  );
};

export default Navigation;
