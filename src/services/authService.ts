import axios from 'axios';
import { LoginRequest, SignupRequest, JwtResponse, AuthUser } from '../types';

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

export class AuthService {
  // Login user
  static async login(loginData: LoginRequest): Promise<JwtResponse> {
    const response = await apiClient.post('/auth/signin', loginData);
    const jwtResponse = response.data;
    
    // Store token and user data in localStorage
    localStorage.setItem('token', jwtResponse.token);
    localStorage.setItem('user', JSON.stringify({
      phoneNumber: jwtResponse.phoneNumber,
      email: jwtResponse.email,
      firstName: jwtResponse.firstName,
      lastName: jwtResponse.lastName,
      userType: jwtResponse.userType,
      role: jwtResponse.role
    }));
    
    return jwtResponse;
  }

  // Register user
  static async signup(signupData: SignupRequest): Promise<any> {
    const response = await apiClient.post('/auth/signup', signupData);
    return response.data;
  }

  // Logout user
  static logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  // Get current user from localStorage
  static getCurrentUser(): AuthUser | null {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  }

  // Get current token from localStorage
  static getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Check if user is authenticated
  static isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return !!(token && user);
  }

  // Check if phone number exists
  static async checkPhoneNumber(phoneNumber: string): Promise<boolean> {
    const response = await apiClient.get(`/auth/check-phone/${phoneNumber}`);
    return response.data.exists;
  }

  // Check if email exists
  static async checkEmail(email: string): Promise<boolean> {
    const response = await apiClient.get(`/auth/check-email/${email}`);
    return response.data.exists;
  }

  // Refresh token (if needed in future)
  static async refreshToken(): Promise<string> {
    const response = await apiClient.post('/auth/refresh');
    const newToken = response.data.token;
    localStorage.setItem('token', newToken);
    return newToken;
  }
}

export default AuthService;
