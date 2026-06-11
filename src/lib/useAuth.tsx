import { useState, useEffect, createContext, useContext } from 'react';
import type { User } from 'firebase/auth';
import { GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}

export function useAuthProvider(): AuthContextType {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return auth.onAuthStateChanged(async (u) => {
      setUser(u);
      if (u) {
        await setDoc(
          doc(db, 'users', u.uid),
          { displayName: u.displayName, email: u.email, photoURL: u.photoURL },
          { merge: true }
        );
      }
      setLoading(false);
    });
  }, []);

  const signIn = async () => {
    await signInWithPopup(auth, new GoogleAuthProvider());
  };

  const signOut = () => firebaseSignOut(auth);

  return { user, loading, signIn, signOut };
}
