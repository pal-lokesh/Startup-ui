// User Types
export interface User {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  userType: UserType;
  role?: string;
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
  latitude?: number;
  longitude?: number;
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
  quantity?: number; // Stock quantity
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Summary DTOs for UI listing
export interface ThemeSummaryDto {
  themeId: string;
  themeName: string;
}

export interface BusinessThemeSummaryDto {
  businessId: string;
  businessName: string;
  themes: ThemeSummaryDto[];
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

// Inventory Types
export interface Inventory {
  inventoryId: string;
  businessId: string;
  inventoryName: string;
  inventoryDescription: string;
  inventoryCategory: string;
  price: number;
  quantity: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryImage {
  imageId: string;
  inventoryId: string;
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
  isPrimary?: boolean;
}

export interface InventoryFormData {
  businessId: string;
  inventoryName: string;
  inventoryDescription: string;
  inventoryCategory: string;
  price: number;
  quantity: number;
}

export interface InventoryImageFormData {
  inventoryId: string;
  imageName: string;
  imageUrl: string;
  imagePath: string;
  imageSize: number;
  imageType: string;
  isPrimary?: boolean;
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
  userId?: string;
  phoneNumber: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: UserType;
  role: string;
}

export interface AuthUser {
  userId?: string;
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
  login: (phoneNumber: string, password: string) => Promise<AuthUser>;
  signup: (signupData: SignupRequest) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

// Plate Types
export interface Plate {
  plateId: string;
  businessId: string;
  dishName: string;
  dishDescription: string;
  plateImage: string;
  price: number;
  dishType: 'veg' | 'non-veg';
  quantity?: number; // Stock quantity
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlateFormData {
  businessId: string;
  dishName: string;
  dishDescription: string;
  plateImage: string;
  price: number;
  dishType: 'veg' | 'non-veg';
}

// Order Types
export interface Order {
  orderId: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryDate: string;
  specialNotes?: string;
  totalAmount: number;
  status: OrderStatus;
  orderDate: string;
  orderItems: OrderItem[];
}

export interface OrderItem {
  itemId: string;
  itemName: string;
  itemType: 'THEME' | 'INVENTORY' | 'PLATE';
  quantity: number;
  price: number;
  businessId: string;
  businessName: string;
}

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  SHIPPED = 'SHIPPED'
}
