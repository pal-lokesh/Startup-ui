import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

interface EquipmentItem {
  id: string;
  name: string;
  image: string;
  price: number;
  description?: string;
  category: 'chair' | 'table' | 'plates';
}

interface EquipmentListProps {
  open: boolean;
  onClose: () => void;
  equipmentType: 'chair' | 'table' | 'plates';
}

const EquipmentList: React.FC<EquipmentListProps> = ({ open, onClose, equipmentType }) => {
  const [equipmentItems, setEquipmentItems] = useState<EquipmentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock data for equipment items
  const mockEquipmentData: EquipmentItem[] = [
    // Chairs
    {
      id: 'chair_1',
      name: 'Classic Wooden Chair',
      image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxyZWN0IHg9IjUwIiB5PSIxMDAiIHdpZHRoPSIxMDAiIGhlaWdodD0iODAiIGZpbGw9IiM4QjQ1MTMiLz4KPHJlY3QgeD0iNDAiIHk9IjE4MCIgd2lkdGg9IjEyMCIgaGVpZ2h0PSIxMCIgZmlsbD0iIzg0QjQ1MSIvPgo8cmVjdCB4PSI0MCIgeT0iMTAwIiB3aWR0aD0iMTAiIGhlaWdodD0iODAiIGZpbGw9IiM4NEI0NTEiLz4KPHJlY3QgeD0iMTUwIiB5PSIxMDAiIHdpZHRoPSIxMCIgaGVpZ2h0PSI4MCIgZmlsbD0iIzg0QjQ1MSIvPgo8L3N2Zz4K',
      price: 2500,
      description: 'Comfortable wooden chair with classic design',
      category: 'chair'
    },
    {
      id: 'chair_2',
      name: 'Modern Plastic Chair',
      image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxyZWN0IHg9IjUwIiB5PSIxMDAiIHdpZHRoPSIxMDAiIGhlaWdodD0iODAiIGZpbGw9IiM0Q0FGNTUiLz4KPHJlY3QgeD0iNDAiIHk9IjE4MCIgd2lkdGg9IjEyMCIgaGVpZ2h0PSIxMCIgZmlsbD0iIzQ0QkY1NSIvPgo8cmVjdCB4PSI0MCIgeT0iMTAwIiB3aWR0aD0iMTAiIGhlaWdodD0iODAiIGZpbGw9IiM0NEJGNTUiLz4KPHJlY3QgeD0iMTUwIiB5PSIxMDAiIHdpZHRoPSIxMCIgaGVpZ2h0PSI4MCIgZmlsbD0iIzQ0QkY1NSIvPgo8L3N2Zz4K',
      price: 1200,
      description: 'Lightweight and durable plastic chair',
      category: 'chair'
    },
    {
      id: 'chair_3',
      name: 'Luxury Upholstered Chair',
      image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxyZWN0IHg9IjUwIiB5PSIxMDAiIHdpZHRoPSIxMDAiIGhlaWdodD0iODAiIGZpbGw9IiM5QzI3QjAiLz4KPHJlY3QgeD0iNDAiIHk9IjE4MCIgd2lkdGg9IjEyMCIgaGVpZ2h0PSIxMCIgZmlsbD0iIzlDMjdCMCIvPgo8cmVjdCB4PSI0MCIgeT0iMTAwIiB3aWR0aD0iMTAiIGhlaWdodD0iODAiIGZpbGw9IiM5QzI3QjAiLz4KPHJlY3QgeD0iMTUwIiB5PSIxMDAiIHdpZHRoPSIxMCIgaGVpZ2h0PSI4MCIgZmlsbD0iIzlDMjdCMCIvPgo8L3N2Zz4K',
      price: 4500,
      description: 'Premium upholstered chair for special events',
      category: 'chair'
    },
    // Tables
    {
      id: 'table_1',
      name: 'Round Dining Table',
      image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iNjAiIGZpbGw9IiM4QjQ1MTMiLz4KPHJlY3QgeD0iOTUiIHk9IjE2MCIgd2lkdGg9IjEwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjODRCNTQxIi8+Cjwvc3ZnPgo=',
      price: 8500,
      description: 'Elegant round table for 6-8 people',
      category: 'table'
    },
    {
      id: 'table_2',
      name: 'Rectangular Banquet Table',
      image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxyZWN0IHg9IjMwIiB5PSI4MCIgd2lkdGg9IjE0MCIgaGVpZ2h0PSI2MCIgZmlsbD0iIzg0QjQ1MSIvPgo8cmVjdCB4PSI5NSIgeT0iMTQwIiB3aWR0aD0iMTAiIGhlaWdodD0iNjAiIGZpbGw9IiM4NEI0NTEiLz4KPC9zdmc+Cg==',
      price: 12000,
      description: 'Large rectangular table for events and parties',
      category: 'table'
    },
    {
      id: 'table_3',
      name: 'Folding Table',
      image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxyZWN0IHg9IjQwIiB5PSI5MCIgd2lkdGg9IjEyMCIgaGVpZ2h0PSI1MCIgZmlsbD0iIzQ0QkY1NSIvPgo8cmVjdCB4PSI5NSIgeT0iMTQwIiB3aWR0aD0iMTAiIGhlaWdodD0iNjAiIGZpbGw9IiM0NEJGNTUiLz4KPC9zdmc+Cg==',
      price: 3500,
      description: 'Portable folding table for easy setup',
      category: 'table'
    },
    // Plates
    {
      id: 'plate_1',
      name: 'Ceramic Dinner Plate Set',
      image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iNDAiIGZpbGw9IiNGRkZGRkYiIHN0cm9rZT0iI0NDQ0NDQyIgc3Ryb2tlLXdpZHRoPSIyIi8+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iMzAiIGZpbGw9IiNGRkZGRkYiLz4KPC9zdmc+Cg==',
      price: 800,
      description: 'Set of 12 ceramic dinner plates',
      category: 'plates'
    },
    {
      id: 'plate_2',
      name: 'Melamine Plate Set',
      image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iNDAiIGZpbGw9IiM0Q0FGNTUiIHN0cm9rZT0iIzMzQkY0NCIgc3Ryb2tlLXdpZHRoPSIyIi8+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iMzAiIGZpbGw9IiM0Q0FGNTUiLz4KPC9zdmc+Cg==',
      price: 500,
      description: 'Durable melamine plates for outdoor events',
      category: 'plates'
    },
    {
      id: 'plate_3',
      name: 'Premium Porcelain Set',
      image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iNDAiIGZpbGw9IiNGRkZGRkYiIHN0cm9rZT0iIzlDMjdCMCIgc3Ryb2tlLXdpZHRoPSIzIi8+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iMzAiIGZpbGw9IiNGRkZGRkYiLz4KPC9zdmc+Cg==',
      price: 1500,
      description: 'Elegant porcelain plates for formal events',
      category: 'plates'
    }
  ];

  useEffect(() => {
    if (open) {
      fetchEquipmentItems();
    }
  }, [open, equipmentType]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchEquipmentItems = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Filter items by equipment type
      const filteredItems = mockEquipmentData.filter(item => item.category === equipmentType);
      setEquipmentItems(filteredItems);
    } catch (err: any) {
      setError('Failed to load equipment items');
      console.error('Error fetching equipment items:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: { minHeight: '70vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5" component="div">
            {equipmentType.charAt(0).toUpperCase() + equipmentType.slice(1)}s Available
          </Typography>
          <Button
            onClick={onClose}
            startIcon={<CloseIcon />}
            variant="outlined"
            size="small"
          >
            Close
          </Button>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress size={60} />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : equipmentItems.length === 0 ? (
          <Box textAlign="center" py={4}>
            <Typography variant="h6" color="text.secondary">
              No {equipmentType}s available at the moment
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {equipmentItems.map((item) => (
              <Grid item xs={12} sm={6} md={4} key={item.id}>
                <Card 
                  sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                    },
                  }}
                >
                  <CardMedia
                    component="img"
                    height="200"
                    image={item.image}
                    alt={item.name}
                    sx={{ objectFit: 'cover' }}
                  />
                  
                  <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="h6" component="h3" gutterBottom>
                      {item.name}
                    </Typography>
                    
                    {item.description && (
                      <Typography variant="body2" color="text.secondary" paragraph sx={{ flexGrow: 1 }}>
                        {item.description}
                      </Typography>
                    )}
                    
                    <Box display="flex" justifyContent="space-between" alignItems="center" mt="auto">
                      <Chip 
                        label={formatPrice(item.price)} 
                        color="primary" 
                        variant="outlined"
                        sx={{ fontWeight: 'bold' }}
                      />
                      <Button 
                        variant="contained" 
                        size="small"
                        onClick={() => {
                          // Handle item selection/booking
                          console.log('Selected item:', item);
                        }}
                      >
                        Select
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EquipmentList;
