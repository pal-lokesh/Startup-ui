import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Tabs,
  Tab,
  Grid,
  Chip,
  Avatar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Image as ImageIcon,
  Inventory as InventoryIcon,
  Palette as PaletteIcon,
} from '@mui/icons-material';
import { Business, Theme, Image, Inventory, InventoryImage } from '../types';
import ThemeService from '../services/themeService';
import ImageService from '../services/imageService';
import InventoryService from '../services/inventoryService';
import ThemeGallery from './ThemeGallery';
import InventoryGallery from './InventoryGallery';

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
      id={`business-tabpanel-${index}`}
      aria-labelledby={`business-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

interface BusinessDetailProps {
  business: Business;
  onClose: () => void;
}

const BusinessDetail: React.FC<BusinessDetailProps> = ({ business, onClose }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [selectedInventory, setSelectedInventory] = useState<Inventory | null>(null);
  const [showThemeGallery, setShowThemeGallery] = useState(false);
  const [showInventoryGallery, setShowInventoryGallery] = useState(false);

  useEffect(() => {
    fetchBusinessData();
  }, [business.businessId]);

  const fetchBusinessData = async () => {
    try {
      setLoading(true);
      const [themesData, inventoryData] = await Promise.all([
        ThemeService.getThemesByBusinessId(business.businessId),
        InventoryService.getInventoryByBusinessId(business.businessId),
      ]);
      setThemes(themesData);
      setInventory(inventoryData);
    } catch (err) {
      setError('Failed to fetch business data');
      console.error('Error fetching business data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleThemeClick = (theme: Theme) => {
    setSelectedTheme(theme);
    setShowThemeGallery(true);
  };

  const handleInventoryClick = (inventory: Inventory) => {
    setSelectedInventory(inventory);
    setShowInventoryGallery(true);
  };

  const handleCloseThemeGallery = () => {
    setShowThemeGallery(false);
    setSelectedTheme(null);
  };

  const handleCloseInventoryGallery = () => {
    setShowInventoryGallery(false);
    setSelectedInventory(null);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Dialog open={true} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5">{business.businessName}</Typography>
          <Button onClick={onClose} color="primary">
            Close
          </Button>
        </Box>
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Business Info Card */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2}>
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
                <Chip
                  label={business.isActive ? 'Active' : 'Inactive'}
                  color={business.isActive ? 'success' : 'error'}
                  size="small"
                  sx={{ mt: 1 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Description
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {business.businessDescription}
                </Typography>
                {business.website && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    <strong>Website:</strong> {business.website}
                  </Typography>
                )}
                {business.operatingHours && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    <strong>Hours:</strong> {business.operatingHours}
                  </Typography>
                )}
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="business tabs">
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
          </Tabs>
        </Box>

        {/* Themes Tab */}
        <TabPanel value={activeTab} index={0}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Themes</Typography>
            <Button variant="contained" startIcon={<AddIcon />} size="small">
              Add Theme
            </Button>
          </Box>
          <Grid container spacing={2}>
            {themes.map((theme) => (
              <Grid item xs={12} sm={6} md={4} key={theme.themeId}>
                <ThemeCard theme={theme} onClick={() => handleThemeClick(theme)} />
              </Grid>
            ))}
            {themes.length === 0 && (
              <Grid item xs={12}>
                <Box textAlign="center" py={4}>
                  <Typography variant="body1" color="text.secondary">
                    No themes found for this business
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        </TabPanel>

        {/* Inventory Tab */}
        <TabPanel value={activeTab} index={1}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Inventory</Typography>
            <Button variant="contained" startIcon={<AddIcon />} size="small">
              Add Inventory
            </Button>
          </Box>
          <Grid container spacing={2}>
            {inventory.map((item) => (
              <Grid item xs={12} sm={6} md={4} key={item.inventoryId}>
                <InventoryCard inventory={item} onClick={() => handleInventoryClick(item)} />
              </Grid>
            ))}
            {inventory.length === 0 && (
              <Grid item xs={12}>
                <Box textAlign="center" py={4}>
                  <Typography variant="body1" color="text.secondary">
                    No inventory found for this business
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        </TabPanel>

        {/* Gallery Dialogs */}
        {selectedTheme && (
          <ThemeGallery
            theme={selectedTheme}
            open={showThemeGallery}
            onClose={handleCloseThemeGallery}
          />
        )}

        {selectedInventory && (
          <InventoryGallery
            inventory={selectedInventory}
            open={showInventoryGallery}
            onClose={handleCloseInventoryGallery}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

// Theme Card Component
const ThemeCard: React.FC<{ theme: Theme; onClick?: () => void }> = ({ theme, onClick }) => {
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);

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

  const primaryImage = images.find(img => img.isPrimary) || images[0];

  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick ? { transform: 'translateY(-2px)', boxShadow: 3 } : {}
      }}
      onClick={onClick}
    >
      <Box sx={{ position: 'relative', height: 200, overflow: 'hidden' }}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="100%">
            <CircularProgress size={24} />
          </Box>
        ) : primaryImage ? (
          <img
            src={primaryImage.imageUrl}
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
        <Chip
          label={theme.isActive ? 'Active' : 'Inactive'}
          color={theme.isActive ? 'success' : 'error'}
          size="small"
          sx={{ position: 'absolute', top: 8, right: 8 }}
        />
        {primaryImage && (
          <Chip
            icon={<StarIcon />}
            label="Primary"
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
          <Typography variant="body2" color="primary">
            {theme.priceRange}
          </Typography>
        </Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
          <Typography variant="caption" color="text.secondary">
            {images.length} image{images.length !== 1 ? 's' : ''}
          </Typography>
          <Box>
            <IconButton size="small">
              <EditIcon />
            </IconButton>
            <IconButton size="small" color="error">
              <DeleteIcon />
            </IconButton>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

// Inventory Card Component
const InventoryCard: React.FC<{ inventory: Inventory; onClick?: () => void }> = ({ inventory, onClick }) => {
  const [images, setImages] = useState<InventoryImage[]>([]);
  const [loading, setLoading] = useState(true);

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

  const primaryImage = images.find(img => img.isPrimary) || images[0];

  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick ? { transform: 'translateY(-2px)', boxShadow: 3 } : {}
      }}
      onClick={onClick}
    >
      <Box sx={{ position: 'relative', height: 200, overflow: 'hidden' }}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="100%">
            <CircularProgress size={24} />
          </Box>
        ) : primaryImage ? (
          <img
            src={primaryImage.imageUrl}
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
        <Chip
          label={inventory.isActive ? 'Active' : 'Inactive'}
          color={inventory.isActive ? 'success' : 'error'}
          size="small"
          sx={{ position: 'absolute', top: 8, right: 8 }}
        />
        {primaryImage && (
          <Chip
            icon={<StarIcon />}
            label="Primary"
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
            ${inventory.price}
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
        <Box display="flex" justifyContent="flex-end" mt={1}>
          <IconButton size="small">
            <EditIcon />
          </IconButton>
          <IconButton size="small" color="error">
            <DeleteIcon />
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  );
};

export default BusinessDetail;
