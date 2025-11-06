import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { CartItem, Cart, Order, OrderFormData } from '../types/cart';
import { Theme, Inventory, Plate, Business } from '../types';

interface CartContextType {
  cart: Cart;
  addToCart: (item: Theme | Inventory | Plate, business: Business) => void;
  removeFromCart: (itemId: string, itemType: 'theme' | 'inventory' | 'plate') => void;
  updateQuantity: (itemId: string, itemType: 'theme' | 'inventory' | 'plate', quantity: number) => void;
  clearCart: () => void;
  getCartItemCount: () => number;
  getCartTotal: () => number;
  isInCart: (itemId: string, itemType: 'theme' | 'inventory' | 'plate') => boolean;
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
  | { type: 'REMOVE_FROM_CART'; payload: { id: string; type: 'theme' | 'inventory' | 'plate' } }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; type: 'theme' | 'inventory' | 'plate'; quantity: number } }
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

  const addToCart = (item: Theme | Inventory | Plate, business: Business) => {
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
        themeCategory: item.themeCategory
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
        inventoryCategory: item.inventoryCategory
      };
    } else if ('plateId' in item) {
      // Plate item
      cartItem = {
        id: item.plateId,
        type: 'plate',
        name: item.dishName,
        description: item.dishDescription,
        price: item.price,
        image: item.plateImage,
        businessId: business.businessId,
        businessName: business.businessName,
        quantity: 1,
        category: 'Food',
        plateId: item.plateId,
        dishType: item.dishType
      };
    } else {
      return; // Invalid item type
    }

    dispatch({ type: 'ADD_TO_CART', payload: cartItem });
  };

  const removeFromCart = (itemId: string, itemType: 'theme' | 'inventory' | 'plate') => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: { id: itemId, type: itemType } });
  };

  const updateQuantity = (itemId: string, itemType: 'theme' | 'inventory' | 'plate', quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id: itemId, type: itemType, quantity } });
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

  const isInCart = (itemId: string, itemType: 'theme' | 'inventory' | 'plate') => {
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
