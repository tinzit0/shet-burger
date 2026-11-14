import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Clock3, Download, MessageCircle, TrendingDown, TrendingUp } from 'lucide-react';
import { ORDER_STAGES, getOrderStage } from '../lib/orderStatus';
import { couponPerformance, customerInsights, daySummary, hourlyOrders, kitchenQueue, ordersCsv, productRanking, whatsappLink } from '../lib/insights';

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

export function AdminSummary({ orders, products }) {
  const now = useNow(60000);
  const [range, setRange] = useState(7);
  const day = useMemo(() => daySummary(orders, now), [orders, now]);
  const hourly = useMemo(() => hourlyOrders(orders, now), [orders, now]);
  const ranking = useMemo(() => productRanking(orders, products, now, range), [orders, products, now, range]);
  const coupons = useMemo(() => couponPerformance(orders), [orders]);
  const customers = useMemo(() => customerInsights(orders, now), [orders, now]);
  const topMax = Math.max(1, ...ranking.top.map(p => p.quantity));
  const download = () => {
    const blob = new Blob([ordersCsv(orders)], { type: 'text/csv;charset=utf-8' }), url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = `pedidos-shet-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(url);
  };
  const Trend = day.change > 0 ? TrendingUp : TrendingDown;
  return <section className="admin-insights">
    <div className="admin-section-title"><h2>Resumen del negocio</h2><button type="button" className="insight-button" onClick={download} disabled={!orders.length}><Download/> EXPORTAR PEDIDOS (EXCEL)</button></div>

    <div className="insight-kpis">
      <article><span>Ventas de hoy</span><strong>{money(day.sales)}</strong>{day.change === null ? <small>Sin datos del {new Date(now).toLocaleDateString('es-CL', { weekday: 'long' })} pasado</small> : <small className={day.change >= 0 ? 'is-up' : 'is-down'}><Trend/> {day.change >= 0 ? '+' : ''}{day.change}% vs. el {new Date(now).toLocaleDateString('es-CL', { weekday: 'long' })} pasado a esta hora</small>}</article>
      <article><span>Pedidos de hoy</span><strong>{day.orders}</strong><small>{day.delivery} delivery · {day.orders - day.delivery} retiro</small></article>
      <article><span>Ticket promedio</span><strong>{money(day.average)}</strong><small>Lo que gasta cada cliente hoy</small></article>
      <article><span>Hora peak</span><strong>{hourly.peakHour === null ? '—' : hourLabel(hourly.peakHour)}</strong><small>{hourly.peakHour === null ? 'Aún faltan datos de semanas anteriores' : 'Ten la plancha lista antes de esa hora'}</small></article>
    </div>

    <article className="insight-card"><header><h3>Pedidos por hora</h3><p>Compara el ritmo de hoy con un {new Date(now).toLocaleDateString('es-CL', { weekday: 'long' })} normal.</p></header><HourChart hours={hourly.hours}/></article>

    <div className="insight-grid">
      <article className="insight-card"><header><h3>Lo más vendido</h3><div className="insight-range" role="group" aria-label="Período">{[7, 30].map(d => <button type="button" key={d} className={range === d ? 'active' : ''} onClick={() => setRange(d)}>{d} DÍAS</button>)}</div></header>
        {ranking.top.length ? <ol className="insight-rank">{ranking.top.slice(0, 6).map(p => <li key={p.id}><div><strong>{p.name}</strong><span>{p.quantity} u. · {money(p.revenue)}</span></div><i style={{ width: `${p.quantity / topMax * 100}%` }}/></li>)}</ol> : <p className="insight-empty">Sin ventas en este período.</p>}
        {ranking.stale.length > 0 && <div className="insight-tip"><AlertTriangle/><p><strong>{ranking.stale.length} productos sin ventas en {range} días:</strong> {ranking.stale.slice(0, 6).map(p => p.name).join(', ')}{ranking.stale.length > 6 ? '…' : ''}. Prueba una promoción o destácalos en la página.</p></div>}
      </article>

      <article className="insight-card"><header><h3>¿Funcionan tus cupones?</h3><p>Uso real en pedidos.</p></header>
        {coupons.length ? <table className="insight-table"><thead><tr><th>Código</th><th>Usos</th><th>Descontado</th><th>Vendido</th></tr></thead><tbody>{coupons.map(c => <tr key={c.code}><td>{c.code}</td><td>{c.uses}</td><td>{money(c.discount)}</td><td>{money(c.sales)}</td></tr>)}</tbody></table> : <p className="insight-empty">Todavía ningún pedido usó un cupón.</p>}
      </article>
    </div>

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
          <footer><em>{order.status}</em>{next && <button type="button" disabled={busyId === order.id} onClick={() => onAdvance(order, next)}>{busyId === order.id ? 'GUARDANDO…' : `→ ${next.status.toUpperCase()}`}</button>}</footer>
        </article>;
      })}</div>
    </>}
  </section>;
}
