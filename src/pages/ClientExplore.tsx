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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Avatar,
  ToggleButton,
  ToggleButtonGroup,
  Paper,
  Fade,
  Slide,
} from '@mui/material';
import {
  Close as CloseIcon,
  Star as StarIcon,
  Image as ImageIcon,
  Inventory as InventoryIcon,
  Palette as PaletteIcon,
  Business as BusinessIcon,
  Home as TentIcon,
  Restaurant as CateringIcon,
  AllInclusive as AllIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { Business, Theme, Image, Inventory, InventoryImage, Plate } from '../types';
import BusinessService from '../services/businessService';
import ThemeService from '../services/themeService';
import ImageService from '../services/imageService';
import InventoryService from '../services/inventoryService';
import plateService from '../services/plateService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`explore-tabpanel-${index}`}
      aria-labelledby={`explore-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const ClientExplore: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [showBusinessDetail, setShowBusinessDetail] = useState(false);
  const [businessThemes, setBusinessThemes] = useState<{[key: string]: Theme[]}>({});
  const [businessInventory, setBusinessInventory] = useState<{[key: string]: Inventory[]}>({});
  const [businessPlates, setBusinessPlates] = useState<{[key: string]: Plate[]}>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([]);
  const [plates, setPlates] = useState<Plate[]>([]);
  const [refreshKey, setRefreshKey] = useState<number>(0);

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
    } else {
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
                 categoryLower.includes('dining') ||
                 categoryLower.includes('catering');
        }
        return false;
      });
      setFilteredBusinesses(filtered);
    }
  };

  const handleBusinessClick = (business: Business) => {
    setSelectedBusiness(business);
    setShowBusinessDetail(true);
  };

  const handleCloseBusinessDetail = () => {
    setShowBusinessDetail(false);
    setSelectedBusiness(null);
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

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Explore Services & Products
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Discover amazing themes and inventory from our business partners
      </Typography>

      {/* Fancy Category Filter */}
      <Paper 
        elevation={3} 
        sx={{ 
          p: 3, 
          mt: 3, 
          mb: 2, 
          borderRadius: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}
      >
        <Box display="flex" alignItems="center" mb={2}>
          <FilterIcon sx={{ mr: 1, fontSize: 28 }} />
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Filter by Business Type
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ mb: 2, opacity: 0.9 }}>
          Choose a category to explore specific types of businesses
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
          <ToggleButton value="all" sx={{ px: 3, py: 1.5 }}>
            <AllIcon sx={{ mr: 1 }} />
            All Businesses
          </ToggleButton>
          <ToggleButton value="tent" sx={{ px: 3, py: 1.5 }}>
            <TentIcon sx={{ mr: 1 }} />
            Tent & Events
          </ToggleButton>
          <ToggleButton value="catering" sx={{ px: 3, py: 1.5 }}>
            <CateringIcon sx={{ mr: 1 }} />
            Catering & Food
          </ToggleButton>
        </ToggleButtonGroup>
        
        <Box mt={2}>
          <Typography variant="caption" sx={{ opacity: 0.8 }}>
            Showing {filteredBusinesses.length} business{filteredBusinesses.length !== 1 ? 'es' : ''}
            {selectedCategory !== 'all' && ` in ${selectedCategory === 'tent' ? 'Tent & Events' : 'Catering & Food'} category`}
            {selectedCategory === 'catering' && ` • ${plates.length} plates available`}
          </Typography>
        </Box>
      </Paper>


      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="explore tabs">
          {selectedCategory === 'catering' ? (
            <Tab
              icon={<CateringIcon />}
              label={`Plates (${plates.length})`}
              iconPosition="start"
            />
          ) : (
            <>
              <Tab
                icon={<PaletteIcon />}
                label={`Themes (${themes.length})`}
                iconPosition="start"
              />
              <Tab
                icon={<InventoryIcon />}
                label={`Inventory (${inventory.length})`}
                iconPosition="start"
              />
            </>
          )}
        </Tabs>
      </Box>

      {/* Themes Tab - Only show for non-catering categories */}
      {selectedCategory !== 'catering' && (
        <TabPanel value={activeTab} index={0} key={`themes-${selectedCategory}-${refreshKey}`}>
          <Fade in={true} timeout={500}>
            <Box>
              {filteredBusinesses.map((business, businessIndex) => {
                const businessThemesList = businessThemes[business.businessId] || [];
                if (businessThemesList.length === 0) return null;
                
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
                          {business.businessCategory} • {businessThemesList.length} Theme{businessThemesList.length !== 1 ? 's' : ''} Available
                        </Typography>
                      </Box>

                      {/* Themes List */}
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
                            <ThemeCard theme={theme} />
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  </Slide>
                );
              })}
            </Box>
          </Fade>
          {themes.length === 0 && (
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No themes available
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Check back later for new themes
              </Typography>
            </Box>
          )}
        </TabPanel>
      )}

      {/* Inventory Tab - Only show for non-catering categories */}
      {selectedCategory !== 'catering' && (
        <TabPanel value={activeTab} index={1} key={`inventory-${selectedCategory}-${refreshKey}`}>
          <Fade in={true} timeout={500}>
            <Box>
              {filteredBusinesses.map((business, businessIndex) => {
                const businessInventoryList = businessInventory[business.businessId] || [];
                if (businessInventoryList.length === 0) return null;
                
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
                          {business.businessCategory} • {businessInventoryList.length} Item{businessInventoryList.length !== 1 ? 's' : ''} Available
                        </Typography>
                      </Box>

                      {/* Inventory List */}
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
                            <InventoryCard inventory={item} />
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  </Slide>
                );
              })}
            </Box>
          </Fade>
          {inventory.length === 0 && (
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No inventory available
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Check back later for new products
              </Typography>
            </Box>
          )}
        </TabPanel>
      )}

      {/* Plates Tab - Index 0 for catering, Index 2 for others */}
      {selectedCategory === 'catering' && (
        <TabPanel value={activeTab} index={0} key={`plates-${selectedCategory}-${refreshKey}`}>
          <Fade in={true} timeout={500}>
            <Box>
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
                            <PlateCard plate={plate} />
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  </Slide>
                );
              })}
              {filteredBusinesses.length === 0 && plates.length > 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                    All Available Plates
                  </Typography>
                  <Box sx={{ position: 'relative', overflow: 'hidden', borderRadius: 2 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        gap: 2,
                        overflowX: 'auto',
                        scrollBehavior: 'smooth',
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
                      }}
                    >
                      {plates.map((plate) => (
                        <Box
                          key={plate.plateId}
                          sx={{
                            minWidth: '280px',
                            maxWidth: '280px',
                            flexShrink: 0,
                          }}
                        >
                          <PlateCard plate={plate} />
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Box>
              )}
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
              {plates.length === 0 && filteredBusinesses.length > 0 && (
                <Box textAlign="center" py={4}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No plates available
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Check back later for new dishes
                  </Typography>
                </Box>
              )}
            </Box>
          </Fade>
        </TabPanel>
      )}

      {/* Plates Tab - For non-catering categories */}
      {selectedCategory !== 'catering' && (
        <TabPanel value={activeTab} index={2} key={`plates-${selectedCategory}-${refreshKey}`}>
          <Fade in={true} timeout={500}>
            <Box>
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
                            <PlateCard plate={plate} />
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  </Slide>
                );
              })}
              {filteredBusinesses.length === 0 && plates.length > 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                    All Available Plates
                  </Typography>
                  <Box sx={{ 
                    position: 'relative', 
                    overflow: 'hidden', 
                    borderRadius: 2,
                  }}>
                    <Box
                      sx={{
                        display: 'flex',
                        gap: 2,
                        overflowX: 'auto',
                        scrollBehavior: 'smooth',
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
                      }}
                    >
                      {plates.map((plate) => (
                        <Box
                          key={plate.plateId}
                          sx={{
                            minWidth: '280px',
                            maxWidth: '280px',
                            flexShrink: 0,
                          }}
                        >
                          <PlateCard plate={plate} />
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Box>
              )}
              {plates.length === 0 && (
                <Box textAlign="center" py={4}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No plates available
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Check back later for new dishes
                  </Typography>
                </Box>
              )}
            </Box>
          </Fade>
        </TabPanel>
      )}

      {/* Business Detail Dialog */}
      {selectedBusiness && (
        <BusinessDetailDialog
          business={selectedBusiness}
          open={showBusinessDetail}
          onClose={handleCloseBusinessDetail}
        />
      )}
    </Box>
  );
};

// Theme Card Component
const ThemeCard: React.FC<{ theme: Theme }> = ({ theme }) => {
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    fetchThemeImages();
  }, [theme.themeId]);

  const fetchThemeImages = async () => {
    try {
      const imagesData = await ImageService.getImagesByThemeId(theme.themeId);
      setImages(imagesData);
    } catch (err) {
      console.error('Error fetching theme images:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePreviousImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const currentImage = images[currentImageIndex];

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ position: 'relative', height: 200, overflow: 'hidden' }}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="100%">
            <CircularProgress size={24} />
          </Box>
        ) : currentImage ? (
          <img
            src={currentImage.imageUrl}
            alt={theme.themeName}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="100%"
            bgcolor="grey.100"
          >
            <ImageIcon color="disabled" />
          </Box>
        )}
        
        {/* Navigation Arrows - Only show if there are multiple images */}
        {images.length > 1 && (
          <>
            <IconButton
              onClick={handlePreviousImage}
              sx={{
                position: 'absolute',
                left: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                bgcolor: 'rgba(0,0,0,0.5)',
                color: 'white',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                zIndex: 2,
              }}
              size="small"
            >
              ←
            </IconButton>
            <IconButton
              onClick={handleNextImage}
              sx={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                bgcolor: 'rgba(0,0,0,0.5)',
                color: 'white',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                zIndex: 2,
              }}
              size="small"
            >
              →
            </IconButton>
          </>
        )}
        
        {/* Image Indicators */}
        {images.length > 1 && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 8,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: 0.5,
              zIndex: 2,
            }}
          >
            {images.map((_, index) => (
              <Box
                key={index}
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: index === currentImageIndex ? 'white' : 'rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                }}
                onClick={() => setCurrentImageIndex(index)}
              />
            ))}
          </Box>
        )}
        
        <Chip
          label={theme.isActive ? 'Available' : 'Unavailable'}
          color={theme.isActive ? 'success' : 'error'}
          size="small"
          sx={{ position: 'absolute', top: 8, right: 8 }}
        />
        {currentImage && currentImage.isPrimary && (
          <Chip
            icon={<StarIcon />}
            label="Featured"
            color="primary"
            size="small"
            sx={{ position: 'absolute', top: 8, left: 8 }}
          />
        )}
      </Box>
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="h6" gutterBottom>
          {theme.themeName}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {theme.themeDescription}
        </Typography>
        <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
          <Chip label={theme.themeCategory} size="small" />
          <Typography variant="h6" color="primary">
            {theme.priceRange}
          </Typography>
        </Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
          <Typography variant="caption" color="text.secondary">
            {images.length} image{images.length !== 1 ? 's' : ''}
          </Typography>
          <Button variant="outlined" size="small">
            View Details
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

// Inventory Card Component
const InventoryCard: React.FC<{ inventory: Inventory }> = ({ inventory }) => {
  const [images, setImages] = useState<InventoryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    fetchInventoryImages();
  }, [inventory.inventoryId]);

  const fetchInventoryImages = async () => {
    try {
      const imagesData = await InventoryService.getInventoryImagesByInventoryId(inventory.inventoryId);
      setImages(imagesData);
    } catch (err) {
      console.error('Error fetching inventory images:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePreviousImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const currentImage = images[currentImageIndex];

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ position: 'relative', height: 200, overflow: 'hidden' }}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="100%">
            <CircularProgress size={24} />
          </Box>
        ) : currentImage ? (
          <img
            src={currentImage.imageUrl}
            alt={inventory.inventoryName}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="100%"
            bgcolor="grey.100"
          >
            <InventoryIcon color="disabled" />
          </Box>
        )}
        
        {/* Navigation Arrows - Only show if there are multiple images */}
        {images.length > 1 && (
          <>
            <IconButton
              onClick={handlePreviousImage}
              sx={{
                position: 'absolute',
                left: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                bgcolor: 'rgba(0,0,0,0.5)',
                color: 'white',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                zIndex: 2,
              }}
              size="small"
            >
              ←
            </IconButton>
            <IconButton
              onClick={handleNextImage}
              sx={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                bgcolor: 'rgba(0,0,0,0.5)',
                color: 'white',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                zIndex: 2,
              }}
              size="small"
            >
              →
            </IconButton>
          </>
        )}
        
        {/* Image Indicators */}
        {images.length > 1 && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 8,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: 0.5,
              zIndex: 2,
            }}
          >
            {images.map((_, index) => (
              <Box
                key={index}
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: index === currentImageIndex ? 'white' : 'rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                }}
                onClick={() => setCurrentImageIndex(index)}
              />
            ))}
          </Box>
        )}
        
        <Chip
          label={inventory.isActive ? 'In Stock' : 'Out of Stock'}
          color={inventory.isActive ? 'success' : 'error'}
          size="small"
          sx={{ position: 'absolute', top: 8, right: 8 }}
        />
        {currentImage && currentImage.isPrimary && (
          <Chip
            icon={<StarIcon />}
            label="Featured"
            color="primary"
            size="small"
            sx={{ position: 'absolute', top: 8, left: 8 }}
          />
        )}
      </Box>
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="h6" gutterBottom>
          {inventory.inventoryName}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {inventory.inventoryDescription}
        </Typography>
        <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
          <Chip label={inventory.inventoryCategory} size="small" />
          <Typography variant="h6" color="primary">
            ₹{inventory.price}
          </Typography>
        </Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
          <Typography variant="caption" color="text.secondary">
            Qty: {inventory.quantity}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {images.length} image{images.length !== 1 ? 's' : ''}
          </Typography>
        </Box>
        <Button variant="outlined" size="small" fullWidth sx={{ mt: 1 }}>
          View Details
        </Button>
      </CardContent>
    </Card>
  );
};


// Business Detail Dialog Component
const BusinessDetailDialog: React.FC<{
  business: Business;
  open: boolean;
  onClose: () => void;
}> = ({ business, open, onClose }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5">{business.businessName}</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Business Information
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <strong>Category:</strong> {business.businessCategory}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <strong>Phone:</strong> {business.businessPhone}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <strong>Email:</strong> {business.businessEmail}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <strong>Address:</strong> {business.businessAddress}
            </Typography>
            {business.website && (
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Website:</strong> {business.website}
              </Typography>
            )}
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Description
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {business.businessDescription}
            </Typography>
            {business.operatingHours && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                <strong>Operating Hours:</strong> {business.operatingHours}
              </Typography>
            )}
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" color="primary">
          Contact Business
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Plate Card Component
const PlateCard: React.FC<{ plate: Plate }> = ({ plate }) => {
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ position: 'relative', height: 200, overflow: 'hidden' }}>
        {plate.plateImage ? (
          <img
            src={plate.plateImage}
            alt={plate.dishName}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="100%"
            bgcolor="grey.100"
          >
            <CateringIcon color="disabled" />
          </Box>
        )}
        <Chip
          label={plate.isActive ? 'Available' : 'Unavailable'}
          color={plate.isActive ? 'success' : 'error'}
          size="small"
          sx={{ position: 'absolute', top: 8, right: 8 }}
        />
        <Chip
          label={plate.dishType === 'veg' ? 'Vegetarian' : 'Non-Vegetarian'}
          color={plate.dishType === 'veg' ? 'success' : 'error'}
          size="small"
          sx={{ position: 'absolute', top: 8, left: 8 }}
        />
      </Box>
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="h6" gutterBottom>
          {plate.dishName}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {plate.dishDescription}
        </Typography>
        <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
          <Chip 
            label={plate.dishType === 'veg' ? 'Veg' : 'Non-Veg'} 
            size="small" 
            color={plate.dishType === 'veg' ? 'success' : 'error'}
          />
          <Typography variant="h6" color="primary">
            ₹{plate.price}
          </Typography>
        </Box>
        <Button variant="outlined" size="small" fullWidth sx={{ mt: 1 }}>
          View Details
        </Button>
      </CardContent>
    </Card>
  );
};

export default ClientExplore;
