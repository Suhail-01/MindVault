'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  User, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Ensure user document exists in Firestore
          const userRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userRef);
          if (!userDoc.exists()) {
            await setDoc(userRef, {
              name: user.displayName || 'Anonymous',
              email: user.email || '',
              plan: 'free',
              preferences: { theme: 'light', notifications: true },
              created_at: new Date().toISOString(),
            });
          }
          setUser(user);
        } catch (error) {
          console.error('Firestore connection error in AuthProvider:', error);
          // Still set the user so they can see the app, but Firestore operations might fail
          setUser(user);
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const [authLoading, setAuthLoading] = useState(false);

  const signInWithGoogle = async () => {
    if (authLoading) return;
    setAuthLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (error.code === 'auth/cancelled-popup-request') {
        console.log('Sign-in popup already open or request cancelled.');
      } else {
        console.error('Error signing in with Google:', error);
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    setAuthLoading(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(result.user, { displayName: name });
      // Firestore document will be created by onAuthStateChanged listener
    } catch (error: any) {
      if (error.code === 'auth/operation-not-allowed') {
        const msg = 'Email/Password sign-up is not allowed. Please enable it in the Firebase Console: https://console.firebase.google.com/project/ai-studio-applet-webapp-78279/authentication/providers';
        console.error(msg);
        throw new Error(msg);
      }
      console.error('Error signing up with email:', error);
      throw error;
    } finally {
      setAuthLoading(false);
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    setAuthLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      console.error('Error signing in with email:', error);
      throw error;
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signUpWithEmail, signInWithEmail, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
