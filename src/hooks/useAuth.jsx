import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { auth, db, isFirebaseConfigured } from '../firebase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(Boolean(isFirebaseConfigured));
  const [authReady, setAuthReady] = useState(!isFirebaseConfigured);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');

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
      setProfile(null);
      setProfileLoading(Boolean(nextUser));
      setProfileError('');
      setLoading(false);
      setAuthReady(true);
    });
    return () => {
      window.clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user || !db) {
      setProfile(null);
      setProfileLoading(false);
      setProfileError('');
      return undefined;
    }

    setProfileLoading(true);
    setProfileError('');

    const unsubscribe = onSnapshot(
      doc(db, 'users', user.uid),
      (snapshot) => {
        setProfile(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null);
        setProfileLoading(false);
      },
      (error) => {
        console.error('Error cargando perfil de usuario', error);
        setProfile(null);
        setProfileError(error.message);
        setProfileLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user]);

  const value = useMemo(
    () => ({
      user,
      profile,
      role: profile?.role || null,
      profileLoading,
      profileError,
      loading,
      authReady,
      login: (email, password) => signInWithEmailAndPassword(auth, email, password),
      logout: () => signOut(auth),
      isReady: isFirebaseConfigured,
    }),
    [user, profile, profileLoading, profileError, loading, authReady],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
