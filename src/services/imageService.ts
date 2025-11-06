import axios from 'axios';
import { Image, ImageFormData } from '../types';

const API_BASE_URL = 'http://localhost:8080/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT to every request
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

// Image Service
export class ImageService {
  // Create a new image
  static async createImage(imageData: ImageFormData, vendorPhone?: string): Promise<Image> {
    const config: any = {};
    if (vendorPhone) {
      config.headers = {
        'X-Vendor-Phone': vendorPhone
      };
    }
    try {
      const response = await apiClient.post('/images', imageData, config);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 403) {
        throw new Error('You are not authorized to upload images. Only vendors can upload images.');
      }
      throw error;
    }
  }

  // Get all images
  static async getAllImages(): Promise<Image[]> {
    const response = await apiClient.get('/images');
    return response.data;
  }

  // Get image by ID
  static async getImageById(imageId: string): Promise<Image> {
    const response = await apiClient.get(`/images/${imageId}`);
    return response.data;
  }

  // Get images by theme ID
  static async getImagesByThemeId(themeId: string): Promise<Image[]> {
    const response = await apiClient.get(`/images/theme/${themeId}`);
    return response.data;
  }

  // Get images by primary status
  static async getImagesByPrimary(isPrimary: boolean): Promise<Image[]> {
    const response = await apiClient.get(`/images/primary/${isPrimary}`);
    return response.data;
  }

  // Update image
  static async updateImage(imageId: string, imageData: Partial<ImageFormData>, vendorPhone?: string): Promise<Image> {
    const config: any = {};
    if (vendorPhone) {
      config.headers = {
        'X-Vendor-Phone': vendorPhone
      };
    }
    try {
      const response = await apiClient.put(`/images/${imageId}`, imageData, config);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 403) {
        throw new Error('You are not authorized to update images. Only vendors can update images.');
      }
      throw error;
    }
  }

  // Set image as primary
  static async setPrimaryImage(imageId: string, vendorPhone?: string): Promise<Image> {
    const config: any = {};
    if (vendorPhone) {
      config.headers = {
        'X-Vendor-Phone': vendorPhone
      };
    }
    try {
      const response = await apiClient.post(`/images/${imageId}/set-primary`, {}, config);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 403) {
        throw new Error('You are not authorized to set primary images. Only vendors can set primary images.');
      }
      throw error;
    }
  }

  // Delete image
  static async deleteImage(imageId: string, vendorPhone?: string): Promise<void> {
    const config: any = {};
    if (vendorPhone) {
      config.headers = {
        'X-Vendor-Phone': vendorPhone
      };
    }
    try {
      await apiClient.delete(`/images/${imageId}`, config);
    } catch (error: any) {
      if (error.response?.status === 403) {
        throw new Error('You are not authorized to delete images. Only vendors can delete images.');
      }
      throw error;
    }
  }

  // Get image count
  static async getImageCount(): Promise<number> {
    const response = await apiClient.get('/images/count');
    return response.data;
  }
}

export default ImageService;
