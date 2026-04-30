import { collection, getDocs, doc, getDoc, setDoc, updateDoc as firebaseUpdateDoc, deleteDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';

export const getCollection = async (collectionName: string) => {
  if (!isFirebaseConfigured || !db) {
    console.warn('Firebase not configured, using fallback');
    return [];
  }

  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    const data: any[] = [];
    querySnapshot.forEach((doc) => {
      data.push({ id: doc.id, ...doc.data() });
    });
    return data;
  } catch (error) {
    console.error('Error getting collection:', error);
    return [];
  }
};

export const getDocById = async (collectionName: string, docId: string) => {
  if (!isFirebaseConfigured || !db) {
    console.warn('Firebase not configured, using fallback');
    return null;
  }

  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting document:', error);
    return null;
  }
};

export const updateDoc = async (collectionName: string, docId: string, data: any) => {
  if (!isFirebaseConfigured || !db) {
    console.warn('Firebase not configured, using fallback');
    return;
  }

  try {
    const docRef = doc(db, collectionName, docId);
    await firebaseUpdateDoc(docRef, data);
  } catch (error) {
    console.error('Error updating document:', error);
    throw error;
  }
};

export const createDoc = async (collectionName: string, docId: string, data: any) => {
  if (!isFirebaseConfigured || !db) {
    console.warn('Firebase not configured, using fallback');
    return;
  }

  try {
    const docRef = doc(db, collectionName, docId);
    await setDoc(docRef, data);
  } catch (error) {
    console.error('Error creating document:', error);
    throw error;
  }
};

export const deleteDocument = async (collectionName: string, docId: string) => {
  if (!isFirebaseConfigured || !db) {
    console.warn('Firebase not configured, using fallback');
    return;
  }

  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
};
