import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
} from '@mui/material';
import {
  People as PeopleIcon,
  Business as BusinessIcon,
  Store as StoreIcon,
  Palette as PaletteIcon,
  Inventory as InventoryIcon,
  Restaurant as RestaurantIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import UserService from '../services/userService';
import BusinessService from '../services/businessService';
import ThemeService from '../services/themeService';
import InventoryService from '../services/inventoryService';
import PlateService from '../services/plateService';
import { useAuth } from '../contexts/AuthContext';
import { User, Business, Theme, Inventory, Plate } from '../types';

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
      id={`super-admin-tabpanel-${index}`}
      aria-labelledby={`super-admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const SuperAdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Data states
  const [users, setUsers] = useState<User[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [plates, setPlates] = useState<Plate[]>([]);
  
  // Stats
  const [stats, setStats] = useState({
    users: 0,
    businesses: 0,
    themes: 0,
    inventory: 0,
    plates: 0,
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [usersData, businessesData, themesData, inventoryData, platesData] = await Promise.all([
        UserService.getAllUsers(),
        BusinessService.getAllBusinesses(),
        ThemeService.getAllThemes(),
        InventoryService.getAllInventory(),
        PlateService.getAllPlates(),
      ]);

      setUsers(usersData);
      setBusinesses(businessesData);
      setThemes(themesData);
      setInventory(inventoryData);
      setPlates(platesData);
      
      setStats({
        users: usersData.length,
        businesses: businessesData.length,
        themes: themesData.length,
        inventory: inventoryData.length,
        plates: platesData.length,
      });
    } catch (err: any) {
      setError('Failed to fetch data: ' + (err.response?.data?.message || err.message));
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
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
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
        Super Admin Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Welcome, {user?.firstName} {user?.lastName}. You have full access to manage all data in the system.
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Total Users
                  </Typography>
                  <Typography variant="h4">{stats.users}</Typography>
                </Box>
                <PeopleIcon sx={{ fontSize: 40, color: '#1976d2' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Businesses
                  </Typography>
                  <Typography variant="h4">{stats.businesses}</Typography>
                </Box>
                <BusinessIcon sx={{ fontSize: 40, color: '#2e7d32' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Themes
                  </Typography>
                  <Typography variant="h4">{stats.themes}</Typography>
                </Box>
                <PaletteIcon sx={{ fontSize: 40, color: '#ed6c02' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Inventory
                  </Typography>
                  <Typography variant="h4">{stats.inventory}</Typography>
                </Box>
                <InventoryIcon sx={{ fontSize: 40, color: '#9c27b0' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Plates
                  </Typography>
                  <Typography variant="h4">{stats.plates}</Typography>
                </Box>
                <RestaurantIcon sx={{ fontSize: 40, color: '#d32f2f' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs for different data sections */}
      <Paper sx={{ width: '100%' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="super admin tabs">
          <Tab label="Users" />
          <Tab label="Businesses" />
          <Tab label="Themes" />
          <Tab label="Inventory" />
          <Tab label="Plates" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>User Type</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.phoneNumber}>
                    <TableCell>{u.firstName} {u.lastName}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{u.phoneNumber}</TableCell>
                    <TableCell>
                      <Chip label={u.userType} size="small" />
                    </TableCell>
                    <TableCell>
                      <Chip label={u.role || 'USER'} size="small" color="primary" />
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" color="primary">
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" color="error">
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Business Name</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {businesses.map((b) => (
                  <TableRow key={b.businessId}>
                    <TableCell>{b.businessName}</TableCell>
                    <TableCell>{b.businessCategory}</TableCell>
                    <TableCell>{b.phoneNumber}</TableCell>
                    <TableCell>{b.businessAddress}</TableCell>
                    <TableCell>
                      <IconButton size="small" color="primary">
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" color="error">
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Theme Name</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Price Range</TableCell>
                  <TableCell>Business ID</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {themes.map((t) => (
                  <TableRow key={t.themeId}>
                    <TableCell>{t.themeName}</TableCell>
                    <TableCell>{t.themeCategory}</TableCell>
                    <TableCell>{t.priceRange}</TableCell>
                    <TableCell>{t.businessId}</TableCell>
                    <TableCell>
                      <IconButton size="small" color="primary">
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" color="error">
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Business ID</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {inventory.map((inv) => (
                  <TableRow key={inv.inventoryId}>
                    <TableCell>{inv.inventoryName}</TableCell>
                    <TableCell>{inv.inventoryCategory}</TableCell>
                    <TableCell>₹{inv.price}</TableCell>
                    <TableCell>{inv.quantity}</TableCell>
                    <TableCell>{inv.businessId}</TableCell>
                    <TableCell>
                      <IconButton size="small" color="primary">
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" color="error">
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={4}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Dish Name</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Veg/Non-Veg</TableCell>
                  <TableCell>Business ID</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {plates.map((p) => (
                  <TableRow key={p.plateId}>
                    <TableCell>{p.dishName}</TableCell>
                    <TableCell>₹{p.price}</TableCell>
                    <TableCell>
                      <Chip 
                        label={p.dishType === 'veg' ? 'Veg' : 'Non-Veg'} 
                        size="small" 
                        color={p.dishType === 'veg' ? 'success' : 'error'} 
                      />
                    </TableCell>
                    <TableCell>{p.businessId}</TableCell>
                    <TableCell>
                      <IconButton size="small" color="primary">
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" color="error">
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default SuperAdminDashboard;

