import { defaultSettings } from '../data/demoData';
import { getSettings, saveSettings } from './firestoreService';

export const settingsService = {
  get: async () => ({ ...defaultSettings, ...((await getSettings()) || {}) }),
  save: (payload) => saveSettings(payload),
};
