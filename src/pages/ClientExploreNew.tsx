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
} from '@mui/material';
import {
  Palette as PaletteIcon,
  Inventory as InventoryIcon,
  Restaurant as CateringIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';

import { Business, Theme, Inventory, Plate } from '../types';
import BusinessService from '../services/businessService';
import ThemeService from '../services/themeService';
import InventoryService from '../services/inventoryService';
import plateService from '../services/plateService';
import ThemeCard from '../components/ThemeCard';
import InventoryCard from '../components/InventoryCard';
import PlateCard from '../components/PlateCard';
import { useCart } from '../contexts/CartContext';

const ClientExplore: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [plates, setPlates] = useState<Plate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([]);
  const [businessThemes, setBusinessThemes] = useState<{[key: string]: Theme[]}>({});
  const [businessInventory, setBusinessInventory] = useState<{[key: string]: Inventory[]}>({});
  const [businessPlates, setBusinessPlates] = useState<{[key: string]: Plate[]}>({});
  const [refreshKey, setRefreshKey] = useState(0);
  const { addToCart } = useCart();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchData();
    }
  }, [selectedCategory]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [businessesData, themesData, inventoryData, platesData] = await Promise.all([
        BusinessService.getAllBusinesses(),
        ThemeService.getAllThemes(),
        InventoryService.getAllInventory(),
        plateService.getAllPlates()
      ]);
      
      setBusinesses(businessesData);
      setThemes(themesData);
      setInventory(inventoryData);
      setPlates(platesData);
      
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
      
    } catch (err) {
      setError('Failed to fetch data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
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

  // Buy Now handlers
  const handleThemeBuyNow = (theme: Theme, business: Business) => {
    addToCart(theme, business);
    // You can add additional logic here like opening cart or showing a success message
  };

  const handleInventoryBuyNow = (inventory: Inventory, business: Business) => {
    addToCart(inventory, business);
    // You can add additional logic here like opening cart or showing a success message
  };

  const handlePlateBuyNow = (plate: Plate, business: Business) => {
    addToCart(plate, business);
    // You can add additional logic here like opening cart or showing a success message
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

      {/* Business-Based Organization */}
      <Box sx={{ mt: 4 }}>
        {selectedCategory === 'all' ? (
          /* All Businesses Section */
          filteredBusinesses.map((business, businessIndex) => {
            const businessThemesList = businessThemes[business.businessId] || [];
            const businessInventoryList = businessInventory[business.businessId] || [];
            const businessPlatesList = businessPlates[business.businessId] || [];
            
            // Skip businesses with no content
            if (businessThemesList.length === 0 && businessInventoryList.length === 0 && businessPlatesList.length === 0) return null;
            
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
                    <Typography variant="h2" gutterBottom sx={{ 
                      fontWeight: 'bold', 
                      color: 'primary.main',
                      borderBottom: '4px solid',
                      borderColor: 'primary.main',
                      pb: 2,
                      display: 'inline-block'
                    }}>
                      {business.businessName}
                    </Typography>
                    <Typography variant="h5" color="text.secondary" sx={{ mb: 3 }}>
                      {business.businessCategory} • {businessThemesList.length} Themes • {businessInventoryList.length} Items • {businessPlatesList.length} Plates
                    </Typography>
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
            
            
            {filteredBusinesses.map((business, businessIndex) => {
              const businessPlatesList = businessPlates[business.businessId] || [];
              if (businessPlatesList.length === 0) return null;
              
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
                      <Typography variant="h3" gutterBottom sx={{ 
                        fontWeight: 'bold', 
                        color: 'primary.main',
                        borderBottom: '3px solid',
                        borderColor: 'primary.main',
                        pb: 1,
                        display: 'inline-block'
                      }}>
                        {business.businessName}
                      </Typography>
                      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                        {business.businessCategory} • {businessPlatesList.length} Plate{businessPlatesList.length !== 1 ? 's' : ''} Available
                      </Typography>
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
                            onEdit={() => {}} 
                            onDelete={() => {}} 
                            onUpdate={() => {}} 
                          />
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Slide>
              );
            })}
            
            
            {/* No data message */}
            {filteredBusinesses.length === 0 && plates.length === 0 && (
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
          filteredBusinesses.map((business, businessIndex) => {
            const businessThemesList = businessThemes[business.businessId] || [];
            const businessInventoryList = businessInventory[business.businessId] || [];
            
            // Skip businesses with no themes or inventory
            if (businessThemesList.length === 0 && businessInventoryList.length === 0) return null;
            
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
                    <Typography variant="h2" gutterBottom sx={{ 
                      fontWeight: 'bold', 
                      color: 'primary.main',
                      borderBottom: '4px solid',
                      borderColor: 'primary.main',
                      pb: 2,
                      display: 'inline-block'
                    }}>
                      {business.businessName}
                    </Typography>
                    <Typography variant="h5" color="text.secondary" sx={{ mb: 3 }}>
                      {business.businessCategory} • {businessThemesList.length} Themes • {businessInventoryList.length} Items
                    </Typography>
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
