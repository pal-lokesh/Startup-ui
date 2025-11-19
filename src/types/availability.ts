export interface Availability {
  availabilityId: number;
  itemId: string;
  itemType: 'theme' | 'inventory' | 'plate';
  businessId: string;
  availabilityDate: string; // YYYY-MM-DD format
  availableQuantity: number;
  isAvailable: boolean;
  priceOverride?: number;
}

export interface AvailabilityRequest {
  itemId: string;
  itemType: 'theme' | 'inventory' | 'plate';
  businessId: string;
  availabilityDate: string; // YYYY-MM-DD format
  availableQuantity: number;
  isAvailable?: boolean;
  priceOverride?: number;
}

export interface CheckAvailabilityRequest {
  itemId: string;
  itemType: 'theme' | 'inventory' | 'plate';
  date: string; // YYYY-MM-DD format
  quantity: number;
}

export interface AvailabilityCheckResponse {
  isAvailable: boolean;
}

export interface AvailableQuantityResponse {
  availableQuantity: number;
}

