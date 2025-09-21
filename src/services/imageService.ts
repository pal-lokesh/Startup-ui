import axios from 'axios';
import { Image, ImageFormData } from '../types';

const API_BASE_URL = 'http://localhost:8080/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Image Service
export class ImageService {
  // Create a new image
  static async createImage(imageData: ImageFormData): Promise<Image> {
    const response = await apiClient.post('/images', imageData);
    return response.data;
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
  static async updateImage(imageId: string, imageData: Partial<ImageFormData>): Promise<Image> {
    const response = await apiClient.put(`/images/${imageId}`, imageData);
    return response.data;
  }

  // Set image as primary
  static async setPrimaryImage(imageId: string): Promise<Image> {
    const response = await apiClient.post(`/images/${imageId}/set-primary`);
    return response.data;
  }

  // Delete image
  static async deleteImage(imageId: string): Promise<void> {
    await apiClient.delete(`/images/${imageId}`);
  }

  // Get image count
  static async getImageCount(): Promise<number> {
    const response = await apiClient.get('/images/count');
    return response.data;
  }
}

export default ImageService;
