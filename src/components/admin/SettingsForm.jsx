import { Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSettings } from '../../hooks/useSettings';
import { settingsService } from '../../services/settingsService';
import { formatFirebaseWriteError } from '../../utils/firebaseErrors';

export default function SettingsForm() {
  const { settings, syncing, error, reload } = useSettings();
  const [form, setForm] = useState({
    themeMode: settings.themeMode || 'light',
    whatsappOrderNumber: settings.whatsappOrderNumber || '',
  });
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    setForm({
      themeMode: settings.themeMode || 'light',
      whatsappOrderNumber: settings.whatsappOrderNumber || '',
    });
  }, [settings.themeMode, settings.whatsappOrderNumber]);

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFeedback('');

    try {
      await settingsService.save({
        themeMode: form.themeMode,
        whatsappOrderNumber: form.whatsappOrderNumber.replace(/\D/g, ''),
      });
      setFeedback('Configuración actualizada.');
      await reload();
    } catch (err) {
      console.error('Error guardando configuración', err);
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
          <h1>Configuración</h1>
        </div>
      </div>

      {syncing && <div className="admin-inline-sync"><span /> Sincronizando configuración...</div>}
      {error && <div className="admin-error">{error}</div>}
      {feedback && <div className="admin-feedback">{feedback}</div>}

      <form className="admin-panel admin-form settings-simple settings-visual-only" onSubmit={save}>
        <section className="settings-section settings-section--visual-mode">
          <div>
            <strong>Modo visual</strong>
            <span>Elegí la apariencia del menú público. El cambio queda guardado en Firebase.</span>
          </div>

          <div className="theme-toggle-admin" role="group" aria-label="Modo visual">
            <button
              type="button"
              className={form.themeMode === 'light' ? 'is-active' : ''}
              aria-pressed={form.themeMode === 'light'}
              onClick={() => setForm({ ...form, themeMode: 'light' })}
            >
              Claro
            </button>
            <button
              type="button"
              className={form.themeMode === 'dark' ? 'is-active' : ''}
              aria-pressed={form.themeMode === 'dark'}
              onClick={() => setForm({ ...form, themeMode: 'dark' })}
            >
              Oscuro
            </button>
          </div>
        </section>

        <section className="settings-section">
          <div>
            <strong>Número de WhatsApp para recibir pedidos</strong>
            <span>Usá formato internacional sin signos. Ej: 595981123456.</span>
          </div>
          <label>
            WhatsApp pedidos
            <input
              inputMode="numeric"
              value={form.whatsappOrderNumber}
              onChange={(event) => setForm({ ...form, whatsappOrderNumber: event.target.value })}
              placeholder="595981123456"
            />
          </label>
        </section>

        <button className="admin-primary-button" type="submit" disabled={saving}>
          <Save size={18} /> {saving ? 'Guardando...' : 'Guardar configuración'}
        </button>
      </form>
    </div>
  );
}
