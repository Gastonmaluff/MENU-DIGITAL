import { Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSettings } from '../../hooks/useSettings';
import { settingsService } from '../../services/settingsService';
import ImageUploader from './ImageUploader';

export default function SettingsForm() {
  const { settings, loading, error, usingDemo, reload } = useSettings();
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
      {error && <div className="admin-error">{error}</div>}
      {feedback && <div className="admin-feedback">{feedback}</div>}
      {loading ? 'Cargando...' : (
        <form className="admin-panel admin-form" onSubmit={save}>
          <div className="form-grid">
            <label>Marca<input value={form.brandName} onChange={(event) => setForm({ ...form, brandName: event.target.value })} /></label>
            <label>Subtítulo<input value={form.brandSubtitle} onChange={(event) => setForm({ ...form, brandSubtitle: event.target.value })} /></label>
            <label>Título del menú<input value={form.menuTitle} onChange={(event) => setForm({ ...form, menuTitle: event.target.value })} /></label>
            <label>Subtítulo del menú<input value={form.menuSubtitle} onChange={(event) => setForm({ ...form, menuSubtitle: event.target.value })} /></label>
          </div>
          <ImageUploader label="Logo" value={form.logoUrl} onChange={(url) => setForm({ ...form, logoUrl: url })} folder="settings" />
          <div className="form-grid">
            <label>Fondo claro<input type="color" value={form.backgroundColor} onChange={(event) => setForm({ ...form, backgroundColor: event.target.value })} /></label>
            <label>Fondo oscuro<input type="color" value={form.darkBackgroundColor} onChange={(event) => setForm({ ...form, darkBackgroundColor: event.target.value })} /></label>
          </div>
          <label className="admin-checkbox"><input type="checkbox" checked={form.showFooter} onChange={(event) => setForm({ ...form, showFooter: event.target.checked })} /> Mostrar footer</label>
          <label>Texto footer<textarea value={form.footerText} onChange={(event) => setForm({ ...form, footerText: event.target.value })} /></label>
          <button className="admin-primary-button" type="submit" disabled={saving}>
            <Save size={18} /> {saving ? 'Guardando...' : 'Guardar configuración'}
          </button>
        </form>
      )}
    </div>
  );
}
