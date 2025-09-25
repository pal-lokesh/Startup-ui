import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardMedia,
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
      <Box sx={{ height: 200, position: 'relative' }}>
        {loading ? (
          <Box 
            display="flex" 
            justifyContent="center" 
            alignItems="center" 
            height="100%"
            bgcolor="grey.100"
          >
            <CircularProgress size={40} />
          </Box>
        ) : error ? (
          <Box 
            display="flex" 
            justifyContent="center" 
            alignItems="center" 
            height="100%"
            bgcolor="grey.100"
            flexDirection="column"
          >
            <ImageIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography variant="caption" color="text.secondary">
              Failed to load images
            </Typography>
          </Box>
        ) : images.length === 0 ? (
          <Box 
            display="flex" 
            justifyContent="center" 
            alignItems="center" 
            height="100%"
            bgcolor="grey.100"
            flexDirection="column"
          >
            <ImageIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography variant="caption" color="text.secondary">
              No images uploaded
            </Typography>
          </Box>
        ) : images.length === 1 ? (
          <CardMedia
            component="img"
            height="200"
            image={images[0].imageUrl}
            alt={images[0].imageName}
            sx={{ objectFit: 'cover' }}
          />
        ) : (
          <Box sx={{ height: '100%', display: 'flex', overflow: 'hidden' }}>
            {/* Main image (first image or primary) */}
            <Box sx={{ flex: 1, position: 'relative' }}>
              <CardMedia
                component="img"
                height="200"
                image={images[0].imageUrl}
                alt={images[0].imageName}
                sx={{ objectFit: 'cover', width: '100%' }}
              />
              {/* Image count overlay */}
              <Box 
                sx={{ 
                  position: 'absolute', 
                  bottom: 8, 
                  right: 8,
                  bgcolor: 'rgba(0,0,0,0.7)',
                  color: 'white',
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  fontSize: '0.75rem'
                }}
              >
                +{images.length - 1} more
              </Box>
            </Box>
            
            {/* Thumbnail strip for additional images */}
            {images.length > 1 && (
              <Box sx={{ width: 60, display: 'flex', flexDirection: 'column' }}>
                {images.slice(1, 4).map((image, index) => (
                  <Box key={image.imageId} sx={{ flex: 1, position: 'relative' }}>
                    <CardMedia
                      component="img"
                      image={image.imageUrl}
                      alt={image.imageName}
                      sx={{ 
                        objectFit: 'cover', 
                        width: '100%', 
                        height: '100%',
                        borderLeft: '2px solid white'
                      }}
                    />
                    {index === 2 && images.length > 4 && (
                      <Box 
                        sx={{ 
                          position: 'absolute', 
                          top: 0, 
                          left: 0, 
                          right: 0, 
                          bottom: 0,
                          bgcolor: 'rgba(0,0,0,0.6)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '0.75rem',
                          fontWeight: 'bold'
                        }}
                      >
                        +{images.length - 4}
                      </Box>
                    )}
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        )}
        
        {/* Status Chip */}
        <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
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
