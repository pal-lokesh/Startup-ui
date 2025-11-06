import axios from 'axios';
import { Business, BusinessFormData } from '../types';

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

// Business Service
export class BusinessService {
  // Create a new business
  static async createBusiness(businessData: BusinessFormData): Promise<Business> {
    const response = await apiClient.post('/businesses', businessData);
    return response.data;
  }

  // Get all businesses
  static async getAllBusinesses(): Promise<Business[]> {
    const response = await apiClient.get('/businesses');
    return response.data;
  }

  // Get business by ID
  static async getBusinessById(businessId: string): Promise<Business> {
    const response = await apiClient.get(`/businesses/${businessId}`);
    return response.data;
  }

  // Get business by phone number
  static async getBusinessByPhoneNumber(phoneNumber: string): Promise<Business> {
    const response = await apiClient.get(`/businesses/phone/${phoneNumber}`);
    return response.data;
  }

  // Get businesses by category
  static async getBusinessesByCategory(category: string): Promise<Business[]> {
    const response = await apiClient.get(`/businesses/category/${category}`);
    return response.data;
  }

  // Get businesses by active status
  static async getBusinessesByActive(active: boolean): Promise<Business[]> {
    const response = await apiClient.get(`/businesses/active/${active}`);
    return response.data;
  }

  // Update business
  static async updateBusiness(businessId: string, businessData: Partial<BusinessFormData>): Promise<Business> {
    const response = await apiClient.put(`/businesses/${businessId}`, businessData);
    return response.data;
  }

  // Delete business
  static async deleteBusiness(businessId: string): Promise<void> {
    await apiClient.delete(`/businesses/${businessId}`);
  }

  // Get business count
  static async getBusinessCount(): Promise<number> {
    const response = await apiClient.get('/businesses/count');
    return response.data;
  }

  // Get all businesses for a vendor by phone number
  static async getBusinessesByVendorPhoneNumber(phoneNumber: string): Promise<Business[]> {
    const response = await apiClient.get(`/businesses/vendor/${phoneNumber}`);
    return response.data;
  }

  // Get business with themes and inventory
  static async getBusinessWithDetails(businessId: string): Promise<{
    business: Business;
    themes: any[];
    inventory: any[];
  }> {
    const response = await apiClient.get(`/businesses/${businessId}/details`);
    return response.data;
  }

  // Find nearby businesses
  static async findNearbyBusinesses(
    latitude: number,
    longitude: number,
    radiusKm: number = 10.0
  ): Promise<{
    latitude: number;
    longitude: number;
    radiusKm: number;
    count: number;
    businesses: Business[];
  }> {
    const response = await apiClient.get('/businesses/nearby', {
      params: { latitude, longitude, radiusKm },
    });
    return response.data;
  }
}

export default BusinessService;
