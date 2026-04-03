import {
  collection,
  addDoc,
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

const ordersCollection = isFirebaseConfigured && db
  ? collection(db, COLLECTION_NAME)
  : null;

// Fallback to localStorage
const getLocalOrders = (): Order[] => {
  const data = localStorage.getItem('progressgarant_orders');
  return data ? JSON.parse(data) : [];
};

const saveLocalOrders = (orders: Order[]) => {
  localStorage.setItem('progressgarant_orders', JSON.stringify(orders));
};

export const createOrder = async (orderData: Omit<Order, 'id'>): Promise<Order> => {
  if (!isFirebaseConfigured || !ordersCollection) {
    // Fallback to localStorage
    const orders = getLocalOrders();
    const newOrder: Order = {
      ...orderData,
      id: Date.now().toString(),
      date: new Date().toISOString(),
    };
    orders.push(newOrder);
    saveLocalOrders(orders);
    return newOrder;
  }

  const docRef = await addDoc(ordersCollection, {
    ...orderData,
    createdAt: Timestamp.now(),
  });

  return {
    ...orderData,
    id: docRef.id,
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
  if (!isFirebaseConfigured || !db) {
    const orders = getLocalOrders();
    const index = orders.findIndex(o => o.id === orderId);
    if (index !== -1) {
      orders[index].status = status;
      saveLocalOrders(orders);
    }
    return;
  }

  const docRef = doc(db, COLLECTION_NAME, orderId);
  await updateDoc(docRef, { status });
};
