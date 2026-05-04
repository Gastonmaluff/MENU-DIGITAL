import { Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSettings } from '../../hooks/useSettings';
import { settingsService } from '../../services/settingsService';
import AdminPreview from './AdminPreview';
import ImageUploader from './ImageUploader';

export default function AppearanceForm() {
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
      setFeedback('Apariencia guardada.');
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
        <div><span>Diseño</span><h1>Apariencia</h1></div>
      </div>
      {usingDemo && <div className="admin-warning">La configuración aún no existe en Firestore. Al guardar se creará `settings/main`.</div>}
      {error && <div className="admin-error">{error}</div>}
      {feedback && <div className="admin-feedback">{feedback}</div>}
      {loading ? 'Cargando...' : (
        <div className="admin-two-column">
          <form className="admin-panel admin-form" onSubmit={save}>
            <div className="form-grid">
              <label>Modo
                <select value={form.themeMode} onChange={(event) => setForm({ ...form, themeMode: event.target.value })}>
                  <option value="light">Claro</option>
                  <option value="dark">Oscuro</option>
                </select>
              </label>
              <label>Color acento
                <input type="color" value={form.primaryColor} onChange={(event) => setForm({ ...form, primaryColor: event.target.value })} />
              </label>
              <label>Sombra de producto
                <select value={form.productShadowIntensity} onChange={(event) => setForm({ ...form, productShadowIntensity: event.target.value })}>
                  <option value="none">Sin sombra</option>
                  <option value="soft">Suave</option>
                  <option value="medium">Media</option>
                  <option value="strong">Fuerte</option>
                </select>
              </label>
              <label>Radio de bordes
                <select value={form.borderRadius} onChange={(event) => setForm({ ...form, borderRadius: event.target.value })}>
                  <option value="small">Pequeño</option>
                  <option value="medium">Medio</option>
                  <option value="large">Grande</option>
                </select>
              </label>
            </div>
            <div className="form-grid">
              <label>Marca<input value={form.brandName} onChange={(event) => setForm({ ...form, brandName: event.target.value })} /></label>
              <label>Subtítulo marca<input value={form.brandSubtitle} onChange={(event) => setForm({ ...form, brandSubtitle: event.target.value })} /></label>
              <label>Título menú<input value={form.menuTitle} onChange={(event) => setForm({ ...form, menuTitle: event.target.value })} /></label>
              <label>Subtítulo menú<input value={form.menuSubtitle} onChange={(event) => setForm({ ...form, menuSubtitle: event.target.value })} /></label>
            </div>
            <ImageUploader label="Logo opcional" value={form.logoUrl} onChange={(url) => setForm({ ...form, logoUrl: url })} folder="settings" />
            <label className="admin-checkbox"><input type="checkbox" checked={form.showFooter} onChange={(event) => setForm({ ...form, showFooter: event.target.checked })} /> Mostrar footer</label>
            <label>Texto footer<textarea value={form.footerText} onChange={(event) => setForm({ ...form, footerText: event.target.value })} /></label>
            <button className="admin-primary-button" type="submit" disabled={saving}>
              <Save size={18} /> {saving ? 'Guardando...' : 'Guardar apariencia'}
            </button>
          </form>
          <section className="admin-panel">
            <h2>Preview rápida</h2>
            <AdminPreview settings={form} />
          </section>
        </div>
      )}
    </div>
  );
}
