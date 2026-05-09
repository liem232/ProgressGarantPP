import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
  DocumentData,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';

export interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string;
  order: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

const COLLECTION_NAME = 'categories';

const categoriesCollection = isFirebaseConfigured && db
  ? collection(db, COLLECTION_NAME)
  : null;

// Fallback to localStorage
const getLocalCategories = (): Category[] => {
  const data = localStorage.getItem('progressgarant_categories');
  return data ? JSON.parse(data) : [];
};

const saveLocalCategories = (categories: Category[]) => {
  localStorage.setItem('progressgarant_categories', JSON.stringify(categories));
};

// Default categories data (соответствуют Index.tsx)
const defaultCategoriesData: Omit<Category, 'id'>[] = [
  { name: 'Кальяны', slug: 'hookahs', image: '/img/catalog1.jpg', order: 1 },
  { name: 'Табак', slug: 'tobacco', image: '/img/catalog2.jpg', order: 2 },
  { name: 'Бестабачные', slug: 'herbal', image: '/img/catalog3.jpg', order: 3 },
  { name: 'Электронные', slug: 'electronic', image: '/img/catalog4.jpg', order: 4 },
  { name: 'Чаши', slug: 'bowls', image: '/img/catalog5.jpg', order: 5 },
  { name: 'Аксессуары', slug: 'accessories', image: '/img/catalog6.png', order: 6 },
  { name: 'Уголь', slug: 'charcoal', image: '/img/catalog7.jpg', order: 7 },
  { name: 'Мундштуки', slug: 'mouthpieces', image: '/img/catalog8.jpg', order: 8 },
];

// Initialize default categories
const initializeDefaultCategories = async (): Promise<Category[]> => {
  if (!isFirebaseConfigured || !categoriesCollection || !db) {
    // Fallback to localStorage
    const localCategories = getLocalCategories();
    if (localCategories.length === 0) {
      const categoriesWithIds = defaultCategoriesData.map((cat, index) => ({
        ...cat,
        id: (index + 1).toString(),
      }));
      saveLocalCategories(categoriesWithIds);
      return categoriesWithIds;
    }
    return localCategories;
  }

  // Firestore mode - seed default categories
  try {
    const createdCategories: Category[] = [];
    for (const catData of defaultCategoriesData) {
      const docRef = await addDoc(categoriesCollection, {
        ...catData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      createdCategories.push({
        ...catData,
        id: docRef.id,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    }
    console.log('Created default categories:', createdCategories.length);
    return createdCategories;
  } catch (error) {
    console.error('Error creating default categories:', error);
    return [];
  }
};

// Get all categories
export const getCategories = async (): Promise<Category[]> => {
  if (!isFirebaseConfigured || !categoriesCollection || !db) {
    // Fallback to localStorage
    const categories = await initializeDefaultCategories();
    return categories.sort((a, b) => a.order - b.order);
  }

  try {
    // Check if Firestore is empty and seed default categories
    const snapshot = await getDocs(categoriesCollection);
    if (snapshot.empty) {
      console.log('Categories collection is empty, initializing defaults...');
      // Seed default categories
      return await initializeDefaultCategories();
    }

    // Простая выборка без orderBy (чтобы не требовать индекс)
    const categories = snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data(),
    })) as Category[];
    
    // Сортировка на клиенте
    return categories.sort((a, b) => a.order - b.order);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};

// Get category by ID
export const getCategoryById = async (id: string): Promise<Category | null> => {
  if (!isFirebaseConfigured || !db) {
    const categories = getLocalCategories();
    return categories.find(c => c.id === id) || null;
  }

  const docRef = doc(db, COLLECTION_NAME, id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;

  const data = docSnap.data() as DocumentData;
  return {
    id: docSnap.id,
    ...data,
  } as Category;
};

// Create category
export const createCategory = async (categoryData: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<Category> => {
  if (!isFirebaseConfigured || !categoriesCollection || !db) {
    const categories = getLocalCategories();
    const newCategory: Category = {
      ...categoryData,
      id: Date.now().toString(),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    categories.push(newCategory);
    saveLocalCategories(categories);
    return newCategory;
  }

  const docRef = await addDoc(categoriesCollection, {
    ...categoryData,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  const newCategory: Category = {
    id: docRef.id,
    ...categoryData,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  return newCategory;
};

// Update category
export const updateCategory = async (id: string, updates: Partial<Category>): Promise<void> => {
  if (!isFirebaseConfigured || !db) {
    const categories = getLocalCategories();
    const index = categories.findIndex(c => c.id === id);
    if (index !== -1) {
      categories[index] = { ...categories[index], ...updates, updatedAt: Timestamp.now() };
      saveLocalCategories(categories);
    }
    return;
  }

  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  });
};

// Delete category
export const deleteCategory = async (id: string): Promise<void> => {
  if (!isFirebaseConfigured || !db) {
    const categories = getLocalCategories();
    const filtered = categories.filter(c => c.id !== id);
    saveLocalCategories(filtered);
    return;
  }

  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
};

// Get category by slug
export const getCategoryBySlug = async (slug: string): Promise<Category | null> => {
  if (!isFirebaseConfigured || !categoriesCollection || !db) {
    const categories = getLocalCategories();
    return categories.find(c => c.slug === slug) || null;
  }

  try {
    const q = query(categoriesCollection, where('slug', '==', slug));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    const docSnap = snapshot.docs[0];
    const data = docSnap.data() as DocumentData;
    return {
      id: docSnap.id,
      ...data,
    } as Category;
  } catch (error) {
    console.error('Error fetching category by slug:', error);
    return null;
  }
};
