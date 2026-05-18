import {
  BarChart3,
  ClipboardList,
  Package,
  TrendingUp,
  WalletCards,
  XCircle,
} from 'lucide-react';
import { useMemo } from 'react';
import { useOrders } from '../../hooks/useOrders';
import { formatPrice } from '../../utils/format';

const toDate = (value) => {
  const date = value?.toDate ? value.toDate() : value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
};

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const dateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatMoney = (value) => `${formatPrice(value)} Gs`;

const getOrderTotal = (order) => Number(order.total || 0);

const getItemQuantity = (item) => Number(item.quantity || 0);

const isCancelled = (order) =>
  ['cancelado', 'cancelled', 'deleted_by_barista'].includes(order.status) || order.deletedFromBaristaView === true;

const isPaid = (order) =>
  ['pagado', 'paid'].includes(order.paymentStatus) || ['pagado', 'paid'].includes(order.status);

const isCurrentMonth = (order) => {
  const date = toDate(order.createdAt);
  if (!date) return false;

  const today = new Date();
  return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth();
};

const summarizeOrders = (orders) => {
  const paidOrders = orders.filter((order) => isPaid(order) && !isCancelled(order));
  const pendingOrders = orders.filter((order) => !isPaid(order) && !isCancelled(order));
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

const getMonthDaySales = (orders) => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, index) => {
    const date = new Date(year, month, index + 1);
    const dayShort = new Intl.DateTimeFormat('es-PY', { weekday: 'short' }).format(date).replace('.', '');
    return {
      key: dateKey(date),
      dayLabel: String(index + 1).padStart(2, '0'),
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
      if (!date) return;
      const item = byKey.get(dateKey(startOfDay(date)));
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
        const category = item.category || 'Sin categoria';
        totals.set(category, (totals.get(category) || 0) + Number(item.subtotal || 0));
      });
    });

  return [...totals.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
};

export default function AdminReports() {
  const { items: orders, syncing, error } = useOrders();
  const monthlyOrders = useMemo(() => orders.filter(isCurrentMonth), [orders]);
  const summary = summarizeOrders(monthlyOrders);
  const salesByDay = getMonthDaySales(monthlyOrders);
  const productRanking = getProductRanking(monthlyOrders);
  const categorySales = getCategorySales(monthlyOrders);
  const monthLabel = new Intl.DateTimeFormat('es-PY', { month: 'long', year: 'numeric' }).format(new Date());
  const statusSummary = [
    { label: 'Pagados', value: summary.paidCount, tone: 'paid' },
    { label: 'Pendientes', value: summary.pendingCount, tone: 'pending' },
    { label: 'Cancelados', value: summary.cancelledCount, tone: 'cancelled' },
  ];

  return (
    <div className="admin-page orders-page orders-analytics-page reports-page">
      <header className="orders-analytics-header">
        <div>
          <span>Informes comerciales</span>
          <h1>Informes</h1>
          <p>Resumen del mes actual: {monthLabel}</p>
        </div>
      </header>

      {syncing && (
        <div className="admin-inline-sync">
          <span />
          Sincronizando informes...
        </div>
      )}
      {error && <div className="admin-error">{error}</div>}

      <section className="orders-commercial-cards" aria-label="Resumen comercial mensual">
        <MetricCard icon={WalletCards} label="Ventas pagadas de este mes" value={formatMoney(summary.paidSales)} detail="No incluye cancelados" />
        <MetricCard icon={ClipboardList} label="Pedidos de este mes" value={summary.count} detail={`${summary.paidCount} pagados`} />
        <MetricCard icon={TrendingUp} label="Ticket promedio de este mes" value={formatMoney(summary.averageTicket)} detail="Ventas / pagados" />
        <MetricCard icon={XCircle} label="Cancelados de este mes" value={summary.cancelledCount} detail={formatMoney(summary.cancelledAmount)} />
        <MetricCard
          icon={Package}
          label="Producto mas vendido de este mes"
          value={summary.topProduct?.name || 'Sin datos'}
          detail={summary.topProduct ? `${summary.topProduct.quantity} unidades` : 'Sin ventas registradas'}
        />
        <MetricCard
          icon={Package}
          label="Producto menos vendido de este mes"
          value={summary.bottomProduct?.name || 'Sin datos'}
          detail={summary.bottomProduct ? `${summary.bottomProduct.quantity} unidades` : 'Sin ventas registradas'}
        />
      </section>

      <section className="orders-chart-grid" aria-label="Graficos comerciales mensuales">
        <SalesBars title="Ventas por dia" data={salesByDay} />
        <StatusBars title="Pedidos por estado" data={statusSummary} />
        <RankingBars title="Productos mas vendidos" data={productRanking.map((item) => ({ label: item.name, value: item.quantity }))} />
        <RankingBars title="Ventas por categoria" data={categorySales.map((item) => ({ label: item.name, value: item.value }))} money />
      </section>
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

function SalesBars({ title, data }) {
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <article className="orders-chart-card">
      <ChartTitle title={title} />
      <div className="orders-sales-bars reports-sales-bars" style={{ '--report-days': data.length }}>
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
