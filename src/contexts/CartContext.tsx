import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { CartItem, Cart, Order, OrderFormData } from '../types/cart';
import { Theme, Inventory, Plate, Dish, Business } from '../types';

interface CartContextType {
  cart: Cart;
  addToCart: (
    item: Theme | Inventory | Plate | Dish, 
    business: Business, 
    bookingDate?: string,
    selectedDishes?: Array<{ dishId: string; dishName: string; dishPrice: number; quantity: number }>
  ) => void;
  removeFromCart: (itemId: string, itemType: 'theme' | 'inventory' | 'plate' | 'dish') => void;
  updateQuantity: (itemId: string, itemType: 'theme' | 'inventory' | 'plate' | 'dish', quantity: number) => void;
  updateBookingDate: (itemId: string, itemType: 'theme' | 'inventory' | 'plate' | 'dish', bookingDate: string | undefined) => void;
  clearCart: () => void;
  getCartItemCount: () => number;
  getCartTotal: () => number;
  isInCart: (itemId: string, itemType: 'theme' | 'inventory' | 'plate' | 'dish') => boolean;
  openCart: () => void;
  closeCart: () => void;
  isCartOpen: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartState {
  items: CartItem[];
}

type CartAction =
  | { type: 'ADD_TO_CART'; payload: CartItem }
  | { type: 'REMOVE_FROM_CART'; payload: { id: string; type: 'theme' | 'inventory' | 'plate' | 'dish' } }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; type: 'theme' | 'inventory' | 'plate' | 'dish'; quantity: number } }
  | { type: 'UPDATE_BOOKING_DATE'; payload: { id: string; type: 'theme' | 'inventory' | 'plate' | 'dish'; bookingDate: string | undefined } }
  | { type: 'CLEAR_CART' };

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_TO_CART': {
      const existingItemIndex = state.items.findIndex(
        item => item.id === action.payload.id && item.type === action.payload.type
      );

      if (existingItemIndex >= 0) {
        const updatedItems = [...state.items];
        updatedItems[existingItemIndex].quantity += action.payload.quantity;
        return { items: updatedItems };
      } else {
        return { items: [...state.items, action.payload] };
      }
    }

    case 'REMOVE_FROM_CART': {
      return {
        items: state.items.filter(
          item => !(item.id === action.payload.id && item.type === action.payload.type)
        )
      };
    }

    case 'UPDATE_QUANTITY': {
      return {
        items: state.items.map(item =>
          item.id === action.payload.id && item.type === action.payload.type
            ? { ...item, quantity: action.payload.quantity }
            : item
        ).filter(item => item.quantity > 0)
      };
    }

    case 'UPDATE_BOOKING_DATE': {
      return {
        items: state.items.map(item =>
          item.id === action.payload.id && item.type === action.payload.type
            ? { ...item, bookingDate: action.payload.bookingDate }
            : item
        )
      };
    }

    case 'CLEAR_CART': {
      return { items: [] };
    }

    default:
      return state;
  }
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });
  const [isCartOpen, setIsCartOpen] = React.useState(false);

  const addToCart = (
    item: Theme | Inventory | Plate | Dish, 
    business: Business, 
    bookingDate?: string,
    selectedDishes?: Array<{ dishId: string; dishName: string; dishPrice: number; quantity: number }>
  ) => {
    let cartItem: CartItem;

    if ('themeId' in item) {
      // Theme item
      cartItem = {
        id: item.themeId,
        type: 'theme',
        name: item.themeName,
        description: item.themeDescription,
        price: parseFloat(item.priceRange.replace(/[^\d.]/g, '')) || 0,
        image: undefined, // Themes don't have single image
        businessId: business.businessId,
        businessName: business.businessName,
        quantity: 1,
        category: item.themeCategory,
        themeId: item.themeId,
        themeCategory: item.themeCategory,
        bookingDate: bookingDate
      };
    } else if ('inventoryId' in item) {
      // Inventory item
      cartItem = {
        id: item.inventoryId,
        type: 'inventory',
        name: item.inventoryName,
        description: item.inventoryDescription,
        price: item.price,
        image: undefined, // Inventory items don't have single image
        businessId: business.businessId,
        businessName: business.businessName,
        quantity: 1,
        category: item.inventoryCategory,
        inventoryId: item.inventoryId,
        inventoryCategory: item.inventoryCategory,
        bookingDate: bookingDate
      };
    } else if ('dishId' in item) {
      // Dish item (check before plateId since both have dishName)
      const dish = item as Dish;
      cartItem = {
        id: dish.dishId,
        type: 'dish',
        name: dish.dishName,
        description: dish.dishDescription,
        price: dish.price,
        image: dish.dishImage,
        businessId: business.businessId,
        businessName: business.businessName,
        quantity: 1,
        category: 'Dish',
        dishId: dish.dishId,
        dishAvailabilityDates: dish.availabilityDates,
        bookingDate: bookingDate
      };
    } else if ('plateId' in item) {
      // Plate item - calculate total price including dishes
      const dishesTotal = selectedDishes?.reduce((sum, dish) => sum + dish.dishPrice * dish.quantity, 0) || 0;
      const totalPrice = item.price + dishesTotal;
      
      cartItem = {
        id: item.plateId,
        type: 'plate',
        name: item.dishName,
        description: item.dishDescription,
        price: totalPrice, // Total price including dishes
        image: item.plateImage,
        businessId: business.businessId,
        businessName: business.businessName,
        quantity: 1,
        category: 'Food',
        plateId: item.plateId,
        dishType: item.dishType,
        bookingDate: bookingDate,
        selectedDishes: selectedDishes || []
      };
    } else {
      return; // Invalid item type
    }

    dispatch({ type: 'ADD_TO_CART', payload: cartItem });
  };

  const removeFromCart = (itemId: string, itemType: 'theme' | 'inventory' | 'plate' | 'dish') => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: { id: itemId, type: itemType } });
  };

  const updateQuantity = (itemId: string, itemType: 'theme' | 'inventory' | 'plate' | 'dish', quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id: itemId, type: itemType, quantity } });
  };

  const updateBookingDate = (itemId: string, itemType: 'theme' | 'inventory' | 'plate' | 'dish', bookingDate: string | undefined) => {
    dispatch({ type: 'UPDATE_BOOKING_DATE', payload: { id: itemId, type: itemType, bookingDate } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const getCartItemCount = () => {
    return state.items.reduce((total, item) => total + item.quantity, 0);
  };

  const getCartTotal = () => {
    return state.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const isInCart = (itemId: string, itemType: 'theme' | 'inventory' | 'plate' | 'dish') => {
    return state.items.some(item => item.id === itemId && item.type === itemType);
  };

  const openCart = () => {
    setIsCartOpen(true);
  };

  const closeCart = () => {
    setIsCartOpen(false);
  };

  const cart: Cart = {
    items: state.items,
    totalItems: getCartItemCount(),
    totalPrice: getCartTotal(),
    businessId: state.items.length > 0 ? state.items[0].businessId : undefined
  };

  const value: CartContextType = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    updateBookingDate,
    clearCart,
    getCartItemCount,
    getCartTotal,
    isInCart,
    openCart,
    closeCart,
    isCartOpen
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
