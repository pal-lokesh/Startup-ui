import { Dish, DishFormData } from '../types';

const API_BASE_URL = 'http://localhost:8080/api/dishes';

class DishService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  async getAllDishes(): Promise<Dish[]> {
    const response = await fetch(API_BASE_URL, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async getDishById(dishId: string): Promise<Dish> {
    const response = await fetch(`${API_BASE_URL}/${dishId}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async getDishesByBusinessId(businessId: string): Promise<Dish[]> {
    try {
      console.log('🌐 DishService: Fetching dishes for business:', businessId);
      const response = await fetch(`${API_BASE_URL}/business/${businessId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      console.log('🌐 DishService: Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ DishService: HTTP error! status:', response.status, 'body:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ DishService: Received', Array.isArray(data) ? data.length : 'non-array', 'dishes');
      if (Array.isArray(data) && data.length > 0) {
        console.log('📋 DishService: Dishes:', data.map(d => d.dishName || d.dishId));
      }
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('❌ DishService: Error fetching dishes by business ID:', error);
      throw error;
    }
  }

  async createDish(dishData: DishFormData, vendorPhone?: string): Promise<Dish> {
    const headers: HeadersInit = this.getAuthHeaders();
    if (vendorPhone) {
      (headers as any)['X-Vendor-Phone'] = vendorPhone;
    }

    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(dishData),
    });

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('You are not authorized to create dishes.');
      }
      const errorText = await response.text();
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorJson.message || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  async updateDish(dishId: string, dishData: DishFormData, vendorPhone?: string): Promise<Dish> {
    const headers: HeadersInit = this.getAuthHeaders();
    if (vendorPhone) {
      (headers as any)['X-Vendor-Phone'] = vendorPhone;
    }

    const response = await fetch(`${API_BASE_URL}/${dishId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(dishData),
    });

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('You are not authorized to update this dish.');
      }
      const errorText = await response.text();
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorJson.message || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  async deleteDish(dishId: string, vendorPhone?: string): Promise<void> {
    const headers: HeadersInit = this.getAuthHeaders();
    if (vendorPhone) {
      (headers as any)['X-Vendor-Phone'] = vendorPhone;
    }

    const response = await fetch(`${API_BASE_URL}/${dishId}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('You are not authorized to delete this dish.');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }
}

const dishService = new DishService();
export default dishService;

