// User Types
export interface User {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  userType: UserType;
  createdAt: string;
  updatedAt: string;
}

export enum UserType {
  VENDOR = 'VENDOR',
  CLIENT = 'CLIENT'
}

// Vendor Types
export interface Vendor {
  vendorId: string;
  phoneNumber: string;
  businessName: string;
  businessDescription: string;
  businessAddress: string;
  businessPhone: string;
  businessEmail: string;
  registrationNumber?: string;
  taxId?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

// Business Types
export interface Business {
  businessId: string;
  phoneNumber: string;
  businessName: string;
  businessDescription: string;
  businessCategory: string;
  businessAddress: string;
  businessPhone: string;
  businessEmail: string;
  website?: string;
  socialMediaLinks?: string;
  operatingHours?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Theme Types
export interface Theme {
  themeId: string;
  businessId: string;
  themeName: string;
  themeDescription: string;
  themeCategory: string;
  priceRange: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Image Types
export interface Image {
  imageId: string;
  themeId: string;
  imageName: string;
  imageUrl: string;
  imagePath: string;
  imageSize: number;
  imageType: string;
  isPrimary: boolean;
  uploadedAt: string;
  metadata?: string;
}

// Form Types
export interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  userType: UserType;
}

export interface VendorFormData {
  phoneNumber: string;
  businessName: string;
  businessDescription: string;
  businessAddress: string;
  businessPhone: string;
  businessEmail: string;
  registrationNumber?: string;
  taxId?: string;
}

export interface BusinessFormData {
  phoneNumber: string;
  businessName: string;
  businessDescription: string;
  businessCategory: string;
  businessAddress: string;
  businessPhone: string;
  businessEmail: string;
  website?: string;
  socialMediaLinks?: string;
  operatingHours?: string;
}

export interface ThemeFormData {
  businessId: string;
  themeName: string;
  themeDescription: string;
  themeCategory: string;
  priceRange: string;
}

export interface ImageFormData {
  themeId: string;
  imageName: string;
  imageUrl: string;
  imagePath: string;
  imageSize: number;
  imageType: string;
}

// Authentication Types
export interface LoginRequest {
  phoneNumber: string;
  password: string;
}

export interface SignupRequest {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
  userType: UserType;
}

export interface JwtResponse {
  token: string;
  type: string;
  phoneNumber: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: UserType;
  role: string;
}

export interface AuthUser {
  phoneNumber: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: UserType;
  role: string;
}

export interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (phoneNumber: string, password: string) => Promise<void>;
  signup: (signupData: SignupRequest) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}
