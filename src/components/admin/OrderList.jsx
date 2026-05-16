import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Package,
  TrendingUp,
  WalletCards,
  XCircle,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useOrders } from '../../hooks/useOrders';
import { formatPrice } from '../../utils/format';

const dateFilters = [
  { value: 'today', label: 'Hoy' },
  { value: 'yesterday', label: 'Ayer' },
  { value: '7days', label: 'Semana' },
  { value: 'month', label: 'Mes' },
  { value: 'custom', label: 'Rango' },
];

const statusFilters = [
  { value: 'all', label: 'Todos' },
  { value: 'paid', label: 'Pagados' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'cancelled', label: 'Cancelados' },
];

const typeFilters = [
  { value: 'all', label: 'Todos' },
  { value: 'local', label: 'En local' },
  { value: 'takeaway', label: 'Para llevar' },
];

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

const isWithinDateFilter = (order, filter, customFrom, customTo) => {
  const date = toDate(order.createdAt);
  if (!date) return filter === 'all';

  const today = startOfDay(new Date());
  const orderDay = startOfDay(date);

  if (filter === 'today') return orderDay.getTime() === today.getTime();
  if (filter === 'yesterday') return orderDay.getTime() === addDays(today, -1).getTime();
  if (filter === '7days') return orderDay >= addDays(today, -6) && orderDay <= today;
  if (filter === 'month') {
    return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth();
  }
  if (filter === 'custom') {
    const from = customFrom ? startOfDay(new Date(`${customFrom}T00:00:00`)) : null;
    const to = customTo ? addDays(startOfDay(new Date(`${customTo}T00:00:00`)), 1) : null;
    return (!from || date >= from) && (!to || date < to);
  }
  return true;
};

const isWithinStatusFilter = (order, filter) => {
  if (filter === 'paid') return isPaid(order) && !isCancelled(order);
  if (filter === 'pending') return isPending(order);
  if (filter === 'cancelled') return isCancelled(order);
  return true;
};

const isWithinTypeFilter = (order, filter) => {
  if (filter === 'takeaway') return Boolean(order.takeAway);
  if (filter === 'local') return !order.takeAway;
  return true;
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
    cancelledAmount,
    averageTicket: paidOrders.length ? paidSales / paidOrders.length : 0,
    topProduct,
    bottomProduct,
  };
};

const getLastSevenDaySales = (orders) => {
  const today = startOfDay(new Date());
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(today, index - 6);
    const dayLong = new Intl.DateTimeFormat('es-PY', { weekday: 'long' }).format(date);
    const dayShort = new Intl.DateTimeFormat('es-PY', { weekday: 'short' }).format(date).replace('.', '');
    return {
      key: dateKey(date),
      dayLabel: `${dayLong.charAt(0).toUpperCase()}${dayLong.slice(1)}`,
      dayShortLabel: `${dayShort.charAt(0).toUpperCase()}${dayShort.slice(1)}`,
      dateLabel: new Intl.DateTimeFormat('es-PY', { day: '2-digit', month: '2-digit' }).format(date),
      value: 0,
    };
  });
  const byKey = new Map(days.map((day) => [day.key, day]));

  orders
    .filter((order) => isPaid(order) && !isCancelled(order))
    .forEach((order) => {
      const date = toDate(order.createdAt);
      const item = byKey.get(dateKey(date));
      if (item) item.value += getOrderTotal(order);
    });

  return days;
};

const getProductRanking = (orders) => {
  const totals = new Map();

  orders
    .filter((order) => !isCancelled(order))
    .forEach((order) => {
      (order.items || []).forEach((item) => {
        const key = item.productId || item.name;
        const current = totals.get(key) || { name: item.name || 'Producto', quantity: 0 };
        current.quantity += getItemQuantity(item);
        totals.set(key, current);
      });
    });

  return [...totals.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 5);
};

const getCategorySales = (orders) => {
  const totals = new Map();

  orders
    .filter((order) => isPaid(order) && !isCancelled(order))
    .forEach((order) => {
      (order.items || []).forEach((item) => {
        const category = item.category || 'Sin categoría';
        totals.set(category, (totals.get(category) || 0) + Number(item.subtotal || 0));
      });
    });

  return [...totals.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
};

export default function OrderList() {
  const { items: orders, syncing, error } = useOrders();
  const todayValue = toInputDate(new Date());
  const [dateFilter, setDateFilter] = useState('7days');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [customFrom, setCustomFrom] = useState(todayValue);
  const [customTo, setCustomTo] = useState(todayValue);
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [cancelledOpen, setCancelledOpen] = useState(false);

  const filteredOrders = useMemo(
    () =>
      orders
        .filter((order) => isWithinDateFilter(order, dateFilter, customFrom, customTo))
        .filter((order) => isWithinStatusFilter(order, statusFilter))
        .filter((order) => isWithinTypeFilter(order, typeFilter))
        .sort((a, b) => (toDate(b.createdAt)?.getTime() || 0) - (toDate(a.createdAt)?.getTime() || 0)),
    [orders, dateFilter, statusFilter, typeFilter, customFrom, customTo],
  );

  const visibleOrders = filteredOrders.filter((order) => !isCancelled(order));
  const cancelledOrders = filteredOrders.filter(isCancelled);
  const dateGroups = dateFilter === '7days' ? buildWeekDateGroups(visibleOrders) : groupByDate(visibleOrders);
  const summary = summarizeOrders(filteredOrders);
  const salesByDay = getLastSevenDaySales(filteredOrders);
  const productRanking = getProductRanking(filteredOrders);
  const categorySales = getCategorySales(filteredOrders);
  const statusSummary = [
    { label: 'Pagados', value: summary.paidCount, tone: 'paid' },
    { label: 'Pendientes', value: summary.pendingCount, tone: 'pending' },
    { label: 'Cancelados', value: summary.cancelledCount, tone: 'cancelled' },
  ];

  const toggleGroup = (key, defaultOpen) => {
    setCollapsedGroups((current) => ({
      ...current,
      [key]: !(current[key] ?? defaultOpen),
    }));
  };

  return (
    <div className="admin-page orders-page orders-analytics-page">
      <header className="orders-analytics-header">
        <div>
          <span>Control comercial</span>
          <h1>Pedidos</h1>
          <p>Control comercial y registro de ventas</p>
        </div>

        <div className="orders-filter-group" aria-label="Filtros rápidos de fecha">
          {dateFilters.map((filter) => (
            <button
              className={dateFilter === filter.value ? 'is-active' : ''}
              type="button"
              key={filter.value}
              onClick={() => setDateFilter(filter.value)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </header>

      <section className="orders-filter-panel" aria-label="Filtros de análisis">
        {dateFilter === 'custom' && (
          <div className="orders-custom-range">
            <label>
              Desde
              <input type="date" value={customFrom} onChange={(event) => setCustomFrom(event.target.value)} />
            </label>
            <label>
              Hasta
              <input type="date" value={customTo} onChange={(event) => setCustomTo(event.target.value)} />
            </label>
          </div>
        )}

        <FilterSegment label="Estado" value={statusFilter} options={statusFilters} onChange={setStatusFilter} />
        <FilterSegment label="Tipo" value={typeFilter} options={typeFilters} onChange={setTypeFilter} />
      </section>

      {syncing && (
        <div className="admin-inline-sync">
          <span />
          Sincronizando pedidos...
        </div>
      )}
      {error && <div className="admin-error">{error}</div>}

      <section className="orders-date-stack" aria-label="Pedidos agrupados por fecha">
        {dateGroups.map((group, index) => {
          const defaultOpen = dateFilter === '7days' ? index === 0 : index === 0;
          const isOpen = collapsedGroups[group.key] ?? defaultOpen;
          const groupSummary = summarizeOrders(group.orders);

          return (
            <article className="orders-date-group" key={group.key}>
              <button className="orders-date-toggle" type="button" onClick={() => toggleGroup(group.key, defaultOpen)}>
                <div>
                  <strong>{group.label || dateLabel(group.date)}</strong>
                  <span>
                    {groupSummary.count} pedidos · {formatMoney(groupSummary.paidSales)} · {groupSummary.paidCount} pagados ·{' '}
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

      <section className="orders-commercial-cards" aria-label="Resumen comercial">
        <MetricCard icon={WalletCards} label="Ventas pagadas" value={formatMoney(summary.paidSales)} detail="No incluye cancelados" />
        <MetricCard icon={ClipboardList} label="Pedidos" value={summary.count} detail={`${summary.paidCount} pagados`} />
        <MetricCard icon={TrendingUp} label="Ticket promedio" value={formatMoney(summary.averageTicket)} detail="Ventas / pagados" />
        <MetricCard icon={XCircle} label="Cancelados" value={summary.cancelledCount} detail={formatMoney(summary.cancelledAmount)} />
        <MetricCard
          icon={Package}
          label="Producto más vendido"
          value={summary.topProduct?.name || 'Sin datos'}
          detail={summary.topProduct ? `${summary.topProduct.quantity} unidades` : 'Sin ventas registradas'}
        />
        <MetricCard
          icon={Package}
          label="Producto menos vendido"
          value={summary.bottomProduct?.name || 'Sin datos'}
          detail={summary.bottomProduct ? `${summary.bottomProduct.quantity} unidades` : 'Sin ventas registradas'}
        />
      </section>

      <section className="orders-chart-grid" aria-label="Gráficos comerciales">
        <SalesBars title="Ventas por día" data={salesByDay} />
        <StatusBars title="Pedidos por estado" data={statusSummary} />
        <RankingBars title="Productos más vendidos" data={productRanking.map((item) => ({ label: item.name, value: item.quantity }))} />
        <RankingBars title="Ventas por categoría" data={categorySales.map((item) => ({ label: item.name, value: item.value }))} money />
      </section>
    </div>
  );
}

function FilterSegment({ label, value, options, onChange }) {
  return (
    <div className="orders-filter-segment">
      <span>{label}</span>
      <div>
        {options.map((option) => (
          <button
            className={value === option.value ? 'is-active' : ''}
            type="button"
            key={option.value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, detail }) {
  return (
    <article className="orders-metric-card">
      <span><Icon size={18} /></span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
        <em>{detail}</em>
      </div>
    </article>
  );
}

function OrderRecord({ order }) {
  const items = order.items || [];
  const itemCount = items.reduce((sum, item) => sum + getItemQuantity(item), 0);
  const customerName = getCustomerName(order);

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
        <Badge tone={isPaid(order) ? 'paid' : 'pending'}>{isPaid(order) ? 'Pagado' : 'Pendiente de pago'}</Badge>
        {order.paymentMethod && <span>{order.paymentMethod}</span>}
        <span>{itemCount} productos</span>
      </div>

      <div className="orders-record-items">
        {items.slice(0, 4).map((item, index) => (
          <span key={`${item.productId || item.name}-${index}`}>{item.quantity}x {item.name}</span>
        ))}
        {items.length > 4 && <span>+{items.length - 4} productos más</span>}
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
        {items.length > 4 && <span>+{items.length - 4} productos más</span>}
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

function SalesBars({ title, data }) {
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <article className="orders-chart-card">
      <ChartTitle title={title} />
      <div className="orders-sales-bars">
        {data.map((item) => (
          <div className="orders-sales-bar" key={item.key}>
            <div style={{ height: `${Math.max(6, (item.value / max) * 100)}%` }} />
            <span className="orders-sales-label">
              <strong className="orders-sales-day-full">{item.dayLabel}</strong>
              <strong className="orders-sales-day-short">{item.dayShortLabel}</strong>
              <small>{item.dateLabel}</small>
            </span>
          </div>
        ))}
      </div>
    </article>
  );
}

function StatusBars({ title, data }) {
  const total = Math.max(data.reduce((sum, item) => sum + item.value, 0), 1);

  return (
    <article className="orders-chart-card">
      <ChartTitle title={title} />
      <div className="orders-horizontal-bars">
        {data.map((item) => (
          <ChartBar key={item.label} label={item.label} value={item.value} percent={(item.value / total) * 100} tone={item.tone} />
        ))}
      </div>
    </article>
  );
}

function RankingBars({ title, data, money = false }) {
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <article className="orders-chart-card">
      <ChartTitle title={title} />
      <div className="orders-horizontal-bars">
        {data.length > 0 ? (
          data.map((item) => (
            <ChartBar
              key={item.label}
              label={item.label}
              value={money ? formatMoney(item.value) : item.value}
              percent={(item.value / max) * 100}
              tone="neutral"
            />
          ))
        ) : (
          <div className="orders-muted-box">Sin datos suficientes.</div>
        )}
      </div>
    </article>
  );
}

function ChartTitle({ title }) {
  return (
    <header className="orders-chart-title">
      <BarChart3 size={18} />
      <strong>{title}</strong>
    </header>
  );
}

function ChartBar({ label, value, percent, tone }) {
  return (
    <div className={`orders-chart-row is-${tone}`}>
      <div>
        <span>{label}</span>
        <b>{value}</b>
      </div>
      <em>
        <i style={{ width: `${Math.max(4, percent)}%` }} />
      </em>
    </div>
  );
}
