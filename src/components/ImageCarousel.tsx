import React, { useState } from 'react';
import {
  Box,
  IconButton,
  CardMedia,
  Typography,
  Fade,
  Slide,
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';

interface ImageCarouselProps {
  images: Array<{
    imageId?: string;
    imageUrl: string;
    imageName: string;
  }>;
  height?: number;
  showNavigation?: boolean;
  showDots?: boolean;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  onImageClick?: (imageIndex: number) => void;
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({
  images,
  height = 200,
  showNavigation = true,
  showDots = true,
  autoPlay = false,
  autoPlayInterval = 3000,
  onImageClick,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  const handleDotClick = (index: number) => {
    setCurrentIndex(index);
  };

  const handleImageClick = () => {
    if (onImageClick) {
      onImageClick(currentIndex);
    }
  };

  if (!images || images.length === 0) {
    return (
      <Box
        sx={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'grey.100',
          color: 'text.secondary',
        }}
      >
        <Typography variant="body2">No images available</Typography>
      </Box>
    );
  }

  if (images.length === 1) {
    return (
      <Box sx={{ height, position: 'relative' }}>
        <CardMedia
          component="img"
          height={height}
          image={images[0].imageUrl}
          alt={images[0].imageName}
          sx={{ 
            objectFit: 'cover',
            cursor: onImageClick ? 'pointer' : 'default'
          }}
          onClick={handleImageClick}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ height, position: 'relative', overflow: 'hidden' }}>
      {/* Main Image Display */}
      <Box sx={{ position: 'relative', height: '100%' }}>
        <Fade in={true} key={currentIndex}>
          <CardMedia
            component="img"
            height={height}
            image={images[currentIndex].imageUrl}
            alt={images[currentIndex].imageName}
            sx={{ 
              objectFit: 'cover',
              cursor: onImageClick ? 'pointer' : 'default'
            }}
            onClick={handleImageClick}
          />
        </Fade>

        {/* Navigation Arrows */}
        {showNavigation && images.length > 1 && (
          <>
            <IconButton
              onClick={handlePrevious}
              sx={{
                position: 'absolute',
                left: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                bgcolor: 'rgba(0,0,0,0.5)',
                color: 'white',
                '&:hover': {
                  bgcolor: 'rgba(0,0,0,0.7)',
                },
                zIndex: 2,
              }}
              size="small"
            >
              <ChevronLeftIcon />
            </IconButton>
            <IconButton
              onClick={handleNext}
              sx={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                bgcolor: 'rgba(0,0,0,0.5)',
                color: 'white',
                '&:hover': {
                  bgcolor: 'rgba(0,0,0,0.7)',
                },
                zIndex: 2,
              }}
              size="small"
            >
              <ChevronRightIcon />
            </IconButton>
          </>
        )}

        {/* Image Counter */}
        {images.length > 1 && (
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
              fontSize: '0.75rem',
            }}
          >
            {currentIndex + 1} / {images.length}
          </Box>
        )}
      </Box>

      {/* Dots Indicator */}
      {showDots && images.length > 1 && (
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
              onClick={() => handleDotClick(index)}
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: index === currentIndex ? 'white' : 'rgba(255,255,255,0.5)',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.8)',
                },
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

export default ImageCarousel;
