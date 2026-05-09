import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { getProducts } from '@/services/productsService';

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
  addToCart: (product: Product, quantity?: number) => Promise<void>;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const itemsRef = useRef<CartItem[]>([]);

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

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const addToCart = async (product: Product, quantity: number = 1) => {
    const products = await getProducts();
    const current = products.find(p => p.id === product.id);
    const available = current?.quantity ?? 0;

    const existingItem = itemsRef.current.find(item => item.id === product.id);
    const currentCartQuantity = existingItem ? existingItem.quantity : 0;
    const newQuantity = currentCartQuantity + quantity;

    if (available <= 0) {
      throw new Error('Товар отсутствует на складе');
    }

    if (newQuantity > available) {
      throw new Error(`Недостаточно товара на складе. Доступно: ${available} шт.`);
    }

    setItems(prevItems => {
      const prevExisting = prevItems.find(item => item.id === product.id);
      if (prevExisting) {
        return prevItems.map(item => (item.id === product.id ? { ...item, quantity: newQuantity } : item));
      }
      return [...prevItems, { ...product, quantity: newQuantity }];
    });
  };

  const removeFromCart = (productId: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== productId));
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const products = await getProducts();
    const current = products.find(p => p.id === productId);
    const available = current?.quantity ?? 0;

    if (available <= 0) {
      throw new Error('Товар отсутствует на складе');
    }

    if (quantity > available) {
      throw new Error(`Недостаточно товара на складе. Доступно: ${available} шт.`);
    }

    setItems(prevItems =>
      prevItems.map(cartItem => (cartItem.id === productId ? { ...cartItem, quantity } : cartItem))
    );
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