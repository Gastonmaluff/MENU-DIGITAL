import { Ban, CheckCircle2, CircleDollarSign, Coffee, PackageCheck, Play, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useOrders } from '../../hooks/useOrders';
import { orderService } from '../../services/orderService';
import { formatFirebaseWriteError } from '../../utils/firebaseErrors';
import { formatPrice } from '../../utils/format';

const statusLabels = {
  pendiente_pago: 'Pendiente de pago',
  pagado: 'Pagado',
  en_preparacion: 'En preparación',
  listo: 'Listo',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};

const actionButtons = [
  { status: 'pagado', label: 'Pagado', icon: CircleDollarSign },
  { status: 'en_preparacion', label: 'Preparar', icon: Play },
  { status: 'listo', label: 'Listo', icon: CheckCircle2 },
  { status: 'entregado', label: 'Entregado', icon: PackageCheck },
  { status: 'cancelado', label: 'Cancelar', icon: Ban },
];

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

export default function OrderList() {
  const { items: orders, syncing, error } = useOrders();
  const [updatingId, setUpdatingId] = useState('');
  const [feedback, setFeedback] = useState('');

  const updateOrderStatus = async (order, status) => {
    setUpdatingId(order.id);
    setFeedback('');

    try {
      if (status === 'pagado') {
        await orderService.updatePayment(order.id, {
          paymentStatus: 'pagado',
          paymentMethod: order.paymentMethod || null,
        });
      } else if (status === 'cancelado') {
        await orderService.cancel(order.id);
      } else {
        await orderService.updateStatus(order.id, status);
      }
      setFeedback(`Pedido #${order.orderNumber} actualizado.`);
    } catch (err) {
      console.error('Error actualizando pedido', err);
      setFeedback(formatFirebaseWriteError(err));
    } finally {
      setUpdatingId('');
    }
  };

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
      {feedback && <div className="admin-feedback">{feedback}</div>}

      <section className="orders-board" aria-label="Pedidos activos">
        {activeOrders.map((order) => (
          <OrderCard key={order.id} order={order} updatingId={updatingId} onUpdateStatus={updateOrderStatus} />
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
            {closedOrders.slice(0, 8).map((order) => (
              <article className="orders-history-row" key={order.id}>
                <strong>#{order.orderNumber}</strong>
                <span>{statusLabels[order.status] || order.status}</span>
                <b>{formatPrice(order.total)}</b>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function OrderCard({ order, updatingId, onUpdateStatus }) {
  const isUpdating = updatingId === order.id;
  const itemCount = (order.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  return (
    <article className={`order-card order-card--${order.status || 'sin_estado'}`}>
      <header className="order-card-header">
        <div>
          <span>{formatDateTime(order.createdAt)}</span>
          <h2>#{order.orderNumber || '---'}</h2>
        </div>
        <div className="order-status-stack">
          <span className="order-status-badge">{statusLabels[order.status] || order.status}</span>
          <small>{order.paymentStatus === 'pagado' ? 'Pago confirmado' : 'Pago pendiente'}</small>
        </div>
      </header>

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

      <div className="order-actions">
        {actionButtons.map(({ status, label, icon: Icon }) => (
          <button
            type="button"
            key={status}
            disabled={isUpdating || order.status === status}
            onClick={() => onUpdateStatus(order, status)}
          >
            {isUpdating ? <RefreshCw size={16} /> : <Icon size={16} />}
            {label}
          </button>
        ))}
      </div>
    </article>
  );
}
