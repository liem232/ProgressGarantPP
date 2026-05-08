import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  description: string;
  inStock: boolean;
  brand?: string;
  volume?: string;
  strength?: string;
  quantity: number;
}

interface CartItem extends Product {
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const savedCart = localStorage.getItem('progressgarant_cart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (error) {
        localStorage.removeItem('progressgarant_cart');
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('progressgarant_cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (product: Product, quantity: number = 1) => {
    // Проверяем наличие товара
    if (product.quantity <= 0) {
      throw new Error('Товар отсутствует на складе');
    }
    
    setItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      const currentCartQuantity = existingItem ? existingItem.quantity : 0;
      const newQuantity = currentCartQuantity + quantity;
      
      // Проверяем, что запрошенное количество не превышает наличие
      if (newQuantity > product.quantity) {
        throw new Error(`Недостаточно товара на складе. Доступно: ${product.quantity} шт.`);
      }
      
      if (existingItem) {
        return prevItems.map(item =>
          item.id === product.id
            ? { ...item, quantity: newQuantity }
            : item
        );
      }
      return [...prevItems, { ...product, quantity }];
    });
  };

  const removeFromCart = (productId: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setItems(prevItems => {
      const item = prevItems.find(item => item.id === productId);
      if (!item) return prevItems;
      
      // Проверяем, что новое количество не превышает наличие на складе
      if (quantity > item.quantity) {
        throw new Error(`Недостаточно товара на складе. Доступно: ${item.quantity} шт.`);
      }
      
      return prevItems.map(cartItem =>
        cartItem.id === productId ? { ...cartItem, quantity } : cartItem
      );
    });
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const value: CartContextType = {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};