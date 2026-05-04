import { useCallback, useEffect, useState } from 'react';
import { isFirebaseConfigured } from '../firebase';
import { sortByOrder } from '../utils/format';

export const useAsyncCollection = (service, fallback = []) => {
  const [items, setItems] = useState(fallback);
  const [loading, setLoading] = useState(Boolean(isFirebaseConfigured));
  const [error, setError] = useState('');
  const [usingDemo, setUsingDemo] = useState(false);

  const load = useCallback(async () => {
    if (!isFirebaseConfigured) {
      setItems(sortByOrder(fallback));
      setUsingDemo(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await service.list();
      if (data.length === 0 && fallback.length > 0) {
        setItems(sortByOrder(fallback));
        setUsingDemo(true);
      } else {
        setItems(sortByOrder(data));
        setUsingDemo(false);
      }
    } catch (err) {
      setError(err.message);
      setItems(sortByOrder(fallback));
      setUsingDemo(true);
    } finally {
      setLoading(false);
    }
  }, [fallback, service]);

  useEffect(() => {
    load();
  }, [load]);

  return { items, setItems, loading, error, usingDemo, reload: load };
};
