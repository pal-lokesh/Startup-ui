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
      // Token is invalid or expired, clear storage
      AuthService.logout();
      // Only redirect if not already on login page
      if (window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export class AuthService {
  // Login user
  static async login(loginData: LoginRequest): Promise<JwtResponse> {
    const response = await apiClient.post('/auth/signin', loginData);
    const jwtResponse = response.data;
    
    // Store token and user data in localStorage (persists across sessions)
    localStorage.setItem('token', jwtResponse.token);
    localStorage.setItem('user', JSON.stringify({
      userId: jwtResponse.userId,
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

  // Validate token by checking if it's expired
  static isTokenValid(token: string): boolean {
    try {
      // Decode JWT token to check expiration
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const decoded = JSON.parse(jsonPayload);
      
      // Check if token is expired
      if (decoded.exp && decoded.exp * 1000 < Date.now()) {
        return false; // Token is expired
      }
      return true; // Token is valid
    } catch (error) {
      console.error('Error validating token:', error);
      return false; // Invalid token format
    }
  }

  // Validate current stored token
  static validateStoredToken(): boolean {
    const token = localStorage.getItem('token');
    if (!token) {
      return false;
    }
    
    const isValid = this.isTokenValid(token);
    if (!isValid) {
      // Clear invalid token
      this.logout();
    }
    return isValid;
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
