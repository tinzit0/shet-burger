import { Check, Clock3, MapPin, X } from 'lucide-react';
import { useEffect } from 'react';
import { getOrderStage, isAwaitingPayment, ORDER_STAGES, isDeliveryOrder, orderStatusLabel, stageLabel } from '../lib/orderStatus';
import { displayDeliveryAddress, getDeliveryZoneFromAddress, DELIVERY_ZONES } from '../lib/delivery';
import { business, directionsUrl } from '../config';
import LoopClip from './LoopClip';

const money = value => `$${Number(value || 0).toLocaleString('es-CL')}`;
// El título sigue al estado actual del pedido.
const stageTitle = (stage, delivery, awaiting) => [awaiting ? 'espera confirmar el pago.' : 'tiene el pago confirmado.', 'está en preparación.', delivery ? 'está listo para reparto.' : 'está listo para retiro.', 'fue entregado.'][stage] || 'está recibido.';

export default function OrderTracker({ order, onClose ,zones=DELIVERY_ZONES}) {
  useEffect(()=>{document.body.style.overflow='hidden';const escape=event=>{if(event.key==='Escape')onClose()};window.addEventListener('keydown',escape);return()=>{document.body.style.overflow='';window.removeEventListener('keydown',escape)}},[onClose]);
  if (!order) return null;
  const currentStage=getOrderStage(order);
  const isDelivery=isDeliveryOrder(order);
  const stages=ORDER_STAGES.map(item=>stageLabel(item.stage,order));
  const address=order.customer?.address||order.address||'';
  const deliveryZone=isDelivery?getDeliveryZoneFromAddress(address,zones):null;
  return <div className="tracker-overlay" role="dialog" aria-modal="true" aria-label="Estado de tu pedido">
    <button className="tracker-backdrop" onClick={onClose} aria-label="Cerrar seguimiento"/>
    <aside className="tracker-panel">
      <header><div><small>SEGUIMIENTO · #{order.order_number||order.id}</small><h2>Tu pedido<br/><em>{stageTitle(currentStage,isDelivery,isAwaitingPayment(order))}</em></h2></div><button onClick={onClose} aria-label="Cerrar"><X/></button></header>
      <div className="tracker-status"><div className="tracker-status__top"><span>ESTADO ACTUAL</span><b>{orderStatusLabel(order)}</b></div><div className="tracker-line">{stages.map((stage,index)=><div className={`tracker-stage${index<=currentStage?' is-done':''}${index===currentStage?' is-current':''}`} key={stage}><div>{index<currentStage?<Check/>:index===currentStage?<Clock3/>:<span>{index+1}</span>}</div><p>{stage}</p></div>)}</div></div>
      <section className="tracker-receipt"><div className="tracker-receipt__heading"><h3>Recibo del pedido</h3><span>{isDelivery?'A DOMICILIO':'RETIRO'}</span></div>{order.items.map((item,index)=><div className="tracker-item-detail" key={item.product?.id||index}><div className="tracker-item"><span>{item.quantity} × {item.product?.name||item.name}</span><b>{money(item.price*item.quantity)}</b></div>{item.burger_choices?.length>0&&<small>Hamburguesas: {item.burger_choices.join(', ')}</small>}{item.selections?.map(selection=><small key={`${selection.label}-${selection.value}`}>{selection.label}: {selection.value}</small>)}{item.note&&<small>Nota: {item.note}</small>}</div>)}{deliveryZone&&<div className="tracker-item tracker-item--delivery"><span>Despacho · {deliveryZone.label}</span><b>{money(deliveryZone.fee)}</b></div>}{order.coupon_code&&<div className="tracker-item coupon-discount"><span>Cupón {order.coupon_code}</span><b>-{money(order.discount_amount)}</b></div>}<div className="tracker-total"><span>Total pagado</span><strong>{money(order.total)}</strong></div></section>
      <div className="tracker-info"><MapPin/><div><b>{isDelivery?'Entrega a domicilio':'Retiro en el carrito SHET'}</b><span>{isDelivery?displayDeliveryAddress(address):business.pickupAddress}</span><small>{order.customer?.name||order.customer_name} · {order.customer?.phone||order.customer_phone}</small>{!isDelivery&&<a href={directionsUrl} target="_blank" rel="noreferrer">CÓMO LLEGAR ↗︎</a>}</div><LoopClip clip={isDelivery?'delivery':'pickup'} className={`tracker-info__clip is-${isDelivery?'delivery':'pickup'}`} label={isDelivery?'Auto de reparto SHET avanzando por la calle con tu pedido':'Hamburguesa SHET con tu pedido listo para retirar'}/></div>
    </aside>
  </div>;
}
