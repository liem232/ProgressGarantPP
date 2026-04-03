import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '@/lib/firebase';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'manager' | 'admin';
  firstName?: string;
  lastName?: string;
  phone?: string;
  photoURL?: string;
}

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  register: (userData: RegisterData) => Promise<boolean>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isUser: boolean;
  isLoading: boolean;
  error: string | null;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAIL = 'admin@progressgarant.ru';
const MANAGER_EMAILS = ['manager@progressgarant.ru'];

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user from Firebase Auth on mount
  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      // Fallback to localStorage if Firebase not configured
      const savedUser = localStorage.getItem('progressgarant_user');
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch {
          localStorage.removeItem('progressgarant_user');
        }
      }
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);

      if (fbUser) {
        // Fetch additional user data from Firestore
        const userDocRef = doc(db!, 'users', fbUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data() as Omit<User, 'id'>;
          setUser({
            id: fbUser.uid,
            ...userData,
          });
        } else {
          // Determine role based on email
          let role: User['role'] = 'user';
          if (fbUser.email === ADMIN_EMAIL) {
            role = 'admin';
          } else if (MANAGER_EMAILS.includes(fbUser.email || '')) {
            role = 'manager';
          }

          // Create user document in Firestore so security rules can rely on it.
          // This is safe because the user is creating their own document (owner).
          const userDocData: Omit<User, 'id'> = {
            username: fbUser.displayName || fbUser.email?.split('@')[0] || '',
            email: fbUser.email || '',
            role,
          };
          try {
            await setDoc(userDocRef, userDocData);
          } catch (e) {
            // If rules prevent creation for some reason, we still keep local user state.
            console.error('Failed to create user document:', e);
          }
          
          // Fallback to basic user info if no Firestore doc
          setUser({
            id: fbUser.uid,
            ...userDocData,
          });
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setError(null);

    if (!isFirebaseConfigured || !auth) {
      // Fallback to localStorage if Firebase not configured
      const savedUsers = JSON.parse(localStorage.getItem('progressgarant_users') || '[]');
      const foundUser = savedUsers.find((u: any) => u.email === email && u.password === password);
      if (foundUser) {
        const { password: _, ...userWithoutPassword } = foundUser;
        setUser(userWithoutPassword);
        localStorage.setItem('progressgarant_user', JSON.stringify(userWithoutPassword));
        return true;
      }
      setError('Неверный email или пароль');
      return false;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (err: any) {
      setError(err.message || 'Ошибка входа');
      return false;
    }
  };

  const register = async (userData: RegisterData): Promise<boolean> => {
    setError(null);

    if (!isFirebaseConfigured || !auth || !db) {
      // Fallback to localStorage
      const users = JSON.parse(localStorage.getItem('progressgarant_users') || '[]');
      if (users.some((u: any) => u.username === userData.username || u.email === userData.email)) {
        setError('Пользователь с таким email или username уже существует');
        return false;
      }
      const newUser = {
        ...userData,
        id: Date.now().toString(),
        role: 'user' as User['role'],
      };
      users.push(newUser);
      localStorage.setItem('progressgarant_users', JSON.stringify(users));
      return true;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
      const fbUser = userCredential.user;

      // Determine role based on email
      let role: User['role'] = 'user';
      if (userData.email === ADMIN_EMAIL) {
        role = 'admin';
      } else if (MANAGER_EMAILS.includes(userData.email)) {
        role = 'manager';
      }

      // Create user document in Firestore
      const userDoc: Omit<User, 'id'> = {
        username: userData.username,
        email: userData.email,
        role,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
      };

      await setDoc(doc(db, 'users', fbUser.uid), userDoc);
      return true;
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Пользователь с таким email уже существует');
      } else {
        setError(err.message || 'Ошибка регистрации');
      }
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    if (!isFirebaseConfigured || !auth) {
      setUser(null);
      localStorage.removeItem('progressgarant_user');
      return;
    }

    try {
      await signOut(auth);
    } catch (err: any) {
      setError(err.message || 'Ошибка выхода');
    }
  };

  const value: AuthContextType = {
    user,
    firebaseUser,
    login,
    logout,
    register,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isManager: user?.role === 'manager' || user?.role === 'admin',
    isUser: user?.role === 'user',
    isLoading,
    error,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};