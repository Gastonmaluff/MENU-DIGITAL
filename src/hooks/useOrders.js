import { useCallback, useEffect, useMemo, useState } from 'react';
import { collection, getDocs, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase';

const ORDERS_COLLECTION = 'orders';
const SYNC_TIMEOUT_MS = 4500;

export const useOrders = () => {
  const ordersQuery = useMemo(() => {
    if (!isFirebaseConfigured || !db) return null;
    return query(collection(db, ORDERS_COLLECTION), orderBy('createdAt', 'desc'));
  }, []);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(Boolean(ordersQuery));
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!ordersQuery) {
      setItems([]);
      setLoading(false);
      setSyncing(false);
      return;
    }

    setSyncing(true);
    setError('');
    try {
      const snapshot = await getDocs(ordersQuery);
      setItems(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
    } catch (err) {
      setError(err.message);
      setItems([]);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, [ordersQuery]);

  useEffect(() => {
    if (!ordersQuery) {
      setSyncing(false);
      return undefined;
    }

    setSyncing(true);
    const timeoutId = window.setTimeout(() => {
      setError('Firebase esta tardando en responder. No se pudieron sincronizar los pedidos.');
      setSyncing(false);
    }, SYNC_TIMEOUT_MS);

    const unsubscribe = onSnapshot(
      ordersQuery,
      (snapshot) => {
        window.clearTimeout(timeoutId);
        setItems(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
        setError('');
        setLoading(false);
        setSyncing(false);
      },
      (err) => {
        window.clearTimeout(timeoutId);
        console.error(err);
        setError(err.message);
        setItems([]);
        setLoading(false);
        setSyncing(false);
      },
    );

    return () => {
      window.clearTimeout(timeoutId);
      unsubscribe();
    };
  }, [ordersQuery]);

  return { items, setItems, loading, syncing, error, reload: load };
};
