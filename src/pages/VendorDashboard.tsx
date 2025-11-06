import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  Paper,
  Button,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Business as BusinessIcon,
  Palette as PaletteIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Language as WebsiteIcon,
  Schedule as ScheduleIcon,
  Edit as EditIcon,
  Chat as ChatIcon,
  Notifications as NotificationIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import BusinessService from '../services/businessService';
import ThemeService from '../services/themeService';
import InventoryService from '../services/inventoryService';
import PlateService from '../services/plateService';
import { Business, Theme, Inventory, Plate } from '../types';
import { Order } from '../types/cart';
import BusinessManagementForm from '../components/BusinessManagementForm';
import ThemeManagement from '../components/ThemeManagement';
import BusinessSelector from '../components/BusinessSelector';
import ThemeCard from '../components/ThemeCard';
import InventoryManagementForm from '../components/InventoryManagementForm';
import InventoryCard from '../components/InventoryCard';
import InventoryImages from '../components/InventoryImages';
import PlateManagementForm from '../components/PlateManagementForm';
import PlateCard from '../components/PlateCard';
import orderService from '../services/orderService';
import notificationService from '../services/notificationService';
import chatService from '../services/chatService';
import { useNavigate } from 'react-router-dom';

const VendorDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [plates, setPlates] = useState<Plate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [businessFormOpen, setBusinessFormOpen] = useState(false);
  const [inventoryFormOpen, setInventoryFormOpen] = useState(false);
  const [editingInventory, setEditingInventory] = useState<Inventory | null>(null);
  const [inventoryImagesOpen, setInventoryImagesOpen] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState<Inventory | null>(null);
  const [inventoryRefreshTrigger, setInventoryRefreshTrigger] = useState(0);
  const [plateFormOpen, setPlateFormOpen] = useState(false);
  const [editingPlate, setEditingPlate] = useState<Plate | null>(null);
  
  // Order management state
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  
  // Notification state
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  useEffect(() => {
    const fetchVendorData = async () => {
      if (!user?.phoneNumber) {
        setError('User phone number not available');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Get all businesses for this vendor
        const businessesData = await BusinessService.getBusinessesByVendorPhoneNumber(user.phoneNumber);
        setBusinesses(businessesData);
        
        // Auto-select first business if available
        if (businessesData.length > 0) {
          setSelectedBusiness(businessesData[0]);
          const business = businessesData[0];
          
          // Fetch data based on business category
          if (business.businessCategory === 'caters') {
            // For catering businesses, only fetch plates
            const platesData = await PlateService.getPlatesByBusinessId(business.businessId);
            setPlates(platesData);
            setThemes([]);
            setInventory([]);
          } else {
            // For non-catering businesses, fetch themes and inventory
            const [themesData, inventoryData] = await Promise.all([
              ThemeService.getThemesByBusinessId(business.businessId),
              InventoryService.getInventoryByBusinessId(business.businessId)
            ]);
            setThemes(themesData);
            setInventory(inventoryData);
            setPlates([]);
          }
        } else {
          setSelectedBusiness(null);
          setThemes([]);
          setInventory([]);
          setPlates([]);
        }
        
      } catch (err: any) {
        if (err.response?.status === 404) {
          // 404 is expected for new vendors - no business profile exists yet
          setBusinesses([]);
          setSelectedBusiness(null);
          setThemes([]);
        } else if (err.response?.status === 403) {
          setError('Access denied. Please ensure you are logged in and have the correct permissions.');
        } else {
          setError('Failed to fetch business data. Please try again later.');
        }
        console.error('Error fetching vendor data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchVendorData();
    
    // Fetch notification count
    if (user?.phoneNumber) {
      fetchNotificationCount();
      fetchUnreadChatCount();
    }
  }, [user?.phoneNumber]);

  // Refresh unread counts when component mounts or user changes
  useEffect(() => {
    if (user?.phoneNumber) {
      const interval = setInterval(() => {
        fetchNotificationCount();
        fetchUnreadChatCount();
      }, 30000); // Refresh every 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [user?.phoneNumber]);

  const handleBusinessSelect = async (business: Business) => {
    setSelectedBusiness(business);
    try {
      // Fetch data based on business category
      if (business.businessCategory === 'caters') {
        // For catering businesses, only fetch plates
        const platesData = await PlateService.getPlatesByBusinessId(business.businessId);
        setPlates(platesData);
        setThemes([]);
        setInventory([]);
      } else {
        // For non-catering businesses, fetch themes and inventory
        const [themesData, inventoryData] = await Promise.all([
          ThemeService.getThemesByBusinessId(business.businessId),
          InventoryService.getInventoryByBusinessId(business.businessId)
        ]);
        setThemes(themesData);
        setInventory(inventoryData);
        setPlates([]);
      }
    } catch (err) {
      console.error('Error fetching business data:', err);
      setThemes([]);
      setInventory([]);
      setPlates([]);
    }
  };

  const handleBusinessesChange = (updatedBusinesses: Business[]) => {
    setBusinesses(updatedBusinesses);
  };

  const handleBusinessSuccess = async (updatedBusiness: Business) => {
    setBusinessFormOpen(false);
    
    // Update businesses list
    const updatedBusinesses = businesses.some(b => b.businessId === updatedBusiness.businessId)
      ? businesses.map(b => b.businessId === updatedBusiness.businessId ? updatedBusiness : b)
      : [...businesses, updatedBusiness];
    
    setBusinesses(updatedBusinesses);
    
    // If this was a new business or the selected business was updated, select it
    if (!selectedBusiness || selectedBusiness.businessId === updatedBusiness.businessId) {
      setSelectedBusiness(updatedBusiness);
      try {
        // Fetch data based on business category
        if (updatedBusiness.businessCategory === 'caters') {
          // For catering businesses, only fetch plates
          const platesData = await PlateService.getPlatesByBusinessId(updatedBusiness.businessId);
          setPlates(platesData);
          setThemes([]);
          setInventory([]);
        } else {
          // For non-catering businesses, fetch themes and inventory
          const [themesData, inventoryData] = await Promise.all([
            ThemeService.getThemesByBusinessId(updatedBusiness.businessId),
            InventoryService.getInventoryByBusinessId(updatedBusiness.businessId)
          ]);
          setThemes(themesData);
          setInventory(inventoryData);
          setPlates([]);
        }
      } catch (err) {
        console.error('Error fetching data after business update:', err);
        setThemes([]);
        setInventory([]);
        setPlates([]);
      }
    }
  };

  const handleThemesChange = (updatedThemes: Theme[]) => {
    setThemes(updatedThemes);
  };

  const handleInventorySuccess = async () => {
    setInventoryFormOpen(false);
    setEditingInventory(null);
    
    if (selectedBusiness) {
      try {
        const inventoryData = await InventoryService.getInventoryByBusinessId(selectedBusiness.businessId);
        setInventory(inventoryData);
      } catch (err) {
        console.error('Error fetching inventory after update:', err);
      }
    }
  };

  const handleEditInventory = (inventory: Inventory) => {
    setEditingInventory(inventory);
    setInventoryFormOpen(true);
  };

  const handleDeleteInventory = async (inventoryId: string) => {
    if (!window.confirm('Are you sure you want to delete this inventory item?')) {
      return;
    }

    try {
      await InventoryService.deleteInventory(inventoryId, user?.phoneNumber);
      const updatedInventory = inventory.filter(item => item.inventoryId !== inventoryId);
      setInventory(updatedInventory);
    } catch (err: any) {
      console.error('Error deleting inventory:', err);
      alert(err.message || 'Failed to delete inventory item');
    }
  };

  const handleViewInventoryImages = (inventory: Inventory) => {
    setSelectedInventory(inventory);
    setInventoryImagesOpen(true);
  };

  const handleInventoryImagesClose = async () => {
    setInventoryImagesOpen(false);
    setSelectedInventory(null);
    
    // Refresh inventory data to show updated images
    if (selectedBusiness) {
      try {
        const inventoryData = await InventoryService.getInventoryByBusinessId(selectedBusiness.businessId);
        setInventory(inventoryData);
        // Increment refresh trigger to force InventoryCard to re-fetch images
        setInventoryRefreshTrigger(prev => prev + 1);
      } catch (err) {
        console.error('Error refreshing inventory after image update:', err);
      }
    }
  };

  const handlePriceUpdate = async (inventoryId: string, newPrice: number) => {
    // Update the local inventory state
    const updatedInventory = inventory.map(item => 
      item.inventoryId === inventoryId 
        ? { ...item, price: newPrice }
        : item
    );
    setInventory(updatedInventory);
  };

  // Plate management handlers
  const handleAddPlate = () => {
    setEditingPlate(null);
    setPlateFormOpen(true);
  };

  const handleEditPlate = (plate: Plate) => {
    setEditingPlate(plate);
    setPlateFormOpen(true);
  };

  const handlePlateSuccess = async (updatedPlate: Plate) => {
    setPlateFormOpen(false);
    setEditingPlate(null);
    
    // Update plates list
    const updatedPlates = plates.some(p => p.plateId === updatedPlate.plateId)
      ? plates.map(p => p.plateId === updatedPlate.plateId ? updatedPlate : p)
      : [...plates, updatedPlate];
    
    setPlates(updatedPlates);
  };

  const handlePlateDelete = (plateId: string) => {
    setPlates(plates.filter(p => p.plateId !== plateId));
  };

  const handlePlateUpdate = (updatedPlate: Plate) => {
    setPlates(plates.map(p => p.plateId === updatedPlate.plateId ? updatedPlate : p));
  };

  const fetchNotificationCount = async () => {
    if (!user?.phoneNumber) return;
    
    try {
      const count = await notificationService.getNotificationCount(user.phoneNumber);
      setUnreadNotificationCount(count);
    } catch (err: any) {
      console.error('Error fetching notification count:', err);
    }
  };

  const fetchUnreadChatCount = async () => {
    if (!user?.phoneNumber) return;
    
    try {
      const count = await chatService.getTotalUnreadCount(user.phoneNumber);
      setUnreadChatCount(count);
    } catch (err: any) {
      console.error('Error fetching unread chat count:', err);
    }
  };

  // Helper function to get the correct Orders tab index
  const getOrdersTabIndex = () => {
    if (!selectedBusiness) return -1;
    let index = 1; // Start after Overview tab
    if (selectedBusiness.businessCategory !== 'caters') {
      index += 2; // Themes + Inventory tabs
    } else {
      index += 1; // Plates tab only
    }
    return index;
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    
    // Fetch orders when Orders tab is selected
    if (newValue === getOrdersTabIndex() && selectedBusiness) {
      fetchOrdersForBusiness();
      fetchNotificationCount(); // Also fetch notification count
    }
  };

  const fetchOrdersForBusiness = async () => {
    if (!selectedBusiness) return;
    
    try {
      setOrdersLoading(true);
      setOrdersError(null);
      console.log('Fetching orders for business:', selectedBusiness.businessId);
      const ordersData = await orderService.getOrdersByBusinessId(selectedBusiness.businessId);
      console.log('Orders fetched:', ordersData);
      setOrders(ordersData);
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setOrdersError(err.message || 'Failed to fetch orders');
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleOrderStatusUpdate = async (orderId: string, newStatus: Order['status']) => {
    try {
      await orderService.updateOrderStatus(orderId, newStatus);
      // Refresh orders after status update
      await fetchOrdersForBusiness();
    } catch (err: any) {
      console.error('Error updating order status:', err);
      setOrdersError(err.message || 'Failed to update order status');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (businesses.length === 0) {
    return (
      <Box sx={{ mt: 2 }}>
        <BusinessSelector
          userPhoneNumber={user?.phoneNumber || ''}
          selectedBusiness={selectedBusiness}
          onBusinessSelect={handleBusinessSelect}
          onBusinessesChange={handleBusinessesChange}
        />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            My Business Dashboard
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            Welcome back, {user?.firstName}! Here's your business overview.
          </Typography>
        </Box>
        {selectedBusiness && (
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => setBusinessFormOpen(true)}
          >
            Edit Business
          </Button>
        )}
      </Box>

      {/* Business Selector */}
      <Box sx={{ mb: 3 }}>
        <BusinessSelector
          userPhoneNumber={user?.phoneNumber || ''}
          selectedBusiness={selectedBusiness}
          onBusinessSelect={handleBusinessSelect}
          onBusinessesChange={handleBusinessesChange}
        />
      </Box>

      {/* Quick Access Section */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
          Quick Access
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                '&:hover': { 
                  boxShadow: 4,
                  transform: 'translateY(-2px)',
                  transition: 'all 0.2s ease-in-out'
                }
              }}
              onClick={() => navigate('/vendor-chat')}
            >
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box display="flex" alignItems="center">
                    {unreadChatCount > 0 ? (
                      <Box sx={{ position: 'relative', mr: 2 }}>
                        <ChatIcon color="primary" sx={{ fontSize: 32 }} />
                        <Box
                          sx={{
                            position: 'absolute',
                            top: -8,
                            right: -8,
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
                      </Box>
                    ) : (
                      <ChatIcon color="primary" sx={{ mr: 2, fontSize: 32 }} />
                    )}
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        Chat with Clients
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {unreadChatCount > 0 
                          ? `${unreadChatCount} unread message${unreadChatCount > 1 ? 's' : ''}`
                          : 'Communicate with your clients'
                        }
                      </Typography>
                    </Box>
                  </Box>
                  <ArrowForwardIcon color="action" />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                '&:hover': { 
                  boxShadow: 4,
                  transform: 'translateY(-2px)',
                  transition: 'all 0.2s ease-in-out'
                }
              }}
              onClick={() => setActiveTab(4)} // Orders tab
            >
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box display="flex" alignItems="center">
                    <NotificationIcon 
                      color={unreadNotificationCount > 0 ? "error" : "primary"} 
                      sx={{ mr: 2, fontSize: 32 }} 
                    />
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        Orders & Notifications
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {unreadNotificationCount > 0 
                          ? `${unreadNotificationCount} unread notifications`
                          : 'View your orders and notifications'
                        }
                      </Typography>
                    </Box>
                  </Box>
                  <ArrowForwardIcon color="action" />
                </Box>
                {unreadNotificationCount > 0 && (
                  <Chip 
                    label={`${unreadNotificationCount} New`} 
                    color="error" 
                    size="small"
                    sx={{ mt: 1 }}
                  />
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {selectedBusiness && (
        <>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={activeTab} onChange={handleTabChange}>
              <Tab label="Overview" />
              {selectedBusiness.businessCategory !== 'caters' && <Tab label="Themes" />}
              {selectedBusiness.businessCategory !== 'caters' && <Tab label="Inventory" />}
              {selectedBusiness.businessCategory === 'caters' && <Tab label="Plates" />}
              <Tab 
                label={
                  unreadNotificationCount > 0 
                    ? `Orders (${unreadNotificationCount})` 
                    : "Orders"
                } 
              />
            </Tabs>
          </Box>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Box>
          {/* Business Information Card */}
          <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <BusinessIcon sx={{ fontSize: 32, color: 'primary.main', mr: 1 }} />
                <Typography variant="h5" component="h2">
                  {selectedBusiness.businessName}
                </Typography>
                <Box ml="auto">
                  <Chip 
                    label={selectedBusiness.isActive ? 'Active' : 'Inactive'} 
                    color={selectedBusiness.isActive ? 'success' : 'default'}
                    size="small"
                  />
                </Box>
              </Box>
              
              <Typography variant="body1" color="text.secondary" paragraph>
                {selectedBusiness.businessDescription}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" mb={1}>
                    <LocationIcon sx={{ fontSize: 20, color: 'text.secondary', mr: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      Address
                    </Typography>
                  </Box>
                  <Typography variant="body1">
                    {selectedBusiness.businessAddress}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" mb={1}>
                    <PhoneIcon sx={{ fontSize: 20, color: 'text.secondary', mr: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      Phone
                    </Typography>
                  </Box>
                  <Typography variant="body1">
                    {selectedBusiness.businessPhone}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" mb={1}>
                    <EmailIcon sx={{ fontSize: 20, color: 'text.secondary', mr: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      Email
                    </Typography>
                  </Box>
                  <Typography variant="body1">
                    {selectedBusiness.businessEmail}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" mb={1}>
                    <PaletteIcon sx={{ fontSize: 20, color: 'text.secondary', mr: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      Category
                    </Typography>
                  </Box>
                  <Typography variant="body1">
                    {selectedBusiness.businessCategory}
                  </Typography>
                </Grid>


                {selectedBusiness.website && (
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" mb={1}>
                      <WebsiteIcon sx={{ fontSize: 20, color: 'text.secondary', mr: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        Website
                      </Typography>
                    </Box>
                    <Typography variant="body1">
                      {selectedBusiness.website}
                    </Typography>
                  </Grid>
                )}

                {selectedBusiness.operatingHours && (
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" mb={1}>
                      <ScheduleIcon sx={{ fontSize: 20, color: 'text.secondary', mr: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        Hours
                      </Typography>
                    </Box>
                    <Typography variant="body1">
                      {selectedBusiness.operatingHours}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Stats Card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Business Statistics
              </Typography>
              
              <Box display="flex" alignItems="center" mb={2}>
                <PaletteIcon sx={{ fontSize: 24, color: 'primary.main', mr: 1 }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {themes.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Themes
                  </Typography>
                </Box>
              </Box>

              <Box display="flex" alignItems="center" mb={2}>
                <BusinessIcon sx={{ fontSize: 24, color: 'success.main', mr: 1 }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {themes.filter(theme => theme.isActive).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Themes
                  </Typography>
                </Box>
              </Box>

              <Box display="flex" alignItems="center">
                <ScheduleIcon sx={{ fontSize: 24, color: 'info.main', mr: 1 }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {new Date(selectedBusiness.createdAt).toLocaleDateString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Joined Date
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

          {/* Themes Section - Only show for non-catering businesses */}
          {selectedBusiness.businessCategory !== 'caters' && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h5" gutterBottom>
                My Themes ({themes.length})
              </Typography>
              
              {themes.length === 0 ? (
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <PaletteIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No themes created yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Start by creating your first theme to showcase your work.
                  </Typography>
                </Paper>
              ) : (
                <Grid container spacing={2}>
                  {themes.map((theme) => (
                    <Grid item xs={12} sm={6} md={4} key={theme.themeId}>
                      <ThemeCard
                        theme={theme}
                        onEdit={(theme) => {
                          // Navigate to Theme Management tab or open edit form
                          setActiveTab(1);
                          // ThemeManagement component will handle the edit
                        }}
                        onDelete={async (theme) => {
                          if (!window.confirm(`Are you sure you want to delete "${theme.themeName}"?`)) {
                            return;
                          }
                          try {
                            await ThemeService.deleteTheme(theme.themeId, user?.phoneNumber);
                            setThemes(prev => prev.filter(t => t.themeId !== theme.themeId));
                          } catch (err: any) {
                            console.error('Error deleting theme:', err);
                            alert(err.message || 'Failed to delete theme');
                          }
                        }}
                        onViewImages={(theme) => {
                          // Navigate to Theme Management tab
                          setActiveTab(1);
                        }}
                        showActions={true}
                      />
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          )}

          {/* Plates Section - Only show for catering businesses */}
          {selectedBusiness.businessCategory === 'caters' && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h5" gutterBottom>
                My Plates ({plates.length})
              </Typography>
              
              {plates.length === 0 ? (
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No plates created yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Start by creating your first plate to showcase your catering dishes.
                  </Typography>
                </Paper>
              ) : (
                <Grid container spacing={2}>
                  {plates.map((plate) => (
                    <Grid item xs={12} sm={6} md={4} key={plate.plateId}>
                      <PlateCard
                        plate={plate}
                        business={selectedBusiness}
                        onEdit={handleEditPlate}
                        onDelete={handlePlateDelete}
                        onUpdate={handlePlateUpdate}
                      />
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          )}
        </Box>
      )}

          {activeTab === 1 && selectedBusiness && selectedBusiness.businessCategory !== 'caters' && (
            <ThemeManagement
              themes={themes}
              businessId={selectedBusiness.businessId}
              onThemesChange={handleThemesChange}
            />
          )}

          {activeTab === 2 && selectedBusiness && selectedBusiness.businessCategory !== 'caters' && (
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5" component="h2">
                  Inventory Management
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => setInventoryFormOpen(true)}
                >
                  Add Inventory Item
                </Button>
              </Box>

              {inventory.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No inventory items yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Start by adding your first inventory item to showcase what you offer.
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() => setInventoryFormOpen(true)}
                  >
                    Add First Inventory Item
                  </Button>
                </Paper>
              ) : (
                <Grid container spacing={3}>
                  {inventory.map((item) => (
                    <Grid item xs={12} sm={6} md={4} key={item.inventoryId}>
                      <InventoryCard
                        inventory={item}
                        onEdit={handleEditInventory}
                        onDelete={handleDeleteInventory}
                        onViewImages={handleViewInventoryImages}
                        onPriceUpdate={handlePriceUpdate}
                        showActions={true}
                        refreshTrigger={inventoryRefreshTrigger}
                      />
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          )}

          {/* Plates Tab - Only show for catering businesses */}
          {activeTab === 1 && selectedBusiness.businessCategory === 'caters' && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" gutterBottom>
                  Plate Management
                </Typography>
                <Button
                  variant="contained"
                  onClick={handleAddPlate}
                >
                  Add New Plate
                </Button>
              </Box>

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
                    onClick={handleAddPlate}
                  >
                    Add First Plate
                  </Button>
                </Paper>
              ) : (
                <Grid container spacing={3}>
                  {plates.map((plate) => (
                    <Grid item xs={12} sm={6} md={4} key={plate.plateId}>
                      <PlateCard
                        plate={plate}
                        business={selectedBusiness}
                        onEdit={handleEditPlate}
                        onDelete={handlePlateDelete}
                        onUpdate={handlePlateUpdate}
                      />
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          )}

          {/* Orders Tab */}
          {activeTab === getOrdersTabIndex() && selectedBusiness && (
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5" component="h2">
                  Orders for {selectedBusiness.businessName}
                  {unreadNotificationCount > 0 && (
                    <Chip 
                      label={`${unreadNotificationCount} New`} 
                      color="primary" 
                      size="small" 
                      sx={{ ml: 2 }}
                    />
                  )}
                </Typography>
                <Button 
                  variant="outlined" 
                  onClick={fetchOrdersForBusiness}
                  disabled={ordersLoading}
                >
                  Refresh Orders
                </Button>
              </Box>

              {/* Notification Banner */}
              {unreadNotificationCount > 0 && (
                <Alert 
                  severity="info" 
                  sx={{ mb: 2 }}
                  action={
                    <Button 
                      color="inherit" 
                      size="small" 
                      onClick={() => {
                        // Mark all notifications as read
                        if (user?.phoneNumber) {
                          notificationService.markAllAsRead(user.phoneNumber);
                          fetchNotificationCount();
                        }
                      }}
                    >
                      Mark All Read
                    </Button>
                  }
                >
                  You have {unreadNotificationCount} unread order notification{unreadNotificationCount > 1 ? 's' : ''}!
                </Alert>
              )}

              {ordersError && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setOrdersError(null)}>
                  {ordersError}
                </Alert>
              )}

              {ordersLoading ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                  <CircularProgress />
                </Box>
              ) : orders.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No orders yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Orders from customers will appear here once they place them.
                  </Typography>
                </Paper>
              ) : (
                <Grid container spacing={3}>
                  {orders.map((order) => (
                    <Grid item xs={12} key={order.orderId}>
                      <Card>
                        <CardContent>
                          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                            <Box>
                              <Box display="flex" alignItems="center" gap={1} mb={1}>
                                <Typography variant="h6">
                                  Order #{order.orderId}
                                </Typography>
                                {/* Show NEW indicator for recent orders (within last 24 hours) */}
                                {new Date(order.orderDate).getTime() > Date.now() - 24 * 60 * 60 * 1000 && (
                                  <Chip 
                                    label="NEW" 
                                    color="primary" 
                                    size="small"
                                    sx={{ fontWeight: 'bold' }}
                                  />
                                )}
                              </Box>
                              <Typography variant="body2" color="text.secondary">
                                Customer: {order.customerName}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Email: {order.customerEmail}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Phone: {order.customerPhone}
                              </Typography>
                            </Box>
                            <Box textAlign="right">
                              <Chip 
                                label={order.status} 
                                color={
                                  order.status === 'PENDING' ? 'warning' :
                                  order.status === 'CONFIRMED' ? 'info' :
                                  order.status === 'PREPARING' ? 'primary' :
                                  order.status === 'READY' ? 'success' :
                                  order.status === 'DELIVERED' ? 'success' :
                                  'error'
                                }
                                sx={{ mb: 1 }}
                              />
                              <Typography variant="h6" color="primary">
                                ₹{order.totalAmount}
                              </Typography>
                            </Box>
                          </Box>

                          <Divider sx={{ my: 2 }} />

                          <Typography variant="subtitle2" gutterBottom>
                            Order Items:
                          </Typography>
                          {order.orderItems.map((item, index) => (
                            <Box key={index} display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                              <Box>
                                <Typography variant="body2">
                                  {item.itemName} ({item.itemType})
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Qty: {item.quantity} × ₹{item.itemPrice}
                                </Typography>
                              </Box>
                              <Typography variant="body2" fontWeight="bold">
                                ₹{item.itemPrice * item.quantity}
                              </Typography>
                            </Box>
                          ))}

                          <Divider sx={{ my: 2 }} />

                          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                Order Date: {new Date(order.orderDate).toLocaleString()}
                              </Typography>
                              {order.deliveryDate && (
                                <Typography variant="body2" color="text.secondary">
                                  Delivery Date: {new Date(order.deliveryDate).toLocaleDateString()}
                                </Typography>
                              )}
                              {order.specialNotes && (
                                <Typography variant="body2" color="text.secondary">
                                  Notes: {order.specialNotes}
                                </Typography>
                              )}
                            </Box>
                            <Box display="flex" gap={1}>
                              {order.status === 'PENDING' && (
                                <Button
                                  variant="contained"
                                  color="success"
                                  size="small"
                                  onClick={() => handleOrderStatusUpdate(order.orderId.toString(), 'CONFIRMED')}
                                >
                                  Confirm Order
                                </Button>
                              )}
                              {order.status === 'CONFIRMED' && (
                                <Button
                                  variant="contained"
                                  color="primary"
                                  size="small"
                                  onClick={() => handleOrderStatusUpdate(order.orderId.toString(), 'PREPARING')}
                                >
                                  Start Preparing
                                </Button>
                              )}
                              {order.status === 'PREPARING' && (
                                <Button
                                  variant="contained"
                                  color="info"
                                  size="small"
                                  onClick={() => handleOrderStatusUpdate(order.orderId.toString(), 'READY')}
                                >
                                  Mark Ready
                                </Button>
                              )}
                              {order.status === 'READY' && (
                                <Button
                                  variant="contained"
                                  color="success"
                                  size="small"
                                  onClick={() => handleOrderStatusUpdate(order.orderId.toString(), 'DELIVERED')}
                                >
                                  Mark Delivered
                                </Button>
                              )}
                              {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
                                <Button
                                  variant="outlined"
                                  color="error"
                                  size="small"
                                  onClick={() => handleOrderStatusUpdate(order.orderId.toString(), 'CANCELLED')}
                                >
                                  Cancel
                                </Button>
                              )}
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          )}

        </>
      )}

      {/* Business Management Form */}
      <BusinessManagementForm
        open={businessFormOpen}
        onClose={() => setBusinessFormOpen(false)}
        business={selectedBusiness}
        onSuccess={handleBusinessSuccess}
      />

      {/* Inventory Management Form */}
      {selectedBusiness && (
        <InventoryManagementForm
          open={inventoryFormOpen}
          onClose={() => {
            setInventoryFormOpen(false);
            setEditingInventory(null);
          }}
          inventory={editingInventory}
          businessId={selectedBusiness.businessId}
          onSuccess={handleInventorySuccess}
        />
      )}

      {/* Inventory Images Dialog */}
      <InventoryImages
        open={inventoryImagesOpen}
        onClose={handleInventoryImagesClose}
        inventory={selectedInventory}
      />

      {/* Plate Management Form */}
      {selectedBusiness && (
        <PlateManagementForm
          open={plateFormOpen}
          onClose={() => {
            setPlateFormOpen(false);
            setEditingPlate(null);
          }}
          plate={editingPlate}
          businessId={selectedBusiness.businessId}
          onSuccess={handlePlateSuccess}
        />
      )}
    </Box>
  );
};

export default VendorDashboard;
