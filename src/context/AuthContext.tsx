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

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      // Clean up previous listener
      if (unsubscribeDoc) {
        unsubscribeDoc();
        unsubscribeDoc = null;
      }

      setUser(currentUser);
      
      if (currentUser) {
        const userRef = doc(db, "users", currentUser.uid);
        const today = new Date().toISOString().split('T')[0];
        
        try {
          const userDoc = await getDoc(userRef);
          
          if (!userDoc.exists()) {
            const newData = {
              userId: currentUser.uid,
              email: currentUser.email,
              isPremium: false,
              totalUsage: 0,
              createdAt: new Date().toISOString(),
            };
            await setDoc(userRef, newData);
          }

          // Start listening
          unsubscribeDoc = onSnapshot(userRef, (doc) => {
            if (doc.exists()) {
              setUserData(doc.data());
              setLoading(false); // Only stop loading when we have real data
            }
          }, (err) => {
            console.error("Firestore error in AuthContext:", err);
            setLoading(false);
          });

        } catch (err) {
          console.error("Error ensuring user profile:", err);
          setLoading(false);
        }
      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, userData, loading, isAdmin: false }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
