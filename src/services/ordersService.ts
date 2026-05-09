import {
  collection,
  setDoc,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  getDoc,
  updateDoc,
  Timestamp,
  DocumentData,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { updateProduct } from '@/services/productsService';

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface OrderData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company?: string;
  city: string;
  address: string;
  comment?: string;
  userId?: string;
}

export interface Order {
  id: string;
  items: OrderItem[];
  orderData: OrderData;
  totalPrice: number;
  totalItems: number;
  date: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  createdAt?: Timestamp;
}

const COLLECTION_NAME = 'orders';
const ORDER_COUNTER_COLLECTION = 'orderCounter';

const ordersCollection = isFirebaseConfigured && db
  ? collection(db, COLLECTION_NAME)
  : null;

const counterCollection = isFirebaseConfigured && db
  ? collection(db, ORDER_COUNTER_COLLECTION)
  : null;

// Get current order counter from Firestore or localStorage
const getOrderCounter = async (): Promise<number> => {
  if (!isFirebaseConfigured || !db) {
    // Fallback to localStorage
    const counter = localStorage.getItem('progressgarant_order_counter');
    return counter ? parseInt(counter, 10) : 0;
  }

  try {
    const counterDoc = await getDoc(doc(db, ORDER_COUNTER_COLLECTION, 'counter'));
    if (counterDoc.exists()) {
      return counterDoc.data()?.value || 0;
    }
    return 0;
  } catch (error) {
    console.error('getOrderCounter error:', error);
    const counter = localStorage.getItem('progressgarant_order_counter');
    return counter ? parseInt(counter, 10) : 0;
  }
};

// Increment order counter (cycle from 1 to 1000)
const incrementOrderCounter = async (): Promise<number> => {
  if (!isFirebaseConfigured || !db) {
    // Fallback to localStorage
    const current = parseInt(localStorage.getItem('progressgarant_order_counter') || '0', 10);
    const next = current >= 1000 ? 1 : current + 1;
    localStorage.setItem('progressgarant_order_counter', next.toString());
    return next;
  }

  try {
    const counterRef = doc(db, ORDER_COUNTER_COLLECTION, 'counter');
    const counterDoc = await getDoc(counterRef);
    const current = counterDoc.exists() ? counterDoc.data()?.value || 0 : 0;
    const next = current >= 1000 ? 1 : current + 1;

    // Используем setDoc с merge, но если упадет - игнорируем
    await setDoc(counterRef, { value: next }, { merge: true }).catch(e => console.warn('Failed to sync counter to Firestore:', e));
    localStorage.setItem('progressgarant_order_counter', next.toString());
    return next;
  } catch (error) {
    console.error('incrementOrderCounter error:', error);
    // Fallback to localStorage if Firestore permissions/indexes prevent counter updates
    const current = parseInt(localStorage.getItem('progressgarant_order_counter') || '0', 10);
    const next = current >= 1000 ? 1 : current + 1;
    localStorage.setItem('progressgarant_order_counter', next.toString());
    return next;
  }
};

// Generate sequential order ID (0001-1000)
const generateOrderId = async (): Promise<string> => {
  try {
    const counter = await incrementOrderCounter();
    return counter.toString().padStart(4, '0');
  } catch (error) {
    console.error('generateOrderId error:', error);
    return Date.now().toString();
  }
};

// Fallback to localStorage
const getLocalOrders = (): Order[] => {
  const data = localStorage.getItem('progressgarant_orders');
  return data ? JSON.parse(data) : [];
};

const saveLocalOrders = (orders: Order[]) => {
  localStorage.setItem('progressgarant_orders', JSON.stringify(orders));
};

export const createOrder = async (orderData: Omit<Order, 'id'>): Promise<Order> => {
  // Generate sequential order ID (0001-1000)
  const orderId = await generateOrderId();
  
  if (!isFirebaseConfigured || !ordersCollection || !db) {
    // Fallback to localStorage
    const orders = getLocalOrders();
    const newOrder: Order = {
      ...orderData,
      id: orderId,
      date: new Date().toISOString(),
    };
    orders.push(newOrder);
    saveLocalOrders(orders);
    return newOrder;
  }

  // Firebase mode - use setDoc with sequential ID
  const docRef = doc(db, COLLECTION_NAME, orderId);
  await setDoc(docRef, {
    ...orderData,
    createdAt: Timestamp.now(),
  });

  return {
    ...orderData,
    id: orderId,
  };
};

export const getOrders = async (userId?: string): Promise<Order[]> => {
  if (!isFirebaseConfigured || !ordersCollection || !db) {
    // Fallback to localStorage
    const orders = getLocalOrders();
    if (userId) {
      return orders
        .filter(o => o.orderData.userId === userId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    return orders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  try {
    let q;
    if (userId) {
      // Avoid requiring a composite index (where + orderBy) by sorting on the client.
      q = query(ordersCollection, where('orderData.userId', '==', userId));
    } else {
      q = query(ordersCollection, orderBy('createdAt', 'desc'));
    }

    const snapshot = await getDocs(q);
    const results = snapshot.docs.map(docSnap => {
      const data = docSnap.data() as DocumentData;
      return {
        id: docSnap.id,
        items: data.items || [],
        orderData: data.orderData || {},
        totalPrice: data.totalPrice || 0,
        totalItems: data.totalItems || 0,
        date: data.date || data.createdAt?.toDate?.().toISOString() || new Date().toISOString(),
        status: data.status || 'pending',
        createdAt: data.createdAt,
      } as Order;
    });

    return results.sort((a, b) => {
      const aTime = (a.createdAt?.toMillis?.() ?? new Date(a.date).getTime());
      const bTime = (b.createdAt?.toMillis?.() ?? new Date(b.date).getTime());
      return bTime - aTime;
    });
  } catch (error) {
    console.error('getOrders error:', error);
    throw error;
  }
};

export const getOrderById = async (orderId: string): Promise<Order | null> => {
  if (!isFirebaseConfigured || !db) {
    const orders = getLocalOrders();
    return orders.find(o => o.id === orderId) || null;
  }

  const docRef = doc(db, COLLECTION_NAME, orderId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;

  const data = docSnap.data() as DocumentData;
  return {
    id: docSnap.id,
    items: data.items || [],
    orderData: data.orderData || {},
    totalPrice: data.totalPrice || 0,
    totalItems: data.totalItems || 0,
    date: data.date || data.createdAt?.toDate?.().toISOString() || new Date().toISOString(),
    status: data.status || 'pending',
    createdAt: data.createdAt,
  } as Order;
};

export const updateOrderStatus = async (
  orderId: string,
  status: Order['status']
): Promise<void> => {
  // Получаем информацию о заказе
  const order = await getOrderById(orderId);
  if (!order) {
    throw new Error('Заказ не найден');
  }

  // Обновляем статус заказа
  if (!isFirebaseConfigured || !db) {
    const orders = getLocalOrders();
    const index = orders.findIndex(o => o.id === orderId);
    if (index !== -1) {
      const previousStatus = orders[index].status;
      orders[index].status = status;
      
  // Резервируем товары при смене на "в обработке"
      if (previousStatus === 'pending' && status === 'processing') {
        await updateStockForOrder(order.items, -1);
      }
      // Возвращаем товары при отмене заказа, если он был обработан
      else if ((previousStatus === 'processing' || previousStatus === 'completed') && status === 'cancelled') {
        await updateStockForOrder(order.items, 1);
      }
      // Списываем, если сразу выполнен
      else if (previousStatus === 'pending' && status === 'completed') {
        await updateStockForOrder(order.items, -1);
      }
      // Возвращаем, если вернули в ожидание
      else if (previousStatus === 'processing' && status === 'pending') {
        await updateStockForOrder(order.items, 1);
      }
      
      saveLocalOrders(orders);
    }
    return;
  }

  const docRef = doc(db, COLLECTION_NAME, orderId);
  
  // Получаем текущий статус заказа
  const currentDoc = await getDoc(docRef);
  const previousStatus = currentDoc.data()?.status || 'pending';
  
  // Обновляем статус
  await updateDoc(docRef, { status });
  
  // Логика пересчета наличия:
  // 1. При переходе в "processing" (в обработке) - списываем (резервируем)
  if (previousStatus === 'pending' && status === 'processing') {
    await updateStockForOrder(order.items, -1);
  }
  // 2. При отмене ("cancelled") - если заказ был в "processing" или "completed", возвращаем товары
  else if ((previousStatus === 'processing' || previousStatus === 'completed') && status === 'cancelled') {
    await updateStockForOrder(order.items, 1);
  }
  // 3. Если заказ из "pending" сразу идет в "completed" - тоже списываем
  else if (previousStatus === 'pending' && status === 'completed') {
    await updateStockForOrder(order.items, -1);
  }
  // 4. Если из "processing" возвращаем в "pending" - возвращаем товары (разрезервируем)
  else if (previousStatus === 'processing' && status === 'pending') {
    await updateStockForOrder(order.items, 1);
  }
};

// Функция для обновления наличия товаров
const updateStockForOrder = async (items: OrderItem[], delta: number): Promise<void> => {
  // Импортируем здесь, чтобы избежать циклических зависимостей
  const { getProducts, updateProduct } = await import('./productsService');
  
  try {
    const products = await getProducts();
    
    for (const item of items) {
      const product = products.find(p => p.id === item.id);
      if (product) {
        const newQuantity = Math.max(0, product.quantity + (item.quantity * delta));
        await updateProduct(item.id, { quantity: newQuantity });
      }
    }
  } catch (error) {
    console.error('Error updating stock for order:', error);
    // Не прерываем выполнение, если не удалось обновить наличие
  }
};

// Проверка лимита заказов за день (защита от спама)
const MAX_ORDERS_PER_DAY = 3;

export const checkOrderLimit = async (userId?: string): Promise<{ allowed: boolean; remaining: number }> => {
  // ВРЕМЕННО отключено до создания индекса в Firestore
  return { allowed: true, remaining: MAX_ORDERS_PER_DAY };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (!isFirebaseConfigured || !ordersCollection || !db) {
    // Fallback to localStorage
    const orders = getLocalOrders();
    const todayOrders = orders.filter(o => {
      const orderDate = new Date(o.date);
      return orderDate >= today && orderDate < tomorrow;
    });

    // Для незалогиненых проверяем по email/телефону из localStorage
    const remaining = Math.max(0, MAX_ORDERS_PER_DAY - todayOrders.length);
    return { allowed: remaining > 0, remaining };
  }

  try {
    // Запрос заказов за сегодня
    const startOfDay = Timestamp.fromDate(today);
    const endOfDay = Timestamp.fromDate(tomorrow);

    let q;
    if (userId) {
      q = query(
        ordersCollection,
        where('orderData.userId', '==', userId),
        where('createdAt', '>=', startOfDay),
        where('createdAt', '<', endOfDay)
      );
    } else {
      // Для незалогиненых пользователей используем localStorage
      const orders = getLocalOrders();
      const todayOrders = orders.filter(o => {
        const orderDate = new Date(o.date);
        return orderDate >= today && orderDate < tomorrow;
      });
      const remaining = Math.max(0, MAX_ORDERS_PER_DAY - todayOrders.length);
      return { allowed: remaining > 0, remaining };
    }

    const snapshot = await getDocs(q);
    const todayOrderCount = snapshot.size;
    const remaining = Math.max(0, MAX_ORDERS_PER_DAY - todayOrderCount);

    return { allowed: remaining > 0, remaining };
  } catch (error) {
    console.error('checkOrderLimit error:', error);
    // В случае ошибки разрешаем заказ (fail-open для UX)
    return { allowed: true, remaining: MAX_ORDERS_PER_DAY };
  }
};
