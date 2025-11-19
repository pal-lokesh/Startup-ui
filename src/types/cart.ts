export interface CartItem {
  id: string;
  type: 'theme' | 'inventory' | 'plate' | 'dish';
  name: string;
  description: string;
  price: number;
  image?: string;
  imageUrl?: string;
  businessId: string;
  businessName: string;
  quantity: number;
  category: string;
  bookingDate?: string; // Date for which the item is booked (YYYY-MM-DD format)
  // Additional properties based on item type
  themeId?: string;
  inventoryId?: string;
  plateId?: string;
  // For themes
  themeCategory?: string;
  // For inventory
  inventoryCategory?: string;
  // For plates
  dishType?: 'veg' | 'non-veg';
  // For dishes
  dishId?: string;
  dishAvailabilityDates?: string[];
  // For plates with dishes
  selectedDishes?: Array<{
    dishId: string;
    dishName: string;
    dishPrice: number;
    quantity: number;
  }>;
}


export interface Cart {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  businessId?: string; // If all items are from same business
}

export interface Order {
  orderId: number;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryDate: string;
  specialNotes?: string;
  totalAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED';
  orderDate: string;
  orderItems: OrderItemResponse[];
}

export interface OrderItemResponse {
  orderItemId: number;
  itemId: string;
  itemName: string;
  itemPrice: number;
  quantity: number;
  itemType: string;
  businessId: string;
  businessName: string;
  imageUrl?: string;
  bookingDate?: string; // Date for which the item is booked (YYYY-MM-DD format)
  selectedDishes?: string; // JSON string storing selected dishes for plates
}

export interface OrderFormData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryDate: string;
  specialNotes?: string;
}
