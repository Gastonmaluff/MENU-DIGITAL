import { Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSettings } from '../../hooks/useSettings';
import { settingsService } from '../../services/settingsService';
import { formatFirebaseWriteError } from '../../utils/firebaseErrors';

export default function SettingsForm() {
  const { settings, syncing, error, reload } = useSettings();
  const [form, setForm] = useState({ themeMode: settings.themeMode || 'light' });
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    setForm({ themeMode: settings.themeMode || 'light' });
  }, [settings.themeMode]);

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFeedback('');

    try {
      await settingsService.save({ themeMode: form.themeMode });
      setFeedback('Modo visual actualizado.');
      await reload();
    } catch (err) {
      console.error('Error guardando configuracion', err);
      setFeedback(formatFirebaseWriteError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <span>General</span>
          <h1>Configuracion</h1>
        </div>
      </div>

      {syncing && <div className="admin-inline-sync"><span /> Sincronizando configuracion...</div>}
      {error && <div className="admin-error">{error}</div>}
      {feedback && <div className="admin-feedback">{feedback}</div>}

      <form className="admin-panel admin-form settings-simple settings-visual-only" onSubmit={save}>
        <section className="settings-section settings-section--visual-mode">
          <div>
            <strong>Modo visual</strong>
            <span>Elegi la apariencia del menu publico. El cambio queda guardado en Firebase.</span>
          </div>

          <div className="theme-toggle-admin" role="group" aria-label="Modo visual">
            <button
              type="button"
              className={form.themeMode === 'light' ? 'is-active' : ''}
              aria-pressed={form.themeMode === 'light'}
              onClick={() => setForm({ themeMode: 'light' })}
            >
              Claro
            </button>
            <button
              type="button"
              className={form.themeMode === 'dark' ? 'is-active' : ''}
              aria-pressed={form.themeMode === 'dark'}
              onClick={() => setForm({ themeMode: 'dark' })}
            >
              Oscuro
            </button>
          </div>
        </section>

        <button className="admin-primary-button" type="submit" disabled={saving}>
          <Save size={18} /> {saving ? 'Guardando...' : 'Guardar modo visual'}
        </button>
      </form>
    </div>
  );
}
