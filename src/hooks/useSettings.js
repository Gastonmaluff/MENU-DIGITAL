import { useCallback, useEffect, useState } from 'react';
import { defaultSettings } from '../data/demoData';
import { isFirebaseConfigured } from '../firebase';
import { settingsService } from '../services/settingsService';

export const useSettings = () => {
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(Boolean(isFirebaseConfigured));
  const [error, setError] = useState('');
  const [usingDemo, setUsingDemo] = useState(false);

  const load = useCallback(async () => {
    if (!isFirebaseConfigured) {
      setSettings(defaultSettings);
      setUsingDemo(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const nextSettings = await settingsService.get();
      setSettings(nextSettings);
      setUsingDemo(false);
    } catch (err) {
      setError(err.message);
      setSettings(defaultSettings);
      setUsingDemo(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { settings, setSettings, loading, error, usingDemo, reload: load };
};
