import { Rating, RatingRequest, RatingStats, RatingCheckResponse } from '../types/rating';

const API_BASE_URL = 'http://localhost:8080/api';

class RatingService {
  private getAuthToken(): string | null {
    return localStorage.getItem('token');
  }

  private getHeaders(): HeadersInit {
    const token = this.getAuthToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  // Create a new rating
  async createRating(ratingRequest: RatingRequest): Promise<Rating> {
    const response = await fetch(`${API_BASE_URL}/ratings`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(ratingRequest),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create rating');
    }

    return response.json();
  }

  // Update an existing rating
  async updateRating(ratingId: string, ratingRequest: RatingRequest): Promise<Rating> {
    const response = await fetch(`${API_BASE_URL}/ratings/${ratingId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(ratingRequest),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update rating');
    }

    return response.json();
  }

  // Delete a rating
  async deleteRating(ratingId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/ratings/${ratingId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete rating');
    }
  }

  // Get all ratings for a specific item
  async getRatingsByItem(itemId: string, itemType: 'THEME' | 'INVENTORY' | 'PLATE'): Promise<Rating[]> {
    const response = await fetch(`${API_BASE_URL}/ratings/item/${itemId}/${itemType}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get ratings');
    }

    return response.json();
  }

  // Get all ratings for a business
  async getRatingsByBusiness(businessId: string): Promise<Rating[]> {
    const response = await fetch(`${API_BASE_URL}/ratings/business/${businessId}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get business ratings');
    }

    return response.json();
  }

  // Get all ratings by the current client
  async getRatingsByClient(): Promise<Rating[]> {
    const response = await fetch(`${API_BASE_URL}/ratings/client`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get client ratings');
    }

    return response.json();
  }

  // Get ratings for a specific order
  async getRatingsByOrder(orderId: string): Promise<Rating[]> {
    const response = await fetch(`${API_BASE_URL}/ratings/order/${orderId}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get order ratings');
    }

    return response.json();
  }

  // Get rating statistics for an item
  async getRatingStats(itemId: string, itemType: 'THEME' | 'INVENTORY' | 'PLATE'): Promise<RatingStats> {
    const response = await fetch(`${API_BASE_URL}/ratings/stats/item/${itemId}/${itemType}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get rating stats');
    }

    return response.json();
  }

  // Get rating statistics for a business
  async getBusinessRatingStats(businessId: string): Promise<RatingStats> {
    const response = await fetch(`${API_BASE_URL}/ratings/stats/business/${businessId}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get business rating stats');
    }

    return response.json();
  }

  // Check if client has rated an item
  async hasClientRatedItem(itemId: string, itemType: 'THEME' | 'INVENTORY' | 'PLATE'): Promise<boolean> {
    const response = await fetch(`${API_BASE_URL}/ratings/check/${itemId}/${itemType}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to check rating status');
    }

    const data: RatingCheckResponse = await response.json();
    return data.hasRated;
  }

  // Get client's rating for an item
  async getClientRatingForItem(itemId: string, itemType: 'THEME' | 'INVENTORY' | 'PLATE'): Promise<Rating | null> {
    const response = await fetch(`${API_BASE_URL}/ratings/client/${itemId}/${itemType}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get client rating');
    }

    const data = await response.json();
    return data; // Returns null if no rating exists
  }
}

export const ratingService = new RatingService();
