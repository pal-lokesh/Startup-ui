import { Availability, AvailabilityRequest, CheckAvailabilityRequest, AvailabilityCheckResponse, AvailableQuantityResponse } from '../types/availability';

const API_BASE_URL = 'http://localhost:8080/api/availability';

class AvailabilityService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  /**
   * Create or update availability for an item
   */
  async createOrUpdateAvailability(request: AvailabilityRequest): Promise<Availability> {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create/update availability');
    }

    return response.json();
  }

  /**
   * Get availability for an item on a specific date
   */
  async getAvailability(itemId: string, itemType: string, date: string): Promise<Availability | null> {
    const response = await fetch(`${API_BASE_URL}/item/${itemId}/type/${itemType}/date/${date}`, {
      headers: this.getAuthHeaders(),
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get availability');
    }

    return response.json();
  }

  /**
   * Get all availabilities for an item
   */
  async getAvailabilitiesForItem(itemId: string, itemType: string): Promise<Availability[]> {
    const response = await fetch(`${API_BASE_URL}/item/${itemId}/type/${itemType}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get availabilities');
    }

    return response.json();
  }

  /**
   * Get availabilities for an item within a date range
   */
  async getAvailabilitiesInRange(
    itemId: string,
    itemType: string,
    startDate: string,
    endDate: string
  ): Promise<Availability[]> {
    const response = await fetch(
      `${API_BASE_URL}/item/${itemId}/type/${itemType}/range?startDate=${startDate}&endDate=${endDate}`,
      {
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get availabilities');
    }

    return response.json();
  }

  /**
   * Get all availabilities for a business
   */
  async getAvailabilitiesForBusiness(businessId: string): Promise<Availability[]> {
    const response = await fetch(`${API_BASE_URL}/business/${businessId}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get availabilities');
    }

    return response.json();
  }

  /**
   * Check if an item is available on a specific date
   */
  async checkAvailability(request: CheckAvailabilityRequest): Promise<boolean> {
    const response = await fetch(`${API_BASE_URL}/check`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to check availability');
    }

    const data: AvailabilityCheckResponse = await response.json();
    return data.isAvailable;
  }

  /**
   * Get available quantity for an item on a specific date
   */
  async getAvailableQuantity(itemId: string, itemType: string, date: string): Promise<number> {
    const response = await fetch(`${API_BASE_URL}/item/${itemId}/type/${itemType}/date/${date}/quantity`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get available quantity');
    }

    const data: AvailableQuantityResponse = await response.json();
    return data.availableQuantity;
  }

  /**
   * Delete availability for an item on a specific date
   */
  async deleteAvailability(itemId: string, itemType: string, date: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/item/${itemId}/type/${itemType}/date/${date}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete availability');
    }
  }

  /**
   * Delete all availabilities for an item
   */
  async deleteAllAvailabilitiesForItem(itemId: string, itemType: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/item/${itemId}/type/${itemType}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete availabilities');
    }
  }
}

export default new AvailabilityService();

