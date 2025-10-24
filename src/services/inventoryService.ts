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
  static async createInventory(inventoryData: InventoryFormData): Promise<Inventory> {
    const response = await apiClient.post('/inventory', inventoryData);
    return response.data;
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

  static async updateInventory(inventoryId: string, inventoryData: Partial<InventoryFormData>): Promise<Inventory> {
    const response = await apiClient.put(`/inventory/${inventoryId}`, inventoryData);
    return response.data;
  }

  static async deleteInventory(inventoryId: string): Promise<void> {
    await apiClient.delete(`/inventory/${inventoryId}`);
  }

  static async getInventoryCount(): Promise<number> {
    const response = await apiClient.get('/inventory/count');
    return response.data;
  }

  // Inventory Image operations
  static async createInventoryImage(imageData: InventoryImageFormData): Promise<InventoryImage> {
    console.log('Sending inventory image data:', imageData);
    const response = await apiClient.post('/inventory/images', imageData);
    console.log('Received response:', response.data);
    return response.data;
  }

  static async getInventoryImagesByInventoryId(inventoryId: string): Promise<InventoryImage[]> {
    console.log('Fetching inventory images for ID:', inventoryId);
    const response = await apiClient.get(`/inventory/images/inventory/${inventoryId}`);
    console.log('API response for inventory images:', response.data);
    return response.data;
  }

  static async updateInventoryImage(imageId: string, imageData: Partial<InventoryImageFormData>): Promise<InventoryImage> {
    const response = await apiClient.put(`/inventory/images/${imageId}`, imageData);
    return response.data;
  }

  static async deleteInventoryImage(imageId: string): Promise<void> {
    await apiClient.delete(`/inventory/images/${imageId}`);
  }

  static async setPrimaryInventoryImage(imageId: string): Promise<InventoryImage> {
    const response = await apiClient.put(`/inventory/images/${imageId}/primary`);
    return response.data;
  }
}

export default InventoryService;
