import axios from 'axios';
import { Inventory, InventoryFormData, InventoryImage, InventoryImageFormData } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add JWT authentication interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {};
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

class InventoryService {
  // Inventory CRUD operations
  static async createInventory(inventoryData: InventoryFormData, vendorPhone?: string): Promise<Inventory> {
    const config: any = {};
    if (vendorPhone) {
      config.headers = {
        'X-Vendor-Phone': vendorPhone
      };
    }
    try {
      const response = await apiClient.post('/inventory', inventoryData, config);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 403) {
        throw new Error('You are not authorized to create products. Only vendors can create products.');
      }
      throw error;
    }
  }

  static async getInventoryById(inventoryId: string): Promise<Inventory> {
    const response = await apiClient.get(`/inventory/${inventoryId}`);
    return response.data;
  }

  static async getInventoryByBusinessId(businessId: string): Promise<Inventory[]> {
    const response = await apiClient.get(`/inventory/business/${businessId}`);
    return response.data;
  }

  static async getAllInventory(): Promise<Inventory[]> {
    const response = await apiClient.get('/inventory');
    return response.data;
  }

  static async updateInventory(inventoryId: string, inventoryData: Partial<InventoryFormData>, vendorPhone?: string): Promise<Inventory> {
    const config: any = {};
    if (vendorPhone) {
      config.headers = {
        'X-Vendor-Phone': vendorPhone
      };
    }
    try {
      const response = await apiClient.put(`/inventory/${inventoryId}`, inventoryData, config);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 403) {
        throw new Error('You are not authorized to update this product. You can only update your own products.');
      }
      throw error;
    }
  }

  static async deleteInventory(inventoryId: string, vendorPhone?: string): Promise<void> {
    const config: any = {};
    if (vendorPhone) {
      config.headers = {
        'X-Vendor-Phone': vendorPhone
      };
    }
    try {
      await apiClient.delete(`/inventory/${inventoryId}`, config);
    } catch (error: any) {
      if (error.response?.status === 403) {
        throw new Error('You are not authorized to delete this product. Only vendors can delete their own products.');
      }
      throw error;
    }
  }

  static async getInventoryCount(): Promise<number> {
    const response = await apiClient.get('/inventory/count');
    return response.data;
  }

  // Inventory Image operations
  static async createInventoryImage(imageData: InventoryImageFormData, vendorPhone?: string): Promise<InventoryImage> {
    console.log('Sending inventory image data:', imageData);
    const config: any = {};
    if (vendorPhone) {
      config.headers = {
        'X-Vendor-Phone': vendorPhone
      };
    }
    try {
      const response = await apiClient.post('/inventory/images', imageData, config);
      console.log('Received response:', response.data);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 403) {
        throw new Error('You are not authorized to upload images. Only vendors can upload images.');
      }
      throw error;
    }
  }

  static async getInventoryImagesByInventoryId(inventoryId: string): Promise<InventoryImage[]> {
    console.log('Fetching inventory images for ID:', inventoryId);
    const response = await apiClient.get(`/inventory/images/inventory/${inventoryId}`);
    console.log('API response for inventory images:', response.data);
    return response.data;
  }

  static async updateInventoryImage(imageId: string, imageData: Partial<InventoryImageFormData>, vendorPhone?: string): Promise<InventoryImage> {
    const config: any = {};
    if (vendorPhone) {
      config.headers = {
        'X-Vendor-Phone': vendorPhone
      };
    }
    try {
      const response = await apiClient.put(`/inventory/images/${imageId}`, imageData, config);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 403) {
        throw new Error('You are not authorized to update images. Only vendors can update images.');
      }
      throw error;
    }
  }

  static async deleteInventoryImage(imageId: string, vendorPhone?: string): Promise<void> {
    const config: any = {};
    if (vendorPhone) {
      config.headers = {
        'X-Vendor-Phone': vendorPhone
      };
    }
    try {
      await apiClient.delete(`/inventory/images/${imageId}`, config);
    } catch (error: any) {
      if (error.response?.status === 403) {
        throw new Error('You are not authorized to delete images. Only vendors can delete images.');
      }
      throw error;
    }
  }

  static async setPrimaryInventoryImage(imageId: string, vendorPhone?: string): Promise<InventoryImage> {
    const config: any = {};
    if (vendorPhone) {
      config.headers = {
        'X-Vendor-Phone': vendorPhone
      };
    }
    try {
      const response = await apiClient.put(`/inventory/images/${imageId}/primary`, {}, config);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 403) {
        throw new Error('You are not authorized to set primary images. Only vendors can set primary images.');
      }
      throw error;
    }
  }
}

export default InventoryService;
