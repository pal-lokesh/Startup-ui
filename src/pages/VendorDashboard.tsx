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
  Inventory as InventoryIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import BusinessService from '../services/businessService';
import ThemeService from '../services/themeService';
import InventoryService from '../services/inventoryService';
import PlateService from '../services/plateService';
import dishService from '../services/dishService';
import { Business, Theme, Inventory, Plate, Dish } from '../types';
import { Order } from '../types/cart';
import { getOrderDisplayTitle } from '../utils/orderDisplay';
import BusinessManagementForm from '../components/BusinessManagementForm';
import ThemeManagement from '../components/ThemeManagement';
import BusinessSelector from '../components/BusinessSelector';
import ThemeCard from '../components/ThemeCard';
import InventoryManagementForm from '../components/InventoryManagementForm';
import InventoryCard from '../components/InventoryCard';
import InventoryImages from '../components/InventoryImages';
import PlateManagementForm from '../components/PlateManagementForm';
import PlateCard from '../components/PlateCard';
import DishManagementForm from '../components/DishManagementForm';
import DishCard from '../components/DishCard';
import orderService from '../services/orderService';
import notificationService from '../services/notificationService';
import chatService from '../services/chatService';
import { useNavigate, useLocation } from 'react-router-dom';

const VendorDashboard: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [plates, setPlates] = useState<Plate[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [businessDishesCache, setBusinessDishesCache] = useState<Record<string, Dish[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState((location.state as any)?.activeTab ?? 0);
  const [businessFormOpen, setBusinessFormOpen] = useState(false);
  const [inventoryFormOpen, setInventoryFormOpen] = useState(false);
  const [editingInventory, setEditingInventory] = useState<Inventory | null>(null);
  const [inventoryImagesOpen, setInventoryImagesOpen] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState<Inventory | null>(null);
  const [inventoryRefreshTrigger, setInventoryRefreshTrigger] = useState(0);
  const [plateFormOpen, setPlateFormOpen] = useState(false);
  const [editingPlate, setEditingPlate] = useState<Plate | null>(null);
  const [dishFormOpen, setDishFormOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  
  // Order management state
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [orderToScrollTo, setOrderToScrollTo] = useState<string | null>(null);
  const [savedScrollPosition, setSavedScrollPosition] = useState<number | null>(null);
  
  // Notification state
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [vendorNotifications, setVendorNotifications] = useState<any[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // Update activeTab when location state changes and fetch data
  useEffect(() => {
    const stateActiveTab = (location.state as any)?.activeTab;
    console.log('Location state changed:', location.state, 'activeTab from state:', stateActiveTab, 'Current activeTab:', activeTab);
    if (stateActiveTab !== undefined && stateActiveTab !== activeTab) {
      console.log('Updating activeTab from location state:', stateActiveTab, 'Current activeTab:', activeTab);
      setActiveTab(stateActiveTab);
      
      // Fetch data when navigating to Orders or Notifications tab from location state
      if (stateActiveTab === 3 && selectedBusiness && !isTentBusiness(selectedBusiness)) {
        console.log('✅ Fetching orders from location state...');
        fetchOrdersForBusiness();
      }
      
      if (stateActiveTab === 4 && selectedBusiness && !isTentBusiness(selectedBusiness)) {
        console.log('✅ Fetching notifications from location state...');
        fetchNotificationCount();
        fetchVendorNotifications();
      }
    }
  }, [location, selectedBusiness]);

  // Debug: Log activeTab changes
  useEffect(() => {
    console.log('🟢 activeTab changed to:', activeTab);
    console.log('🟢 selectedBusiness:', selectedBusiness?.businessName);
    console.log('🟢 isTentBusiness:', isTentBusiness(selectedBusiness));
    console.log('🟢 Should show Orders?', selectedBusiness && !isTentBusiness(selectedBusiness) && activeTab === 3);
  }, [activeTab, selectedBusiness]);

  // Debug: Track dishes state changes
  useEffect(() => {
    console.log('🔄 Dishes state changed. Current count:', dishes.length);
    if (dishes.length > 0) {
      console.log('📋 Current dishes:', dishes.map(d => d.dishName || d.dishId));
    }
  }, [dishes]);

  useEffect(() => {
    const fetchVendorData = async () => {
      // Wait for user to be available
      if (!user) {
        setLoading(true);
        return;
      }

      if (!user.phoneNumber) {
        setError('User phone number not available');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Get all businesses for this vendor
        const businessesData = await BusinessService.getBusinessesByVendorPhoneNumber(user.phoneNumber);
        setBusinesses(businessesData);
        
        // Auto-select first business if available
        if (businessesData.length > 0) {
          const business = businessesData[0];
          console.log('🔍 Selected business:', business.businessId, 'Category:', business.businessCategory);
          setSelectedBusiness(business);
          
          // Fetch data based on business category
          if (business.businessCategory === 'caters') {
            // For catering businesses, fetch plates and dishes
            try {
              console.log('🍽️ Fetching plates and dishes for catering business:', business.businessId);
              const [platesData, dishesData] = await Promise.all([
                PlateService.getPlatesByBusinessId(business.businessId),
                dishService.getDishesByBusinessId(business.businessId).catch(err => {
                  console.error('❌ Error fetching dishes for business:', business.businessId, err);
                  // On initial load, don't use cache (it's empty anyway), return empty array
                  return [];
                })
              ]);
              console.log('✅ Fetched dishes for business:', business.businessId, 'Count:', dishesData?.length || 0);
              console.log('📦 Dishes data:', JSON.stringify(dishesData, null, 2));
              
              setPlates(platesData || []);
              const dishesArray = Array.isArray(dishesData) ? dishesData : [];
              console.log('💾 Setting dishes state with', dishesArray.length, 'items');
              setDishes(dishesArray);
              
              // Always update cache with fetched data (even if empty)
              setBusinessDishesCache((prev) => {
                const updated = {
                  ...prev,
                  [business.businessId]: dishesArray,
                };
                console.log('💾 Updated cache for business:', business.businessId, 'with', dishesArray.length, 'items');
                return updated;
              });
              setThemes([]);
              setInventory([]);
            } catch (err: any) {
              console.error('Error fetching plates/dishes:', err);
              // Set empty arrays but don't fail the entire operation
              setPlates([]);
              // On initial load, cache is empty, so just set empty array
              setDishes([]);
              setThemes([]);
              setInventory([]);
            }
          } else {
            // For non-catering businesses, fetch themes and inventory
            try {
              const [themesData, inventoryData] = await Promise.all([
                ThemeService.getThemesByBusinessId(business.businessId),
                InventoryService.getInventoryByBusinessId(business.businessId)
              ]);
              setThemes(themesData);
              setInventory(inventoryData);
              setPlates([]);
              const cachedDishes = businessDishesCache[business.businessId] || [];
              setDishes(cachedDishes);
            } catch (err: any) {
              console.error('Error fetching themes/inventory:', err);
              // Set empty arrays but don't fail the entire operation
              setThemes([]);
              setInventory([]);
              setPlates([]);
              setDishes([]);
            }
          }
        } else {
          setSelectedBusiness(null);
          setThemes([]);
          setInventory([]);
          setPlates([]);
          setDishes([]);
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
    
    // Fetch notification count and notifications
    if (user?.phoneNumber) {
      fetchNotificationCount();
      fetchVendorNotifications(); // Also fetch notifications on load
      fetchUnreadChatCount();
    }
  }, [user, user?.phoneNumber]);

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
        // For catering businesses, fetch plates and dishes
        try {
          const [platesData, dishesData] = await Promise.all([
            PlateService.getPlatesByBusinessId(business.businessId),
            dishService.getDishesByBusinessId(business.businessId).catch(err => {
              console.warn('Error fetching dishes for business:', business.businessId, err);
              // Return cached dishes if available, otherwise empty array
              return businessDishesCache[business.businessId] || [];
            })
          ]);
          console.log('handleBusinessSelect - Fetched dishes for business:', business.businessId, 'Count:', dishesData?.length || 0, dishesData);
          setPlates(platesData);
          setDishes(dishesData || []);
          // Always update cache with fetched data (even if empty, to prevent stale cache)
          setBusinessDishesCache((prev) => ({
            ...prev,
            [business.businessId]: dishesData || [],
          }));
          setThemes([]);
          setInventory([]);
        } catch (err) {
          console.error('Error fetching plates/dishes:', err);
          // Try to use cached data as fallback
          const cachedDishes = businessDishesCache[business.businessId] || [];
          setDishes(cachedDishes);
          setPlates([]);
          setThemes([]);
          setInventory([]);
        }
      } else {
        // For non-catering businesses, fetch themes and inventory
        const [themesData, inventoryData] = await Promise.all([
          ThemeService.getThemesByBusinessId(business.businessId),
          InventoryService.getInventoryByBusinessId(business.businessId)
        ]);
        setThemes(themesData);
        setInventory(inventoryData);
        setPlates([]);
        setDishes([]);
      }
    } catch (err) {
      console.error('Error fetching business data:', err);
      setThemes([]);
      setInventory([]);
      setPlates([]);
      // Try to use cached dishes if available
      const cachedDishes = businessDishesCache[business.businessId] || [];
      setDishes(cachedDishes);
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

  const handleAddDish = () => {
    setEditingDish(null);
    setDishFormOpen(true);
  };

  const handleEditDish = (dish: Dish) => {
    setEditingDish(dish);
    setDishFormOpen(true);
  };

  const handleDishSuccess = async (updatedDish: Dish) => {
    setDishFormOpen(false);
    setEditingDish(null);
    
    // Update dishes list
    const updatedDishes = dishes.some(d => d.dishId === updatedDish.dishId)
      ? dishes.map(d => d.dishId === updatedDish.dishId ? updatedDish : d)
      : [...dishes, updatedDish];
    
    setDishes(updatedDishes);
    if (selectedBusiness) {
      setBusinessDishesCache(prev => ({
        ...prev,
        [selectedBusiness.businessId]: updatedDishes,
      }));
    }
  };

  const handleDishDelete = (dishId: string) => {
    const updatedDishes = dishes.filter(d => d.dishId !== dishId);
    setDishes(updatedDishes);
    if (selectedBusiness) {
      setBusinessDishesCache(prev => ({
        ...prev,
        [selectedBusiness.businessId]: updatedDishes,
      }));
    }
  };

  const handleDishUpdate = (updatedDish: Dish) => {
    const updatedDishes = dishes.map(d => d.dishId === updatedDish.dishId ? updatedDish : d);
    setDishes(updatedDishes);
    if (selectedBusiness) {
      setBusinessDishesCache(prev => ({
        ...prev,
        [selectedBusiness.businessId]: updatedDishes,
      }));
    }
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

  const fetchVendorNotifications = async () => {
    if (!user?.phoneNumber) return;
    
    try {
      setLoadingNotifications(true);
      const notifications = await notificationService.getNotificationsByVendor(user.phoneNumber);
      // Sort by date, newest first
      const sortedNotifications = notifications.sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setVendorNotifications(sortedNotifications);
      setUnreadNotificationCount(notifications.filter((n: any) => !n.isRead).length);
    } catch (err: any) {
      console.error('Error fetching vendor notifications:', err);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const handleMarkNotificationAsRead = async (notificationId: number) => {
    try {
      await notificationService.markAsRead(notificationId);
      // Update local state
      setVendorNotifications(prev => 
        prev.map(n => n.notificationId === notificationId ? { ...n, isRead: true } : n)
      );
      setUnreadNotificationCount(prev => Math.max(0, prev - 1));
    } catch (err: any) {
      console.error('Error marking notification as read:', err);
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

  // Helper function to check if business is tent type
  const isTentBusiness = (business: Business | null): boolean => {
    if (!business) return false;
    const category = business.businessCategory?.toLowerCase() || '';
    // More specific check - only match exact tent categories
    return category === 'tent_house' || category === 'tent' || 
           (category.includes('tent') && !category.includes('cater'));
  };

  // Helper function to get the actual tab index for a given tab label
  const getTabIndex = (tabLabel: string): number => {
    if (!selectedBusiness) return -1;
    
    let index = 0; // Overview is always first
    
    if (isTentBusiness(selectedBusiness)) {
      // Tent: Overview(0), Theme(1), Inventory(2), Explore(3)
      if (tabLabel === 'Overview') return 0;
      if (tabLabel === 'Theme') return 1;
      if (tabLabel === 'Inventory') return 2;
      if (tabLabel === 'Explore') return 3;
    } else if (selectedBusiness.businessCategory === 'caters') {
      // Catering: Overview(0), Plate(1), Dish(2), Orders(3), Notifications(4), Explore(5)
      if (tabLabel === 'Overview') return 0;
      if (tabLabel === 'Plate') return 1;
      if (tabLabel === 'Dish') return 2;
      if (tabLabel === 'Orders') return 3;
      if (tabLabel === 'Notifications') return 4;
      if (tabLabel === 'Explore') return 5;
    } else {
      // Non-catering: Overview(0), Themes(1), Inventory(2), Orders(3), Notifications(4)
      if (tabLabel === 'Overview') return 0;
      if (tabLabel === 'Themes') return 1;
      if (tabLabel === 'Inventory') return 2;
      if (tabLabel === 'Orders') return 3;
      if (tabLabel === 'Notifications') return 4;
    }
    
    return -1;
  };

  // Helper to check if current activeTab matches a specific tab
  const isTabActive = (tabLabel: string): boolean => {
    return activeTab === getTabIndex(tabLabel);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    console.log('🔵 ========== TAB CLICKED ==========');
    console.log('🔵 newValue (tab index):', newValue);
    console.log('🔵 Business category:', selectedBusiness?.businessCategory);
    console.log('🔵 Is tent business:', isTentBusiness(selectedBusiness));
    console.log('🔵 Current activeTab:', activeTab);
    
    // Material-UI Tabs use the index based on the order of tabs in JSX
    // We need to calculate the actual tab indices based on what's rendered
    
    // Calculate which tabs are actually rendered
    let tabLabels: string[] = ['Overview'];
    
    if (isTentBusiness(selectedBusiness)) {
      tabLabels.push('Theme', 'Inventory', 'Explore');
    } else if (selectedBusiness?.businessCategory === 'caters') {
      tabLabels.push('Plate', 'Dish', 'Orders', 'Notifications', 'Explore');
    } else {
      tabLabels.push('Themes', 'Inventory', 'Orders', 'Notifications');
    }
    
    console.log('🔵 Tab labels in order:', tabLabels);
    console.log('🔵 Total tabs:', tabLabels.length);
    
    // Safety check - make sure newValue is within bounds
    if (newValue < 0 || newValue >= tabLabels.length) {
      console.error('❌ Invalid tab index:', newValue, 'Max index:', tabLabels.length - 1);
      return;
    }
    
    const clickedTabLabel = tabLabels[newValue];
    console.log('🔵 Clicked tab label:', clickedTabLabel);
    
    // If it's the Explore tab, navigate to explore page IMMEDIATELY and don't update state
    if (clickedTabLabel === 'Explore') {
      console.log('🔵 Navigating to Explore page...');
      navigate('/explore');
      return; // Don't update activeTab or fetch data
    }
    
    // Update active tab state
    console.log('🔵 Setting activeTab to:', newValue);
    setActiveTab(newValue);
    
    // Determine which tab was clicked
    const isOrdersTab = clickedTabLabel === 'Orders';
    const isNotificationsTab = clickedTabLabel === 'Notifications';
    
    console.log('🔵 Tab analysis:', {
      newValue,
      clickedTabLabel,
      businessCategory: selectedBusiness?.businessCategory,
      isOrdersTab,
      isNotificationsTab,
      isTent: isTentBusiness(selectedBusiness)
    });
    
    if (isOrdersTab) {
      console.log('✅ Orders tab clicked - Fetching orders...');
      console.log('✅ activeTab set to:', newValue);
      console.log('✅ Will show Orders content when activeTab === 3');
      fetchOrdersForBusiness();
    }
    
    if (isNotificationsTab) {
      console.log('✅ Notifications tab clicked - Fetching notifications...');
      fetchNotificationCount();
      fetchVendorNotifications();
    }
    
    console.log('🔵 ========== TAB CHANGE COMPLETE ==========');
    console.log('🔵 Final activeTab value:', newValue);
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

  // Scroll to the order after orders are updated
  useEffect(() => {
    if (orderToScrollTo && orders.length > 0 && !ordersLoading) {
      // Immediately restore saved position to prevent jump to top
      if (savedScrollPosition !== null) {
        window.scrollTo({ top: savedScrollPosition - 100, behavior: 'auto' });
      }
      
      // Then try to find and scroll to the element with multiple attempts
      const scrollToOrder = () => {
        const orderElement = document.getElementById(`order-${orderToScrollTo}`);
        if (orderElement) {
          // Calculate absolute position correctly
          const rect = orderElement.getBoundingClientRect();
          const absoluteElementTop = rect.top + window.pageYOffset;
          
          // Scroll to the element
          window.scrollTo({ 
            top: absoluteElementTop - 100,
            behavior: 'auto'
          });
          
          // Clear the scroll tracking
          setOrderToScrollTo(null);
          setSavedScrollPosition(null);
        } else if (savedScrollPosition !== null) {
          // If element not found, restore saved position
          window.scrollTo({ top: savedScrollPosition - 100, behavior: 'auto' });
          setOrderToScrollTo(null);
          setSavedScrollPosition(null);
        }
      };
      
      // Try multiple times with increasing delays to ensure DOM is ready
      setTimeout(() => scrollToOrder(), 0);
      setTimeout(() => scrollToOrder(), 50);
      setTimeout(() => scrollToOrder(), 100);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollToOrder();
        });
      });
    }
  }, [orders, ordersLoading, orderToScrollTo, savedScrollPosition]);

  const handleOrderStatusUpdate = async (orderId: string, newStatus: Order['status']) => {
    try {
      // Get the order element's position BEFORE updating
      const orderElement = document.getElementById(`order-${orderId}`);
      let elementPosition: number | null = null;
      
      if (orderElement) {
        const rect = orderElement.getBoundingClientRect();
        elementPosition = rect.top + window.pageYOffset;
      }
      
      // Save both scroll position and element position
      const currentScrollPosition = window.scrollY;
      setSavedScrollPosition(elementPosition !== null ? elementPosition : currentScrollPosition);
      
      // Store the order ID to scroll to after refresh
      setOrderToScrollTo(orderId);
      await orderService.updateOrderStatus(orderId, newStatus);
      // Refresh orders after status update
      await fetchOrdersForBusiness();
      // The useEffect will handle scrolling to the order after orders are loaded
    } catch (err: any) {
      console.error('Error updating order status:', err);
      setOrdersError(err.message || 'Failed to update order status');
      setOrderToScrollTo(null); // Clear on error
      setSavedScrollPosition(null);
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

  // Show loading if auth is still loading or if we're waiting for user data
  if (authLoading || (!user && loading)) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  // If user is not available after loading, show error
  if (!user) {
    return (
      <Box>
        <Alert severity="error">
          Unable to load user information. Please try logging in again.
        </Alert>
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
            {selectedBusiness && !isTentBusiness(selectedBusiness) && (
            <Card
              sx={{
                cursor: 'pointer',
                '&:hover': {
                  boxShadow: 4,
                  transform: 'translateY(-2px)',
                  transition: 'all 0.2s ease-in-out'
                }
              }}
              onClick={() => {
                // For catering vendors, navigate to Orders tab in dashboard (index 3)
                // For non-catering vendors, navigate to separate orders page
                if (selectedBusiness.businessCategory === 'caters') {
                  setActiveTab(3); // Orders tab
                } else {
                  navigate('/vendor-orders-notifications');
                }
              }}
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
            )}
          </Grid>
        </Grid>
      </Box>

      {selectedBusiness && (
        <>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3, position: 'relative', zIndex: 1 }}>
            <Tabs 
              value={activeTab} 
              onChange={(e, newValue) => {
                console.log('🔴 Tabs onChange called directly!', { newValue, currentActiveTab: activeTab, event: e });
                if (newValue !== activeTab) {
                  handleTabChange(e, newValue);
                } else {
                  console.log('⚠️ Tab clicked but value unchanged, forcing update...');
                  // Force update even if value is the same
                  handleTabChange(e, newValue);
                }
              }}
              aria-label="vendor dashboard tabs"
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              sx={{ 
                '& .MuiTab-root': {
                  pointerEvents: 'auto !important',
                  cursor: 'pointer !important',
                  minHeight: '48px',
                  userSelect: 'none',
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: 'primary.main',
                },
                '& .MuiTab-root.Mui-selected': {
                  color: 'primary.main',
                }
              }}
            >
              <Tab label="Overview" />
              {isTentBusiness(selectedBusiness) && <Tab label="Theme" />}
              {isTentBusiness(selectedBusiness) && <Tab label="Inventory" />}
              {!isTentBusiness(selectedBusiness) && selectedBusiness.businessCategory !== 'caters' && <Tab label="Themes" />}
              {!isTentBusiness(selectedBusiness) && selectedBusiness.businessCategory !== 'caters' && <Tab label="Inventory" />}
              {!isTentBusiness(selectedBusiness) && selectedBusiness.businessCategory === 'caters' && <Tab label="Plate" />}
              {!isTentBusiness(selectedBusiness) && selectedBusiness.businessCategory === 'caters' && <Tab label="Dish" />}
              {!isTentBusiness(selectedBusiness) && (
                <>
                  <Tab 
                    label="Orders"
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('🟡 Orders Tab onClick fired directly!');
                      console.log('🟡 Current activeTab:', activeTab);
                      console.log('🟡 selectedBusiness:', selectedBusiness?.businessName);
                      console.log('🟡 isTentBusiness:', isTentBusiness(selectedBusiness));
                      // Manually trigger tab change
                      const ordersTabIndex = selectedBusiness?.businessCategory === 'caters' ? 3 : 3;
                      console.log('🟡 Setting activeTab to:', ordersTabIndex);
                      setActiveTab(ordersTabIndex);
                      fetchOrdersForBusiness();
                    }}
                  />
                  <Tab 
                    label={
                      unreadNotificationCount > 0 
                        ? `Notifications (${unreadNotificationCount})` 
                        : "Notifications"
                    }
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('🟡 Notifications Tab onClick fired directly!');
                      console.log('🟡 Current activeTab:', activeTab);
                      console.log('🟡 selectedBusiness:', selectedBusiness?.businessName);
                      console.log('🟡 isTentBusiness:', isTentBusiness(selectedBusiness));
                      // Manually trigger tab change
                      const notificationsTabIndex = selectedBusiness?.businessCategory === 'caters' ? 4 : 4;
                      console.log('🟡 Setting activeTab to:', notificationsTabIndex);
                      setActiveTab(notificationsTabIndex);
                      fetchNotificationCount();
                      fetchVendorNotifications();
                    }}
                  />
                </>
              )}
              {(isTentBusiness(selectedBusiness) || selectedBusiness.businessCategory === 'caters') && (
                <Tab 
                  label="Explore"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    console.log('🟡 Explore Tab onClick fired directly!');
                    console.log('🟡 Current activeTab:', activeTab);
                    console.log('🟡 selectedBusiness:', selectedBusiness?.businessName);
                    console.log('🟡 Navigating to /explore immediately...');
                    // Navigate immediately without updating state
                    navigate('/explore');
                  }}
                />
              )}
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
                <Box ml="auto" display="flex" alignItems="center" gap={1}>
                  <Chip 
                    label={selectedBusiness.isActive ? 'Active' : 'Inactive'} 
                    color={selectedBusiness.isActive ? 'success' : 'default'}
                    size="small"
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => setBusinessFormOpen(true)}
                    sx={{ ml: 1 }}
                  >
                    Edit
                  </Button>
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
              
              {selectedBusiness.businessCategory === 'caters' ? (
                <>
                  <Box display="flex" alignItems="center" mb={2}>
                    <PaletteIcon sx={{ fontSize: 24, color: 'primary.main', mr: 1 }} />
                    <Box>
                      <Typography variant="h4" component="div">
                        {plates.length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Plates
                      </Typography>
                    </Box>
                  </Box>
                </>
              ) : (
                <>
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

                  <Box display="flex" alignItems="center" mb={2}>
                    <InventoryIcon sx={{ fontSize: 24, color: 'warning.main', mr: 1 }} />
                    <Box>
                      <Typography variant="h4" component="div">
                        {inventory.length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Inventory
                      </Typography>
                    </Box>
                  </Box>
                </>
              )}

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

          {/* Quick Access Section for Catering Vendors - Orders & Notifications */}
          {selectedBusiness && selectedBusiness.businessCategory === 'caters' && (
            <Box sx={{ mt: 4 }}>
              <Card sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
                    <Box display="flex" alignItems="center" gap={2}>
                      <NotificationIcon sx={{ fontSize: 40 }} />
                      <Box>
                        <Typography variant="h6" gutterBottom>
                          Orders & Notifications
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                          {unreadNotificationCount > 0 
                            ? `${unreadNotificationCount} unread notifications`
                            : 'View and manage your orders and notifications'
                          }
                        </Typography>
                      </Box>
                    </Box>
                    <Button
                      variant="contained"
                      color="secondary"
                      size="large"
                      startIcon={<NotificationIcon />}
                      onClick={() => setActiveTab(3)}
                      sx={{ 
                        minWidth: 200,
                        fontWeight: 'bold'
                      }}
                    >
                      View Orders
                    </Button>
                  </Box>
                  {unreadNotificationCount > 0 && (
                    <Box mt={2}>
                      <Chip 
                        label={`${unreadNotificationCount} New Notifications`} 
                        color="error" 
                        size="medium"
                        sx={{ fontWeight: 'bold' }}
                      />
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Box>
          )}

          {/* Themes Section - Only show for non-catering businesses (including tent) */}
          {(isTentBusiness(selectedBusiness) || selectedBusiness.businessCategory !== 'caters') && (
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

          {/* Inventory Section - Only show for non-catering businesses (including tent) */}
          {(isTentBusiness(selectedBusiness) || selectedBusiness.businessCategory !== 'caters') && (
            <Box sx={{ mt: 4 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h5" gutterBottom>
                  My Inventory ({inventory.length})
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => setInventoryFormOpen(true)}
                >
                  Add Inventory Item
                </Button>
              </Box>
              
              {inventory.length === 0 ? (
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <BusinessIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No inventory items yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Start by adding your first inventory item to showcase what you offer.
                  </Typography>
                </Paper>
              ) : (
                <Grid container spacing={2}>
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

          {/* Plates Section - Only show for catering businesses (not tent) */}
          {!isTentBusiness(selectedBusiness) && selectedBusiness.businessCategory === 'caters' && (
            <Box sx={{ mt: 4 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h5" gutterBottom>
                  My Plates ({plates.length})
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => {
                    setEditingPlate(null);
                    setPlateFormOpen(true);
                  }}
                >
                  Add Plate
                </Button>
              </Box>
              
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

          {/* Dishes Section - Only show for catering businesses (not tent) */}
          {!isTentBusiness(selectedBusiness) && selectedBusiness.businessCategory === 'caters' && (
            <Box sx={{ mt: 4 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h5" gutterBottom>
                  My Dishes ({dishes.length})
                </Typography>
                <Button
                  variant="contained"
                  onClick={handleAddDish}
                >
                  Add Dish
                </Button>
              </Box>
              
              {dishes.length === 0 ? (
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No dishes created yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Start by creating your first dish to showcase your catering menu.
                  </Typography>
                </Paper>
              ) : (
                <Grid container spacing={2}>
                  {dishes.map((dish) => (
                    <Grid item xs={12} sm={6} md={4} key={dish.dishId}>
                      <DishCard
                        dish={dish}
                        business={selectedBusiness}
                        onEdit={handleEditDish}
                        onDelete={handleDishDelete}
                        onUpdate={handleDishUpdate}
                      />
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          )}
            </Box>
          )}

          {/* Theme Tab - Show for tent businesses and non-catering businesses only */}
          {activeTab === 1 && selectedBusiness && 
            !isTentBusiness(selectedBusiness) && 
            selectedBusiness.businessCategory !== 'caters' && (
            <ThemeManagement
              themes={themes}
              businessId={selectedBusiness.businessId}
              onThemesChange={handleThemesChange}
            />
          )}

          {/* Theme Tab - Show for tent businesses */}
          {activeTab === 1 && selectedBusiness && 
            isTentBusiness(selectedBusiness) && (
            <ThemeManagement
              themes={themes}
              businessId={selectedBusiness.businessId}
              onThemesChange={handleThemesChange}
            />
          )}

          {/* Inventory Tab - Show for tent businesses */}
          {activeTab === 2 && selectedBusiness && isTentBusiness(selectedBusiness) && (
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

          {/* Explore Tab - For tent businesses and catering businesses */}
          {/* Only show Explore content if activeTab matches Explore tab index (3 for tent, 5 for caters) */}
          {((isTentBusiness(selectedBusiness) && activeTab === 3) || 
            (selectedBusiness.businessCategory === 'caters' && activeTab === 5)) && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h5" gutterBottom>
                Explore Marketplace
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Browse themes, inventory, and plates from other vendors
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/explore')}
                sx={{ mt: 2 }}
              >
                Go to Explore Page
              </Button>
            </Box>
          )}

          {activeTab === 2 && selectedBusiness && !isTentBusiness(selectedBusiness) && selectedBusiness.businessCategory !== 'caters' && (
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

          {/* Plates Tab - Only show for catering businesses (not tent) */}
          {activeTab === 1 && !isTentBusiness(selectedBusiness) && selectedBusiness.businessCategory === 'caters' && (
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

          {/* Dishes Tab - Only show for catering businesses (not tent) */}
          {activeTab === 2 && !isTentBusiness(selectedBusiness) && selectedBusiness.businessCategory === 'caters' && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" gutterBottom>
                  Dish Management
                </Typography>
                <Button
                  variant="contained"
                  onClick={handleAddDish}
                >
                  Add New Dish
                </Button>
              </Box>

              {dishes.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No dishes yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Start by adding your first dish to showcase your catering menu.
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={handleAddDish}
                  >
                    Add First Dish
                  </Button>
                </Paper>
              ) : (
                <Grid container spacing={3}>
                  {dishes.map((dish) => (
                    <Grid item xs={12} sm={6} md={4} key={dish.dishId}>
                      <DishCard
                        dish={dish}
                        business={selectedBusiness}
                        onEdit={handleEditDish}
                        onDelete={handleDishDelete}
                        onUpdate={handleDishUpdate}
                      />
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          )}

          {/* Orders Tab */}
          {/* For non-catering: tab index 3 (Overview=0, Themes=1, Inventory=2, Orders=3, Notifications=4) */}
          {/* For catering: tab index 3 (Overview=0, Plate=1, Dish=2, Orders=3, Notifications=4, Explore=5) */}
          {/* Orders Tab - Only Orders */}
          {/* Only show Orders content if activeTab is exactly 3 (Orders tab index) */}
          {selectedBusiness && !isTentBusiness(selectedBusiness) && activeTab === 3 && (
            <Box sx={{ width: '100%', p: 2 }}>
              <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
                Orders for {selectedBusiness.businessName}
              </Typography>
              
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="body1" color="text.secondary">
                  Manage and track all orders from your customers
                </Typography>
                <Button 
                  variant="outlined" 
                  onClick={fetchOrdersForBusiness}
                  disabled={ordersLoading}
                >
                  Refresh Orders
                </Button>
              </Box>

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
                    <Grid item xs={12} key={order.orderId} id={`order-${order.orderId}`}>
                      <Card>
                        <CardContent>
                          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                            <Box>
                              <Box display="flex" alignItems="center" gap={1} mb={1}>
                                <Typography variant="h6">
                                  {getOrderDisplayTitle(order)}
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

          {/* Notifications Tab - Only Notifications */}
          {/* Only show Notifications content if activeTab is exactly 4 (Notifications tab index) */}
          {selectedBusiness && !isTentBusiness(selectedBusiness) && activeTab === 4 && (
            <Box sx={{ width: '100%', p: 2 }}>
              <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
                Notifications
              </Typography>
              
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="body1" color="text.secondary">
                  {unreadNotificationCount > 0 
                    ? `${unreadNotificationCount} unread notifications`
                    : 'View and manage your notifications'
                  }
                </Typography>
                <Box display="flex" gap={1}>
                  <Button 
                    variant="outlined" 
                    size="small"
                    onClick={fetchVendorNotifications}
                    disabled={loadingNotifications}
                  >
                    Refresh
                  </Button>
                  {unreadNotificationCount > 0 && (
                    <Button 
                      variant="contained" 
                      size="small"
                      color="primary"
                      onClick={async () => {
                        if (user?.phoneNumber) {
                          try {
                            await notificationService.markAllAsRead(user.phoneNumber);
                            fetchNotificationCount();
                            fetchVendorNotifications();
                          } catch (err) {
                            console.error('Error marking all notifications as read:', err);
                          }
                        }
                      }}
                    >
                      Mark All Read
                    </Button>
                  )}
                </Box>
              </Box>
              
              {loadingNotifications ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                  <CircularProgress />
                </Box>
              ) : vendorNotifications.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                  <NotificationIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No notifications yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    You'll receive notifications here when customers place orders or when there are updates.
                  </Typography>
                </Paper>
              ) : (
                <Box>
                  {vendorNotifications.map((notification) => (
                    <Card 
                      key={notification.notificationId} 
                      sx={{ 
                        mb: 2,
                        borderLeft: !notification.isRead ? '4px solid #1976d2' : 'none',
                        bgcolor: !notification.isRead ? 'action.hover' : 'inherit',
                        cursor: 'pointer',
                        '&:hover': {
                          boxShadow: 2,
                        }
                      }}
                      onClick={() => {
                        if (!notification.isRead) {
                          handleMarkNotificationAsRead(notification.notificationId);
                        }
                      }}
                    >
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                          <Box flex={1}>
                            <Box display="flex" alignItems="center" gap={1} mb={1}>
                              <NotificationIcon 
                                sx={{ 
                                  fontSize: 20, 
                                  color: notification.isRead ? 'text.secondary' : 'primary.main' 
                                }} 
                              />
                              <Typography 
                                variant="body1" 
                                sx={{ fontWeight: notification.isRead ? 'normal' : 'bold' }}
                              >
                                {notification.message}
                              </Typography>
                              {!notification.isRead && (
                                <Chip label="New" color="primary" size="small" />
                              )}
                            </Box>
                            <Typography variant="caption" color="text.secondary" display="block">
                              {new Date(notification.createdAt).toLocaleString()}
                            </Typography>
                            {notification.orderId && (
                              <Typography variant="caption" color="text.secondary" display="block">
                                {notification.businessName}
                              </Typography>
                            )}
                          </Box>
                          {!notification.isRead && (
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkNotificationAsRead(notification.notificationId);
                              }}
                            >
                              Mark Read
                            </Button>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
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

      {/* Dish Management Form */}
      {selectedBusiness && (
        <DishManagementForm
          open={dishFormOpen}
          onClose={() => {
            setDishFormOpen(false);
            setEditingDish(null);
          }}
          dish={editingDish}
          businessId={selectedBusiness.businessId}
          onSuccess={handleDishSuccess}
        />
      )}
    </Box>
  );
};

export default VendorDashboard;
