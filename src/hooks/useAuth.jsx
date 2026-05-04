import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { auth, isFirebaseConfigured } from '../firebase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(isFirebaseConfigured));
  const [authReady, setAuthReady] = useState(!isFirebaseConfigured);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      setAuthReady(true);
      return undefined;
    }
    const timeoutId = window.setTimeout(() => {
      setLoading(false);
      setAuthReady(true);
    }, 1800);
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      window.clearTimeout(timeoutId);
      setUser(nextUser);
      setLoading(false);
      setAuthReady(true);
    });
    return () => {
      window.clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      authReady,
      login: (email, password) => signInWithEmailAndPassword(auth, email, password),
      logout: () => signOut(auth),
      isReady: isFirebaseConfigured,
    }),
    [user, loading, authReady],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
