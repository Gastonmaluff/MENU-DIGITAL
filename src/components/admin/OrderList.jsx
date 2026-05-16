import { CheckCircle2, Coffee, XCircle } from 'lucide-react';
import { useOrders } from '../../hooks/useOrders';
import { formatPrice } from '../../utils/format';

const statusLabels = {
  pendiente_pago: 'Pendiente de pago',
  pagado: 'Pagado',
  en_preparacion: 'En preparación',
  listo: 'Listo',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};

const formatDateTime = (value) => {
  const date = value?.toDate ? value.toDate() : value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return 'Sin fecha';

  return new Intl.DateTimeFormat('es-PY', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  }).format(date);
};

const getOrderStatusLabel = (order) => {
  if (order.status === 'cancelado' && order.cancelledBy === 'barista') return 'Cancelado por barista';
  return statusLabels[order.status] || order.status || 'Sin estado';
};

const getCustomerName = (order) => String(order.customerName || order.orderName || '').trim();

const getOrderTitle = (order) => {
  const customerName = getCustomerName(order);
  return `#${order.orderNumber || '---'}${customerName ? ` · ${customerName}` : ''}`;
};

export default function OrderList() {
  const { items: orders, syncing, error } = useOrders();

  const activeOrders = orders.filter((order) => order.status !== 'entregado' && order.status !== 'cancelado');
  const closedOrders = orders.filter((order) => order.status === 'entregado' || order.status === 'cancelado');

  return (
    <div className="admin-page orders-page">
      <div className="admin-page-header">
        <div>
          <span>Operación</span>
          <h1>Pedidos</h1>
        </div>
      </div>

      {syncing && (
        <div className="admin-inline-sync">
          <span />
          Sincronizando pedidos...
        </div>
      )}
      {error && <div className="admin-error">{error}</div>}

      <section className="orders-board" aria-label="Pedidos activos">
        {activeOrders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
        {!syncing && activeOrders.length === 0 && (
          <div className="admin-empty-inline orders-empty">
            <Coffee size={28} />
            No hay pedidos activos.
          </div>
        )}
      </section>

      {closedOrders.length > 0 && (
        <section className="orders-history">
          <div className="editor-panel-title">
            <strong>Finalizados y cancelados</strong>
            <span>{closedOrders.length} pedidos</span>
          </div>
          <div className="orders-history-list">
            {closedOrders.slice(0, 12).map((order) => (
              <article className="orders-history-row" key={order.id}>
                <strong>
                  {getOrderTitle(order)}
                  {order.takeAway ? ' · Para llevar' : ''}
                </strong>
                <span>{getOrderStatusLabel(order)}</span>
                <b>{formatPrice(order.total)}</b>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function OrderPaymentIndicator({ order }) {
  const isPaid = order.paymentStatus === 'pagado' || order.status === 'pagado';
  const isCancelled = order.status === 'cancelado';

  if (isCancelled) {
    return (
      <div className="order-payment-indicator is-cancelled">
        <XCircle size={32} />
        <strong>{order.cancelledBy === 'barista' ? 'Cancelado por barista' : 'Cancelado'}</strong>
        <small>Registro conservado</small>
      </div>
    );
  }

  if (isPaid) {
    return (
      <div className="order-payment-indicator is-paid">
        <CheckCircle2 size={36} />
        <strong>Pagado</strong>
        <small>{order.paymentMethod ? `Pago confirmado · ${order.paymentMethod}` : 'Pago confirmado'}</small>
      </div>
    );
  }

  return (
    <div className="order-payment-indicator">
      <strong>Pendiente de pago</strong>
      <small>Esperando confirmación de caja</small>
    </div>
  );
}

function OrderCard({ order }) {
  const itemCount = (order.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  return (
    <article className={`order-card order-card--${order.status || 'sin_estado'}`}>
      <header className="order-card-header">
        <div>
          <span>{formatDateTime(order.createdAt)}</span>
          <h2>{getOrderTitle(order)}</h2>
        </div>
        <div className="order-status-stack">
          <span className="order-status-badge">{getOrderStatusLabel(order)}</span>
          <small>{order.paymentStatus === 'pagado' ? 'Pago confirmado' : 'Pago pendiente'}</small>
        </div>
      </header>

      {order.takeAway && <span className="order-takeaway-badge">Para llevar</span>}

      <div className="order-card-meta">
        <span>{itemCount} productos</span>
        <strong>{formatPrice(order.total)}</strong>
      </div>

      <div className="order-items">
        {(order.items || []).map((item, index) => (
          <div className="order-item" key={`${item.productId}-${index}`}>
            <div>
              <strong>{item.quantity}x {item.name}</strong>
              <span>{[...(item.modifiers || []), item.note].filter(Boolean).join(' · ')}</span>
            </div>
            <b>{formatPrice(item.subtotal)}</b>
          </div>
        ))}
      </div>

      {order.note && <p className="order-note">Obs: {order.note}</p>}

      <OrderPaymentIndicator order={order} />
    </article>
  );
}
