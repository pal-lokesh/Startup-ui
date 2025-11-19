import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  ToggleButton,
  ToggleButtonGroup,
  Fade,
  Slide,
  Paper,
  Button,
  IconButton,
  Tooltip,
  Slider,
} from '@mui/material';
import {
  Palette as PaletteIcon,
  Inventory as InventoryIcon,
  Restaurant as CateringIcon,
  Business as BusinessIcon,
  Chat as ChatIcon,
} from '@mui/icons-material';

import { Business, Theme, Inventory, Plate, Dish } from '../types';
import BusinessService from '../services/businessService';
import ThemeService from '../services/themeService';
import InventoryService from '../services/inventoryService';
import plateService from '../services/plateService';
import dishService from '../services/dishService';
import chatService from '../services/chatService';
import ThemeCard from '../components/ThemeCard';
import InventoryCard from '../components/InventoryCard';
import PlateCard from '../components/PlateCard';
import DishCard from '../components/DishCard';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { calculateDistance, formatDistance, isValidCoordinates } from '../utils/distanceUtils';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import { parsePriceRange, getAveragePrice, isWithinBudget, formatPrice } from '../utils/priceUtils';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import StarIcon from '@mui/icons-material/Star';
import { ratingService } from '../services/ratingService';
import { RatingStats } from '../types/rating';

type LocationFilter = 'all' | 'nearby' | 'custom';
type BudgetFilter = 'all' | 'custom';
type SortOrder = 'price-low' | 'price-high' | 'rating-high' | 'rating-low' | 'default';

const ClientExplore: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [plates, setPlates] = useState<Plate[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([]);
  const [businessThemes, setBusinessThemes] = useState<{[key: string]: Theme[]}>({});
  const [businessInventory, setBusinessInventory] = useState<{[key: string]: Inventory[]}>({});
  const [businessPlates, setBusinessPlates] = useState<{[key: string]: Plate[]}>({});
  const [businessDishes, setBusinessDishes] = useState<{[key: string]: Dish[]}>({});
  const [refreshKey, setRefreshKey] = useState(0);
  const [chatLoading, setChatLoading] = useState<{[key: string]: boolean}>({});
  
  // Location-based filtering state
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [locationFilter, setLocationFilter] = useState<LocationFilter>('all'); // Default to all
  const [customRadius, setCustomRadius] = useState<number>(10);
  const [appliedRadius, setAppliedRadius] = useState<number>(10); // The radius that's actually applied
  const [locationLoading, setLocationLoading] = useState(false);
  const [businessDistances, setBusinessDistances] = useState<{[key: string]: number}>({});
  const [locationRequested, setLocationRequested] = useState(false); // Track if location was requested
  
  // Budget-based filtering state
  const [budgetFilter, setBudgetFilter] = useState<BudgetFilter>('all');
  const [customMinBudget, setCustomMinBudget] = useState<number>(0);
  const [customMaxBudget, setCustomMaxBudget] = useState<number>(100000);
  const [appliedMinBudget, setAppliedMinBudget] = useState<number>(0); // The min budget that's actually applied
  const [appliedMaxBudget, setAppliedMaxBudget] = useState<number>(100000); // The max budget that's actually applied
  const [sortOrder, setSortOrder] = useState<SortOrder>('default');
  
  // Rating stats state
  const [themeRatingStats, setThemeRatingStats] = useState<{[key: string]: RatingStats}>({});
  const [inventoryRatingStats, setInventoryRatingStats] = useState<{[key: string]: RatingStats}>({});
  const [plateRatingStats, setPlateRatingStats] = useState<{[key: string]: RatingStats}>({});
  const [dishRatingStats, setDishRatingStats] = useState<{[key: string]: RatingStats}>({});
  const [ratingStatsLoading, setRatingStatsLoading] = useState(false);
  
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
    // Automatically request location once on page load
    if (!locationRequested && navigator.geolocation) {
      getCurrentLocation(false); // false = automatic request
      setLocationRequested(true);
    }
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchData();
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (userLocation && locationFilter !== 'all') {
      calculateDistances();
    }
  }, [userLocation, locationFilter, customRadius, businesses]);

  useEffect(() => {
    loadRatingStats();
  }, [themes, inventory, plates, dishes]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [businessesData, themesData, inventoryData, platesData, dishesData] = await Promise.all([
        BusinessService.getAllBusinesses(),
        ThemeService.getAllThemes(),
        InventoryService.getAllInventory(),
        plateService.getAllPlates(),
        dishService.getAllDishes()
      ]);
      
      setBusinesses(businessesData);
      setThemes(themesData);
      setInventory(inventoryData);
      setPlates(platesData);
      setDishes(dishesData);
      
      // Don't filter on initial load - show all businesses initially
      setFilteredBusinesses(businessesData);
      
      // Group themes by business
      const themesByBusiness: {[key: string]: Theme[]} = {};
      themesData.forEach(theme => {
        if (!themesByBusiness[theme.businessId]) {
          themesByBusiness[theme.businessId] = [];
        }
        themesByBusiness[theme.businessId].push(theme);
      });
      setBusinessThemes(themesByBusiness);
      
      // Group inventory by business
      const inventoryByBusiness: {[key: string]: Inventory[]} = {};
      inventoryData.forEach(item => {
        if (!inventoryByBusiness[item.businessId]) {
          inventoryByBusiness[item.businessId] = [];
        }
        inventoryByBusiness[item.businessId].push(item);
      });
      setBusinessInventory(inventoryByBusiness);
      
      // Group plates by business
      const platesByBusiness: {[key: string]: Plate[]} = {};
      platesData.forEach(plate => {
        if (!platesByBusiness[plate.businessId]) {
          platesByBusiness[plate.businessId] = [];
        }
        platesByBusiness[plate.businessId].push(plate);
      });
      setBusinessPlates(platesByBusiness);
      
      // Group dishes by business
      const dishesByBusiness: {[key: string]: Dish[]} = {};
      dishesData.forEach(dish => {
        if (!dishesByBusiness[dish.businessId]) {
          dishesByBusiness[dish.businessId] = [];
        }
        dishesByBusiness[dish.businessId].push(dish);
      });
      setBusinessDishes(dishesByBusiness);
      
    } catch (err) {
      setError('Failed to fetch data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load rating stats for all items
  const loadRatingStats = async () => {
    if (themes.length === 0 && inventory.length === 0 && plates.length === 0 && dishes.length === 0) return;
    
    try {
      setRatingStatsLoading(true);
      const themeStatsPromises = themes.map(theme =>
        ratingService.getRatingStats(theme.themeId, 'THEME').catch(() => null)
      );
      const inventoryStatsPromises = inventory.map(item =>
        ratingService.getRatingStats(item.inventoryId, 'INVENTORY').catch(() => null)
      );
      const plateStatsPromises = plates.map(plate =>
        ratingService.getRatingStats(plate.plateId, 'PLATE').catch(() => null)
      );
      const dishStatsPromises = dishes.map(dish =>
        ratingService.getRatingStats(dish.dishId, 'DISH').catch(() => null)
      );

      const [themeStatsResults, inventoryStatsResults, plateStatsResults, dishStatsResults] = await Promise.all([
        Promise.all(themeStatsPromises),
        Promise.all(inventoryStatsPromises),
        Promise.all(plateStatsPromises),
        Promise.all(dishStatsPromises)
      ]);

      // Build rating stats maps
      const themeStatsMap: {[key: string]: RatingStats} = {};
      themes.forEach((theme, index) => {
        if (themeStatsResults[index]) {
          themeStatsMap[theme.themeId] = themeStatsResults[index]!;
        }
      });

      const inventoryStatsMap: {[key: string]: RatingStats} = {};
      inventory.forEach((item, index) => {
        if (inventoryStatsResults[index]) {
          inventoryStatsMap[item.inventoryId] = inventoryStatsResults[index]!;
        }
      });

      const plateStatsMap: {[key: string]: RatingStats} = {};
      plates.forEach((plate, index) => {
        if (plateStatsResults[index]) {
          plateStatsMap[plate.plateId] = plateStatsResults[index]!;
        }
      });

      const dishStatsMap: {[key: string]: RatingStats} = {};
      dishes.forEach((dish, index) => {
        if (dishStatsResults[index]) {
          dishStatsMap[dish.dishId] = dishStatsResults[index]!;
        }
      });

      setThemeRatingStats(themeStatsMap);
      setInventoryRatingStats(inventoryStatsMap);
      setPlateRatingStats(plateStatsMap);
      setDishRatingStats(dishStatsMap);
    } catch (err) {
      console.error('Error loading rating stats:', err);
    } finally {
      setRatingStatsLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setRefreshKey(Date.now());
  };

  const handleCategoryChange = (event: React.MouseEvent<HTMLElement>, newCategory: string) => {
    if (newCategory !== null) {
      setSelectedCategory(newCategory);
      setActiveTab(0); // Reset to first tab when category changes
      setBusinessThemes({}); // Clear business themes
      setBusinessInventory({}); // Clear business inventory
      setBusinessPlates({}); // Clear business plates
      setRefreshKey(Date.now()); // Force refresh
      filterBusinessesByCategory(newCategory);
    }
  };

  const filterBusinessesByCategory = (category: string) => {
    if (category === 'all') {
      setFilteredBusinesses(businesses);
      return;
    }
    
    const filtered = businesses.filter(business => {
      const categoryLower = business.businessCategory.toLowerCase();
      
      if (category === 'tent') {
        return categoryLower.includes('tent') || 
               categoryLower.includes('event') || 
               categoryLower.includes('wedding') ||
               categoryLower.includes('party') ||
               categoryLower.includes('decoration');
      } else if (category === 'catering') {
        return categoryLower.includes('catering') || 
               categoryLower.includes('food') || 
               categoryLower.includes('restaurant') ||
               categoryLower.includes('cafe') ||
               categoryLower.includes('catering');
      }
      return false;
    });
    
    setFilteredBusinesses(filtered);
  };

  // Get user's current location
  const getCurrentLocation = (isManual: boolean = true) => {
    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported by your browser');
      // If geolocation not supported, keep location filter as 'all'
      setLocationFilter('all');
      if (isManual) {
        alert('Geolocation is not supported by your browser');
      }
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lon: longitude });
        setLocationLoading(false);
        // Location is obtained but filter remains as user selected (default: 'all')
      },
      (error) => {
        console.error('Error getting location:', error);
        // If location access denied or failed, fall back to 'all' filter
        setLocationFilter('all');
        setLocationLoading(false);
        // Only show alert on manual request, not on automatic request
        if (isManual) {
          alert('Unable to get your location. Please enable location permissions.');
        }
      }
    );
  };

  // Calculate distances from user location to all businesses
  const calculateDistances = () => {
    if (!userLocation) return;

    const distances: {[key: string]: number} = {};
    businesses.forEach(business => {
      if (business.latitude && business.longitude) {
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lon,
          business.latitude,
          business.longitude
        );
        distances[business.businessId] = distance;
      }
    });
    setBusinessDistances(distances);
  };

  // Sort businesses by distance
  const sortBusinessesByDistance = (businessList: Business[]): Business[] => {
    if (locationFilter === 'all' || !userLocation) {
      return businessList;
    }

    const radius = appliedRadius;
    
    return businessList
      .filter(business => {
        if (!business.latitude || !business.longitude) return false;
        const distance = businessDistances[business.businessId];
        return distance !== undefined && distance <= radius;
      })
      .sort((a, b) => {
        const distA = businessDistances[a.businessId] || Infinity;
        const distB = businessDistances[b.businessId] || Infinity;
        return distA - distB;
      });
  };

  // Sort themes/plates by business distance
  const sortItemsByDistance = <T extends { businessId: string }>(
    items: T[]
  ): T[] => {
    if (locationFilter === 'all' || !userLocation) {
      return items;
    }

    const radius = appliedRadius;

    return items
      .filter(item => {
        const business = businesses.find(b => b.businessId === item.businessId);
        if (!business || !business.latitude || !business.longitude) return false;
        const distance = businessDistances[business.businessId];
        return distance !== undefined && distance <= radius;
      })
      .sort((a, b) => {
        const distA = businessDistances[a.businessId] || Infinity;
        const distB = businessDistances[b.businessId] || Infinity;
        return distA - distB;
      });
  };

  const handleLocationFilterChange = (filter: LocationFilter) => {
    setLocationFilter(filter);
    if (filter !== 'all' && !userLocation) {
      getCurrentLocation(true); // true = manual request
    }
    if (filter === 'all') {
      setAppliedRadius(10); // Reset applied radius when switching to all
    }
  };

  const handleApplyCustomRadius = () => {
    setAppliedRadius(customRadius);
  };

  const handleBudgetFilterChange = (filter: BudgetFilter) => {
    setBudgetFilter(filter);
    if (filter === 'all') {
      setAppliedMinBudget(0);
      setAppliedMaxBudget(100000);
    }
  };

  const handleApplyCustomBudget = () => {
    setAppliedMinBudget(customMinBudget);
    setAppliedMaxBudget(customMaxBudget);
  };

  // Get budget range based on filter
  const getBudgetRange = (): { min: number; max: number } => {
    if (budgetFilter === 'custom') {
      return { min: appliedMinBudget, max: appliedMaxBudget };
    }
    // For 'all', return full range
    return { min: 0, max: Infinity };
  };

  // Get average rating for a theme
  const getThemeRating = (themeId: string): number => {
    const stats = themeRatingStats[themeId];
    return stats?.averageRating || 0;
  };

  // Get average rating for inventory
  const getInventoryRating = (inventoryId: string): number => {
    const stats = inventoryRatingStats[inventoryId];
    return stats?.averageRating || 0;
  };

  // Get average rating for plate
  const getPlateRating = (plateId: string): number => {
    const stats = plateRatingStats[plateId];
    return stats?.averageRating || 0;
  };

  // Get average rating for dish
  const getDishRating = (dishId: string): number => {
    const stats = dishRatingStats[dishId];
    return stats?.averageRating || 0;
  };

  // Filter and sort themes by budget and rating
  const filterAndSortThemes = (themeList: Theme[]): Theme[] => {
    const budgetRange = getBudgetRange();
    
    let filtered = themeList.filter(theme => {
      return isWithinBudget(undefined, theme.priceRange, budgetRange.min, budgetRange.max);
    });

    if (sortOrder === 'price-low') {
      filtered.sort((a, b) => {
        const avgA = getAveragePrice(a.priceRange);
        const avgB = getAveragePrice(b.priceRange);
        return avgA - avgB;
      });
    } else if (sortOrder === 'price-high') {
      filtered.sort((a, b) => {
        const avgA = getAveragePrice(a.priceRange);
        const avgB = getAveragePrice(b.priceRange);
        return avgB - avgA;
      });
    } else if (sortOrder === 'rating-high') {
      filtered.sort((a, b) => {
        const ratingA = getThemeRating(a.themeId);
        const ratingB = getThemeRating(b.themeId);
        return ratingB - ratingA; // High to low
      });
    } else if (sortOrder === 'rating-low') {
      filtered.sort((a, b) => {
        const ratingA = getThemeRating(a.themeId);
        const ratingB = getThemeRating(b.themeId);
        return ratingA - ratingB; // Low to high
      });
    }

    return filtered;
  };

  // Filter and sort inventory by budget and rating
  const filterAndSortInventory = (inventoryList: Inventory[]): Inventory[] => {
    const budgetRange = getBudgetRange();
    
    let filtered = inventoryList.filter(item => {
      return isWithinBudget(item.price, undefined, budgetRange.min, budgetRange.max);
    });

    if (sortOrder === 'price-low') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortOrder === 'price-high') {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sortOrder === 'rating-high') {
      filtered.sort((a, b) => {
        const ratingA = getInventoryRating(a.inventoryId);
        const ratingB = getInventoryRating(b.inventoryId);
        return ratingB - ratingA; // High to low
      });
    } else if (sortOrder === 'rating-low') {
      filtered.sort((a, b) => {
        const ratingA = getInventoryRating(a.inventoryId);
        const ratingB = getInventoryRating(b.inventoryId);
        return ratingA - ratingB; // Low to high
      });
    }

    return filtered;
  };

  // Filter and sort plates by budget and rating
  const filterAndSortPlates = (plateList: Plate[]): Plate[] => {
    const budgetRange = getBudgetRange();
    
    let filtered = plateList.filter(plate => {
      return isWithinBudget(plate.price, undefined, budgetRange.min, budgetRange.max);
    });

    if (sortOrder === 'price-low') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortOrder === 'price-high') {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sortOrder === 'rating-high') {
      filtered.sort((a, b) => {
        const ratingA = getPlateRating(a.plateId);
        const ratingB = getPlateRating(b.plateId);
        return ratingB - ratingA; // High to low
      });
    } else if (sortOrder === 'rating-low') {
      filtered.sort((a, b) => {
        const ratingA = getPlateRating(a.plateId);
        const ratingB = getPlateRating(b.plateId);
        return ratingA - ratingB; // Low to high
      });
    }

    return filtered;
  };

  const filterAndSortDishes = (dishList: Dish[]): Dish[] => {
    const budgetRange = getBudgetRange();
    
    let filtered = dishList.filter(dish => {
      return isWithinBudget(dish.price, undefined, budgetRange.min, budgetRange.max);
    });

    if (sortOrder === 'price-low') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortOrder === 'price-high') {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sortOrder === 'rating-high') {
      filtered.sort((a, b) => {
        const ratingA = getDishRating(a.dishId);
        const ratingB = getDishRating(b.dishId);
        return ratingB - ratingA; // High to low
      });
    } else if (sortOrder === 'rating-low') {
      filtered.sort((a, b) => {
        const ratingA = getDishRating(a.dishId);
        const ratingB = getDishRating(b.dishId);
        return ratingA - ratingB; // Low to high
      });
    }

    return filtered;
  };

  // Buy Now handlers
  // Note: The card components handle adding to cart and opening cart.
  // These handlers can be used for additional logic like notifications or analytics.
  const handleThemeBuyNow = (theme: Theme, business: Business) => {
    // Item is already added to cart by the card component
    // You can add additional logic here like showing a success message
  };

  const handleInventoryBuyNow = (inventory: Inventory, business: Business) => {
    // Item is already added to cart by the card component
    // You can add additional logic here like showing a success message
  };

  const handlePlateBuyNow = (plate: Plate, business: Business) => {
    // Item is already added to cart by the card component
    // You can add additional logic here like showing a success message
  };

  const handleDishBuyNow = (dish: Dish, business: Business) => {
    // Item is already added to cart by the card component
    // You can add additional logic here like showing a success message
  };

  const handleStartChat = async (business: Business) => {
    if (!user) {
      alert('Please log in to start a chat');
      return;
    }

    const businessId = business.businessId;
    setChatLoading(prev => ({ ...prev, [businessId]: true }));

    try {
      // Get vendor phone from business data
      const vendorPhone = business.phoneNumber;
      
      // Create or get chat
      const chat = await chatService.createOrGetChat(
        user.phoneNumber,
        vendorPhone,
        business.businessId,
        business.businessName
      );

      // Navigate to chat page
      navigate('/client-chat');
    } catch (error) {
      console.error('Error starting chat:', error);
      alert('Failed to start chat. Please try again.');
    } finally {
      setChatLoading(prev => ({ ...prev, [businessId]: false }));
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Typography variant="h3" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
        Explore Services
      </Typography>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
        Discover themes, inventory, and catering options from local businesses
      </Typography>

      {/* Category Filter */}
      <Paper sx={{ p: 3, mb: 4, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Typography variant="h6" gutterBottom sx={{ color: 'white', mb: 2 }}>
          Filter by Category
        </Typography>
        <ToggleButtonGroup
          value={selectedCategory}
          exclusive
          onChange={handleCategoryChange}
          aria-label="business category filter"
          sx={{
            '& .MuiToggleButton-root': {
              color: 'white',
              borderColor: 'rgba(255,255,255,0.3)',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.1)',
              },
              '&.Mui-selected': {
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.3)',
                },
              },
            },
          }}
        >
          <ToggleButton value="all" aria-label="all businesses">
            <BusinessIcon sx={{ mr: 1 }} />
            All Businesses
          </ToggleButton>
          <ToggleButton value="tent" aria-label="tent and events">
            <PaletteIcon sx={{ mr: 1 }} />
            Tent & Events
          </ToggleButton>
          <ToggleButton value="catering" aria-label="catering and food">
            <CateringIcon sx={{ mr: 1 }} />
            Catering & Food
          </ToggleButton>
        </ToggleButtonGroup>
      </Paper>

      {/* Location Filter */}
      <Paper sx={{ p: 3, mb: 4, background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h6" sx={{ color: 'white' }}>
            Filter by Location
          </Typography>
          {!userLocation && (
            <Button
              variant="contained"
              startIcon={locationLoading ? <CircularProgress size={16} color="inherit" /> : <MyLocationIcon />}
              onClick={() => getCurrentLocation(true)}
              disabled={locationLoading}
              sx={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.3)',
                },
              }}
            >
              {locationLoading ? 'Getting Location...' : 'Use My Location'}
            </Button>
          )}
          {userLocation && (
            <Chip
              icon={<LocationOnIcon />}
              label={`Location: ${userLocation.lat.toFixed(4)}, ${userLocation.lon.toFixed(4)}`}
              sx={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}
            />
          )}
        </Box>
        <ToggleButtonGroup
          value={locationFilter}
          exclusive
          onChange={(e, value) => value !== null && handleLocationFilterChange(value)}
          aria-label="location filter"
          sx={{
            '& .MuiToggleButton-root': {
              color: 'white',
              borderColor: 'rgba(255,255,255,0.3)',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.1)',
              },
              '&.Mui-selected': {
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.3)',
                },
              },
            },
          }}
        >
          <ToggleButton value="all" aria-label="all locations">
            <LocationOnIcon sx={{ mr: 1 }} />
            All Locations
          </ToggleButton>
          <ToggleButton value="custom" aria-label="custom radius">
            <LocationOnIcon sx={{ mr: 1 }} />
            Custom Radius
          </ToggleButton>
        </ToggleButtonGroup>
        {locationFilter === 'custom' && (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ px: 1, mb: 2 }}>
              <Slider
                value={customRadius}
                onChange={(e, newValue) => setCustomRadius(newValue as number)}
                min={1}
                max={50}
                step={1}
                marks={[
                  { value: 1, label: '1km' },
                  { value: 10, label: '10km' },
                  { value: 25, label: '25km' },
                  { value: 50, label: '50km' },
                ]}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${value}km`}
                sx={{
                  color: 'white',
                  '& .MuiSlider-thumb': {
                    backgroundColor: 'white',
                    '&:hover': {
                      boxShadow: '0 0 0 8px rgba(255, 255, 255, 0.16)',
                    },
                  },
                  '& .MuiSlider-track': {
                    backgroundColor: 'white',
                  },
                  '& .MuiSlider-rail': {
                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                  },
                  '& .MuiSlider-markLabel': {
                    color: 'white',
                  },
                  '& .MuiSlider-valueLabel': {
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    color: '#f5576c',
                    fontWeight: 'bold',
                  },
                }}
              />
            </Box>
            <Button
              variant="contained"
              onClick={handleApplyCustomRadius}
              sx={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.3)',
                },
                fontWeight: 'bold',
              }}
            >
              Apply Filter ({customRadius}km)
            </Button>
          </Box>
        )}
      </Paper>

      {/* Budget Filter */}
      <Paper sx={{ p: 3, mb: 4, background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h6" sx={{ color: 'white' }}>
            Filter by Budget
          </Typography>
          <ToggleButtonGroup
            value={sortOrder}
            exclusive
            onChange={(e, value) => value !== null && setSortOrder(value)}
            aria-label="sort order"
            size="small"
            sx={{
              flexWrap: 'wrap',
              gap: 1,
              '& .MuiToggleButton-root': {
                color: 'white',
                borderColor: 'rgba(255,255,255,0.3)',
                mb: 1,
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)',
                },
                '&.Mui-selected': {
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.3)',
                  },
                },
              },
            }}
          >
            <ToggleButton value="default" aria-label="default sort">
              Default
            </ToggleButton>
            <ToggleButton value="price-low" aria-label="price low to high">
              <AttachMoneyIcon sx={{ mr: 0.5, fontSize: 'small' }} />
              Price: Low to High
            </ToggleButton>
            <ToggleButton value="price-high" aria-label="price high to low">
              <AttachMoneyIcon sx={{ mr: 0.5, fontSize: 'small' }} />
              Price: High to Low
            </ToggleButton>
            <ToggleButton value="rating-high" aria-label="rating high to low">
              <StarIcon sx={{ mr: 0.5, fontSize: 'small' }} />
              Rating: High to Low
            </ToggleButton>
            <ToggleButton value="rating-low" aria-label="rating low to high">
              <StarIcon sx={{ mr: 0.5, fontSize: 'small' }} />
              Rating: Low to High
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
        <ToggleButtonGroup
          value={budgetFilter}
          exclusive
          onChange={(e, value) => value !== null && handleBudgetFilterChange(value)}
          aria-label="budget filter"
          sx={{
            flexWrap: 'wrap',
            gap: 1,
            '& .MuiToggleButton-root': {
              color: 'white',
              borderColor: 'rgba(255,255,255,0.3)',
              mb: 1,
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.1)',
              },
              '&.Mui-selected': {
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.3)',
                },
              },
            },
          }}
        >
          <ToggleButton value="all" aria-label="all budgets">
            <AttachMoneyIcon sx={{ mr: 1 }} />
            All Prices
          </ToggleButton>
          <ToggleButton value="custom" aria-label="custom budget">
            Custom Range
          </ToggleButton>
        </ToggleButtonGroup>
        {budgetFilter === 'custom' && (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ px: 1, mb: 2 }}>
              <Slider
                value={[customMinBudget, customMaxBudget]}
                onChange={(e, newValue) => {
                  const [min, max] = newValue as number[];
                  setCustomMinBudget(min);
                  setCustomMaxBudget(max);
                }}
                min={0}
                max={200000}
                step={1000}
                marks={[
                  { value: 0, label: '₹0' },
                  { value: 50000, label: '₹50k' },
                  { value: 100000, label: '₹1 lac' },
                  { value: 200000, label: '₹200k' },
                ]}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => formatPrice(value)}
                sx={{
                  color: 'white',
                  '& .MuiSlider-thumb': {
                    backgroundColor: 'white',
                    '&:hover': {
                      boxShadow: '0 0 0 8px rgba(255, 255, 255, 0.16)',
                    },
                  },
                  '& .MuiSlider-track': {
                    backgroundColor: 'white',
                  },
                  '& .MuiSlider-rail': {
                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                  },
                  '& .MuiSlider-markLabel': {
                    color: 'white',
                  },
                  '& .MuiSlider-valueLabel': {
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    color: '#00f2fe',
                    fontWeight: 'bold',
                  },
                }}
              />
            </Box>
            <Button
              variant="contained"
              onClick={handleApplyCustomBudget}
              sx={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.3)',
                },
                fontWeight: 'bold',
              }}
            >
              Apply Filter ({formatPrice(customMinBudget)} - {formatPrice(customMaxBudget)})
            </Button>
          </Box>
        )}
      </Paper>

      {/* Business-Based Organization */}
      <Box sx={{ mt: 4 }}>
        {selectedCategory === 'all' ? (
          /* All Businesses Section */
          sortBusinessesByDistance(filteredBusinesses).map((business, businessIndex) => {
            const businessThemesList = filterAndSortThemes(
              sortItemsByDistance(
                businessThemes[business.businessId] || []
              )
            );
            const businessInventoryList = filterAndSortInventory(
              sortItemsByDistance(
                businessInventory[business.businessId] || []
              )
            );
            const businessPlatesList = filterAndSortPlates(
              sortItemsByDistance(
                businessPlates[business.businessId] || []
              )
            );
            const businessDishesList = filterAndSortDishes(
              sortItemsByDistance(
                businessDishes[business.businessId] || []
              )
            );
            
            // Skip businesses with no content
            if (businessThemesList.length === 0 && businessInventoryList.length === 0 && businessPlatesList.length === 0 && businessDishesList.length === 0) return null;
            
            const distance = businessDistances[business.businessId];
            
            return (
              <Slide 
                key={business.businessId} 
                direction="up" 
                in={true} 
                timeout={300 + businessIndex * 100}
              >
                <Box sx={{ mb: 8 }}>
                  {/* Business Name as Main Heading */}
                  <Box sx={{ mb: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Typography variant="h2" gutterBottom sx={{ 
                        fontWeight: 'bold', 
                        color: 'primary.main',
                        borderBottom: '4px solid',
                        borderColor: 'primary.main',
                        pb: 2,
                        display: 'inline-block',
                        flex: 1
                      }}>
                        {business.businessName}
                      </Typography>
                      <Tooltip title="Start a conversation with this vendor">
                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={<ChatIcon />}
                          onClick={() => handleStartChat(business)}
                          disabled={chatLoading[business.businessId]}
                          sx={{
                            minWidth: 'auto',
                            px: 2,
                            py: 1,
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 'bold',
                            boxShadow: 2,
                            '&:hover': {
                              boxShadow: 4,
                              transform: 'translateY(-1px)',
                            },
                            transition: 'all 0.2s ease-in-out',
                          }}
                        >
                          {chatLoading[business.businessId] ? 'Starting...' : 'Chat'}
                        </Button>
                      </Tooltip>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                      <Typography variant="h5" color="text.secondary">
                        {business.businessCategory} • {businessThemesList.length} Themes • {businessInventoryList.length} Items • {businessPlatesList.length} Plates • {businessDishesList.length} Dishes
                      </Typography>
                      {distance !== undefined && userLocation && (
                        <Chip
                          icon={<LocationOnIcon />}
                          label={formatDistance(distance)}
                          color="primary"
                          sx={{ fontWeight: 'bold' }}
                        />
                      )}
                    </Box>
                  </Box>

                  {/* Show themes if available */}
                  {businessThemesList.length > 0 && (
                    <Box sx={{ mb: 4 }}>
                      <Typography variant="h5" gutterBottom sx={{ mb: 3, color: 'primary.main' }}>
                        🎨 Themes
                      </Typography>
                      <Box sx={{ 
                        display: 'flex',
                        gap: 2,
                        overflowX: 'auto',
                        scrollBehavior: 'smooth',
                        pb: 2,
                        '&::-webkit-scrollbar': {
                          height: 8,
                        },
                        '&::-webkit-scrollbar-track': {
                          backgroundColor: 'rgba(0,0,0,0.1)',
                          borderRadius: 4,
                        },
                        '&::-webkit-scrollbar-thumb': {
                          backgroundColor: 'rgba(0,0,0,0.3)',
                          borderRadius: 4,
                          '&:hover': {
                            backgroundColor: 'rgba(0,0,0,0.5)',
                          },
                        },
                      }}>
                        {businessThemesList.map((theme) => (
                          <Box
                            key={theme.themeId}
                            sx={{
                              minWidth: '280px',
                              maxWidth: '280px',
                              flexShrink: 0,
                            }}
                          >
                            <ThemeCard 
                              theme={theme} 
                              business={business}
                              onBuyNow={handleThemeBuyNow}
                              showCartButton={true}
                              showBuyNowButton={true}
                              showActions={false}
                            />
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}

                  {/* Show inventory if available */}
                  {businessInventoryList.length > 0 && (
                    <Box sx={{ mb: 4 }}>
                      <Typography variant="h5" gutterBottom sx={{ mb: 3, color: 'primary.main' }}>
                        📦 Inventory
                      </Typography>
                      <Box sx={{ 
                        display: 'flex',
                        gap: 2,
                        overflowX: 'auto',
                        scrollBehavior: 'smooth',
                        pb: 2,
                        '&::-webkit-scrollbar': {
                          height: 8,
                        },
                        '&::-webkit-scrollbar-track': {
                          backgroundColor: 'rgba(0,0,0,0.1)',
                          borderRadius: 4,
                        },
                        '&::-webkit-scrollbar-thumb': {
                          backgroundColor: 'rgba(0,0,0,0.3)',
                          borderRadius: 4,
                          '&:hover': {
                            backgroundColor: 'rgba(0,0,0,0.5)',
                          },
                        },
                      }}>
                        {businessInventoryList.map((item) => (
                          <Box
                            key={item.inventoryId}
                            sx={{
                              minWidth: '280px',
                              maxWidth: '280px',
                              flexShrink: 0,
                            }}
                          >
                            <InventoryCard 
                              inventory={item} 
                              business={business}
                              onBuyNow={handleInventoryBuyNow}
                              showCartButton={true}
                              showBuyNowButton={true}
                              showActions={false}
                            />
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}

                  {/* Show plates if available */}
                  {businessPlatesList.length > 0 && (
                    <Box sx={{ mb: 4 }}>
                      <Typography variant="h5" gutterBottom sx={{ mb: 3, color: 'primary.main' }}>
                        🍽️ Plates
                      </Typography>
                      <Box sx={{ 
                        display: 'flex',
                        gap: 2,
                        overflowX: 'auto',
                        scrollBehavior: 'smooth',
                        pb: 2,
                        '&::-webkit-scrollbar': {
                          height: 8,
                        },
                        '&::-webkit-scrollbar-track': {
                          backgroundColor: 'rgba(0,0,0,0.1)',
                          borderRadius: 4,
                        },
                        '&::-webkit-scrollbar-thumb': {
                          backgroundColor: 'rgba(0,0,0,0.3)',
                          borderRadius: 4,
                          '&:hover': {
                            backgroundColor: 'rgba(0,0,0,0.5)',
                          },
                        },
                      }}>
                        {businessPlatesList.map((plate) => (
                          <Box
                            key={plate.plateId}
                            sx={{
                              minWidth: '280px',
                              maxWidth: '280px',
                              flexShrink: 0,
                            }}
                          >
                            <PlateCard 
                              plate={plate} 
                              business={business}
                              onEdit={() => {}} 
                              onDelete={() => {}} 
                              onUpdate={() => {}} 
                              onBuyNow={handlePlateBuyNow}
                              showCartButton={true}
                              showBuyNowButton={true}
                            />
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}

                  {/* Show dishes if available */}
                  {businessDishesList.length > 0 && (
                    <Box sx={{ mb: 4 }}>
                      <Typography variant="h5" gutterBottom sx={{ mb: 3, color: 'primary.main' }}>
                        🍲 Dishes
                      </Typography>
                      <Box sx={{ 
                        display: 'flex',
                        gap: 2,
                        overflowX: 'auto',
                        scrollBehavior: 'smooth',
                        pb: 2,
                        '&::-webkit-scrollbar': {
                          height: 8,
                        },
                        '&::-webkit-scrollbar-track': {
                          backgroundColor: 'rgba(0,0,0,0.1)',
                          borderRadius: 4,
                        },
                        '&::-webkit-scrollbar-thumb': {
                          backgroundColor: 'rgba(0,0,0,0.3)',
                          borderRadius: 4,
                          '&:hover': {
                            backgroundColor: 'rgba(0,0,0,0.5)',
                          },
                        },
                      }}>
                        {businessDishesList.map((dish) => (
                          <Box
                            key={dish.dishId}
                            sx={{
                              minWidth: '280px',
                              maxWidth: '280px',
                              flexShrink: 0,
                            }}
                          >
                            <DishCard 
                              dish={dish} 
                              business={business}
                              onEdit={() => {}} 
                              onDelete={() => {}} 
                              onUpdate={() => {}} 
                              onBuyNow={handleDishBuyNow}
                              showCartButton={true}
                              showBuyNowButton={true}
                            />
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}
                </Box>
              </Slide>
            );
          })
        ) : selectedCategory === 'catering' ? (
          /* Catering & Food Section */
          <Box>
            <Typography variant="h4" gutterBottom sx={{ 
              fontWeight: 'bold', 
              color: 'primary.main',
              borderBottom: '3px solid',
              borderColor: 'primary.main',
              pb: 2,
              mb: 4
            }}>
              🍽️ Catering & Food
            </Typography>
            
            
            {sortBusinessesByDistance(filteredBusinesses).map((business, businessIndex) => {
              const businessPlatesList = filterAndSortPlates(
                sortItemsByDistance(
                  businessPlates[business.businessId] || []
                )
              );
              const businessDishesList = filterAndSortDishes(
                sortItemsByDistance(
                  businessDishes[business.businessId] || []
                )
              );
              if (businessPlatesList.length === 0 && businessDishesList.length === 0) return null;
              
              const distance = businessDistances[business.businessId];
              
              return (
                <Slide 
                  key={business.businessId} 
                  direction="up" 
                  in={true} 
                  timeout={300 + businessIndex * 100}
                >
                  <Box sx={{ mb: 6 }}>
                    {/* Business Name as Heading */}
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Typography variant="h3" gutterBottom sx={{ 
                          fontWeight: 'bold', 
                          color: 'primary.main',
                          borderBottom: '3px solid',
                          borderColor: 'primary.main',
                          pb: 1,
                          display: 'inline-block',
                          flex: 1
                        }}>
                          {business.businessName}
                        </Typography>
                        <Tooltip title="Start a conversation with this vendor">
                          <Button
                            variant="contained"
                            color="primary"
                            startIcon={<ChatIcon />}
                            onClick={() => handleStartChat(business)}
                            disabled={chatLoading[business.businessId]}
                            sx={{
                              minWidth: 'auto',
                              px: 2,
                              py: 1,
                              borderRadius: 2,
                              textTransform: 'none',
                              fontWeight: 'bold',
                              boxShadow: 2,
                              '&:hover': {
                                boxShadow: 4,
                                transform: 'translateY(-1px)',
                              },
                              transition: 'all 0.2s ease-in-out',
                            }}
                          >
                            {chatLoading[business.businessId] ? 'Starting...' : 'Chat'}
                          </Button>
                        </Tooltip>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                        <Typography variant="h6" color="text.secondary">
                          {business.businessCategory} • {businessPlatesList.length} Plate{businessPlatesList.length !== 1 ? 's' : ''} • {businessDishesList.length} Dish{businessDishesList.length !== 1 ? 'es' : ''} Available
                        </Typography>
                        {distance !== undefined && userLocation && (
                          <Chip
                            icon={<LocationOnIcon />}
                            label={formatDistance(distance)}
                            color="primary"
                            sx={{ fontWeight: 'bold' }}
                          />
                        )}
                      </Box>
                    </Box>

                    {/* Plates List */}
                    <Box sx={{ 
                      display: 'flex',
                      gap: 2,
                      overflowX: 'auto',
                      scrollBehavior: 'smooth',
                      pb: 2,
                      '&::-webkit-scrollbar': {
                        height: 8,
                      },
                      '&::-webkit-scrollbar-track': {
                        backgroundColor: 'rgba(0,0,0,0.1)',
                        borderRadius: 4,
                      },
                      '&::-webkit-scrollbar-thumb': {
                        backgroundColor: 'rgba(0,0,0,0.3)',
                        borderRadius: 4,
                        '&:hover': {
                          backgroundColor: 'rgba(0,0,0,0.5)',
                        },
                      },
                    }}>
                      {businessPlatesList.map((plate) => (
                        <Box
                          key={plate.plateId}
                          sx={{
                            minWidth: '280px',
                            maxWidth: '280px',
                            flexShrink: 0,
                          }}
                        >
                          <PlateCard 
                            plate={plate} 
                            business={business}
                            onEdit={() => {}} 
                            onDelete={() => {}} 
                            onUpdate={() => {}} 
                            onBuyNow={handlePlateBuyNow}
                            showCartButton={true}
                            showBuyNowButton={true}
                          />
                        </Box>
                      ))}
                    </Box>

                    {/* Dishes List */}
                    {businessDishesList.length > 0 && (
                      <Box sx={{ mt: 4 }}>
                        <Typography variant="h5" gutterBottom sx={{ mb: 3, color: 'primary.main' }}>
                          🍲 Dishes
                        </Typography>
                        <Box sx={{ 
                          display: 'flex',
                          gap: 2,
                          overflowX: 'auto',
                          scrollBehavior: 'smooth',
                          pb: 2,
                          '&::-webkit-scrollbar': {
                            height: 8,
                          },
                          '&::-webkit-scrollbar-track': {
                            backgroundColor: 'rgba(0,0,0,0.1)',
                            borderRadius: 4,
                          },
                          '&::-webkit-scrollbar-thumb': {
                            backgroundColor: 'rgba(0,0,0,0.3)',
                            borderRadius: 4,
                            '&:hover': {
                              backgroundColor: 'rgba(0,0,0,0.5)',
                            },
                          },
                        }}>
                          {businessDishesList.map((dish) => (
                            <Box
                              key={dish.dishId}
                              sx={{
                                minWidth: '280px',
                                maxWidth: '280px',
                                flexShrink: 0,
                              }}
                            >
                              <DishCard 
                                dish={dish} 
                                business={business}
                                onEdit={() => {}} 
                                onDelete={() => {}} 
                                onUpdate={() => {}} 
                                onBuyNow={handleDishBuyNow}
                                showCartButton={true}
                                showBuyNowButton={true}
                              />
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    )}
                  </Box>
                </Slide>
              );
            })}
            
            
            {/* No data message */}
            {filteredBusinesses.length === 0 && plates.length === 0 && dishes.length === 0 && (
              <Box textAlign="center" py={4}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No catering businesses found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Try selecting a different category
                </Typography>
              </Box>
            )}
          </Box>
        ) : (
          /* Tent & Events Section */
          sortBusinessesByDistance(filteredBusinesses).map((business, businessIndex) => {
            const businessThemesList = filterAndSortThemes(
              sortItemsByDistance(
                businessThemes[business.businessId] || []
              )
            );
            const businessInventoryList = filterAndSortInventory(
              sortItemsByDistance(
                businessInventory[business.businessId] || []
              )
            );
            
            // Skip businesses with no themes or inventory
            if (businessThemesList.length === 0 && businessInventoryList.length === 0) return null;
            
            const distance = businessDistances[business.businessId];
            
            return (
              <Slide 
                key={business.businessId} 
                direction="up" 
                in={true} 
                timeout={300 + businessIndex * 100}
              >
                <Box sx={{ mb: 8 }}>
                  {/* Business Name as Main Heading */}
                  <Box sx={{ mb: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Typography variant="h2" gutterBottom sx={{ 
                        fontWeight: 'bold', 
                        color: 'primary.main',
                        borderBottom: '4px solid',
                        borderColor: 'primary.main',
                        pb: 2,
                        display: 'inline-block',
                        flex: 1
                      }}>
                        {business.businessName}
                      </Typography>
                      <Tooltip title="Start a conversation with this vendor">
                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={<ChatIcon />}
                          onClick={() => handleStartChat(business)}
                          disabled={chatLoading[business.businessId]}
                          sx={{
                            minWidth: 'auto',
                            px: 2,
                            py: 1,
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 'bold',
                            boxShadow: 2,
                            '&:hover': {
                              boxShadow: 4,
                              transform: 'translateY(-1px)',
                            },
                            transition: 'all 0.2s ease-in-out',
                          }}
                        >
                          {chatLoading[business.businessId] ? 'Starting...' : 'Chat'}
                        </Button>
                      </Tooltip>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                      <Typography variant="h5" color="text.secondary">
                        {business.businessCategory} • {businessThemesList.length} Themes • {businessInventoryList.length} Items
                      </Typography>
                      {distance !== undefined && userLocation && (
                        <Chip
                          icon={<LocationOnIcon />}
                          label={formatDistance(distance)}
                          color="primary"
                          sx={{ fontWeight: 'bold' }}
                        />
                      )}
                    </Box>
                  </Box>

                  {/* Business Tabs */}
                  <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                    <Tabs value={activeTab} onChange={handleTabChange} aria-label={`${business.businessName} tabs`}>
                      <Tab
                        icon={<PaletteIcon />}
                        label={`Themes (${businessThemesList.length})`}
                        iconPosition="start"
                      />
                      <Tab
                        icon={<InventoryIcon />}
                        label={`Inventory (${businessInventoryList.length})`}
                        iconPosition="start"
                      />
                    </Tabs>
                  </Box>

                  {/* Themes Tab for this business */}
                  {activeTab === 0 && businessThemesList.length > 0 && (
                    <Box sx={{ mb: 4 }}>
                      <Typography variant="h5" gutterBottom sx={{ mb: 3, color: 'primary.main' }}>
                        🎨 Themes from {business.businessName}
                      </Typography>
                      <Box sx={{ 
                        display: 'flex',
                        gap: 2,
                        overflowX: 'auto',
                        scrollBehavior: 'smooth',
                        pb: 2,
                        '&::-webkit-scrollbar': {
                          height: 8,
                        },
                        '&::-webkit-scrollbar-track': {
                          backgroundColor: 'rgba(0,0,0,0.1)',
                          borderRadius: 4,
                        },
                        '&::-webkit-scrollbar-thumb': {
                          backgroundColor: 'rgba(0,0,0,0.3)',
                          borderRadius: 4,
                          '&:hover': {
                            backgroundColor: 'rgba(0,0,0,0.5)',
                          },
                        },
                      }}>
                        {businessThemesList.map((theme) => (
                          <Box
                            key={theme.themeId}
                            sx={{
                              minWidth: '280px',
                              maxWidth: '280px',
                              flexShrink: 0,
                            }}
                          >
                            <ThemeCard 
                              theme={theme} 
                              business={business}
                              onBuyNow={handleThemeBuyNow}
                              showCartButton={true}
                              showBuyNowButton={true}
                              showActions={false}
                            />
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}

                  {/* Inventory Tab for this business */}
                  {activeTab === 1 && businessInventoryList.length > 0 && (
                    <Box sx={{ mb: 4 }}>
                      <Typography variant="h5" gutterBottom sx={{ mb: 3, color: 'primary.main' }}>
                        📦 Inventory from {business.businessName}
                      </Typography>
                      <Box sx={{ 
                        display: 'flex',
                        gap: 2,
                        overflowX: 'auto',
                        scrollBehavior: 'smooth',
                        pb: 2,
                        '&::-webkit-scrollbar': {
                          height: 8,
                        },
                        '&::-webkit-scrollbar-track': {
                          backgroundColor: 'rgba(0,0,0,0.1)',
                          borderRadius: 4,
                        },
                        '&::-webkit-scrollbar-thumb': {
                          backgroundColor: 'rgba(0,0,0,0.3)',
                          borderRadius: 4,
                          '&:hover': {
                            backgroundColor: 'rgba(0,0,0,0.5)',
                          },
                        },
                      }}>
                        {businessInventoryList.map((item) => (
                          <Box
                            key={item.inventoryId}
                            sx={{
                              minWidth: '280px',
                              maxWidth: '280px',
                              flexShrink: 0,
                            }}
                          >
                            <InventoryCard 
                              inventory={item} 
                              business={business}
                              onBuyNow={handleInventoryBuyNow}
                              showCartButton={true}
                              showBuyNowButton={true}
                              showActions={false}
                            />
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}


                  {/* No content message */}
                  {activeTab === 0 && businessThemesList.length === 0 && (
                    <Box textAlign="center" py={4}>
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        No themes available from {business.businessName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Check back later for new themes
                      </Typography>
                    </Box>
                  )}

                  {activeTab === 1 && businessInventoryList.length === 0 && (
                    <Box textAlign="center" py={4}>
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        No inventory available from {business.businessName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Check back later for new items
                      </Typography>
                    </Box>
                  )}

                </Box>
              </Slide>
            );
          })
        )}
      </Box>
    </Box>
  );
};

export default ClientExplore;
