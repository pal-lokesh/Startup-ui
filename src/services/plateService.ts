import { Plate, PlateFormData } from '../types';

const API_BASE_URL = 'http://localhost:8080/api/plates';

class PlateService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  async getAllPlates(): Promise<Plate[]> {
    try {
      const response = await fetch(API_BASE_URL, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching plates:', error);
      throw error;
    }
  }

  async getPlateById(plateId: string): Promise<Plate> {
    try {
      const response = await fetch(`${API_BASE_URL}/${plateId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching plate:', error);
      throw error;
    }
  }

  async getPlatesByBusinessId(businessId: string): Promise<Plate[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/business/${businessId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching plates by business ID:', error);
      throw error;
    }
  }

  async createPlate(plateData: PlateFormData): Promise<Plate> {
    try {
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(plateData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating plate:', error);
      throw error;
    }
  }

  async updatePlate(plateId: string, plateData: PlateFormData): Promise<Plate> {
    try {
      const response = await fetch(`${API_BASE_URL}/${plateId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(plateData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating plate:', error);
      throw error;
    }
  }

  async deletePlate(plateId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/${plateId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting plate:', error);
      throw error;
    }
  }

  async getPlateCount(): Promise<number> {
    try {
      const response = await fetch(`${API_BASE_URL}/count`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.count;
    } catch (error) {
      console.error('Error fetching plate count:', error);
      throw error;
    }
  }

  async getPlateCountByBusinessId(businessId: string): Promise<number> {
    try {
      const response = await fetch(`${API_BASE_URL}/business/${businessId}/count`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.count;
    } catch (error) {
      console.error('Error fetching plate count by business ID:', error);
      throw error;
    }
  }
}

const plateService = new PlateService();
export default plateService;
