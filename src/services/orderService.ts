import { Order, OrderFormData, CartItem } from '../types/cart';

const API_BASE_URL = 'http://localhost:8080/api/orders';

class OrderService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  async createOrder(cartItems: CartItem[], orderData: OrderFormData, userId: string): Promise<Order> {
    try {
      // Transform cart items to match backend API structure
      const orderItems = cartItems.map(item => {
        const orderItem: any = {
          itemId: item.id,
          itemName: item.name,
          itemPrice: item.price,
          quantity: item.quantity,
          itemType: item.type,
          businessId: item.businessId,
          businessName: item.businessName,
          imageUrl: item.imageUrl || item.image,
        };
        
        // Only include bookingDate if it's provided and not empty
        if (item.bookingDate && item.bookingDate.trim() !== '') {
          orderItem.bookingDate = item.bookingDate;
        }
        
        // Include selected dishes for plates
        if (item.type === 'plate' && item.selectedDishes && item.selectedDishes.length > 0) {
          orderItem.selectedDishes = JSON.stringify(item.selectedDishes);
        }
        
        return orderItem;
      });

      const orderPayload = {
        userId: userId,
        customerName: orderData.customerName,
        customerEmail: orderData.customerEmail,
        customerPhone: orderData.customerPhone,
        deliveryAddress: orderData.deliveryAddress,
        deliveryDate: orderData.deliveryDate,
        specialNotes: orderData.specialNotes || '',
        items: orderItems
      };

      console.log('Creating order with payload:', JSON.stringify(orderPayload, null, 2));

      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(orderPayload),
      });

      if (!response.ok) {
        // Try to parse error response
        let errorMessage = `HTTP error! status: ${response.status}`;
        
        // Clone the response so we can read it multiple times if needed
        const responseClone = response.clone();
        
        try {
          const errorData = await response.json();
          console.log('Error response data:', errorData);
          // Handle different error response formats
          if (typeof errorData === 'string') {
            errorMessage = errorData;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          // If response is not JSON, try to get text from clone
          try {
            const errorText = await responseClone.text();
            console.log('Error response text:', errorText);
            if (errorText) {
              errorMessage = errorText;
            }
          } catch (textError) {
            console.error('Error reading response text:', textError);
            // Keep default error message
          }
        }
        console.error('Final error message:', errorMessage);
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Error creating order:', error);
      // Re-throw with proper error message
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(error.message || 'Failed to create order');
    }
  }

  async getOrders(): Promise<Order[]> {
    try {
      const response = await fetch(API_BASE_URL, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  }

  async getOrderById(orderId: string): Promise<Order> {
    try {
      const response = await fetch(`${API_BASE_URL}/${orderId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching order:', error);
      throw error;
    }
  }

  async updateOrderStatus(orderId: string, status: Order['status']): Promise<Order> {
    try {
      const response = await fetch(`${API_BASE_URL}/${orderId}/status?status=${status}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        // Try to parse error response
        let errorMessage = `HTTP error! status: ${response.status}`;
        
        // Clone the response so we can read it multiple times if needed
        const responseClone = response.clone();
        
        try {
          const errorData = await response.json();
          console.log('Error response data:', errorData);
          // Handle different error response formats
          if (typeof errorData === 'string') {
            errorMessage = errorData;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          // If response is not JSON, try to get text from clone
          try {
            const errorText = await responseClone.text();
            console.log('Error response text:', errorText);
            if (errorText) {
              errorMessage = errorText;
            }
          } catch (textError) {
            console.error('Error reading response text:', textError);
            // Keep default error message
          }
        }
        console.error('Final error message:', errorMessage);
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Error updating order status:', error);
      // Re-throw with proper error message
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(error.message || 'Failed to update order status');
    }
  }

  async getOrdersByBusinessId(businessId: string): Promise<Order[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/business/${businessId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching business orders:', error);
      throw error;
    }
  }

  async getOrdersByUserId(userId: string): Promise<Order[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/user/${userId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Ensure we always return an array
      // Handle case where backend might return a single object instead of array
      if (Array.isArray(data)) {
        console.log(`Fetched ${data.length} orders for user ${userId}`);
        return data;
      } else if (data && typeof data === 'object') {
        // If it's a single order object, wrap it in an array
        console.warn('Backend returned single order object instead of array, wrapping it');
        return [data];
      } else {
        console.warn('Unexpected response format, returning empty array');
        return [];
      }
    } catch (error) {
      console.error('Error fetching user orders:', error);
      throw error;
    }
  }

  async cancelOrder(orderId: string): Promise<Order> {
    try {
      const response = await fetch(`${API_BASE_URL}/${orderId}/status?status=CANCELLED`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error cancelling order:', error);
      throw error;
    }
  }

  async getOrderStatistics(): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/statistics`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching order statistics:', error);
      throw error;
    }
  }
}

const orderService = new OrderService();
export default orderService;
