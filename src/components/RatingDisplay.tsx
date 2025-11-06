import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Rating as MuiRating,
  Button,
  Chip,
  Card,
  CardContent,
  Avatar,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Star, RateReview } from '@mui/icons-material';
import { Rating, RatingStats } from '../types/rating';
import { ratingService } from '../services/ratingService';

interface RatingDisplayProps {
  itemId: string;
  itemType: 'THEME' | 'INVENTORY' | 'PLATE';
  businessId: string;
  onRateClick?: () => void;
  showRateButton?: boolean;
  compact?: boolean;
}

const RatingDisplay: React.FC<RatingDisplayProps> = ({
  itemId,
  itemType,
  businessId,
  onRateClick,
  showRateButton = true,
  compact = false,
}) => {
  const [ratingStats, setRatingStats] = useState<RatingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRatingStats();
  }, [itemId, itemType]);

  const loadRatingStats = async () => {
    try {
      setLoading(true);
      const stats = await ratingService.getRatingStats(itemId, itemType);
      setRatingStats(stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load ratings');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={2}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!ratingStats || ratingStats.totalRatings === 0) {
    return (
      <Box>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          No ratings yet
        </Typography>
        {showRateButton && onRateClick && (
          <Button
            size="small"
            startIcon={<Star />}
            onClick={onRateClick}
            variant="outlined"
          >
            Be the first to rate
          </Button>
        )}
      </Box>
    );
  }

  if (compact) {
    return (
      <Box display="flex" alignItems="center" gap={1}>
        <MuiRating
          value={ratingStats.averageRating}
          readOnly
          size="small"
          precision={0.1}
        />
        <Typography variant="body2" color="text.secondary">
          ({ratingStats.totalRatings})
        </Typography>
        {showRateButton && onRateClick && (
          <Button
            size="small"
            startIcon={<RateReview />}
            onClick={onRateClick}
            variant="text"
          >
            Rate
          </Button>
        )}
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <MuiRating
            value={ratingStats.averageRating}
            readOnly
            size="medium"
            precision={0.1}
          />
          <Typography variant="h6">
            {ratingStats.averageRating.toFixed(1)}
          </Typography>
        </Box>
        <Chip
          label={`${ratingStats.totalRatings} rating${ratingStats.totalRatings !== 1 ? 's' : ''}`}
          size="small"
          variant="outlined"
        />
        {showRateButton && onRateClick && (
          <Button
            size="small"
            startIcon={<RateReview />}
            onClick={onRateClick}
            variant="outlined"
          >
            Rate this item
          </Button>
        )}
      </Box>

      {ratingStats.recentRatings.length > 0 && (
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Recent Reviews
          </Typography>
          {ratingStats.recentRatings.map((rating, index) => (
            <Card key={rating.ratingId} sx={{ mb: 1, boxShadow: 1 }}>
              <CardContent sx={{ py: 1.5 }}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                    {rating.clientPhone.slice(-2)}
                  </Avatar>
                  <MuiRating
                    value={rating.rating}
                    readOnly
                    size="small"
                  />
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(rating.createdAt)}
                  </Typography>
                </Box>
                {rating.comment && (
                  <Typography variant="body2" color="text.primary">
                    {rating.comment}
                  </Typography>
                )}
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default RatingDisplay;
