import { CheckCircle2, ClipboardList, Loader2, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCategories } from '../../hooks/useCategories';
import { useProducts } from '../../hooks/useProducts';
import { useSettings } from '../../hooks/useSettings';
import { orderService } from '../../services/orderService';
import { resolveAssetUrl } from '../../utils/assets';
import { formatPrice } from '../../utils/format';
import { buildOrderWhatsAppUrl, normalizeWhatsAppNumber } from '../../utils/orderWhatsApp';
import { getProductImageUrl } from '../../utils/productImages';
import ThemeWrapper from '../public/ThemeWrapper';

const CATEGORY_TARGETS = [
  { key: 'cafes', label: 'Cafés' },
  { key: 'iced-coffee', label: 'Iced Coffee' },
  { key: 'salados', label: 'Salados' },
  { key: 'dulces', label: 'Dulces' },
  { key: 'no-coffee', label: 'No Coffee' },
];

const QUICK_MODIFIERS = [
  'Sin azúcar',
  'Con azúcar',
  'Leche vegetal',
  'Extra shot',
  'Sin hielo',
  'Extra hielo',
  'Para llevar',
];

const MODIFIER_CATEGORY_KEYS = ['cafes', 'iced-coffee'];

const normalizeText = (value = '') =>
  value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

const findCategoryForTarget = (categories, target) =>
  categories.find((category) => {
    const candidates = [category.id, category.slug, category.name].map(normalizeText);
    return candidates.includes(target.key) || candidates.includes(normalizeText(target.label));
  });

const getProductCartKey = (product) => product.id;

const createCartItem = ({ product, category, cartKey, modifiers = [], note = '', acceptsModifiers = false }) => ({
  cartKey,
  productId: product.id,
  name: product.name,
  category,
  quantity: 1,
  unitPrice: Number(product.price || 0),
  subtotal: Number(product.price || 0),
  modifiers,
  note,
  acceptsModifiers,
});

export default function BaristaPanel() {
  const { settings, syncing: syncingSettings } = useSettings();
  const { items: categories, syncing: syncingCategories, error: categoriesError } = useCategories();
  const { items: products, syncing: syncingProducts, error: productsError } = useProducts();
  const [activeCategoryKey, setActiveCategoryKey] = useState(CATEGORY_TARGETS[0].key);
  const [cartItems, setCartItems] = useState([]);
  const [orderNote, setOrderNote] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [takeAway, setTakeAway] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [modifierSheet, setModifierSheet] = useState(null);

  const fixedCategories = CATEGORY_TARGETS.map((target) => ({
    ...target,
    category: findCategoryForTarget(categories, target),
  }));

  const activeCategory = fixedCategories.find((category) => category.key === activeCategoryKey);
  const activeCategoryId = activeCategory?.category?.id || '';
  const activeCategoryName = activeCategory?.category?.name || activeCategory?.label || '';
  const activeProducts = activeCategoryId
    ? products.filter((product) => product.active && product.categoryId === activeCategoryId)
    : [];
  const activeCategoryAcceptsModifiers = MODIFIER_CATEGORY_KEYS.includes(activeCategoryKey);

  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const total = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  const syncing = syncingCategories || syncingProducts || syncingSettings;
  const error = categoriesError || productsError;

  const addProduct = (product) => {
    setFeedback(null);
    const cartKey = getProductCartKey(product);
    setCartItems((current) => {
      const existing = current.find((item) => item.cartKey === cartKey);
      if (existing) {
        return current.map((item) =>
          item.cartKey === cartKey
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * item.unitPrice,
              }
            : item,
        );
      }

      return [
        ...current,
        createCartItem({
          product,
          category: activeCategoryName,
          cartKey,
          acceptsModifiers: activeCategoryAcceptsModifiers,
        }),
      ];
    });
  };

  const openNewModifierSheet = (product) => {
    setFeedback(null);
    setModifierSheet({
      mode: 'new',
      product,
      category: activeCategoryName,
      acceptsModifiers: activeCategoryAcceptsModifiers,
      modifiers: [],
      note: '',
    });
  };

  const openEditModifierSheet = (item) => {
    setFeedback(null);
    setModifierSheet({
      mode: 'edit',
      cartKey: item.cartKey,
      product: { id: item.productId, name: item.name, price: item.unitPrice },
      category: item.category,
      acceptsModifiers: item.acceptsModifiers,
      modifiers: item.modifiers || [],
      note: item.note || '',
    });
  };

  const toggleSheetModifier = (modifier) => {
    setModifierSheet((current) => {
      if (!current) return current;
      const modifiers = current.modifiers.includes(modifier)
        ? current.modifiers.filter((item) => item !== modifier)
        : [...current.modifiers, modifier];
      return { ...current, modifiers };
    });
  };

  const saveModifierSheet = () => {
    if (!modifierSheet) return;

    if (modifierSheet.mode === 'new') {
      const cartKey = `${modifierSheet.product.id}-${Date.now()}`;
      setCartItems((current) => [
        ...current,
        createCartItem({
          product: modifierSheet.product,
          category: modifierSheet.category,
          cartKey,
          modifiers: modifierSheet.modifiers,
          note: modifierSheet.note.trim(),
          acceptsModifiers: modifierSheet.acceptsModifiers,
        }),
      ]);
    } else {
      setCartItems((current) =>
        current.map((item) =>
          item.cartKey === modifierSheet.cartKey
            ? {
                ...item,
                modifiers: modifierSheet.modifiers,
                note: modifierSheet.note.trim(),
              }
            : item,
        ),
      );
    }

    setModifierSheet(null);
  };

  const updateQuantity = (cartKey, nextQuantity) => {
    setCartItems((current) =>
      current
        .map((item) => {
          if (item.cartKey !== cartKey) return item;
          const quantity = Math.max(0, nextQuantity);
          return {
            ...item,
            quantity,
            subtotal: quantity * item.unitPrice,
          };
        })
        .filter((item) => item.quantity > 0),
    );
  };

  const clearCart = () => {
    setCartItems([]);
    setOrderNote('');
    setCustomerName('');
    setTakeAway(false);
    setFeedback(null);
  };

  const confirmOrder = async () => {
    if (cartItems.length === 0 || saving) return;
    const whatsappNumber = normalizeWhatsAppNumber(settings.whatsappOrderNumber);
    const whatsappWindow = whatsappNumber ? window.open('', '_blank') : null;
    setSaving(true);
    setFeedback(null);

    try {
      const normalizedCustomerName = customerName.trim();
      const normalizedNote = orderNote.trim();
      const items = cartItems.map((item) => ({
        productId: item.productId,
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
        modifiers: item.modifiers,
        note: item.note,
      }));
      const result = await orderService.create({
        status: 'pendiente_pago',
        paymentStatus: 'pendiente',
        paymentMethod: null,
        customerName: normalizedCustomerName,
        takeAway,
        items,
        total,
        note: normalizedNote,
        createdBy: 'barista',
        source: 'barista_panel',
      });

      const whatsappUrl = buildOrderWhatsAppUrl(whatsappNumber, {
        orderNumber: result.orderNumber,
        customerName: normalizedCustomerName,
        takeAway,
        items,
        total,
        note: normalizedNote,
      });

      if (whatsappUrl && whatsappWindow) {
        whatsappWindow.location.href = whatsappUrl;
      } else if (whatsappWindow) {
        whatsappWindow.close();
      }

      setFeedback({
        type: 'success',
        orderNumber: result.orderNumber,
        customerName: normalizedCustomerName,
        takeAway,
        whatsappConfigured: Boolean(whatsappUrl),
        whatsappOpened: Boolean(whatsappUrl && whatsappWindow),
        whatsappUrl,
      });
      setCartItems([]);
      setOrderNote('');
      setCustomerName('');
      setTakeAway(false);
    } catch (err) {
      whatsappWindow?.close();
      console.error('Error creando pedido', err);
      setFeedback({ type: 'error', message: err.message || 'No se pudo crear el pedido.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ThemeWrapper settings={settings}>
      <main className="barista-page">
        <header className="barista-header">
          <div>
            <span>Nirvana</span>
            <h1>Barista</h1>
          </div>
          <div className="barista-header-actions">
            <Link className="barista-icon-link" to="/barista/orders" title="Ver pedidos" aria-label="Ver pedidos">
              <ClipboardList size={20} />
            </Link>
            <div className="barista-live-total" aria-label="Total actual">
              <ShoppingBag size={18} />
              <strong>{formatPrice(total)}</strong>
            </div>
          </div>
        </header>

        {feedback?.type === 'success' && (
          <section className="barista-confirmation" aria-live="polite">
            <CheckCircle2 size={20} />
            <span>
              Pedido #{feedback.orderNumber}{feedback.customerName ? ` · ${feedback.customerName}` : ''} creado
              {feedback.takeAway && <b>Para llevar</b>}
              {!feedback.whatsappConfigured && <small>No hay WhatsApp configurado para avisos.</small>}
              {feedback.whatsappConfigured && !feedback.whatsappOpened && feedback.whatsappUrl && (
                <a href={feedback.whatsappUrl} target="_blank" rel="noreferrer">Abrir WhatsApp</a>
              )}
            </span>
          </section>
        )}

        {feedback?.type === 'error' && (
          <section className="barista-error" aria-live="polite">
            {feedback.message}
          </section>
        )}

        {error && <section className="barista-error">No se pudo sincronizar el menú.</section>}
        {syncing && (
          <section className="barista-sync">
            <Loader2 size={18} />
            <span>Sincronizando menú...</span>
          </section>
        )}

        <nav className="barista-categories" aria-label="Categorías">
          {fixedCategories.map(({ key, label, category }) => (
            <button
              className={`barista-category ${activeCategoryKey === key ? 'is-active' : ''}`}
              type="button"
              key={key}
              disabled={!category}
              onClick={() => setActiveCategoryKey(key)}
            >
              {label}
            </button>
          ))}
        </nav>

        <section className="barista-products" aria-label={`Productos de ${activeCategory?.label || 'categoría'}`}>
          {activeProducts.map((product) => (
            <ProductQuickCard
              key={product.id}
              product={product}
              onAdd={() => addProduct(product)}
              onCustomize={() => openNewModifierSheet(product)}
            />
          ))}
          {!syncing && activeProducts.length === 0 && (
            <div className="barista-empty">No hay productos activos en esta categoría.</div>
          )}
        </section>

        <section className="barista-note">
          <label>
            Observación
            <textarea
              value={orderNote}
              onChange={(event) => setOrderNote(event.target.value)}
              placeholder="Ej: sin azúcar, separar bebidas"
            />
          </label>
        </section>

        <aside className="barista-cart" aria-label="Pedido actual">
          <div className="barista-cart-head">
            <div>
              <span>{itemCount} productos</span>
              <strong>{formatPrice(total)}</strong>
            </div>
            <button className="barista-clear" type="button" onClick={clearCart} disabled={cartItems.length === 0 || saving}>
              <Trash2 size={17} />
              Limpiar
            </button>
          </div>

          <div className="barista-order-options">
            <label className="barista-order-name">
              Nombre
              <input
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                placeholder="Juan, Mesa 2"
                maxLength={40}
              />
            </label>
            <button
              className={`barista-takeaway ${takeAway ? 'is-active' : ''}`}
              type="button"
              aria-pressed={takeAway}
              onClick={() => setTakeAway((value) => !value)}
            >
              Para llevar
            </button>
          </div>

          {cartItems.length > 0 && (
            <div className="barista-cart-items">
              {cartItems.map((item) => (
                <article className="barista-cart-item" key={item.cartKey}>
                  <div>
                    <strong>{item.name}</strong>
                    <span>{formatPrice(item.subtotal)}</span>
                    {(item.modifiers.length > 0 || item.note) && (
                      <small>{[...item.modifiers, item.note].filter(Boolean).join(' · ')}</small>
                    )}
                  </div>
                  <button className="barista-options" type="button" onClick={() => openEditModifierSheet(item)}>
                    Opciones
                  </button>
                  <QuantityStepper
                    quantity={item.quantity}
                    onDecrease={() => updateQuantity(item.cartKey, item.quantity - 1)}
                    onIncrease={() => updateQuantity(item.cartKey, item.quantity + 1)}
                  />
                </article>
              ))}
            </div>
          )}

          <button
            className="barista-confirm"
            type="button"
            onClick={confirmOrder}
            disabled={cartItems.length === 0 || saving || syncingSettings}
          >
            {saving ? (
              <>
                <Loader2 size={19} />
                Confirmando...
              </>
            ) : (
              <>
                <CheckCircle2 size={19} />
                Confirmar pedido
              </>
            )}
          </button>
        </aside>

        {modifierSheet && (
          <ModifierSheet
            sheet={modifierSheet}
            onClose={() => setModifierSheet(null)}
            onToggleModifier={toggleSheetModifier}
            onNoteChange={(note) => setModifierSheet((current) => ({ ...current, note }))}
            onSave={saveModifierSheet}
          />
        )}
      </main>
    </ThemeWrapper>
  );
}

function ProductQuickCard({ product, onAdd, onCustomize }) {
  const imageUrl = resolveAssetUrl(getProductImageUrl(product));

  return (
    <article className="barista-product-card">
      <button className="barista-product-main" type="button" onClick={onCustomize}>
        <span className="barista-product-image">
          {imageUrl ? <img src={imageUrl} alt="" loading="lazy" /> : <ShoppingBag size={22} />}
        </span>
        <span className="barista-product-copy">
          <strong>{product.name}</strong>
          <span>{formatPrice(product.price)}</span>
          <small>Ajustar</small>
        </span>
      </button>
      <button className="barista-add" type="button" onClick={onAdd} aria-label={`Agregar ${product.name}`}>
        <Plus size={26} />
      </button>
    </article>
  );
}

function QuantityStepper({ quantity, onDecrease, onIncrease }) {
  return (
    <div className="barista-stepper">
      <button type="button" onClick={onDecrease} aria-label="Disminuir cantidad">
        <Minus size={18} />
      </button>
      <strong>{quantity}</strong>
      <button type="button" onClick={onIncrease} aria-label="Aumentar cantidad">
        <Plus size={18} />
      </button>
    </div>
  );
}

function ModifierSheet({ sheet, onClose, onToggleModifier, onNoteChange, onSave }) {
  return (
    <div className="barista-modifier-backdrop" role="presentation" onClick={onClose}>
      <section className="barista-modifier-sheet" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className="barista-modifier-head">
          <div>
            <span>{sheet.mode === 'new' ? 'Agregar con opciones' : 'Opciones del item'}</span>
            <h2>{sheet.product.name}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar opciones">
            <X size={20} />
          </button>
        </div>

        {sheet.acceptsModifiers && (
          <div className="barista-modifier-chips" aria-label="Modificadores rápidos">
            {QUICK_MODIFIERS.map((modifier) => (
              <button
                className={sheet.modifiers.includes(modifier) ? 'is-active' : ''}
                type="button"
                key={modifier}
                onClick={() => onToggleModifier(modifier)}
              >
                {modifier}
              </button>
            ))}
          </div>
        )}

        <label className="barista-item-note">
          Nota del item
          <textarea
            value={sheet.note}
            onChange={(event) => onNoteChange(event.target.value)}
            placeholder="Ej: tibio, poco hielo, sin canela"
          />
        </label>

        <div className="barista-modifier-actions">
          <button type="button" onClick={onClose}>Cancelar</button>
          <button type="button" onClick={onSave}>{sheet.mode === 'new' ? 'Agregar' : 'Guardar'}</button>
        </div>
      </section>
    </div>
  );
}
