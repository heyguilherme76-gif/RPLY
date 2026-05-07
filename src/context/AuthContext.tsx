import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, onSnapshot, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

interface AuthContextType {
  user: User | null;
  userData: any | null;
  loading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  isAdmin: false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeDoc: (() => void) | null = null;
    let loadingTimeout: NodeJS.Timeout;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      // Clear timeout if auth changes
      if (loadingTimeout) clearTimeout(loadingTimeout);
      
      // Clean up previous listener
      if (unsubscribeDoc) {
        unsubscribeDoc();
        unsubscribeDoc = null;
      }

      setUser(currentUser);
      
      if (currentUser) {
        const userRef = doc(db, "users", currentUser.uid);
        
        // Start listening immediately
        unsubscribeDoc = onSnapshot(userRef, async (snapshot) => {
          if (snapshot.exists()) {
            setUserData(snapshot.data());
            setLoading(false);
          } else {
            // Document doesn't exist, try to create it but don't block
            setUserData(null);
            
            try {
              const newData = {
                userId: currentUser.uid,
                email: currentUser.email,
                isPremium: false,
                analises_usadas: 0,
                createdAt: new Date().toISOString(),
              };
              // Using setDoc here. Since we are inside onSnapshot, 
              // it will trigger another snapshot when done.
              await setDoc(userRef, newData);
            } catch (err) {
              console.error("Error creating user profile:", err);
              // If creation fails (e.g. permission denied), we should still stop loading
              setLoading(false);
            }
          }
        }, (err) => {
          console.error("Firestore error in AuthContext snapshot:", err);
          setLoading(false);
        });

        // Safety timeout to prevent infinite loading
        loadingTimeout = setTimeout(() => {
          setLoading(false);
        }, 8000);

      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
      if (loadingTimeout) clearTimeout(loadingTimeout);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, userData, loading, isAdmin: false }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
