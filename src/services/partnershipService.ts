import { collection, addDoc, getDocs, doc, updateDoc, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';

export interface PartnershipRequest {
  id?: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  companyName: string;
  contactPerson: string;
  address: string;
  businessType: string;
  experience: string;
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  adminComment?: string;
  createdAt: Timestamp;
  reviewedAt?: Timestamp;
  reviewedBy?: string;
}

export const createPartnershipRequest = async (request: Omit<PartnershipRequest, 'id' | 'createdAt' | 'status'>): Promise<string | null> => {
  if (!isFirebaseConfigured || !db) {
    console.warn('Firebase not configured, using fallback');
    return null;
  }

  try {
    const docRef = await addDoc(collection(db, 'partnershipRequests'), {
      ...request,
      status: 'pending',
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating partnership request:', error);
    return null;
  }
};

export const getPartnershipRequests = async (): Promise<PartnershipRequest[]> => {
  if (!isFirebaseConfigured || !db) {
    console.warn('Firebase not configured, using fallback');
    return [];
  }

  try {
    const q = query(
      collection(db, 'partnershipRequests'),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const requests: PartnershipRequest[] = [];
    querySnapshot.forEach((doc) => {
      requests.push({ id: doc.id, ...doc.data() } as PartnershipRequest);
    });
    return requests;
  } catch (error) {
    console.error('Error getting partnership requests:', error);
    return [];
  }
};

export const updatePartnershipRequest = async (
  requestId: string,
  updates: Partial<PartnershipRequest>
): Promise<boolean> => {
  if (!isFirebaseConfigured || !db) {
    console.warn('Firebase not configured, using fallback');
    return false;
  }

  try {
    const docRef = doc(db, 'partnershipRequests', requestId);
    await updateDoc(docRef, {
      ...updates,
      reviewedAt: Timestamp.now(),
    });
    return true;
  } catch (error) {
    console.error('Error updating partnership request:', error);
    return false;
  }
};

export const approvePartnershipRequest = async (
  requestId: string,
  userId: string,
  adminId: string,
  adminComment?: string
): Promise<boolean> => {
  if (!isFirebaseConfigured || !db) {
    console.warn('Firebase not configured, using fallback');
    return false;
  }

  try {
    // Обновляем заявку
    const docRef = doc(db, 'partnershipRequests', requestId);
    await updateDoc(docRef, {
      status: 'approved',
      adminComment,
      reviewedAt: Timestamp.now(),
      reviewedBy: adminId,
    });

    // Обновляем пользователя - делаем его партнером
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      isPartner: true,
      partnerApprovedAt: Timestamp.now(),
    });

    return true;
  } catch (error) {
    console.error('Error approving partnership request:', error);
    return false;
  }
};

export const rejectPartnershipRequest = async (
  requestId: string,
  adminId: string,
  adminComment?: string
): Promise<boolean> => {
  if (!isFirebaseConfigured || !db) {
    console.warn('Firebase not configured, using fallback');
    return false;
  }

  try {
    const docRef = doc(db, 'partnershipRequests', requestId);
    await updateDoc(docRef, {
      status: 'rejected',
      adminComment,
      reviewedAt: Timestamp.now(),
      reviewedBy: adminId,
    });
    return true;
  } catch (error) {
    console.error('Error rejecting partnership request:', error);
    return false;
  }
};

export const getUserPartnershipRequest = async (userId: string): Promise<PartnershipRequest | null> => {
  if (!isFirebaseConfigured || !db) {
    console.warn('Firebase not configured, using fallback');
    return null;
  }

  try {
    const q = query(
      collection(db, 'partnershipRequests'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as PartnershipRequest;
    }
    return null;
  } catch (error) {
    console.error('Error getting user partnership request:', error);
    return null;
  }
};

export const revokePartnership = async (
  userId: string,
  adminId: string,
  adminComment?: string
): Promise<boolean> => {
  if (!isFirebaseConfigured || !db) {
    console.warn('Firebase not configured, using fallback');
    return false;
  }

  try {
    // Убираем статус партнера у пользователя
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      isPartner: false,
      partnerApprovedAt: null,
    });

    // Обновляем заявку на партнерство (если есть)
    const q = query(
      collection(db, 'partnershipRequests'),
      where('userId', '==', userId),
      where('status', '==', 'approved')
    );
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      await updateDoc(doc.ref, {
        status: 'rejected',
        adminComment: adminComment || 'Партнерство разорвано администратором',
        reviewedAt: Timestamp.now(),
        reviewedBy: adminId,
      });
    }

    return true;
  } catch (error) {
    console.error('Error revoking partnership:', error);
    return false;
  }
};
