export interface Rating {
  ratingId: string;
  clientPhone: string;
  itemId: string;
  itemType: 'THEME' | 'INVENTORY' | 'PLATE';
  businessId: string;
  rating: number; // 1-5 stars
  comment: string;
  orderId?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface RatingRequest {
  itemId: string;
  itemType: 'THEME' | 'INVENTORY' | 'PLATE';
  businessId: string;
  rating: number; // 1-5 stars
  comment: string;
  orderId?: string;
}

export interface RatingStats {
  itemId: string;
  itemType: 'THEME' | 'INVENTORY' | 'PLATE';
  businessId: string;
  averageRating: number;
  totalRatings: number;
  recentRatings: Rating[];
}

export interface RatingCheckResponse {
  hasRated: boolean;
}

export interface RatingFormData {
  rating: number;
  comment: string;
}

export interface RatingDialogProps {
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
