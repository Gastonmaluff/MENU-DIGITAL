import { ArrowLeft, Ban, CheckCircle2, Clock, Loader2, PackageCheck, ReceiptText } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useOrders } from '../../hooks/useOrders';
import { useSettings } from '../../hooks/useSettings';
import { orderService } from '../../services/orderService';
import { formatFirebaseWriteError } from '../../utils/firebaseErrors';
import { formatPrice } from '../../utils/format';
import ThemeWrapper from '../public/ThemeWrapper';

const statusLabels = {
  pendiente_pago: 'Pendiente de pago',
  pagado: 'Pagado',
  en_preparacion: 'En preparación',
  listo: 'Listo',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};

const formatTime = (value) => {
  const date = value?.toDate ? value.toDate() : value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return '--:--';

  return new Intl.DateTimeFormat('es-PY', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const getOrderTitle = (order) => {
  const customerName = String(order.customerName || order.orderName || '').trim();
  return `#${order.orderNumber || '---'}${customerName ? ` · ${customerName}` : ''}`;
};

export default function BaristaOrders() {
  const { settings } = useSettings();
  const { items: orders, syncing, error } = useOrders();
  const [updatingId, setUpdatingId] = useState('');
  const [feedback, setFeedback] = useState('');

  const visibleOrders = useMemo(
    () =>
      orders
        .filter((order) => order.source === 'barista_panel' || order.createdBy === 'barista')
        .filter((order) => order.deletedFromBaristaView !== true)
        .slice(0, 40),
    [orders],
  );

  const cancelOrder = async (order) => {
    if (!confirm(`Cancelar pedido ${getOrderTitle(order)}?`)) return;
    setUpdatingId(order.id);
    setFeedback('');

    try {
      await orderService.cancelByBarista(order.id);
      setFeedback(`Pedido ${getOrderTitle(order)} cancelado.`);
    } catch (err) {
      console.error('Error cancelando pedido desde barista', err);
      setFeedback(formatFirebaseWriteError(err));
    } finally {
      setUpdatingId('');
    }
  };

  return (
    <ThemeWrapper settings={settings}>
      <main className="barista-page barista-orders-page">
        <header className="barista-header">
          <div>
            <span>Nirvana</span>
            <h1>Pedidos</h1>
          </div>
          <Link className="barista-icon-link" to="/barista" title="Volver a toma de pedidos" aria-label="Volver a toma de pedidos">
            <ArrowLeft size={20} />
          </Link>
        </header>

        {syncing && (
          <section className="barista-sync">
            <Loader2 size={18} />
            <span>Sincronizando pedidos...</span>
          </section>
        )}
        {error && <section className="barista-error">{error}</section>}
        {feedback && <section className="barista-confirmation"><CheckCircle2 size={18} /><span>{feedback}</span></section>}

        <section className="barista-order-list" aria-label="Pedidos recientes">
          {visibleOrders.map((order) => (
            <article className="barista-order-card" key={order.id}>
              <header>
                <div>
                  <span><Clock size={14} /> {formatTime(order.createdAt)}</span>
                  <h2>{getOrderTitle(order)}</h2>
                </div>
                <strong>{formatPrice(order.total)}</strong>
              </header>

              <div className="barista-order-badges">
                <span>{statusLabels[order.status] || order.status || 'Pedido'}</span>
                {order.takeAway && <b>Para llevar</b>}
                {order.paymentStatus === 'pagado' && <b><PackageCheck size={14} /> Pagado</b>}
              </div>

              <div className="barista-order-items">
                {(order.items || []).map((item, index) => (
                  <div key={`${item.productId}-${index}`}>
                    <span>{item.quantity}x {item.name}</span>
                    <b>{formatPrice(item.subtotal)}</b>
                  </div>
                ))}
              </div>

              {order.note && <p className="barista-order-note">Obs: {order.note}</p>}

              <button
                className="barista-order-cancel"
                type="button"
                onClick={() => cancelOrder(order)}
                disabled={updatingId === order.id || order.status === 'cancelado'}
              >
                {updatingId === order.id ? <Loader2 size={16} /> : <Ban size={16} />}
                Cancelar pedido
              </button>
            </article>
          ))}

          {!syncing && visibleOrders.length === 0 && (
            <div className="barista-empty">
              <ReceiptText size={26} />
              Todavía no hay pedidos recientes.
            </div>
          )}
        </section>
      </main>
    </ThemeWrapper>
  );
}
