import { Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSettings } from '../../hooks/useSettings';
import { settingsService } from '../../services/settingsService';
import ImageUploader from './ImageUploader';

export default function SettingsForm() {
  const { settings, syncing, error, usingDemo, reload } = useSettings();
  const [form, setForm] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFeedback('');
    try {
      await settingsService.save(form);
      setFeedback('Configuración guardada.');
      await reload();
    } catch (err) {
      setFeedback(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div><span>General</span><h1>Configuración</h1></div>
      </div>
      {usingDemo && <div className="admin-warning">Al guardar se creará el documento `settings/main`.</div>}
      {syncing && <div className="admin-inline-sync"><span /> Sincronizando configuración...</div>}
      {error && <div className="admin-error">{error}</div>}
      {feedback && <div className="admin-feedback">{feedback}</div>}
      <form className="admin-panel admin-form settings-simple" onSubmit={save}>
        <section className="settings-section">
          <div>
            <strong>Logo del negocio</strong>
            <span>Usá PNG transparente para que se integre mejor al menú.</span>
          </div>
          <ImageUploader label="Subir o reemplazar logo" value={form.logoUrl} onChange={(url) => setForm({ ...form, logoUrl: url })} folder="settings" />
        </section>

        <section className="settings-section">
          <div>
            <strong>Modo visual</strong>
            <span>Este cambio se aplica a la vista pública.</span>
          </div>
          <div className="theme-toggle-admin">
            <button type="button" className={form.themeMode === 'light' ? 'is-active' : ''} onClick={() => setForm({ ...form, themeMode: 'light' })}>Claro</button>
            <button type="button" className={form.themeMode === 'dark' ? 'is-active' : ''} onClick={() => setForm({ ...form, themeMode: 'dark' })}>Oscuro</button>
          </div>
        </section>

        <section className="settings-section">
          <div>
            <strong>Textos principales</strong>
            <span>Solo lo esencial para mantener la composición limpia.</span>
          </div>
          <div className="form-grid">
            <label>Marca<input value={form.brandName} onChange={(event) => setForm({ ...form, brandName: event.target.value })} /></label>
            <label>Subtítulo<input value={form.brandSubtitle} onChange={(event) => setForm({ ...form, brandSubtitle: event.target.value })} /></label>
            <label>Título del menú<input value={form.menuTitle} onChange={(event) => setForm({ ...form, menuTitle: event.target.value })} /></label>
            <label>Subtítulo del menú<input value={form.menuSubtitle} onChange={(event) => setForm({ ...form, menuSubtitle: event.target.value })} /></label>
          </div>
        </section>

        <button className="admin-primary-button" type="submit" disabled={saving}>
          <Save size={18} /> {saving ? 'Guardando...' : 'Guardar configuración'}
        </button>
      </form>
    </div>
  );
}
