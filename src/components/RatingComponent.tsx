import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Rating as MuiRating,
  Box,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Rating, RatingRequest, RatingFormData } from '../types/rating';
import { ratingService } from '../services/ratingService';

interface RatingComponentProps {
  open: boolean;
  onClose: () => void;
  itemId: string;
  itemType: 'THEME' | 'INVENTORY' | 'PLATE';
  itemName: string;
  businessId: string;
  orderId?: string;
  existingRating?: Rating;
  onRatingSubmitted: (rating: Rating) => void;
}

const RatingComponent: React.FC<RatingComponentProps> = ({
  open,
  onClose,
  itemId,
  itemType,
  itemName,
  businessId,
  orderId,
  existingRating,
  onRatingSubmitted,
}) => {
  const [formData, setFormData] = useState<RatingFormData>({
    rating: existingRating?.rating || 0,
    comment: existingRating?.comment || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRatingChange = (event: React.SyntheticEvent, newValue: number | null) => {
    setFormData(prev => ({
      ...prev,
      rating: newValue || 0,
    }));
  };

  const handleCommentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      comment: event.target.value,
    }));
  };

  const handleSubmit = async () => {
    if (formData.rating === 0) {
      setError('Please select a rating');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const ratingRequest: RatingRequest = {
        itemId,
        itemType,
        businessId,
        rating: formData.rating,
        comment: formData.comment,
        orderId,
      };

      let rating: Rating;
      if (existingRating) {
        rating = await ratingService.updateRating(existingRating.ratingId, ratingRequest);
      } else {
        rating = await ratingService.createRating(ratingRequest);
      }

      onRatingSubmitted(rating);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit rating');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      rating: existingRating?.rating || 0,
      comment: existingRating?.comment || '',
    });
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {existingRating ? 'Update Rating' : 'Rate Item'}
        <Typography variant="subtitle2" color="text.secondary">
          {itemName}
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Rating *
          </Typography>
          <MuiRating
            value={formData.rating}
            onChange={handleRatingChange}
            size="large"
            precision={1}
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {formData.rating === 0 && 'Please select a rating'}
            {formData.rating === 1 && 'Poor'}
            {formData.rating === 2 && 'Fair'}
            {formData.rating === 3 && 'Good'}
            {formData.rating === 4 && 'Very Good'}
            {formData.rating === 5 && 'Excellent'}
          </Typography>
        </Box>

        <TextField
          fullWidth
          multiline
          rows={4}
          label="Comment (Optional)"
          value={formData.comment}
          onChange={handleCommentChange}
          placeholder="Share your experience with this item..."
          variant="outlined"
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || formData.rating === 0}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Submitting...' : existingRating ? 'Update Rating' : 'Submit Rating'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RatingComponent;
