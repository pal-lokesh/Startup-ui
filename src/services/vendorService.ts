import axios from 'axios';
import { Vendor, VendorFormData } from '../types';

const API_BASE_URL = 'http://localhost:8080/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Vendor Service
export class VendorService {
  // Create a new vendor
  static async createVendor(vendorData: VendorFormData): Promise<Vendor> {
    const response = await apiClient.post('/vendors', vendorData);
    return response.data;
  }

  // Get all vendors
  static async getAllVendors(): Promise<Vendor[]> {
    const response = await apiClient.get('/vendors');
    return response.data;
  }

  // Get vendor by phone number
  static async getVendorByPhoneNumber(phoneNumber: string): Promise<Vendor> {
    const response = await apiClient.get(`/vendors/phone/${phoneNumber}`);
    return response.data;
  }

  // Get vendor by ID
  static async getVendorById(vendorId: string): Promise<Vendor> {
    const response = await apiClient.get(`/vendors/${vendorId}`);
    return response.data;
  }

  // Get vendors by verification status
  static async getVendorsByVerified(verified: boolean): Promise<Vendor[]> {
    const response = await apiClient.get(`/vendors/verified/${verified}`);
    return response.data;
  }

  // Update vendor
  static async updateVendor(phoneNumber: string, vendorData: Partial<VendorFormData>): Promise<Vendor> {
    const response = await apiClient.put(`/vendors/phone/${phoneNumber}`, vendorData);
    return response.data;
  }

  // Delete vendor
  static async deleteVendor(phoneNumber: string): Promise<void> {
    await apiClient.delete(`/vendors/phone/${phoneNumber}`);
  }

  // Get vendor count
  static async getVendorCount(): Promise<number> {
    const response = await apiClient.get('/vendors/count');
    return response.data;
  }
}

export default VendorService;
