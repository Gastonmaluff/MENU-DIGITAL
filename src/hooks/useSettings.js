import { useCallback, useEffect, useRef, useState } from 'react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { demoSettings } from '../data/demoData';
import { db, isFirebaseConfigured } from '../firebase';

const SYNC_TIMEOUT_MS = 4500;

export const useSettings = () => {
  const [settings, setSettings] = useState(demoSettings);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(Boolean(isFirebaseConfigured && db));
  const [error, setError] = useState('');
  const [usingDemo, setUsingDemo] = useState(true);
  const receivedSnapshotRef = useRef(false);

  const load = useCallback(async () => {
    if (!isFirebaseConfigured || !db) {
      setSettings(demoSettings);
      setUsingDemo(true);
      setLoading(false);
      setSyncing(false);
      return;
    }
    setSyncing(true);
    setError('');
    try {
      const snapshot = await getDoc(doc(db, 'settings', 'main'));
      if (snapshot.exists()) {
        setSettings({ ...demoSettings, ...snapshot.data() });
        setUsingDemo(false);
      } else {
        setSettings(demoSettings);
        setUsingDemo(true);
      }
    } catch (err) {
      setError(err.message);
      setSettings(demoSettings);
      setUsingDemo(true);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured || !db) {
      setSyncing(false);
      return undefined;
    }

    receivedSnapshotRef.current = false;
    setSyncing(true);
    const timeoutId = window.setTimeout(() => {
      if (!receivedSnapshotRef.current) {
        setError('Firebase está tardando en responder. Se mantiene la apariencia local.');
        setSyncing(false);
      }
    }, SYNC_TIMEOUT_MS);

    const unsubscribe = onSnapshot(
      doc(db, 'settings', 'main'),
      (snapshot) => {
        receivedSnapshotRef.current = true;
        window.clearTimeout(timeoutId);
        if (snapshot.exists()) {
          setSettings({ ...demoSettings, ...snapshot.data() });
          setUsingDemo(false);
        } else {
          setSettings(demoSettings);
          setUsingDemo(true);
        }
        setError('');
        setLoading(false);
        setSyncing(false);
      },
      (err) => {
        receivedSnapshotRef.current = true;
        window.clearTimeout(timeoutId);
        console.error(err);
        setError(err.message);
        setSettings(demoSettings);
        setUsingDemo(true);
        setLoading(false);
        setSyncing(false);
      },
    );

    return () => {
      window.clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  return { settings, setSettings, loading, syncing, error, usingDemo, reload: load };
};
