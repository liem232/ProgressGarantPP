import { getDocs, collection } from "firebase/firestore";
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
