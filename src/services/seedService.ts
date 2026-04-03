import { writeBatch, doc } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { mockProducts } from "@/data/products";
import type { Product } from "@/contexts/CartContext";

export const seedProducts = async (): Promise<{ total: number } > => {
  if (!isFirebaseConfigured || !db) {
    throw new Error("Firebase is not configured");
  }

  const batch = writeBatch(db);

  (mockProducts as Product[]).forEach((p) => {
    const { id, ...rest } = p;
    batch.set(doc(db, "products", String(id)), rest);
  });

  await batch.commit();
  return { total: mockProducts.length };
};
