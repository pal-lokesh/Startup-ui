import axios from 'axios';
import { User, UserFormData, UserType } from '../types';

const API_BASE_URL = 'http://localhost:8080/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token expiration
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// User Service
export class UserService {
  // Create a new user
  static async createUser(userData: UserFormData): Promise<User> {
    const response = await apiClient.post('/users', userData);
    return response.data;
  }

  // Get all users
  static async getAllUsers(): Promise<User[]> {
    const response = await apiClient.get('/users');
    return response.data;
  }

  // Get user by phone number
  static async getUserByPhoneNumber(phoneNumber: string): Promise<User> {
    const response = await apiClient.get(`/users/phone/${phoneNumber}`);
    return response.data;
  }

  // Get user by email
  static async getUserByEmail(email: string): Promise<User> {
    const response = await apiClient.get(`/users/email/${email}`);
    return response.data;
  }

  // Get users by type
  static async getUsersByType(userType: UserType): Promise<User[]> {
    const response = await apiClient.get(`/users/type/${userType}`);
    return response.data;
  }

  // Update user
  static async updateUser(phoneNumber: string, userData: Partial<UserFormData>): Promise<User> {
    const response = await apiClient.put(`/users/phone/${phoneNumber}`, userData);
    return response.data;
  }

  // Delete user
  static async deleteUser(phoneNumber: string): Promise<void> {
    await apiClient.delete(`/users/phone/${phoneNumber}`);
  }

  // Get user count
  static async getUserCount(): Promise<number> {
    const response = await apiClient.get('/users/count');
    return response.data;
  }
}

export default UserService;
