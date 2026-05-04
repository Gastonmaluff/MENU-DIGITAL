import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { collection, getDocs, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase';
import { sortByOrder } from '../utils/format';

const SYNC_TIMEOUT_MS = 4500;

export const useAsyncCollection = (collectionName, fallback = [], options = {}) => {
  const { orderField = 'sortOrder' } = options;
  const fallbackItems = useMemo(() => sortByOrder(fallback), [fallback]);
  const firestoreQuery = useMemo(() => {
    if (!isFirebaseConfigured || !db) return null;
    const ref = collection(db, collectionName);
    return orderField ? query(ref, orderBy(orderField, 'asc')) : query(ref);
  }, [collectionName, orderField]);
  const [items, setItems] = useState(fallbackItems);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(Boolean(firestoreQuery));
  const [error, setError] = useState('');
  const [usingDemo, setUsingDemo] = useState(true);
  const receivedSnapshotRef = useRef(false);

  const load = useCallback(async () => {
    if (!firestoreQuery) {
      setItems(fallbackItems);
      setUsingDemo(true);
      setLoading(false);
      setSyncing(false);
      return;
    }

    setSyncing(true);
    setError('');
    try {
      const snapshot = await getDocs(firestoreQuery);
      if (snapshot.empty) {
        setItems(fallbackItems);
        setUsingDemo(true);
      } else {
        const data = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
        setItems(sortByOrder(data));
        setUsingDemo(false);
      }
    } catch (err) {
      setError(err.message);
      setItems(fallbackItems);
      setUsingDemo(true);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, [fallbackItems, firestoreQuery]);

  useEffect(() => {
    setItems(fallbackItems);
  }, [fallbackItems]);

  useEffect(() => {
    if (!firestoreQuery) {
      setSyncing(false);
      return undefined;
    }

    receivedSnapshotRef.current = false;
    setSyncing(true);
    const timeoutId = window.setTimeout(() => {
      if (!receivedSnapshotRef.current) {
        setError('Firebase está tardando en responder. Se mantiene el menú local.');
        setSyncing(false);
      }
    }, SYNC_TIMEOUT_MS);

    const unsubscribe = onSnapshot(
      firestoreQuery,
      (snapshot) => {
        receivedSnapshotRef.current = true;
        window.clearTimeout(timeoutId);
        if (!snapshot.empty) {
          const data = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
          setItems(sortByOrder(data));
          setUsingDemo(false);
        } else {
          setItems(fallbackItems);
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
        setItems(fallbackItems);
        setUsingDemo(true);
        setLoading(false);
        setSyncing(false);
      },
    );

    return () => {
      window.clearTimeout(timeoutId);
      unsubscribe();
    };
  }, [fallbackItems, firestoreQuery]);

  return { items, setItems, loading, syncing, error, usingDemo, reload: load };
};
