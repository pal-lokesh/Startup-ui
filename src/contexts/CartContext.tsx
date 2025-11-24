import React, { createContext, useContext, useReducer, ReactNode, useMemo } from 'react';
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
  console.log('🔄 CartReducer called with action:', action.type);
  console.log('🔄 Current state items count:', state.items.length);
  console.log('🔄 Current state items:', state.items);
  
  switch (action.type) {
    case 'ADD_TO_CART': {
      console.log('🔄 ADD_TO_CART action - payload:', action.payload);
      console.log('🔄 Payload id:', action.payload.id, 'type:', action.payload.type);
      const existingItemIndex = state.items.findIndex(
        item => item.id === action.payload.id && item.type === action.payload.type
      );
      console.log('🔄 Existing item index:', existingItemIndex);

      if (existingItemIndex >= 0) {
        console.log('🔄 Item already in cart, updating quantity');
        const updatedItems = [...state.items];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + action.payload.quantity
        };
        console.log('🔄 Updated items count:', updatedItems.length);
        console.log('🔄 Updated items:', updatedItems);
        const newState = { items: updatedItems };
        console.log('🔄 Returning new state:', newState);
        return newState;
      } else {
        console.log('🔄 New item, adding to cart');
        const newItems = [...state.items, action.payload];
        console.log('🔄 New items count:', newItems.length);
        console.log('🔄 New items:', newItems);
        const newState = { items: newItems };
        console.log('🔄 Returning new state:', newState);
        return newState;
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
      console.log('🛒 CLEAR_CART action received - clearing cart');
      const newState = { items: [] };
      console.log('🛒 Cart cleared - new state:', newState);
      return newState;
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
  
  // Debug: Log state changes
  React.useEffect(() => {
    console.log('🛒 CartProvider state changed:', {
      itemsCount: state.items.length,
      items: state.items
    });
  }, [state.items]);

  const addToCart = (
    item: Theme | Inventory | Plate | Dish, 
    business: Business, 
    bookingDate?: string,
    selectedDishes?: Array<{ dishId: string; dishName: string; dishPrice: number; quantity: number }>
  ) => {
    console.log('🛒 CartContext.addToCart called');
    console.log('🛒 item:', item);
    console.log('🛒 item keys:', Object.keys(item));
    console.log('🛒 business:', business);
    console.log('🛒 bookingDate:', bookingDate);
    console.log('🛒 selectedDishes:', selectedDishes);
    console.log('🛒 Current cart state items:', state.items.length);
    
    // Debug: Check which properties exist
    const hasThemeId = 'themeId' in item || (item as any).themeId !== undefined;
    const hasInventoryId = 'inventoryId' in item || (item as any).inventoryId !== undefined;
    const hasDishId = 'dishId' in item || (item as any).dishId !== undefined;
    const hasPlateId = 'plateId' in item || (item as any).plateId !== undefined;
    
    console.log('🛒 Type checks:', {
      hasThemeId,
      hasInventoryId,
      hasDishId,
      hasPlateId,
      itemType: typeof item,
      itemConstructor: item?.constructor?.name,
    });
    
    let cartItem: CartItem;

    if (hasThemeId) {
      console.log('🛒 ✅ Identified as THEME');
      // Theme item
      const theme = item as Theme;
      cartItem = {
        id: theme.themeId,
        type: 'theme',
        name: theme.themeName,
        description: theme.themeDescription,
        price: parseFloat(theme.priceRange.replace(/[^\d.]/g, '')) || 0,
        image: undefined, // Themes don't have single image
        businessId: business.businessId,
        businessName: business.businessName,
        quantity: 1,
        category: theme.themeCategory,
        themeId: theme.themeId,
        themeCategory: theme.themeCategory,
        bookingDate: bookingDate
      };
    } else if (hasInventoryId) {
      console.log('🛒 ✅ Identified as INVENTORY');
      // Inventory item
      const inventory = item as Inventory;
      cartItem = {
        id: inventory.inventoryId,
        type: 'inventory',
        name: inventory.inventoryName,
        description: inventory.inventoryDescription,
        price: inventory.price,
        image: undefined, // Inventory items don't have single image
        businessId: business.businessId,
        businessName: business.businessName,
        quantity: 1,
        category: inventory.inventoryCategory,
        inventoryId: inventory.inventoryId,
        inventoryCategory: inventory.inventoryCategory,
        bookingDate: bookingDate
      };
    } else if (hasDishId) {
      console.log('🛒 ✅ Identified as DISH');
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
    } else if (hasPlateId) {
      console.log('🛒 ✅ Identified as PLATE');
      // Plate item - calculate total price including dishes
      const plate = item as Plate;
      const dishesTotal = selectedDishes?.reduce((sum, dish) => sum + dish.dishPrice * dish.quantity, 0) || 0;
      const totalPrice = plate.price + dishesTotal;
      
      console.log('🛒 Plate details:', {
        plateId: plate.plateId,
        dishName: plate.dishName,
        price: plate.price,
        dishesTotal,
        totalPrice
      });
      
      cartItem = {
        id: plate.plateId,
        type: 'plate',
        name: plate.dishName,
        description: plate.dishDescription,
        price: totalPrice, // Total price including dishes
        image: plate.plateImage,
        businessId: business.businessId,
        businessName: business.businessName,
        quantity: 1,
        category: 'Food',
        plateId: plate.plateId,
        dishType: plate.dishType,
        bookingDate: bookingDate,
        selectedDishes: selectedDishes || []
      };
    } else {
      console.error('🛒 ❌ ERROR: Could not identify item type!');
      console.error('🛒 ❌ Item object:', JSON.stringify(item, null, 2));
      console.error('🛒 ❌ Available keys:', Object.keys(item));
      alert('Error: Could not add item to cart. Item type could not be determined.');
      return; // Invalid item type
    }

    console.log('🛒 Created cartItem:', cartItem);
    console.log('🛒 Dispatching ADD_TO_CART action');
    dispatch({ type: 'ADD_TO_CART', payload: cartItem });
    // Note: state will be updated after dispatch, so we log the item being added
    console.log('✅ Item added to cart:', cartItem.name, 'Type:', cartItem.type, 'Business:', cartItem.businessName);
    console.log('✅ Cart state after dispatch - items count:', state.items.length + 1);
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
    console.log('🛒 clearCart() called - clearing cart with', state.items.length, 'items');
    dispatch({ type: 'CLEAR_CART' });
    console.log('🛒 clearCart() dispatch sent');
  };

  const getCartItemCount = () => {
    const count = state.items.reduce((total, item) => total + item.quantity, 0);
    console.log('🛒 getCartItemCount called, returning:', count, 'from', state.items.length, 'items');
    return count;
  };

  const getCartTotal = () => {
    const total = state.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    console.log('🛒 getCartTotal called, returning:', total);
    return total;
  };

  const isInCart = (itemId: string, itemType: 'theme' | 'inventory' | 'plate' | 'dish') => {
    const inCart = state.items.some(item => item.id === itemId && item.type === itemType);
    console.log('🛒 isInCart called for', itemId, itemType, 'returning:', inCart);
    return inCart;
  };

  const openCart = () => {
    console.log('🛒 CartContext.openCart called');
    console.log('🛒 Current cart items count:', state.items.length);
    console.log('🛒 Setting isCartOpen to true');
    setIsCartOpen(true);
    console.log('🛒 isCartOpen set to true');
  };

  const closeCart = () => {
    setIsCartOpen(false);
  };

  // Memoize cart object to prevent unnecessary re-renders
  const cart: Cart = useMemo(() => {
    const totalItems = state.items.reduce((total, item) => total + item.quantity, 0);
    const totalPrice = state.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    const cartObj = {
      items: state.items,
      totalItems: totalItems,
      totalPrice: totalPrice,
      businessId: state.items.length > 0 ? state.items[0].businessId : undefined
    };
    console.log('🛒 Cart object created/updated:', {
      itemsCount: cartObj.items.length,
      totalItems: cartObj.totalItems,
      totalPrice: cartObj.totalPrice,
      items: cartObj.items,
      stateItemsCount: state.items.length
    });
    return cartObj;
  }, [state.items]);
  
  // Debug: Log cart whenever it changes
  React.useEffect(() => {
    console.log('🛒 Cart useEffect triggered:', {
      itemsCount: cart.items.length,
      totalItems: cart.totalItems,
      totalPrice: cart.totalPrice,
      items: cart.items
    });
  }, [cart.items, cart.totalItems, cart.totalPrice]);

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
