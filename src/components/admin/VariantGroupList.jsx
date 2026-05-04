import { Edit3, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useVariantGroups } from '../../hooks/useVariantGroups';
import { variantService } from '../../services/variantService';
import { formatFirebaseWriteError } from '../../utils/firebaseErrors';
import { formatPrice } from '../../utils/format';

const emptyGroup = {
  name: '',
  type: 'single',
  required: false,
  active: true,
  sortOrder: 1,
  options: [{ id: '', name: '', priceModifier: 0, active: true }],
};

export default function VariantGroupList() {
  const { items, syncing, error, usingDemo, reload } = useVariantGroups();
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');

  const save = async (payload) => {
    setSaving(true);
    setFeedback('');
    try {
      if (payload.id) await variantService.update(payload.id, payload);
      else await variantService.create(payload);
      setEditing(null);
      setFeedback('Grupo de variantes guardado.');
      await reload();
    } catch (err) {
      console.error('Error guardando variantes', err);
      setFeedback(formatFirebaseWriteError(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (group) => {
    if (!confirm(`Eliminar grupo "${group.name}"?`)) return;
    try {
      await variantService.remove(group.id);
      setFeedback('Grupo eliminado.');
      reload();
    } catch (err) {
      console.error('Error eliminando variantes', err);
      setFeedback(formatFirebaseWriteError(err));
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div><span>CRUD</span><h1>Variantes</h1></div>
        <button className="admin-primary-button" type="button" onClick={() => setEditing(emptyGroup)}>
          <Plus size={18} /> Nuevo grupo
        </button>
      </div>
      {usingDemo && <div className="admin-warning">Estás viendo variantes demo. Creá un grupo para guardar en Firestore.</div>}
      {syncing && <div className="admin-inline-sync"><span /> Sincronizando variantes...</div>}
      {error && <div className="admin-error">{error}</div>}
      {feedback && <div className="admin-feedback">{feedback}</div>}
      {editing && <VariantGroupForm group={editing} saving={saving} onCancel={() => setEditing(null)} onSave={save} />}
      <section className="admin-list">
        {items.map((group) => (
          <article className="admin-list-item" key={group.id}>
            <div>
              <strong>{group.name}</strong>
              <span>{group.type} · {group.required ? 'obligatoria' : 'opcional'} · {(group.options || []).length} opciones</span>
              <small>{(group.options || []).map((option) => `${option.name}${option.priceModifier ? ` +${formatPrice(option.priceModifier)}` : ''}`).join(' · ')}</small>
            </div>
            <div className="admin-actions">
              <button type="button" onClick={() => setEditing(group)}><Edit3 size={17} /></button>
              <button type="button" onClick={() => remove(group)}><Trash2 size={17} /></button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

function VariantGroupForm({ group, saving, onCancel, onSave }) {
  const [form, setForm] = useState(group);

  const setOption = (index, field, value) => {
    setForm({
      ...form,
      options: form.options.map((option, optionIndex) =>
        optionIndex === index ? { ...option, [field]: value } : option,
      ),
    });
  };

  const submit = (event) => {
    event.preventDefault();
    onSave({ ...form, options: form.options.filter((option) => option.name.trim()) });
  };

  return (
    <form className="admin-panel admin-form" onSubmit={submit}>
      <div className="form-grid">
        <label>Nombre<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label>
        <label>Tipo<select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>
          <option value="single">Selección única</option>
          <option value="multiple">Selección múltiple</option>
        </select></label>
        <label>Orden<input type="number" value={form.sortOrder || 0} onChange={(event) => setForm({ ...form, sortOrder: event.target.value })} /></label>
      </div>
      <div className="admin-switch-row">
        <label className="admin-checkbox"><input type="checkbox" checked={form.required} onChange={(event) => setForm({ ...form, required: event.target.checked })} /> Obligatoria</label>
        <label className="admin-checkbox"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} /> Activa</label>
      </div>
      <fieldset>
        <legend>Opciones</legend>
        {form.options.map((option, index) => (
          <div className="variant-option-row" key={option.id || index}>
            <input placeholder="Nombre" value={option.name} onChange={(event) => setOption(index, 'name', event.target.value)} />
            <input type="number" placeholder="Precio adicional" value={option.priceModifier} onChange={(event) => setOption(index, 'priceModifier', event.target.value)} />
            <label><input type="checkbox" checked={option.active} onChange={(event) => setOption(index, 'active', event.target.checked)} /> Activa</label>
            <button type="button" onClick={() => setForm({ ...form, options: form.options.filter((_, optionIndex) => optionIndex !== index) })}>Quitar</button>
          </div>
        ))}
        <button className="admin-secondary-button" type="button" onClick={() => setForm({ ...form, options: [...form.options, { id: '', name: '', priceModifier: 0, active: true }] })}>Agregar opción</button>
      </fieldset>
      <div className="admin-form-actions">
        <button className="admin-secondary-button" type="button" onClick={onCancel}>Cancelar</button>
        <button className="admin-primary-button" type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar grupo'}</button>
      </div>
    </form>
  );
}
