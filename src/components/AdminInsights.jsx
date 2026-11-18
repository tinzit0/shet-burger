import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Clock3, Download, MessageCircle, TrendingDown, TrendingUp } from 'lucide-react';
import { ORDER_STAGES, getOrderStage, orderStatusLabel, stageLabel } from '../lib/orderStatus';
import { categorySales, couponPerformance, customerInsights, dailySales, hourlyOrders, kitchenQueue, ordersCsv, PERIODS, periodSummary, productRanking, weekdaySales, whatsappLink } from '../lib/insights';

const DAY_MS = 86400000;
const DAY_NAMES = { Lun: 'lunes', Mar: 'martes', Mié: 'miércoles', Jue: 'jueves', Vie: 'viernes', Sáb: 'sábado', Dom: 'domingo' };

const money = value => `$${Math.round(Number(value || 0)).toLocaleString('es-CL')}`;
const hourLabel = h => `${String(h).padStart(2, '0')}:00`;

// Reloj compartido: los minutos de espera se actualizan solos sin recargar.
export function useNow(interval = 30000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), interval); return () => clearInterval(id); }, [interval]);
  return now;
}

function HourChart({ hours }) {
  // Solo el horario con movimiento, para que las barras no sean hilos.
  const used = hours.filter(h => h.today || h.typical);
  const from = used.length ? Math.max(0, Math.min(...used.map(h => h.hour)) - 1) : 11;
  const to = used.length ? Math.min(23, Math.max(...used.map(h => h.hour)) + 1) : 23;
  const shown = hours.slice(from, to + 1), max = Math.max(1, ...shown.map(h => Math.max(h.today, h.typical)));
  return <div className="insight-chart" role="img" aria-label="Pedidos por hora de hoy comparados con un día normal">
    <div className="insight-chart__legend"><span><i className="is-today"/>Hoy</span><span><i className="is-typical"/>Promedio del mismo día (4 semanas)</span></div>
    <div className="insight-chart__bars">{shown.map(h => <div className="insight-chart__col" key={h.hour} tabIndex={0}>
      <div className="insight-chart__tip"><strong>{hourLabel(h.hour)}</strong><span>Hoy: {h.today}</span><span>Normal: {h.typical}</span></div>
      <div className="insight-chart__pair"><b className="is-typical" style={{ height: `${h.typical / max * 100}%` }}/><b className="is-today" style={{ height: `${h.today / max * 100}%` }}/></div>
      <small>{h.hour}</small>
    </div>)}</div>
  </div>;
}

// Barras de una sola serie con tooltip por barra (ventas por día, por día de la semana).
function BarChart({ rows, label, labelEvery = 1 }) {
  const max = Math.max(1, ...rows.map(r => r.value));
  return <div className="insight-chart insight-chart--single" role="img" aria-label={label}>
    <div className="insight-chart__bars">{rows.map((r, i) => <div className={`insight-chart__col${r.current ? ' is-current' : ''}`} key={r.key} tabIndex={0} aria-label={r.tip.join(', ')}>
      <div className="insight-chart__tip">{r.tip.map((line, j) => j ? <span key={j}>{line}</span> : <strong key={j}>{line}</strong>)}</div>
      <div className="insight-chart__pair"><b className="is-today" style={{ height: `${r.value / max * 100}%` }}/></div>
      <small className={i % labelEvery && i !== rows.length - 1 ? 'is-hidden' : ''}>{r.label}</small>
    </div>)}</div>
  </div>;
}

function Change({ value, compare }) {
  if (value === null) return <small>Sin datos para comparar con {compare}</small>;
  const Icon = value >= 0 ? TrendingUp : TrendingDown;
  return <small className={value >= 0 ? 'is-up' : 'is-down'}><Icon/> {value >= 0 ? '+' : ''}{value}% vs. {compare}</small>;
}

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

export function AdminSummary({ orders, products, allOrders = orders }) {
  const now = useNow(60000);
  const [period, setPeriod] = useState('7');
  const stats = useMemo(() => periodSummary(orders, period, now, allOrders), [orders, period, now, allOrders]);
  const { range } = stats, days = (now - range.start) / DAY_MS;
  const daily = useMemo(() => dailySales(orders, period, now), [orders, period, now]);
  const weekdays = useMemo(() => weekdaySales(orders, now), [orders, now]);
  const categories = useMemo(() => categorySales(orders, products, range.start, now), [orders, products, range.start, now]);
  const hourly = useMemo(() => hourlyOrders(orders, now), [orders, now]);
  const ranking = useMemo(() => productRanking(orders, products, now, days), [orders, products, now, days]);
  const coupons = useMemo(() => couponPerformance(orders.filter(o => new Date(o.created_at || now).getTime() >= range.start)), [orders, range.start, now]);
  const customers = useMemo(() => customerInsights(orders, now), [orders, now]);
  const periodLabel = PERIODS.find(p => p.id === period).label.toLowerCase();
  const topMax = Math.max(1, ...ranking.top.map(p => p.quantity)), catMax = Math.max(1, ...categories.map(c => c.revenue));
  const bestDay = weekdays.reduce((best, d) => d.sales > best.sales ? d : best, weekdays[0]);
  const dailyTotal = daily.reduce((t, d) => t + d.sales, 0);
  const share = channel => stats.orders ? Math.round(channel.orders / stats.orders * 100) : 0;
  const download = () => {
    const blob = new Blob([ordersCsv(orders)], { type: 'text/csv;charset=utf-8' }), url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = `pedidos-shet-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(url);
  };
  return <section className="admin-insights">
    <div className="admin-section-title"><h2>Resumen del negocio</h2><button type="button" className="insight-button" onClick={download} disabled={!orders.length}><Download/> EXPORTAR PEDIDOS (EXCEL)</button></div>
    <div className="insight-range insight-range--period" role="group" aria-label="Período de las estadísticas">{PERIODS.map(p => <button type="button" key={p.id} className={period === p.id ? 'active' : ''} aria-pressed={period === p.id} onClick={() => setPeriod(p.id)}>{p.label.toUpperCase()}</button>)}</div>

    <div className="insight-kpis">
      <article><span>Ventas · {periodLabel}</span><strong>{money(stats.sales)}</strong><Change value={stats.change.sales} compare={range.compare}/></article>
      <article><span>Pedidos</span><strong>{stats.orders}</strong><Change value={stats.change.orders} compare={range.compare}/></article>
      <article><span>Ticket promedio</span><strong>{money(stats.average)}</strong><Change value={stats.change.average} compare={range.compare}/></article>
      <article><span>Productos vendidos</span><strong>{stats.units}</strong><small>{stats.orders ? `${(stats.units / stats.orders).toFixed(1).replace('.', ',')} por pedido` : 'Sin pedidos en el período'}</small></article>
      <article><span>Clientes</span><strong>{stats.customers}</strong><small>{plural(stats.newCustomers, 'nuevo', 'nuevos')} · {stats.returning} que vuelven</small></article>
      <article><span>Descuentos en cupones</span><strong>{money(stats.discount)}</strong><small>{plural(stats.couponOrders, 'pedido', 'pedidos')} con cupón</small></article>
      <article><span>Pedidos rechazados</span><strong>{stats.rejected}</strong><small>{stats.rejectedRate}% de los pedidos recibidos</small></article>
      <article><span>Hora peak</span><strong>{hourly.peakHour === null ? '—' : hourLabel(hourly.peakHour)}</strong><small>{hourly.peakHour === null ? 'Aún faltan datos de semanas anteriores' : 'Ten la plancha lista antes de esa hora'}</small></article>
    </div>

    <article className="insight-card"><header><h3>Ventas por día</h3><p>{period === 'today' ? 'Últimos 14 días' : `${money(dailyTotal)} en ${daily.length} días · promedio ${money(dailyTotal / daily.length)} diario`}</p></header>
      <BarChart label="Ventas por día" labelEvery={daily.length > 16 ? 5 : 1} rows={daily.map((d, i) => ({ key: d.date, value: d.sales, current: i === daily.length - 1, label: new Date(d.date).getDate(), tip: [new Date(d.date).toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' }), money(d.sales), plural(d.orders, 'pedido', 'pedidos')] }))}/>
    </article>

    <div className="insight-grid">
      <article className="insight-card"><header><h3>Delivery vs. retiro</h3><p>{periodLabel}</p></header>
        {stats.orders ? <><div className="insight-split" role="img" aria-label={stats.channels.map(c => `${c.label} ${share(c)}%`).join(', ')}>{stats.channels.filter(c => c.orders).map(c => <b key={c.id} className={`is-${c.id}`} style={{ flexGrow: c.orders }}/>)}</div>
          <ul className="insight-legend">{stats.channels.map(c => <li key={c.id}><i className={`is-${c.id}`}/><div><strong>{c.label} · {share(c)}%</strong><span>{plural(c.orders, 'pedido', 'pedidos')} · {money(c.sales)} · ticket {money(c.orders ? c.sales / c.orders : 0)}</span></div></li>)}</ul></> : <p className="insight-empty">Sin pedidos en este período.</p>}
      </article>
      <article className="insight-card"><header><h3>Ventas por categoría</h3><p>Antes de descuentos.</p></header>
        {categories.length ? <ol className="insight-rank">{categories.map(c => <li key={c.id}><div><strong>{c.label}</strong><span>{c.quantity} u. · {money(c.revenue)}</span></div><i style={{ width: `${c.revenue / catMax * 100}%` }}/></li>)}</ol> : <p className="insight-empty">Sin ventas en este período.</p>}
      </article>
    </div>

    <article className="insight-card"><header><h3>Pedidos por hora</h3><p>Compara el ritmo de hoy con un {new Date(now).toLocaleDateString('es-CL', { weekday: 'long' })} normal.</p></header><HourChart hours={hourly.hours}/></article>

    <div className="insight-grid">
      <article className="insight-card"><header><h3>Lo más vendido</h3><p>{periodLabel}</p></header>
        {ranking.top.length ? <ol className="insight-rank">{ranking.top.slice(0, 8).map(p => <li key={p.id}><div><strong>{p.name}</strong><span>{p.quantity} u. · {money(p.revenue)}</span></div><i style={{ width: `${p.quantity / topMax * 100}%` }}/></li>)}</ol> : <p className="insight-empty">Sin ventas en este período.</p>}
        {ranking.stale.length > 0 && period !== 'today' && <div className="insight-tip"><AlertTriangle/><p><strong>{ranking.stale.length} productos sin ventas ({periodLabel}):</strong> {ranking.stale.slice(0, 6).map(p => p.name).join(', ')}{ranking.stale.length > 6 ? '…' : ''}. Prueba una promoción o destácalos en la página.</p></div>}
      </article>
      <article className="insight-card"><header><h3>Mejores días</h3><p>Venta promedio · últimas 8 semanas</p></header>
        {bestDay.sales ? <><BarChart label="Venta promedio por día de la semana" rows={weekdays.map(d => ({ key: d.name, value: d.sales, label: d.name, tip: [d.name, money(d.sales), `${String(d.orders).replace('.', ',')} pedidos en promedio`] }))}/><p className="insight-note">Tu día más fuerte es el <strong>{DAY_NAMES[bestDay.name]}</strong>, con {money(bestDay.sales)} en promedio.</p></> : <p className="insight-empty">Aún no hay ventas suficientes.</p>}
      </article>
    </div>

    <article className="insight-card"><header><h3>¿Funcionan tus cupones?</h3><p>Uso real en pedidos · {periodLabel}</p></header>
      {coupons.length ? <table className="insight-table"><thead><tr><th>Código</th><th>Usos</th><th>Descontado</th><th>Vendido</th></tr></thead><tbody>{coupons.map(c => <tr key={c.code}><td>{c.code}</td><td>{c.uses}</td><td>{money(c.discount)}</td><td>{money(c.sales)}</td></tr>)}</tbody></table> : <p className="insight-empty">Ningún pedido usó un cupón en este período.</p>}
    </article>

    <article className="insight-card"><header><h3>Clientes</h3><p>{customers.total} clientes distintos · {customers.loyal.length} han vuelto a comprar.</p></header>
      <div className="insight-grid">
        <div><h4>Más fieles</h4>{customers.loyal.length ? <ul className="insight-people">{customers.loyal.slice(0, 5).map(c => <li key={c.phone}><div><strong>{c.name}</strong><span>{c.orders} pedidos · {money(c.spent)}</span></div><a href={whatsappLink(c.phone, `¡Hola ${c.name}! Gracias por preferir SHET BURGER 🍔`)} target="_blank" rel="noreferrer" aria-label={`Escribir a ${c.name} por WhatsApp`}><MessageCircle/></a></li>)}</ul> : <p className="insight-empty">Aún no hay clientes que repitan.</p>}</div>
        <div><h4>Para recuperar <small>(no compran hace 21+ días)</small></h4>{customers.sleeping.length ? <ul className="insight-people">{customers.sleeping.slice(0, 5).map(c => <li key={c.phone}><div><strong>{c.name}</strong><span>Hace {c.daysAway} días · {c.orders} pedidos</span></div><a href={whatsappLink(c.phone, `¡Hola ${c.name}! Te extrañamos en SHET BURGER 🍔 Vuelve esta semana y usa tu cupón de regreso.`)} target="_blank" rel="noreferrer" aria-label={`Invitar a ${c.name} a volver por WhatsApp`}><MessageCircle/></a></li>)}</ul> : <p className="insight-empty">Nadie se ha alejado. Buena señal.</p>}</div>
      </div>
    </article>
  </section>;
}

export function AdminKitchen({ orders, onAdvance, busyId }) {
  const now = useNow(15000);
  const queue = useMemo(() => kitchenQueue(orders, now), [orders, now]);
  return <section className="admin-kitchen">
    <div className="admin-section-title"><h2>Cocina</h2><span>{queue.orders.length} pedidos abiertos · {queue.orders.filter(o => o.late).length} {queue.orders.filter(o => o.late).length === 1 ? 'atrasado' : 'atrasados'}</span></div>
    {!queue.orders.length ? <div className="admin-empty"><Clock3/><h3>Todo al día. No hay pedidos por preparar.</h3></div> : <>
      <article className="insight-card kitchen-totals"><header><h3>Preparar ahora</h3><p>Suma de todos los pedidos abiertos.</p></header><ul>{queue.items.map(i => <li key={i.name}><b>{i.quantity}×</b> {i.name}</li>)}</ul></article>
      <div className="kitchen-tickets">{queue.orders.map(order => {
        const stage = getOrderStage(order), next = ORDER_STAGES[stage + 1];
        return <article key={order.id} className={`kitchen-ticket${order.late ? ' is-late' : ''}`}>
          <header><strong>#{order.order_number || order.id}</strong><span className="kitchen-timer"><Clock3/> {order.minutes} min</span></header>
          <p>{order.customer?.name || order.customer_name || 'Cliente'} · {(order.mode || order.fulfillment) === 'delivery' ? 'Delivery' : 'Retiro'}</p>
          <ul>{(order.items || []).map((item, i) => <li key={i}><b>{item.quantity}×</b> {item.product?.name || item.name}{item.variant ? ` (${item.variant})` : ''}{item.note && <small>Nota: {item.note}</small>}</li>)}</ul>
          <footer><em>{orderStatusLabel(order)}</em>{next && <button type="button" disabled={busyId === order.id} onClick={() => onAdvance(order, next)}>{busyId === order.id ? 'GUARDANDO…' : `→ ${stageLabel(next.stage, order).toUpperCase()}`}</button>}</footer>
        </article>;
      })}</div>
    </>}
  </section>;
}
