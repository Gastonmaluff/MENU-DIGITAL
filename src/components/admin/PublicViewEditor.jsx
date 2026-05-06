import {
  CheckCircle2,
  Edit3,
  Eye,
  EyeOff,
  GripVertical,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useCategories } from '../../hooks/useCategories';
import { useProducts } from '../../hooks/useProducts';
import { categoryService } from '../../services/categoryService';
import { productService } from '../../services/productService';
import { formatFirebaseWriteError } from '../../utils/firebaseErrors';
import { formatPrice, slugify } from '../../utils/format';
import ImageUploader from './ImageUploader';
import ProductThumbnail from './ProductThumbnail';

const iconOptions = ['Coffee', 'Snowflake', 'Wheat', 'CakeSlice', 'Leaf', 'CupSoda'];

const emptyCategory = {
  name: '',
  slug: '',
  icon: 'Coffee',
  sortOrder: 1,
  active: true,
};

const emptyProduct = {
  name: '',
  categoryId: '',
  price: 0,
  shortDescription: '',
  description: '',
  imageUrl: '',
  featuredImageUrl: '',
  active: true,
  featured: false,
  sortOrder: 1,
  visualOptions: {
    lactoseFree: false,
    plantBased: false,
  },
  suggestedProductIds: [],
  variantGroupIds: [],
  tags: [],
};

export default function PublicViewEditor() {
  const { user } = useAuth();
  const { items: categories, syncing: syncingCategories, error: categoriesError, usingDemo: demoCategories, reload: reloadCategories } = useCategories();
  const { items: products, syncing: syncingProducts, error: productsError, usingDemo: demoProducts, reload: reloadProducts } = useProducts();
  const [activeCategoryId, setActiveCategoryId] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const productFormRef = useRef(null);
  const productNameInputRef = useRef(null);

  const activeCategory = categories.find((category) => category.id === activeCategoryId) || categories[0];
  const categoryProducts = useMemo(
    () => products.filter((product) => product.categoryId === activeCategory?.id),
    [products, activeCategory?.id],
  );

  const saveCategory = async (payload) => {
    if (!user) {
      setFeedback('No tenés permisos para guardar. Iniciá sesión como administrador.');
      return;
    }
    setSaving(true);
    setFeedback('');
    try {
      const data = {
        ...payload,
        slug: payload.slug || slugify(payload.name),
        sortOrder: Number(payload.sortOrder || 0),
      };
      if (payload.id) await categoryService.update(payload.id, data);
      else await categoryService.create(data);
      setEditingCategory(null);
      setFeedback('Categoría guardada.');
      await reloadCategories();
    } catch (err) {
      console.error('Error guardando categoría', err);
      setFeedback(formatFirebaseWriteError(err));
    } finally {
      setSaving(false);
    }
  };

  const saveProduct = async (payload) => {
    if (!user) {
      setFeedback('No tenés permisos para guardar. Iniciá sesión como administrador.');
      return;
    }
    setSaving(true);
    setFeedback('');
    try {
      const data = {
        ...payload,
        categoryId: payload.categoryId || activeCategory?.id,
        tags: [],
        variantGroupIds: [],
        suggestedProductIds: payload.suggestedProductIds || [],
      };
      if (payload.id) await productService.update(payload.id, data);
      else await productService.create(data);
      setEditingProduct(null);
      setFeedback('Producto guardado. La vista pública se actualizará automáticamente.');
      await reloadProducts();
    } catch (err) {
      console.error('Error guardando producto', err);
      setFeedback(formatFirebaseWriteError(err));
    } finally {
      setSaving(false);
    }
  };

  const removeCategory = async (category) => {
    if (!confirm(`Eliminar categoría "${category.name}"?`)) return;
    setFeedback('');
    try {
      await categoryService.remove(category.id);
      setFeedback('Categoría eliminada.');
      await reloadCategories();
    } catch (err) {
      console.error('Error eliminando categoría', err);
      setFeedback(formatFirebaseWriteError(err));
    }
  };

  const removeProduct = async (product) => {
    if (!confirm(`Eliminar producto "${product.name}"?`)) return;
    setFeedback('');
    try {
      await productService.remove(product.id);
      setFeedback('Producto eliminado.');
      await reloadProducts();
    } catch (err) {
      console.error('Error eliminando producto', err);
      setFeedback(formatFirebaseWriteError(err));
    }
  };

  const focusProductForm = useCallback(() => {
    window.setTimeout(() => {
      productFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      productNameInputRef.current?.focus({ preventScroll: true });
    }, 80);
  }, []);

  const openProductEditor = useCallback((product) => {
    setEditingProduct(product);
    focusProductForm();
  }, [focusProductForm]);

  return (
    <div className="admin-page editor-page">
      <div className="admin-page-header">
        <div>
          <span>Contenido</span>
          <h1>Editar vista pública</h1>
        </div>
        <button
          className="admin-primary-button"
          type="button"
          onClick={() => setEditingCategory({ ...emptyCategory, sortOrder: categories.length + 1 })}
        >
          <Plus size={18} /> Nueva categoría
        </button>
      </div>

      {(demoCategories || demoProducts) && (
        <div className="admin-warning">Estás viendo datos demo si Firestore está vacío. Al guardar, se persiste en Firebase.</div>
      )}
      {(syncingCategories || syncingProducts) && <div className="admin-inline-sync"><span /> Sincronizando contenido...</div>}
      {(categoriesError || productsError) && <div className="admin-error">{categoriesError || productsError}</div>}
      {feedback && <div className="admin-feedback">{feedback}</div>}
      {!user && <div className="admin-error">No hay una sesión admin activa. Volvé a iniciar sesión para guardar cambios.</div>}

      <div className="editor-layout">
        <aside className="editor-categories admin-panel">
          <div className="editor-panel-title">
            <strong>Categorías</strong>
            <span>{categories.length} en total</span>
          </div>
          <div className="editor-category-list">
            {categories.map((category) => (
              <button
                type="button"
                key={category.id}
                className={`editor-category-item ${category.id === activeCategory?.id ? 'is-active' : ''}`}
                onClick={() => setActiveCategoryId(category.id)}
              >
                <GripVertical size={15} />
                <span>{category.name}</span>
                {category.active ? <Eye size={15} /> : <EyeOff size={15} />}
              </button>
            ))}
          </div>
        </aside>

        <section className="editor-main">
          {activeCategory && (
            <div className="admin-panel editor-toolbar">
              <div>
                <span>Categoría seleccionada</span>
                <h2>{activeCategory.name}</h2>
              </div>
              <div className="admin-actions">
                <button type="button" onClick={() => setEditingCategory(activeCategory)}><Edit3 size={17} /></button>
                <button type="button" onClick={() => removeCategory(activeCategory)}><Trash2 size={17} /></button>
              </div>
            </div>
          )}

          {editingCategory && (
            <CategoryEditor
              category={editingCategory}
              saving={saving}
              onCancel={() => setEditingCategory(null)}
              onSave={saveCategory}
            />
          )}

          {activeCategory && (
            <div className="admin-panel">
              <div className="editor-panel-title">
                <div>
                  <strong>Productos de {activeCategory.name}</strong>
                  <span>Editá imagen, precio, destacado y opciones visuales.</span>
                </div>
                <button
                  className="admin-primary-button"
                  type="button"
                  onClick={() =>
                    openProductEditor({
                      ...emptyProduct,
                      categoryId: activeCategory.id,
                      sortOrder: categoryProducts.length + 1,
                    })
                  }
                >
                  <Plus size={18} /> Nuevo producto
                </button>
              </div>

              <div className="editor-product-list">
                {categoryProducts.map((product) => (
                  <article className="editor-product-row" key={product.id}>
                    <ProductThumbnail product={product} />
                    <div>
                      <strong>{product.name}</strong>
                      <span>{product.shortDescription || 'Sin subtítulo'} · {formatPrice(product.price)}</span>
                    </div>
                    {product.featured && <span className="admin-mini-badge editor-badge"><Sparkles size={14} /> destacado</span>}
                    <div className="admin-actions">
                      <button type="button" onClick={() => openProductEditor(product)}><Edit3 size={17} /></button>
                      <button type="button" onClick={() => removeProduct(product)}><Trash2 size={17} /></button>
                    </div>
                  </article>
                ))}
                {categoryProducts.length === 0 && (
                  <div className="admin-empty-inline">Todavía no hay productos en esta categoría.</div>
                )}
              </div>
            </div>
          )}

          {editingProduct && (
            <div id="product-form" ref={productFormRef} className="product-form-anchor">
              <ProductEditor
                product={editingProduct}
                saving={saving}
                nameInputRef={productNameInputRef}
                onCancel={() => setEditingProduct(null)}
                onSave={saveProduct}
              />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function CategoryEditor({ category, saving, onCancel, onSave }) {
  const [form, setForm] = useState(category);

  const submit = (event) => {
    event.preventDefault();
    onSave({ ...form, slug: form.slug || slugify(form.name) });
  };

  return (
    <form className="admin-panel admin-form compact-editor" onSubmit={submit}>
      <div className="editor-panel-title">
        <strong>{form.id ? 'Editar categoría' : 'Nueva categoría'}</strong>
      </div>
      <div className="form-grid">
        <label>Nombre<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label>
        <label>Orden<input type="number" value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: event.target.value })} /></label>
        <label>Icono
          <select value={form.icon} onChange={(event) => setForm({ ...form, icon: event.target.value })}>
            {iconOptions.map((icon) => <option key={icon} value={icon}>{icon}</option>)}
          </select>
        </label>
        <label>Slug<input value={form.slug || slugify(form.name)} onChange={(event) => setForm({ ...form, slug: event.target.value })} /></label>
      </div>
      <label className="admin-checkbox"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} /> Visible en el menú</label>
      <div className="admin-form-actions">
        <button className="admin-secondary-button" type="button" onClick={onCancel}>Cancelar</button>
        <button className="admin-primary-button" type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar categoría'}</button>
      </div>
    </form>
  );
}

function ProductEditor({ product, saving, nameInputRef, onCancel, onSave }) {
  const [pendingUploads, setPendingUploads] = useState(0);
  const [imageUploadError, setImageUploadError] = useState('');
  const [form, setForm] = useState({
    ...product,
    visualOptions: {
      lactoseFree: Boolean(product.visualOptions?.lactoseFree || product.optionFlags?.deslactosado),
      plantBased: Boolean(product.visualOptions?.plantBased || product.optionFlags?.vegetal),
    },
  });

  const submit = (event) => {
    event.preventDefault();
    if (pendingUploads > 0 || imageUploadError) return;
    onSave(form);
  };

  const setUploadActive = useCallback((active) => {
    setPendingUploads((count) => Math.max(0, count + (active ? 1 : -1)));
  }, []);

  const updateImageField = (field, url) => {
    setImageUploadError('');
    setForm({ ...form, [field]: url });
  };

  const setVisualOption = (key, value) => {
    setForm({
      ...form,
      visualOptions: {
        ...form.visualOptions,
        [key]: value,
      },
    });
  };

  return (
    <form className="admin-panel admin-form product-editor-form" onSubmit={submit}>
      <div className="editor-panel-title">
        <div>
          <strong>{form.id ? `Editar ${form.name}` : 'Nuevo producto'}</strong>
          <span>Estos datos se reflejan en la vista pública.</span>
        </div>
      </div>
      <div className="form-grid">
        <label>Nombre<input ref={nameInputRef} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label>
        <label>Precio<input type="number" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} /></label>
        <label>Orden<input type="number" value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: event.target.value })} /></label>
        <label>Subtítulo<input value={form.shortDescription} onChange={(event) => setForm({ ...form, shortDescription: event.target.value })} /></label>
      </div>
      <label>Descripción<textarea value={form.description || ''} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
      <div className="form-grid">
        <ImageUploader
          label="Imagen principal PNG/JPG"
          value={form.imageUrl}
          onChange={(url) => updateImageField('imageUrl', url)}
          onUploadingChange={setUploadActive}
          onError={(error) => setImageUploadError(error.message)}
        />
        <ImageUploader
          label="Imagen destacada opcional"
          value={form.featuredImageUrl}
          onChange={(url) => updateImageField('featuredImageUrl', url)}
          onUploadingChange={setUploadActive}
          onError={(error) => setImageUploadError(error.message)}
        />
      </div>
      {imageUploadError && <small className="admin-error-text">{imageUploadError}</small>}
      <section className="editor-options-box">
        <div>
          <strong>Opciones visuales</strong>
          <span>Se muestran como íconos discretos en el menú público.</span>
        </div>
        <label className="admin-checkbox"><input type="checkbox" checked={form.visualOptions.lactoseFree} onChange={(event) => setVisualOption('lactoseFree', event.target.checked)} /> Deslactosado</label>
        <label className="admin-checkbox"><input type="checkbox" checked={form.visualOptions.plantBased} onChange={(event) => setVisualOption('plantBased', event.target.checked)} /> Vegetal</label>
      </section>
      <div className="admin-switch-row">
        <label className="admin-checkbox"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} /> Visible</label>
        <label className="admin-checkbox"><input type="checkbox" checked={form.featured} onChange={(event) => setForm({ ...form, featured: event.target.checked })} /> Producto destacado</label>
      </div>
      <div className="admin-form-actions">
        <button className="admin-secondary-button" type="button" onClick={onCancel}>Cancelar</button>
        <button className="admin-primary-button" type="submit" disabled={saving || pendingUploads > 0 || Boolean(imageUploadError)}>
          <CheckCircle2 size={18} /> {pendingUploads > 0 ? 'Subiendo imagen...' : saving ? 'Guardando...' : 'Guardar producto'}
        </button>
      </div>
    </form>
  );
}
