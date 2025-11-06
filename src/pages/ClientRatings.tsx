import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Rating as MuiRating,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  RateReview as RateReviewIcon,
} from '@mui/icons-material';
import { Rating } from '../types/rating';
import { ratingService } from '../services/ratingService';
import RatingComponent from '../components/RatingComponent';

const ClientRatings: React.FC = () => {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingRating, setEditingRating] = useState<Rating | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ratingToDelete, setRatingToDelete] = useState<Rating | null>(null);

  useEffect(() => {
    loadRatings();
  }, []);

  const loadRatings = async () => {
    try {
      setLoading(true);
      setError(null);
      const clientRatings = await ratingService.getRatingsByClient();
      setRatings(clientRatings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load ratings');
    } finally {
      setLoading(false);
    }
  };

  const handleEditRating = (rating: Rating) => {
    setEditingRating(rating);
  };

  const handleDeleteRating = (rating: Rating) => {
    setRatingToDelete(rating);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!ratingToDelete) return;

    try {
      await ratingService.deleteRating(ratingToDelete.ratingId);
      setRatings(ratings.filter(r => r.ratingId !== ratingToDelete.ratingId));
      setDeleteDialogOpen(false);
      setRatingToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete rating');
    }
  };

  const handleRatingUpdated = (updatedRating: Rating) => {
    setRatings(ratings.map(r => 
      r.ratingId === updatedRating.ratingId ? updatedRating : r
    ));
    setEditingRating(null);
  };

  const getItemTypeColor = (itemType: string) => {
    switch (itemType) {
      case 'THEME': return 'primary';
      case 'INVENTORY': return 'secondary';
      case 'PLATE': return 'success';
      default: return 'default';
    }
  };

  const getItemTypeIcon = (itemType: string) => {
    switch (itemType) {
      case 'THEME': return '🎨';
      case 'INVENTORY': return '🪑';
      case 'PLATE': return '🍽️';
      default: return '📦';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          My Ratings & Reviews
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your ratings and reviews for themes, inventory, and plates
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {ratings.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <StarIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No ratings yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Start rating items after your orders are delivered to see them here.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {ratings.map((rating) => (
            <Grid item xs={12} md={6} lg={4} key={rating.ratingId}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="h6" component="span">
                        {getItemTypeIcon(rating.itemType)}
                      </Typography>
                      <Chip
                        label={rating.itemType}
                        color={getItemTypeColor(rating.itemType)}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                    <Box display="flex" gap={0.5}>
                      <Tooltip title="Edit Rating">
                        <IconButton
                          size="small"
                          onClick={() => handleEditRating(rating)}
                          color="primary"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Rating">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteRating(rating)}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>

                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Item ID: {rating.itemId}
                  </Typography>

                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <MuiRating
                      value={rating.rating}
                      readOnly
                      size="small"
                    />
                    <Typography variant="body2" color="text.secondary">
                      ({rating.rating}/5)
                    </Typography>
                  </Box>

                  {rating.comment && (
                    <Box mb={2}>
                      <Typography variant="body2" color="text.primary">
                        "{rating.comment}"
                      </Typography>
                    </Box>
                  )}

                  <Divider sx={{ my: 1 }} />

                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Business: {rating.businessId}
                    </Typography>
                    <br />
                    <Typography variant="caption" color="text.secondary">
                      Rated on: {formatDate(rating.createdAt)}
                    </Typography>
                    {rating.orderId && (
                      <>
                        <br />
                        <Typography variant="caption" color="text.secondary">
                          Order: {rating.orderId}
                        </Typography>
                      </>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Edit Rating Dialog */}
      {editingRating && (
        <RatingComponent
          open={!!editingRating}
          onClose={() => setEditingRating(null)}
          itemId={editingRating.itemId}
          itemType={editingRating.itemType}
          itemName={`Item ${editingRating.itemId}`}
          businessId={editingRating.businessId}
          orderId={editingRating.orderId}
          existingRating={editingRating}
          onRatingSubmitted={handleRatingUpdated}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Rating</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this rating? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ClientRatings;
