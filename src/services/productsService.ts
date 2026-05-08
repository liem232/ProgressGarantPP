import { getDocs, collection, doc, updateDoc } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { mockProducts } from "@/data/products";
import type { Product } from "@/contexts/CartContext";

export type { Product };

export const getProducts = async (): Promise<Product[]> => {
  if (!isFirebaseConfigured || !db) {
    return mockProducts as Product[];
  }

  const snapshot = await getDocs(collection(db, "products"));
  return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Product, "id">) }));
};

export const updateProduct = async (id: string, updates: Partial<Product>): Promise<void> => {
  if (!isFirebaseConfigured || !db) {
    // Для локальной разработки - обновляем mockProducts
    const productIndex = mockProducts.findIndex(p => p.id === id);
    if (productIndex !== -1) {
      Object.assign(mockProducts[productIndex], updates);
    }
    return;
  }

  const docRef = doc(db, "products", id);
  await updateDoc(docRef, updates);
};
