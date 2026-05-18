import { Ban, CheckCircle2, CreditCard, Loader2, ReceiptText, Search, WalletCards } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useOrders } from '../../hooks/useOrders';
import { orderService } from '../../services/orderService';
import { formatFirebaseWriteError } from '../../utils/firebaseErrors';
import { formatPrice } from '../../utils/format';

const paymentMethods = [
  { value: 'efectivo', label: 'Efectivo', icon: WalletCards },
  { value: 'tarjeta', label: 'Tarjeta', icon: CreditCard },
  { value: 'transferencia', label: 'Transferencia', icon: ReceiptText },
  { value: 'qr', label: 'QR', icon: CreditCard },
];

const statusLabels = {
  pendiente_pago: 'Pendiente de pago',
  pagado: 'Pagado',
  en_preparacion: 'En preparación',
  listo: 'Listo',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};

const getOrderLabel = (order) => {
  const customerName = String(order.customerName || order.orderName || '').trim();
  return `#${order.orderNumber || '---'}${customerName ? ` · ${customerName}` : ''}`;
};

const matchesSearch = (order, search) => {
  const query = search.trim().toLowerCase();
  if (!query) return true;

  return [
    order.orderNumber,
    order.customerName,
    order.orderName,
    order.status,
    order.paymentMethod,
    ...(order.items || []).map((item) => item.name),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .includes(query);
};

const toDate = (value) => {
  const date = value?.toDate ? value.toDate() : value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
};

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const isSameDay = (value, day = new Date()) => {
  const date = toDate(value);
  if (!date) return false;
  return startOfDay(date).getTime() === startOfDay(day).getTime();
};

const isCancelled = (order) =>
  ['cancelado', 'cancelled', 'deleted_by_barista'].includes(order.status) || order.deletedFromBaristaView === true;

const isPaid = (order) =>
  ['pagado', 'paid'].includes(order.paymentStatus) || ['pagado', 'paid'].includes(order.status);

const isActivePendingOrder = (order) => !isCancelled(order) && !isPaid(order) && order.status !== 'entregado';

const getPaidDate = (order) => order.paidAt || order.updatedAt || order.createdAt;

const pluralizeOrder = (count) => `${count} ${count === 1 ? 'pedido activo' : 'pedidos activos'}`;

export default function CashierPanel() {
  const { items: orders, syncing, error } = useOrders();
  const [search, setSearch] = useState('');
  const [paymentSelection, setPaymentSelection] = useState({});
  const [updatingId, setUpdatingId] = useState('');
  const [feedback, setFeedback] = useState('');

  const pendingOrders = useMemo(
    () =>
      orders.filter((order) =>
        isActivePendingOrder(order) && matchesSearch(order, search),
      ),
    [orders, search],
  );

  const paidOrders = useMemo(
    () =>
      orders.filter((order) =>
        isPaid(order) && !isCancelled(order) && matchesSearch(order, search),
      ),
    [orders, search],
  );

  const activeOrders = useMemo(
    () => orders.filter(isActivePendingOrder),
    [orders],
  );

  const paidTodayOrders = useMemo(
    () => orders.filter((order) => isPaid(order) && !isCancelled(order) && isSameDay(getPaidDate(order))),
    [orders],
  );

  const pendingTotal = activeOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const paidTodayTotal = paidTodayOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);

  const markPaid = async (order) => {
    const paymentMethod = paymentSelection[order.id] || order.paymentMethod || 'efectivo';
    setUpdatingId(order.id);
    setFeedback('');

    try {
      await orderService.updatePayment(order.id, {
        paymentStatus: 'pagado',
        paymentMethod,
      });
      setFeedback(`Pedido ${getOrderLabel(order)} marcado como pagado.`);
    } catch (err) {
      console.error('Error marcando pedido como pagado', err);
      setFeedback(formatFirebaseWriteError(err));
    } finally {
      setUpdatingId('');
    }
  };

  const cancelOrder = async (order) => {
    if (!confirm(`Cancelar pedido ${getOrderLabel(order)}?`)) return;
    setUpdatingId(order.id);
    setFeedback('');

    try {
      await orderService.cancel(order.id);
      setFeedback(`Pedido ${getOrderLabel(order)} cancelado.`);
    } catch (err) {
      console.error('Error cancelando pedido', err);
      setFeedback(formatFirebaseWriteError(err));
    } finally {
      setUpdatingId('');
    }
  };

  return (
    <main className="cashier-page">
      <header className="cashier-header">
        <div>
          <span>Nirvana</span>
          <h1>Cajera</h1>
        </div>
        <div className="cashier-summary">
          <article>
            <span>Pedidos activos</span>
            <strong>{activeOrders.length}</strong>
            <small>Pendientes de cobro</small>
          </article>
          <article>
            <span>Pendiente de cobro</span>
            <strong>{formatPrice(pendingTotal)}</strong>
            <small>{pluralizeOrder(activeOrders.length)}</small>
          </article>
          <article>
            <span>Cobrado hoy</span>
            <strong>{formatPrice(paidTodayTotal)}</strong>
            <small>{paidTodayOrders.length} {paidTodayOrders.length === 1 ? 'pedido pagado' : 'pedidos pagados'}</small>
          </article>
        </div>
      </header>

      <section className="cashier-toolbar">
        <label className="cashier-search">
          <Search size={18} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por número, nombre o producto"
          />
        </label>
        {syncing && (
          <div className="cashier-sync">
            <Loader2 size={17} />
            Sincronizando pedidos...
          </div>
        )}
      </section>

      {error && <section className="cashier-error">{error}</section>}
      {feedback && <section className="cashier-feedback">{feedback}</section>}

      <section className="cashier-section">
        <div className="cashier-section-title">
          <strong>Pedidos pendientes</strong>
          <span>{pendingOrders.length} pedidos</span>
        </div>

        <div className="cashier-order-list">
          {pendingOrders.map((order) => (
            <CashierOrderCard
              key={order.id}
              order={order}
              selectedMethod={paymentSelection[order.id] || order.paymentMethod || 'efectivo'}
              updating={updatingId === order.id}
              onSelectMethod={(method) => setPaymentSelection((current) => ({ ...current, [order.id]: method }))}
              onMarkPaid={() => markPaid(order)}
              onCancel={() => cancelOrder(order)}
            />
          ))}
          {!syncing && pendingOrders.length === 0 && (
            <div className="cashier-empty">
              <CheckCircle2 size={26} />
              No hay pedidos pendientes de pago.
            </div>
          )}
        </div>
      </section>

      {paidOrders.length > 0 && (
        <section className="cashier-section cashier-section--paid">
          <div className="cashier-section-title">
            <strong>Pagados recientes</strong>
            <span>{paidOrders.length} pedidos</span>
          </div>
          <div className="cashier-paid-list">
            {paidOrders.slice(0, 10).map((order) => (
              <article key={order.id}>
                <strong>{getOrderLabel(order)}</strong>
                <span>{order.paymentMethod || 'sin método'} · {statusLabels[order.status] || order.status}</span>
                <b>{formatPrice(order.total)}</b>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function CashierOrderCard({ order, selectedMethod, updating, onSelectMethod, onMarkPaid, onCancel }) {
  const itemCount = (order.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  return (
    <article className="cashier-order-card">
      <header>
        <div>
          <span>{statusLabels[order.status] || order.status || 'Pedido'}</span>
          <h2>{getOrderLabel(order)}</h2>
          {order.takeAway && <b>Para llevar</b>}
        </div>
        <strong>{formatPrice(order.total)}</strong>
      </header>

      <div className="cashier-order-meta">
        <span>{itemCount} productos</span>
        <span>{order.paymentStatus === 'pagado' ? 'Pago confirmado' : 'Pago pendiente'}</span>
      </div>

      <div className="cashier-items">
        {(order.items || []).map((item, index) => (
          <div key={`${item.productId}-${index}`}>
            <span>{item.quantity}x {item.name}</span>
            <b>{formatPrice(item.subtotal)}</b>
          </div>
        ))}
      </div>

      {order.note && <p className="cashier-note">Obs: {order.note}</p>}

      <div className="cashier-methods" role="group" aria-label={`Método de pago ${getOrderLabel(order)}`}>
        {paymentMethods.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            className={selectedMethod === value ? 'is-active' : ''}
            type="button"
            aria-pressed={selectedMethod === value}
            onClick={() => onSelectMethod(value)}
            disabled={updating}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      <div className="cashier-actions">
        <button className="cashier-cancel" type="button" onClick={onCancel} disabled={updating}>
          <Ban size={17} />
          Cancelar
        </button>
        <button className="cashier-paid" type="button" onClick={onMarkPaid} disabled={updating}>
          {updating ? <Loader2 size={17} /> : <CheckCircle2 size={17} />}
          Marcar pagado
        </button>
      </div>
    </article>
  );
}
