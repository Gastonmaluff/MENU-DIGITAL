import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  XCircle,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useOrders } from '../../hooks/useOrders';
import { formatPrice } from '../../utils/format';

const statusLabels = {
  pendiente_pago: 'Pendiente de pago',
  pagado: 'Pagado',
  en_preparacion: 'En preparación',
  listo: 'Listo',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
  cancelled: 'Cancelado',
  deleted_by_barista: 'Cancelado por barista',
};

const toDate = (value) => {
  const date = value?.toDate ? value.toDate() : value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
};

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const addDays = (date, amount) => {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
};

const toInputDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const dateKey = (date) => (date ? toInputDate(date) : 'sin-fecha');

const dateLabel = (date) => {
  if (!date) return 'Sin fecha';
  const today = startOfDay(new Date());
  const target = startOfDay(date);
  const formatted = new Intl.DateTimeFormat('es-PY', { day: '2-digit', month: '2-digit' }).format(date);
  if (target.getTime() === today.getTime()) return `Hoy - ${formatted}`;
  if (target.getTime() === addDays(today, -1).getTime()) return `Ayer - ${formatted}`;
  if (target.getTime() === addDays(today, -2).getTime()) return `Antes de ayer - ${formatted}`;
  return formatted;
};

const weekGroupLabel = (date) => {
  const relativeLabel = dateLabel(date);
  if (relativeLabel.includes(' - ')) return relativeLabel;

  const day = new Intl.DateTimeFormat('es-PY', { weekday: 'long' }).format(date);
  const formatted = new Intl.DateTimeFormat('es-PY', { day: '2-digit', month: '2-digit' }).format(date);
  return `${day.charAt(0).toUpperCase()}${day.slice(1)} - ${formatted}`;
};

const formatTime = (value) => {
  const date = toDate(value);
  if (!date) return '--:--';
  return new Intl.DateTimeFormat('es-PY', { hour: '2-digit', minute: '2-digit' }).format(date);
};

const formatDateTime = (value) => {
  const date = toDate(value);
  if (!date) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-PY', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const formatMoney = (value) => `${formatPrice(value)} Gs`;

const getCustomerName = (order) => String(order.customerName || order.orderName || '').trim();

const getOrderNumber = (order) => `#${order.orderNumber || '---'}`;

const getOrderTotal = (order) => Number(order.total || 0);

const getItemQuantity = (item) => Number(item.quantity || 0);

const isCancelled = (order) =>
  ['cancelado', 'cancelled', 'deleted_by_barista'].includes(order.status) || order.deletedFromBaristaView === true;

const isPaid = (order) => order.paymentStatus === 'pagado' || order.status === 'pagado';

const isPending = (order) => !isCancelled(order) && !isPaid(order);

const getStatusLabel = (order) => {
  if (isCancelled(order) && order.cancelledBy === 'barista') return 'Cancelado por barista';
  if (isCancelled(order)) return 'Cancelado';
  if (isPaid(order)) return 'Pagado';
  return statusLabels[order.status] || 'Pendiente de pago';
};

const getCancelledBy = (order) => {
  if (order.cancelledBy === 'barista') return 'Barista';
  if (order.cancelledBy === 'cashier') return 'Cajera';
  if (order.cancelledBy === 'admin') return 'Admin';
  return 'Sin dato';
};

const isWithinWeekView = (order) => {
  const date = toDate(order.createdAt);
  if (!date) return false;

  const today = startOfDay(new Date());
  const orderDay = startOfDay(date);

  return orderDay >= addDays(today, -6) && orderDay <= today;
};

const getDateRangeBounds = (fromValue, toValue) => {
  const fromDate = fromValue ? startOfDay(new Date(`${fromValue}T00:00:00`)) : null;
  const toDateValue = toValue ? startOfDay(new Date(`${toValue}T00:00:00`)) : null;

  if (fromDate && toDateValue && fromDate > toDateValue) {
    return { from: toDateValue, to: addDays(fromDate, 1) };
  }

  return {
    from: fromDate,
    to: toDateValue ? addDays(toDateValue, 1) : null,
  };
};

const isWithinDateRange = (order, fromValue, toValue) => {
  const date = toDate(order.createdAt);
  if (!date) return false;

  const { from, to } = getDateRangeBounds(fromValue, toValue);
  return (!from || date >= from) && (!to || date < to);
};

const groupByDate = (orders) => {
  const groups = new Map();

  orders.forEach((order) => {
    const date = toDate(order.createdAt);
    const key = dateKey(date);
    const current = groups.get(key) || {
      key,
      date,
      orders: [],
      latestTime: 0,
    };
    current.orders.push(order);
    current.latestTime = Math.max(current.latestTime, date?.getTime() || 0);
    groups.set(key, current);
  });

  return [...groups.values()]
    .map((group) => ({
      ...group,
      orders: group.orders.sort((a, b) => (toDate(b.createdAt)?.getTime() || 0) - (toDate(a.createdAt)?.getTime() || 0)),
    }))
    .sort((a, b) => b.latestTime - a.latestTime);
};

const buildWeekDateGroups = (orders) => {
  const today = startOfDay(new Date());
  const groups = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(today, -index);
    return {
      key: dateKey(date),
      date,
      label: weekGroupLabel(date),
      orders: [],
      latestTime: date.getTime(),
    };
  });
  const byKey = new Map(groups.map((group) => [group.key, group]));

  orders.forEach((order) => {
    const date = toDate(order.createdAt);
    const group = byKey.get(dateKey(date));
    if (group) group.orders.push(order);
  });

  return groups.map((group) => ({
    ...group,
    orders: group.orders.sort((a, b) => (toDate(b.createdAt)?.getTime() || 0) - (toDate(a.createdAt)?.getTime() || 0)),
  }));
};

const summarizeOrders = (orders) => {
  const paidOrders = orders.filter((order) => isPaid(order) && !isCancelled(order));
  const pendingOrders = orders.filter(isPending);
  const cancelledOrders = orders.filter(isCancelled);
  const paidSales = paidOrders.reduce((sum, order) => sum + getOrderTotal(order), 0);
  const pendingAmount = pendingOrders.reduce((sum, order) => sum + getOrderTotal(order), 0);
  const cancelledAmount = cancelledOrders.reduce((sum, order) => sum + getOrderTotal(order), 0);
  const productTotals = new Map();

  orders
    .filter((order) => !isCancelled(order))
    .forEach((order) => {
      (order.items || []).forEach((item) => {
        const key = item.productId || item.name;
        const current = productTotals.get(key) || { name: item.name || 'Producto', quantity: 0 };
        current.quantity += getItemQuantity(item);
        productTotals.set(key, current);
      });
    });

  const soldProducts = [...productTotals.values()].filter((item) => item.quantity > 0);
  const topProduct = [...soldProducts].sort((a, b) => b.quantity - a.quantity)[0];
  const bottomProduct = [...soldProducts].sort((a, b) => a.quantity - b.quantity)[0];

  return {
    count: orders.length,
    paidCount: paidOrders.length,
    pendingCount: pendingOrders.length,
    cancelledCount: cancelledOrders.length,
    paidSales,
    pendingAmount,
    activeAmount: paidSales + pendingAmount,
    cancelledAmount,
    averageTicket: paidOrders.length ? paidSales / paidOrders.length : 0,
    topProduct,
    bottomProduct,
  };
};

export default function OrderList() {
  const { items: orders, syncing, error } = useOrders();
  const todayValue = toInputDate(new Date());
  const [rangeFrom, setRangeFrom] = useState(todayValue);
  const [rangeTo, setRangeTo] = useState(todayValue);
  const [rangeQuery, setRangeQuery] = useState(null);
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [collapsedRangeGroups, setCollapsedRangeGroups] = useState({});
  const [cancelledOpen, setCancelledOpen] = useState(false);
  const [rangeOpen, setRangeOpen] = useState(false);

  const weeklyOrders = useMemo(
    () =>
      orders
        .filter(isWithinWeekView)
        .sort((a, b) => (toDate(b.createdAt)?.getTime() || 0) - (toDate(a.createdAt)?.getTime() || 0)),
    [orders],
  );

  const visibleOrders = weeklyOrders.filter((order) => !isCancelled(order));
  const cancelledOrders = weeklyOrders.filter(isCancelled);
  const dateGroups = buildWeekDateGroups(visibleOrders);
  const rangeOrders = useMemo(
    () =>
      rangeQuery
        ? orders
            .filter((order) => isWithinDateRange(order, rangeQuery.from, rangeQuery.to))
            .sort((a, b) => (toDate(b.createdAt)?.getTime() || 0) - (toDate(a.createdAt)?.getTime() || 0))
        : [],
    [orders, rangeQuery],
  );
  const rangeGroups = groupByDate(rangeOrders);
  const summary = summarizeOrders(weeklyOrders);

  const toggleGroup = (key, defaultOpen) => {
    setCollapsedGroups((current) => ({
      ...current,
      [key]: !(current[key] ?? defaultOpen),
    }));
  };

  const toggleRangeGroup = (key, defaultOpen) => {
    setCollapsedRangeGroups((current) => ({
      ...current,
      [key]: !(current[key] ?? defaultOpen),
    }));
  };

  const searchDateRange = (event) => {
    event.preventDefault();
    setRangeQuery({ from: rangeFrom, to: rangeTo });
    setCollapsedRangeGroups({});
  };

  return (
    <div className="admin-page orders-page orders-analytics-page">
      <header className="orders-analytics-header">
        <div>
          <span>Control comercial</span>
          <h1>Pedidos</h1>
          <p>Control comercial y registro de ventas</p>
        </div>
      </header>

      {syncing && (
        <div className="admin-inline-sync">
          <span />
          Sincronizando pedidos...
        </div>
      )}
      {error && <div className="admin-error">{error}</div>}

      <section className="orders-date-stack" aria-label="Pedidos agrupados por fecha">
        {dateGroups.map((group, index) => {
          const defaultOpen = index === 0;
          const isOpen = collapsedGroups[group.key] ?? defaultOpen;
          const groupSummary = summarizeOrders(group.orders);

          return (
            <article className="orders-date-group" key={group.key}>
              <button className="orders-date-toggle" type="button" onClick={() => toggleGroup(group.key, defaultOpen)}>
                <div>
                  <strong>{group.label || dateLabel(group.date)}</strong>
                  <span>
                    {groupSummary.count} pedidos · {formatMoney(groupSummary.activeAmount)} · {groupSummary.paidCount} pagados ·{' '}
                    {groupSummary.pendingCount} pendientes
                  </span>
                </div>
                <ChevronDown className={isOpen ? 'is-open' : ''} size={20} />
              </button>

              {isOpen && (
                <div className="orders-record-grid">
                  {group.orders.length > 0 ? (
                    group.orders.map((order) => (
                      <OrderRecord key={order.id} order={order} />
                    ))
                  ) : (
                    <div className="orders-muted-box">No hay pedidos registrados en este día.</div>
                  )}
                </div>
              )}
            </article>
          );
        })}

        {!syncing && dateGroups.length === 0 && (
          <div className="admin-empty-inline orders-empty">
            <ClipboardList size={28} />
            No hay pedidos para los filtros seleccionados.
          </div>
        )}
      </section>

      <section className="orders-cancelled-section">
        <button className="orders-date-toggle" type="button" onClick={() => setCancelledOpen((value) => !value)}>
          <div>
            <strong>Pedidos cancelados</strong>
            <span>
              {cancelledOrders.length} pedidos · {formatMoney(summary.cancelledAmount)} anulados
            </span>
          </div>
          <ChevronDown className={cancelledOpen ? 'is-open' : ''} size={20} />
        </button>

        {cancelledOpen && (
          <div className="orders-cancelled-list">
            {cancelledOrders.map((order) => (
              <CancelledOrderRecord key={order.id} order={order} />
            ))}
            {cancelledOrders.length === 0 && <div className="orders-muted-box">No hay pedidos cancelados en este periodo.</div>}
          </div>
        )}
      </section>

      <section className="orders-range-section">
        <button className="orders-date-toggle" type="button" onClick={() => setRangeOpen((value) => !value)}>
          <div>
            <strong>Buscar por rango de fechas</strong>
            <span>
              {rangeQuery ? `${rangeOrders.length} pedidos encontrados` : 'Consulta adicional sin modificar la vista semanal'}
            </span>
          </div>
          <ChevronDown className={rangeOpen ? 'is-open' : ''} size={20} />
        </button>

        {rangeOpen && (
          <div className="orders-range-body">
            <form className="orders-custom-range" onSubmit={searchDateRange}>
              <label>
                Desde
                <input type="date" value={rangeFrom} onChange={(event) => setRangeFrom(event.target.value)} />
              </label>
              <label>
                Hasta
                <input type="date" value={rangeTo} onChange={(event) => setRangeTo(event.target.value)} />
              </label>
              <button className="admin-primary-button" type="submit">Consultar</button>
            </form>

            {rangeQuery && (
              <div className="orders-range-results">
                {rangeGroups.length > 0 ? (
                  rangeGroups.map((group, index) => {
                    const defaultOpen = index === 0;
                    const isOpen = collapsedRangeGroups[group.key] ?? defaultOpen;
                    const groupSummary = summarizeOrders(group.orders);

                    return (
                      <article className="orders-date-group orders-range-group" key={group.key}>
                        <button
                          className="orders-date-toggle"
                          type="button"
                          onClick={() => toggleRangeGroup(group.key, defaultOpen)}
                        >
                          <div>
                            <strong>{dateLabel(group.date)}</strong>
                            <span>
                              {groupSummary.count} pedidos · {formatMoney(groupSummary.activeAmount)} ·{' '}
                              {groupSummary.paidCount} pagados · {groupSummary.pendingCount} pendientes
                            </span>
                          </div>
                          <ChevronDown className={isOpen ? 'is-open' : ''} size={20} />
                        </button>

                        {isOpen && (
                          <div className="orders-record-grid">
                            {group.orders.map((order) => (
                              <OrderRecord key={order.id} order={order} />
                            ))}
                          </div>
                        )}
                      </article>
                    );
                  })
                ) : (
                  <div className="orders-muted-box">No se encontraron pedidos en ese rango.</div>
                )}
              </div>
            )}
          </div>
        )}
      </section>


    </div>
  );
}

function OrderRecord({ order }) {
  const items = order.items || [];
  const itemCount = items.reduce((sum, item) => sum + getItemQuantity(item), 0);
  const customerName = getCustomerName(order);
  const statusTone = isCancelled(order) ? 'cancelled' : isPaid(order) ? 'paid' : 'pending';

  return (
    <article className="orders-record-card">
      <header>
        <div>
          <strong>{getOrderNumber(order)} · {formatTime(order.createdAt)}</strong>
          <span>
            {[customerName, order.takeAway ? 'Para llevar' : 'En local'].filter(Boolean).join(' · ')}
          </span>
        </div>
        <b>{formatMoney(getOrderTotal(order))}</b>
      </header>

      <div className="orders-record-meta">
        <Badge tone={statusTone}>{getStatusLabel(order)}</Badge>
        {order.paymentMethod && <span>{order.paymentMethod}</span>}
        <span>{itemCount} productos</span>
      </div>

      <div className="orders-record-items">
        {items.slice(0, 4).map((item, index) => (
          <span key={`${item.productId || item.name}-${index}`}>{item.quantity}x {item.name}</span>
        ))}
        {items.length > 4 && <span>+{items.length - 4} productos mas</span>}
      </div>

      {order.note && <p>Obs: {order.note}</p>}
    </article>
  );
}

function CancelledOrderRecord({ order }) {
  const items = order.items || [];

  return (
    <article className="orders-cancelled-card">
      <header>
        <div>
          <strong>{getOrderNumber(order)} · {formatDateTime(order.cancelledAt || order.createdAt)}</strong>
          <span>{getStatusLabel(order)} · {getCancelledBy(order)}</span>
        </div>
        <b>{formatMoney(getOrderTotal(order))}</b>
      </header>
      <div className="orders-record-items">
        {items.slice(0, 4).map((item, index) => (
          <span key={`${item.productId || item.name}-${index}`}>{item.quantity}x {item.name}</span>
        ))}
        {items.length > 4 && <span>+{items.length - 4} productos mas</span>}
      </div>
      {order.cancelReason && <p>Motivo: {order.cancelReason}</p>}
    </article>
  );
}

function Badge({ tone, children }) {
  const Icon = tone === 'paid' ? CheckCircle2 : tone === 'cancelled' ? XCircle : CalendarDays;
  return (
    <span className={`orders-status-badge is-${tone}`}>
      <Icon size={14} />
      {children}
    </span>
  );
}
