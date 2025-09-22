import axios from 'axios';
import { Theme, ThemeFormData, BusinessThemeSummaryDto } from '../types';

const API_BASE_URL = 'http://localhost:8080/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Theme Service
export class ThemeService {
  // Create a new theme
  static async createTheme(themeData: ThemeFormData): Promise<Theme> {
    const response = await apiClient.post('/themes', themeData);
    return response.data;
  }

  // Get all themes
  static async getAllThemes(): Promise<Theme[]> {
    const response = await apiClient.get('/themes');
    return response.data;
  }

  // Get theme by ID
  static async getThemeById(themeId: string): Promise<Theme> {
    const response = await apiClient.get(`/themes/${themeId}`);
    return response.data;
  }

  // Get themes by business ID
  static async getThemesByBusinessId(businessId: string): Promise<Theme[]> {
    const response = await apiClient.get(`/themes/business/${businessId}`);
    return response.data;
  }

  // Get themes by category
  static async getThemesByCategory(category: string): Promise<Theme[]> {
    const response = await apiClient.get(`/themes/category/${category}`);
    return response.data;
  }

  // Get themes by active status
  static async getThemesByActive(active: boolean): Promise<Theme[]> {
    const response = await apiClient.get(`/themes/active/${active}`);
    return response.data;
  }

  // Update theme
  static async updateTheme(themeId: string, themeData: Partial<ThemeFormData>): Promise<Theme> {
    const response = await apiClient.put(`/themes/${themeId}`, themeData);
    return response.data;
  }

  // Delete theme
  static async deleteTheme(themeId: string): Promise<void> {
    await apiClient.delete(`/themes/${themeId}`);
  }

  // Get theme count
  static async getThemeCount(): Promise<number> {
    const response = await apiClient.get('/themes/count');
    return response.data;
  }

  // Get minimal grouped view: business name + themes
  static async getThemesByBusinessSummary(): Promise<BusinessThemeSummaryDto[]> {
    const response = await apiClient.get('/themes/by-business/summary');
    return response.data;
  }
}

export default ThemeService;
