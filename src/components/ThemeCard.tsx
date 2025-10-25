import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  CircularProgress,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Image as ImageIcon,
} from '@mui/icons-material';
import { Theme, Image } from '../types';
import ImageService from '../services/imageService';
import ImageCarousel from './ImageCarousel';

interface ThemeCardProps {
  theme: Theme;
  onEdit?: (theme: Theme) => void;
  onDelete?: (theme: Theme) => void;
  onViewImages?: (theme: Theme) => void;
  showActions?: boolean;
}

const ThemeCard: React.FC<ThemeCardProps> = ({
  theme,
  onEdit,
  onDelete,
  onViewImages,
  showActions = true,
}) => {
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAllImages();
  }, [theme.themeId]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchAllImages = async () => {
    try {
      setLoading(true);
      setError(null);
      const allImages = await ImageService.getImagesByThemeId(theme.themeId);
      setImages(allImages);
    } catch (err: any) {
      setError('Failed to load images');
      console.error('Error fetching theme images:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
        },
      }}
    >
      {/* Images Section */}
      <Box sx={{ position: 'relative' }}>
        {loading ? (
          <Box 
            display="flex" 
            justifyContent="center" 
            alignItems="center" 
            height="200"
            bgcolor="grey.100"
          >
            <CircularProgress size={40} />
          </Box>
        ) : error ? (
          <Box 
            display="flex" 
            justifyContent="center" 
            alignItems="center" 
            height="200"
            bgcolor="grey.100"
            flexDirection="column"
          >
            <ImageIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography variant="caption" color="text.secondary">
              Failed to load images
            </Typography>
          </Box>
        ) : (
          <ImageCarousel
            images={images}
            height={200}
            showNavigation={true}
            showDots={true}
            onImageClick={() => onViewImages?.(theme)}
          />
        )}
        
        {/* Status Chip */}
        <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 3 }}>
          <Chip 
            label={theme.isActive ? 'Active' : 'Inactive'} 
            color={theme.isActive ? 'success' : 'default'}
            size="small"
          />
        </Box>
      </Box>

      {/* Content Section */}
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Typography variant="h6" component="h3" noWrap sx={{ flexGrow: 1, mr: 1 }}>
            {theme.themeName}
          </Typography>
        </Box>
        
        <Typography variant="body2" color="text.secondary" paragraph sx={{ flexGrow: 1 }}>
          {theme.themeDescription}
        </Typography>
        
        <Box mb={2}>
          <Typography variant="body2" color="text.secondary">
            <strong>Category:</strong> {theme.themeCategory}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Price:</strong> {theme.priceRange}
          </Typography>
        </Box>
      </CardContent>
      
      {/* Actions Section */}
      {showActions && (
        <Box sx={{ p: 2, pt: 0 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="caption" color="text.secondary">
              Created: {new Date(theme.createdAt).toLocaleDateString()}
            </Typography>
            <Box>
              {onViewImages && (
                <IconButton 
                  size="small" 
                  color="info"
                  onClick={() => onViewImages(theme)}
                  title="Manage Images"
                >
                  <ViewIcon />
                </IconButton>
              )}
              {onEdit && (
                <IconButton 
                  size="small" 
                  color="primary"
                  onClick={() => onEdit(theme)}
                  title="Edit theme"
                >
                  <EditIcon />
                </IconButton>
              )}
              {onDelete && (
                <IconButton 
                  size="small" 
                  color="error"
                  onClick={() => onDelete(theme)}
                  title="Delete theme"
                >
                  <DeleteIcon />
                </IconButton>
              )}
            </Box>
          </Box>
        </Box>
      )}
    </Card>
  );
};

export default ThemeCard;
