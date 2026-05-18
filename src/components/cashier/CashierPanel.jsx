import { Ban, CheckCircle2, CreditCard, Eye, FileText, Loader2, ReceiptText, Search, WalletCards, X } from 'lucide-react';
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
  en_preparacion: 'En preparaciÃ³n',
  listo: 'Listo',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};

const getOrderLabel = (order) => {
  const customerName = String(order.customerName || order.orderName || '').trim();
  return `#${order.orderNumber || '---'}${customerName ? ` Â· ${customerName}` : ''}`;
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

const getCancelledDate = (order) => order.cancelledAt || order.updatedAt || order.createdAt;

const pluralizeOrder = (count) => `${count} ${count === 1 ? 'pedido activo' : 'pedidos activos'}`;

const formatMoney = (value) => `${formatPrice(value)} Gs`;

const formatDate = (value) => {
  const date = toDate(value);
  if (!date) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-PY', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
};

const formatTime = (value) => {
  const date = toDate(value);
  if (!date) return '--:--';
  return new Intl.DateTimeFormat('es-PY', { hour: '2-digit', minute: '2-digit' }).format(date);
};

const paymentLabel = (method) =>
  paymentMethods.find((item) => item.value === method)?.label || 'Metodo no registrado';

const getCustomerName = (order) => String(order.customerName || order.orderName || '').trim();

const getItemModifiers = (item) =>
  [...(item.modifiers || []), item.note].filter(Boolean);

const blobToDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

const fetchLogoDataUrl = async () => {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}assets/nirvana-logo.png`);
    if (!response.ok) return null;
    return blobToDataUrl(await response.blob());
  } catch {
    return null;
  }
};

const addPdfText = (doc, text, x, y, options = {}) => {
  doc.text(String(text), x, y, options);
  return y + (options.lineHeight || 7);
};

export default function CashierPanel() {
  const { items: orders, syncing, error } = useOrders();
  const [search, setSearch] = useState('');
  const [paymentSelection, setPaymentSelection] = useState({});
  const [updatingId, setUpdatingId] = useState('');
  const [feedback, setFeedback] = useState('');
  const [closingDay, setClosingDay] = useState(false);
  const [selectedPaidOrder, setSelectedPaidOrder] = useState(null);

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

  const pendingTodayOrders = useMemo(
    () => orders.filter((order) => isActivePendingOrder(order) && isSameDay(order.createdAt)),
    [orders],
  );

  const cancelledTodayOrders = useMemo(
    () => orders.filter((order) => isCancelled(order) && isSameDay(getCancelledDate(order))),
    [orders],
  );

  const pendingTotal = activeOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const paidTodayTotal = paidTodayOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const pendingTodayTotal = pendingTodayOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const cancelledTodayTotal = cancelledTodayOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);

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

  const closeDay = async () => {
    setClosingDay(true);
    setFeedback('');

    try {
      const pdfBlob = await buildDailyClosePdf({
        paidOrders: paidTodayOrders,
        pendingOrders: pendingTodayOrders,
        cancelledOrders: cancelledTodayOrders,
        paidTotal: paidTodayTotal,
        pendingTotal: pendingTodayTotal,
        cancelledTotal: cancelledTodayTotal,
      });
      const todayName = new Intl.DateTimeFormat('es-PY', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date()).replaceAll('/', '-');
      const file = new File([pdfBlob], `cierre-caja-nirvana-${todayName}.pdf`, { type: 'application/pdf' });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: 'Cierre de caja Nirvana',
          text: 'Resumen de cierre de caja del dia.',
          files: [file],
        });
        setFeedback('Cierre de caja generado y compartido.');
      } else {
        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.name;
        link.click();
        URL.revokeObjectURL(url);
        setFeedback('Cierre de caja generado. El navegador descargo el PDF.');
      }
    } catch (err) {
      console.error('Error generando cierre de caja', err);
      setFeedback('No pudimos generar el cierre de caja. Intenta nuevamente.');
    } finally {
      setClosingDay(false);
    }
  };

  return (
    <main className="cashier-page">
      <header className="cashier-header">
        <div>
          <span>Nirvana</span>
          <h1>Cajera</h1>
          <button className="cashier-close-day" type="button" onClick={closeDay} disabled={closingDay}>
            {closingDay ? <Loader2 size={18} /> : <FileText size={18} />}
            Cerrar dia
          </button>
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
            placeholder="Buscar por nÃºmero, nombre o producto"
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
              <button key={order.id} type="button" onClick={() => setSelectedPaidOrder(order)}>
                <strong>{getOrderLabel(order)}</strong>
                <span>{paymentLabel(order.paymentMethod)} · {statusLabels[order.status] || order.status}</span>
                <b>{formatPrice(order.total)}</b>
                <em>
                  <Eye size={15} />
                  Ver detalle
                </em>
              </button>
            ))}
          </div>
        </section>
      )}

      {selectedPaidOrder && (
        <PaidOrderDetailModal order={selectedPaidOrder} onClose={() => setSelectedPaidOrder(null)} />
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

      <div className="cashier-methods" role="group" aria-label={`MÃ©todo de pago ${getOrderLabel(order)}`}>
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

async function buildDailyClosePdf({ paidOrders, pendingOrders, cancelledOrders, paidTotal, pendingTotal, cancelledTotal }) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const generatedAt = new Date();
  let y = 18;

  const logo = await fetchLogoDataUrl();
  if (logo) {
    doc.addImage(logo, 'PNG', margin, 12, 24, 24);
  }

  doc.setTextColor(30, 23, 18);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('Cierre de caja', logo ? 46 : margin, 20);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(122, 102, 88);
  doc.text(`Nirvana · ${formatDate(generatedAt)} · ${formatTime(generatedAt)}`, logo ? 46 : margin, 28);
  y = 44;

  const paidCount = paidOrders.length;
  const ticketAverage = paidCount ? paidTotal / paidCount : 0;
  const methodTotals = paymentMethods.map((method) => ({
    ...method,
    total: paidOrders
      .filter((order) => order.paymentMethod === method.value)
      .reduce((sum, order) => sum + Number(order.total || 0), 0),
  }));

  const ensureSpace = (space = 24) => {
    if (y + space <= pageHeight - margin) return;
    doc.addPage();
    y = margin;
  };

  const sectionTitle = (title) => {
    ensureSpace(16);
    doc.setTextColor(184, 121, 52);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    y = addPdfText(doc, title, margin, y);
    doc.setDrawColor(235, 224, 214);
    doc.line(margin, y - 4, pageWidth - margin, y - 4);
  };

  const row = (label, value) => {
    ensureSpace(8);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(122, 102, 88);
    doc.text(label, margin, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 23, 18);
    doc.text(String(value), pageWidth - margin, y, { align: 'right' });
    y += 7;
  };

  sectionTitle('Resumen general');
  row('Total cobrado del dia', formatMoney(paidTotal));
  row('Total pendiente del dia', formatMoney(pendingTotal));
  row('Pedidos activos / pendientes', pendingOrders.length);
  row('Pedidos cobrados', paidCount);
  row('Pedidos cancelados', cancelledOrders.length);
  row('Ticket promedio del dia', formatMoney(ticketAverage));
  y += 5;

  sectionTitle('Desglose por metodo de pago');
  methodTotals.forEach((method) => row(method.label, formatMoney(method.total)));
  y += 5;

  sectionTitle('Detalle de pedidos cobrados');
  if (paidOrders.length === 0) {
    row('Sin pedidos cobrados', formatMoney(0));
  } else {
    paidOrders.forEach((order) => {
      ensureSpace(12);
      const name = getCustomerName(order);
      doc.setFontSize(9.5);
      doc.setTextColor(30, 23, 18);
      doc.setFont('helvetica', 'bold');
      doc.text(`#${order.orderNumber || '---'}${name ? ` · ${name}` : ''}`, margin, y);
      doc.text(formatMoney(order.total), pageWidth - margin, y, { align: 'right' });
      y += 5;
      doc.setTextColor(122, 102, 88);
      doc.setFont('helvetica', 'normal');
      doc.text(`${paymentLabel(order.paymentMethod)} · ${formatTime(getPaidDate(order))}`, margin, y);
      y += 7;
    });
  }

  sectionTitle('Detalle de pedidos cancelados');
  if (cancelledOrders.length === 0) {
    row('Sin pedidos cancelados', formatMoney(0));
  } else {
    cancelledOrders.forEach((order) => {
      ensureSpace(11);
      const name = getCustomerName(order);
      doc.setFontSize(9.5);
      doc.setTextColor(30, 23, 18);
      doc.setFont('helvetica', 'bold');
      doc.text(`#${order.orderNumber || '---'}${name ? ` · ${name}` : ''}`, margin, y);
      doc.text(formatMoney(order.total), pageWidth - margin, y, { align: 'right' });
      y += 5;
      doc.setTextColor(122, 102, 88);
      doc.setFont('helvetica', 'normal');
      doc.text(statusLabels[order.status] || 'Cancelado', margin, y);
      y += 7;
    });
  }

  y += 4;
  sectionTitle('Totales finales');
  row('Total cobrado', formatMoney(paidTotal));
  row('Total pendiente', formatMoney(pendingTotal));
  row('Total cancelado', formatMoney(cancelledTotal));

  return doc.output('blob');
}

function PaidOrderDetailModal({ order, onClose }) {
  const items = order.items || [];
  const customerName = getCustomerName(order);
  const paidDate = getPaidDate(order);

  return (
    <div className="cashier-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="cashier-detail-modal" role="dialog" aria-modal="true" aria-label="Detalle del pedido" onMouseDown={(event) => event.stopPropagation()}>
        <header>
          <div>
            <span>Pedido pagado</span>
            <h2>{getOrderLabel(order)}</h2>
            <p>{formatDate(order.createdAt)} · {formatTime(order.createdAt)}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar detalle">
            <X size={19} />
          </button>
        </header>

        <div className="cashier-detail-badges">
          <span>Pagado</span>
          <span>{paymentLabel(order.paymentMethod)}</span>
          {order.takeAway && <span>Para llevar</span>}
          {customerName && <span>{customerName}</span>}
        </div>

        <div className="cashier-detail-items">
          {items.map((item, index) => {
            const modifiers = getItemModifiers(item);
            return (
              <article key={`${item.productId || item.name}-${index}`}>
                <div>
                  <strong>{item.quantity}x {item.name}</strong>
                  {modifiers.length > 0 && (
                    <small>{modifiers.map((modifier) => `+ ${modifier}`).join(' · ')}</small>
                  )}
                  {item.unitPrice ? <em>Unitario: {formatMoney(item.unitPrice)}</em> : null}
                </div>
                <b>{formatMoney(item.subtotal)}</b>
              </article>
            );
          })}
        </div>

        <footer>
          <div>
            <span>Total del pedido</span>
            <strong>{formatMoney(order.total)}</strong>
          </div>
          <p>{paymentLabel(order.paymentMethod)} · Cobrado {formatDate(paidDate)} {formatTime(paidDate)}</p>
          <button className="cashier-paid" type="button" onClick={onClose}>Cerrar</button>
        </footer>
      </section>
    </div>
  );
}
