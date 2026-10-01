import { Check, Clock3, MapPin, X } from 'lucide-react';
import { useEffect } from 'react';
import { getOrderStage, ORDER_STAGES } from '../lib/orderStatus';
import { getDeliveryZoneFromAddress } from '../lib/delivery';
import { business, directionsUrl } from '../config';

const money = value => `$${Number(value || 0).toLocaleString('es-CL')}`;
const stages = ORDER_STAGES.map(item => item.status);

export default function OrderTracker({ order, onClose }) {
  useEffect(()=>{document.body.style.overflow='hidden';const escape=event=>{if(event.key==='Escape')onClose()};window.addEventListener('keydown',escape);return()=>{document.body.style.overflow='';window.removeEventListener('keydown',escape)}},[onClose]);
  if (!order) return null;
  const currentStage=getOrderStage(order);
  const isDelivery=(order.mode||order.fulfillment)==='delivery';
  const address=order.customer?.address||order.address||'';
  const deliveryZone=isDelivery?getDeliveryZoneFromAddress(address):null;
  return <div className="tracker-overlay" role="dialog" aria-modal="true" aria-label="Estado de tu pedido">
    <button className="tracker-backdrop" onClick={onClose} aria-label="Cerrar seguimiento"/>
    <aside className="tracker-panel">
      <header><div><small>SEGUIMIENTO · #{order.order_number||order.id}</small><h2>Tu pedido<br/><em>va en camino.</em></h2></div><button onClick={onClose} aria-label="Cerrar"><X/></button></header>
      <div className="tracker-status"><div className="tracker-status__top"><span>ESTADO ACTUAL</span><b>{order.status}</b></div><div className="tracker-line">{stages.map((stage,index)=><div className={`tracker-stage${index<=currentStage?' is-done':''}${index===currentStage?' is-current':''}`} key={stage}><div>{index<currentStage?<Check/>:index===currentStage?<Clock3/>:<span>{index+1}</span>}</div><p>{stage}</p></div>)}</div></div>
      <section className="tracker-receipt"><div className="tracker-receipt__heading"><h3>Recibo del pedido</h3><span>{isDelivery?'A DOMICILIO':'RETIRO'}</span></div>{order.items.map((item,index)=><div className="tracker-item" key={item.product?.id||index}><span>{item.quantity} × {item.product?.name||item.name}</span><b>{money(item.price*item.quantity)}</b></div>)}{deliveryZone&&<div className="tracker-item tracker-item--delivery"><span>Despacho · {deliveryZone.label}</span><b>{money(deliveryZone.fee)}</b></div>}<div className="tracker-total"><span>Total pagado</span><strong>{money(order.total)}</strong></div></section>
      <div className="tracker-info"><MapPin/><div><b>{isDelivery?'Entrega a domicilio':'Retiro en el carrito SHET'}</b><span>{isDelivery?address:business.pickupAddress}</span><small>{order.customer?.name||order.customer_name} · {order.customer?.phone||order.customer_phone}</small>{!isDelivery&&<a href={directionsUrl} target="_blank" rel="noreferrer">CÓMO LLEGAR ↗</a>}</div></div>
    </aside>
  </div>;
}
