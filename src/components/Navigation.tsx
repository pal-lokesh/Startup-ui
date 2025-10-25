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
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import Cart from './Cart';
import notificationService from '../services/notificationService';
import chatService from '../services/chatService';

const drawerWidth = 240;

const Navigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { getCartItemCount } = useCart();
  const [cartOpen, setCartOpen] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [notificationCount, setNotificationCount] = React.useState(0);
  const [unreadChatCount, setUnreadChatCount] = React.useState(0);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleUserMenuClose();
  };

  // Fetch notification count for vendors
  React.useEffect(() => {
    if (user && user.userType === 'VENDOR') {
      const fetchNotificationCount = async () => {
        try {
          const count = await notificationService.getNotificationCount(user.phoneNumber);
          setNotificationCount(count);
        } catch (error) {
          console.error('Error fetching notification count:', error);
        }
      };
      
      fetchNotificationCount();
      // Refresh every 30 seconds
      const interval = setInterval(fetchNotificationCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

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
    { text: 'Explore', icon: <PaletteIcon />, path: '/explore' },
  ];

  const vendorItems = [
    { text: 'My Business', icon: <BusinessIcon />, path: '/vendor-dashboard' },
    { 
      text: unreadChatCount > 0 ? `Chat (${unreadChatCount})` : 'Chat', 
      icon: <ChatIcon />, 
      path: '/vendor-chat' 
    },
    { text: 'Explore', icon: <PaletteIcon />, path: '/explore' },
  ];

  const adminItems = [
    { text: 'Users', icon: <PeopleIcon />, path: '/users' },
    { text: 'Vendors', icon: <BusinessIcon />, path: '/vendors' },
    { text: 'Businesses', icon: <StoreIcon />, path: '/businesses' },
    { text: 'Themes', icon: <PaletteIcon />, path: '/themes' },
    { text: 'Images', icon: <ImageIcon />, path: '/images' },
  ];

  const menuItems = user && (user.role === 'ADMIN' || user.role === 'VENDOR_ADMIN')
    ? [{ text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' }, ...baseItems, ...adminItems]
    : user && user.userType === 'CLIENT'
    ? clientItems
    : user && user.userType === 'VENDOR'
    ? vendorItems
    : baseItems;

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Record Service
        </Typography>
      </Toolbar>
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              component={Link}
              to={item.path}
              selected={location.pathname === item.path}
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
        ))}
      </List>
    </div>
  );

  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
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
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            User Management System
          </Typography>
          {user && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {/* Cart Icon for Clients */}
              {user.userType === 'CLIENT' && (
                <IconButton
                  color="inherit"
                  onClick={() => setCartOpen(true)}
                  sx={{ mr: 1 }}
                >
                  <CartIcon />
                  {getCartItemCount() > 0 && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        backgroundColor: 'error.main',
                        color: 'white',
                        borderRadius: '50%',
                        width: 20,
                        height: 20,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                      }}
                    >
                      {getCartItemCount()}
                    </Box>
                  )}
                </IconButton>
              )}
              
              {/* Notification Icon for Vendors */}
              {user.userType === 'VENDOR' && (
                <IconButton
                  color="inherit"
                  onClick={() => navigate('/vendor-dashboard')}
                  sx={{ mr: 1 }}
                >
                  <NotificationIcon />
                  {notificationCount > 0 && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        backgroundColor: 'error.main',
                        color: 'white',
                        borderRadius: '50%',
                        width: 20,
                        height: 20,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                      }}
                    >
                      {notificationCount}
                    </Box>
                  )}
                </IconButton>
              )}
              
              {/* Chat Icon for Both Clients and Vendors */}
              <IconButton
                color="inherit"
                onClick={() => navigate(user.userType === 'CLIENT' ? '/client-chat' : '/vendor-chat')}
                sx={{ mr: 1 }}
              >
                <ChatIcon />
                {unreadChatCount > 0 && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      backgroundColor: 'error.main',
                      color: 'white',
                      borderRadius: '50%',
                      width: 20,
                      height: 20,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                    }}
                  >
                    {unreadChatCount}
                  </Box>
                )}
              </IconButton>
              <Typography variant="body2" sx={{ mr: 2 }}>
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
                <Avatar sx={{ width: 32, height: 32 }}>
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
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
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
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Cart open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
};

export default Navigation;
