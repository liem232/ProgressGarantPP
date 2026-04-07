import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  where,
  onSnapshot,
  Timestamp,
  DocumentData,
  doc,
  updateDoc,
  arrayUnion,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, isFirebaseConfigured } from '@/lib/firebase';

export interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  senderRole: 'user' | 'manager' | 'admin';
  timestamp: Timestamp;
  attachments?: ChatAttachment[];
  orderId?: string;
}

export interface ChatAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface ChatRoom {
  id: string;
  name: string;
  participants: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastMessage?: {
    text: string;
    senderName: string;
    timestamp: Timestamp;
  };
}

export interface ChatThread {
  id: string;
  type: 'user-manager' | 'staff';
  participantIds: string[];
  userId?: string;
  userName?: string;
  userEmail?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastMessage?: {
    text: string;
    senderId: string;
    senderName: string;
    senderRole: 'user' | 'manager' | 'admin';
    timestamp: Timestamp;
  };
}

export interface ChatConfig {
  defaultManagerId: string | null;
}

const MESSAGES_COLLECTION = 'chatMessages';
const ROOMS_COLLECTION = 'chatRooms';

const THREADS_COLLECTION = 'chatThreads';

const APP_CONFIG_COLLECTION = 'appConfig';
const CHAT_CONFIG_DOC = 'chat';

export const getChatConfig = async (): Promise<ChatConfig> => {
  if (!isFirebaseConfigured || !db) {
    return { defaultManagerId: null };
  }

  try {
    const cfgRef = doc(db, APP_CONFIG_COLLECTION, CHAT_CONFIG_DOC);
    const snap = await getDoc(cfgRef);
    if (!snap.exists()) {
      return { defaultManagerId: null };
    }
    const data = snap.data() as any;
    return {
      defaultManagerId: typeof data.defaultManagerId === 'string' ? data.defaultManagerId : null,
    };
  } catch (error) {
    console.error('Error fetching chat config:', error);
    return { defaultManagerId: null };
  }
};

const messagesCollection = isFirebaseConfigured && db
  ? collection(db, MESSAGES_COLLECTION)
  : null;

const roomsCollection = isFirebaseConfigured && db
  ? collection(db, ROOMS_COLLECTION)
  : null;

const threadsCollection = isFirebaseConfigured && db
  ? collection(db, THREADS_COLLECTION)
  : null;

// Fallback storage for when Firebase is not configured
let localMessages: ChatMessage[] = [];
let localRooms: ChatRoom[] = [];
let localThreads: ChatThread[] = [];

export const createChatRoom = async (
  name: string,
  participants: string[]
): Promise<ChatRoom | null> => {
  if (!isFirebaseConfigured || !roomsCollection || !db) {
    const room: ChatRoom = {
      id: Date.now().toString(),
      name,
      participants,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    localRooms.push(room);
    return room;
  }

  const roomDoc = await addDoc(roomsCollection, {
    name,
    participants,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  return {
    id: roomDoc.id,
    name,
    participants,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
};

export const getChatRooms = async (): Promise<ChatRoom[]> => {
  if (!isFirebaseConfigured || !roomsCollection) {
    return localRooms;
  }

  const q = query(roomsCollection, orderBy('updatedAt', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(docSnap => {
    const data = docSnap.data() as DocumentData;
    return {
      id: docSnap.id,
      name: data.name,
      participants: data.participants || [],
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      lastMessage: data.lastMessage,
    } as ChatRoom;
  });
};

export const sendMessage = async (
  text: string,
  senderId: string,
  senderName: string,
  senderRole: 'user' | 'manager' | 'admin',
  attachments?: ChatAttachment[],
  orderId?: string
): Promise<ChatMessage | null> => {
  if (!isFirebaseConfigured || !messagesCollection || !db) {
    const message: ChatMessage = {
      id: Date.now().toString(),
      text,
      senderId,
      senderName,
      senderRole,
      timestamp: Timestamp.now(),
      attachments,
      orderId,
    };
    localMessages.push(message);
    return message;
  }

  const messageData = {
    text,
    senderId,
    senderName,
    senderRole,
    timestamp: Timestamp.now(),
    attachments: attachments || [],
    orderId: orderId || null,
  };

  const docRef = await addDoc(messagesCollection, messageData);

  return {
    id: docRef.id,
    ...messageData,
  };
};

export const getMessages = async (orderId?: string): Promise<ChatMessage[]> => {
  if (!isFirebaseConfigured || !messagesCollection) {
    let messages = localMessages;
    if (orderId) {
      messages = messages.filter(m => m.orderId === orderId);
    }
    return messages.sort((a, b) => a.timestamp.toMillis() - b.timestamp.toMillis());
  }

  let q;
  if (orderId) {
    q = query(
      messagesCollection,
      where('orderId', '==', orderId),
      orderBy('timestamp', 'asc')
    );
  } else {
    q = query(messagesCollection, orderBy('timestamp', 'asc'));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(docSnap => {
    const data = docSnap.data() as DocumentData;
    return {
      id: docSnap.id,
      text: data.text,
      senderId: data.senderId,
      senderName: data.senderName,
      senderRole: data.senderRole,
      timestamp: data.timestamp,
      attachments: data.attachments || [],
      orderId: data.orderId,
    } as ChatMessage;
  });
};

export const subscribeToMessages = (
  callback: (messages: ChatMessage[]) => void,
  orderId?: string
): (() => void) => {
  if (!isFirebaseConfigured || !messagesCollection) {
    // Return mock unsubscribe for fallback
    return () => {};
  }

  let q;
  if (orderId) {
    q = query(
      messagesCollection,
      where('orderId', '==', orderId),
      orderBy('timestamp', 'asc')
    );
  } else {
    q = query(messagesCollection, orderBy('timestamp', 'asc'));
  }

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(docSnap => {
      const data = docSnap.data() as DocumentData;
      return {
        id: docSnap.id,
        text: data.text,
        senderId: data.senderId,
        senderName: data.senderName,
        senderRole: data.senderRole,
        timestamp: data.timestamp,
        attachments: data.attachments || [],
        orderId: data.orderId,
      } as ChatMessage;
    });
    callback(messages);
  });
};

export const uploadFile = async (
  file: File,
  orderId?: string
): Promise<ChatAttachment | null> => {
  if (!isFirebaseConfigured || !storage) {
    // Fallback - create a fake attachment for demo
    return {
      id: Date.now().toString(),
      name: file.name,
      url: URL.createObjectURL(file),
      type: file.type,
      size: file.size,
    };
  }

  const fileName = `${Date.now()}_${file.name}`;
  const filePath = orderId
    ? `order_files/${orderId}/${fileName}`
    : `chat_files/${fileName}`;
  const storageRef = ref(storage, filePath);

  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);

  return {
    id: fileName,
    name: file.name,
    url: downloadURL,
    type: file.type,
    size: file.size,
  };
};

export const getAvailableManagers = async (): Promise<{id: string, name: string, email: string}[]> => {
  if (!isFirebaseConfigured || !db) {
    // Fallback для режима без Firebase
    return [];
  }

  try {
    // Получаем пользователей с ролью manager или admin
    const managersQuery = query(
      collection(db, 'users'),
      where('role', 'in', ['manager', 'admin'])
    );
    
    const snapshot = await getDocs(managersQuery);
    return snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        name: `${data.firstName || ''} ${data.lastName || ''}`.trim() || data.username || 'Менеджер',
        email: data.email || ''
      };
    });
  } catch (error) {
    console.error('Error fetching managers:', error);
    return [];
  }
};

const getThreadMessagesCollection = (threadId: string) => {
  if (!isFirebaseConfigured || !db) return null;
  return collection(db, THREADS_COLLECTION, threadId, 'messages');
};

export const getOrCreateUserManagerThread = async (
  userId: string,
  managerId: string,
  userName?: string,
  userEmail?: string
): Promise<ChatThread | null> => {
  if (!userId || !managerId) return null;

  const deterministicThreadId = `${userId}_${managerId}`;

  if (!isFirebaseConfigured || !threadsCollection || !db) {
    const existing = localThreads.find(
      (t) => t.type === 'user-manager' && t.userId === userId && t.participantIds.includes(managerId)
    );
    if (existing) return existing;

    const now = Timestamp.now();
    const thread: ChatThread = {
      id: deterministicThreadId,
      type: 'user-manager',
      participantIds: [userId, managerId],
      userId,
      userName,
      userEmail,
      createdAt: now,
      updatedAt: now,
    };
    localThreads.push(thread);
    return thread;
  }

  // Avoid Firestore composite index requirements by using a deterministic doc id.
  // This guarantees there is at most one thread per (userId, managerId).
  const threadRef = doc(db, THREADS_COLLECTION, deterministicThreadId);
  const existingSnap = await getDoc(threadRef);
  if (existingSnap.exists()) {
    const data = existingSnap.data() as DocumentData;

    // Backfill display fields for staff UI if the thread already exists.
    // Do this best-effort; ignore failures to avoid breaking chat.
    if ((userName || userEmail) && (!data.userName || !data.userEmail)) {
      const patch: Record<string, any> = {};
      if (userName && !data.userName) patch.userName = userName;
      if (userEmail && !data.userEmail) patch.userEmail = userEmail;
      if (Object.keys(patch).length > 0) {
        try {
          await updateDoc(threadRef, patch);
        } catch {
          // ignore
        }
      }
    }

    return {
      id: existingSnap.id,
      type: data.type,
      participantIds: data.participantIds || [],
      userId: data.userId,
      userName: typeof data.userName === 'string' ? data.userName : undefined,
      userEmail: typeof data.userEmail === 'string' ? data.userEmail : undefined,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      lastMessage: data.lastMessage || undefined,
    } as ChatThread;
  }

  const threadData = {
    type: 'user-manager' as const,
    participantIds: [userId, managerId],
    userId,
    userName: userName || null,
    userEmail: userEmail || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastMessage: null,
  };

  await setDoc(threadRef, threadData);

  // Do not depend on serverTimestamp() materialization for UI readiness.
  // Return a usable thread object immediately.
  const now = Timestamp.now();
  return {
    id: deterministicThreadId,
    type: 'user-manager',
    participantIds: [userId, managerId],
    userId,
    userName,
    userEmail,
    createdAt: now,
    updatedAt: now,
    lastMessage: undefined,
  } as ChatThread;
};

export const listUserManagerThreadsForStaff = async (participantId?: string): Promise<ChatThread[]> => {
  if (!isFirebaseConfigured || !threadsCollection) {
    const base = localThreads.filter((t) => t.type === 'user-manager');
    if (participantId) {
      return base
        .filter((t) => t.participantIds.includes(participantId))
        .sort((a, b) => b.updatedAt.toMillis() - a.updatedAt.toMillis());
    }
    return base.sort((a, b) => b.updatedAt.toMillis() - a.updatedAt.toMillis());
  }

  // Important: for managers we must query only threads where they participate,
  // otherwise security rules will prevent reading the whole collection.
  // Also avoid composite index requirements by sorting on the client.
  if (participantId) {
    const q = query(threadsCollection, where('participantIds', 'array-contains', participantId));
    const snapshot = await getDocs(q);
    const threads = snapshot.docs
      .map((docSnap) => {
        const data = docSnap.data() as DocumentData;
        return {
          id: docSnap.id,
          type: data.type,
          participantIds: data.participantIds || [],
          userId: data.userId,
          userName: typeof data.userName === 'string' ? data.userName : undefined,
          userEmail: typeof data.userEmail === 'string' ? data.userEmail : undefined,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          lastMessage: data.lastMessage || undefined,
        } as ChatThread;
      })
      .filter((t) => t.type === 'user-manager');

    return threads.sort((a, b) => b.updatedAt.toMillis() - a.updatedAt.toMillis());
  }

  // Admin use-case: list all user-manager threads.
  const q = query(threadsCollection, where('type', '==', 'user-manager'), orderBy('updatedAt', 'desc'));
  const snapshot = await getDocs(q);
  const threads = snapshot.docs.map((docSnap) => {
    const data = docSnap.data() as DocumentData;
    return {
      id: docSnap.id,
      type: data.type,
      participantIds: data.participantIds || [],
      userId: data.userId,
      userName: typeof data.userName === 'string' ? data.userName : undefined,
      userEmail: typeof data.userEmail === 'string' ? data.userEmail : undefined,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      lastMessage: data.lastMessage || undefined,
    } as ChatThread;
  });
  return threads;
};

// Staff threads: admin <-> manager direct communication
export const getOrCreateStaffThread = async (
  adminId: string,
  managerId: string
): Promise<ChatThread | null> => {
  if (!adminId || !managerId) return null;

  const sortedIds = [adminId, managerId].sort();
  const deterministicThreadId = `staff_${sortedIds[0]}_${sortedIds[1]}`;

  if (!isFirebaseConfigured || !threadsCollection || !db) {
    const existing = localThreads.find(
      (t) => t.type === 'staff' && t.participantIds.includes(adminId) && t.participantIds.includes(managerId)
    );
    if (existing) return existing;

    const now = Timestamp.now();
    const thread: ChatThread = {
      id: deterministicThreadId,
      type: 'staff',
      participantIds: sortedIds,
      createdAt: now,
      updatedAt: now,
    };
    localThreads.push(thread);
    return thread;
  }

  const threadRef = doc(db, THREADS_COLLECTION, deterministicThreadId);
  const existingSnap = await getDoc(threadRef);
  if (existingSnap.exists()) {
    const data = existingSnap.data() as DocumentData;
    return {
      id: existingSnap.id,
      type: data.type,
      participantIds: data.participantIds || [],
      userId: data.userId,
      userName: typeof data.userName === 'string' ? data.userName : undefined,
      userEmail: typeof data.userEmail === 'string' ? data.userEmail : undefined,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      lastMessage: data.lastMessage || undefined,
    } as ChatThread;
  }

  const threadData = {
    type: 'staff' as const,
    participantIds: sortedIds,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastMessage: null,
  };

  await setDoc(threadRef, threadData);

  const now = Timestamp.now();
  return {
    id: deterministicThreadId,
    type: 'staff',
    participantIds: sortedIds,
    createdAt: now,
    updatedAt: now,
    lastMessage: undefined,
  } as ChatThread;
};

export const listStaffThreadsForAdmin = async (adminId: string): Promise<ChatThread[]> => {
  if (!isFirebaseConfigured || !threadsCollection || !db) {
    return localThreads
      .filter((t) => t.type === 'staff' && t.participantIds.includes(adminId))
      .sort((a, b) => b.updatedAt.toMillis() - a.updatedAt.toMillis());
  }

  // Query all staff threads where admin participates
  const q = query(
    threadsCollection,
    where('type', '==', 'staff'),
    where('participantIds', 'array-contains', adminId)
  );
  const snapshot = await getDocs(q);
  const threads = snapshot.docs.map((docSnap) => {
    const data = docSnap.data() as DocumentData;
    return {
      id: docSnap.id,
      type: data.type,
      participantIds: data.participantIds || [],
      userId: data.userId,
      userName: typeof data.userName === 'string' ? data.userName : undefined,
      userEmail: typeof data.userEmail === 'string' ? data.userEmail : undefined,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      lastMessage: data.lastMessage || undefined,
    } as ChatThread;
  });
  return threads.sort((a, b) => b.updatedAt.toMillis() - a.updatedAt.toMillis());
};

export const sendThreadMessage = async (
  threadId: string,
  text: string,
  senderId: string,
  senderName: string,
  senderRole: 'user' | 'manager' | 'admin',
  attachments?: ChatAttachment[],
  orderId?: string
): Promise<ChatMessage | null> => {
  if (!threadId) return null;
  const trimmedText = (text || '').trim();
  const normalizedAttachments = attachments || [];
  if (!trimmedText && normalizedAttachments.length === 0) return null;

  if (!isFirebaseConfigured || !db) {
    const message: ChatMessage = {
      id: Date.now().toString(),
      text: trimmedText,
      senderId,
      senderName,
      senderRole,
      timestamp: Timestamp.now(),
      attachments: normalizedAttachments,
      orderId,
    };
    return message;
  }

  const threadMessages = getThreadMessagesCollection(threadId);
  if (!threadMessages) return null;

  const messageData = {
    text: trimmedText,
    senderId,
    senderName,
    senderRole,
    timestamp: serverTimestamp(),
    attachments: normalizedAttachments,
    orderId: orderId || null,
  };

  const docRef = await addDoc(threadMessages, messageData);

  const threadRef = doc(db, THREADS_COLLECTION, threadId);
  await updateDoc(threadRef, {
    updatedAt: serverTimestamp(),
    lastMessage: {
      text: trimmedText,
      senderId,
      senderName,
      senderRole,
      timestamp: serverTimestamp(),
    },
  });

  return {
    id: docRef.id,
    ...(messageData as any),
  } as ChatMessage;
};

export const subscribeToThreadMessages = (
  threadId: string,
  callback: (messages: ChatMessage[]) => void
): (() => void) => {
  if (!isFirebaseConfigured || !db) {
    return () => {};
  }

  const threadMessages = getThreadMessagesCollection(threadId);
  if (!threadMessages) return () => {};

  const q = query(threadMessages, orderBy('timestamp', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map((docSnap) => {
      const data = docSnap.data() as DocumentData;
      return {
        id: docSnap.id,
        text: data.text,
        senderId: data.senderId,
        senderName: data.senderName,
        senderRole: data.senderRole,
        timestamp: data.timestamp,
        attachments: data.attachments || [],
        orderId: data.orderId,
      } as ChatMessage;
    });
    callback(messages);
  });
};
