import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Copy, MapPin, Minus, Plus, ShoppingBag, Trash2, Upload, X } from 'lucide-react';
import { business, directionsUrl } from '../config';
import { calculateOrderTotal, composeDeliveryAddress, getDeliveryFee, getDeliveryZone, DELIVERY_UNAVAILABLE_MESSAGE, DELIVERY_ZONES } from '../lib/delivery';
import { zoneForPoint } from '../lib/geo';
const DeliveryMap = lazy(() => import('./DeliveryMap'));
import { lookupDeliveryAddress, reverseGeocode } from '../lib/addressLookup';
import { customizationUnavailable } from '../lib/customization';
import BurgerPhoto from './BurgerPhoto';
import { productImage } from '../lib/productImages';
import { findCoupon } from '../lib/coupons';
import { couponDiscount, couponError, couponConditions } from '../lib/couponRules';

const money=value=>`$${Number(value||0).toLocaleString('es-CL')}`;
const priceOf=item=>item.variant?.price??Number(item.product.prices[0][1].replace(/\D/g,''));
const allowedReceipts=['image/jpeg','image/png','image/webp','application/pdf'];
const upsellCategories=[['fritos','Fritos'],['bebidas','Bebidas'],['extras','Extras']];

export default function CartDrawer({zones=DELIVERY_ZONES,cart,onClose,onChange,onClear,onConfirm,onTrack,products=[],stock={},storeOpen=true,onAdd,onExplore}){
 const[step,setStep]=useState('cart'),[mode,setMode]=useState('delivery'),[sent,setSent]=useState(false),[receipt,setReceipt]=useState(null),[form,setForm]=useState({name:'',phone:'',zone:'',address:'',point:null}),[copied,setCopied]=useState(false),[saving,setSaving]=useState(false),[error,setError]=useState(''),[upsellCategory,setUpsellCategory]=useState('fritos');
 const[coupon,setCoupon]=useState(null),[couponCode,setCouponCode]=useState(''),[couponMessage,setCouponMessage]=useState(''),[couponBusy,setCouponBusy]=useState(false);
 const subtotal=cart.reduce((sum,item)=>sum+priceOf(item)*item.quantity,0);
 const deliveryFee=getDeliveryFee(mode,form.zone,zones);
 const couponContext={items:cart,mode,deliveryFee};
 const discount=couponDiscount(coupon,subtotal,Date.now(),couponContext);
 const total=calculateOrderTotal(subtotal,mode,form.zone,zones)-discount;
 const [addressLookup, setAddressLookup] = useState({ status: 'idle', message: '', formattedAddress: '' });
 const [lookupAttempt, setLookupAttempt] = useState(0);
 const paymentReady=mode==='pickup'||Boolean(form.zone && addressLookup.status === 'ready');
 const [addressFields, setAddressFields] = useState({ street: '', number: '', population: '' });
 const skipLookupRef = useRef(false), reverseRef = useRef(0), numberRef = useRef(null), pinnedRef = useRef(false);
 const [numberMissing, setNumberMissing] = useState(false);
 const updateAddress = (field, value) => {
   reverseRef.current++;
   if (field === 'number') setNumberMissing(false);
   const fields = { ...addressFields, [field]: value };
   setAddressFields(fields);
   // House number typed after choosing the spot on the map: keep that pin and its zone.
   if (field === 'number' && pinnedRef.current && form.point) {
     skipLookupRef.current = true;
     setForm(current => ({ ...current, address: composeDeliveryAddress(fields) }));
     setError('');
     return;
   }
   pinnedRef.current = false;
   setForm(current => ({ ...current, address: composeDeliveryAddress(fields), zone: '', point: null }));
   setAddressLookup({ status: 'idle', message: '', formattedAddress: '' });
   setError('');
 };
 useEffect(() => {
   if (mode !== 'delivery') return;
   // Fields just filled from the map pin: the zone is already known, don't search again.
   if (skipLookupRef.current) { skipLookupRef.current = false; return; }
   const address = form.address.trim();
   if (!addressFields.street.trim() || !/\d/.test(addressFields.number)) return;
   let cancelled = false;
   const controller = new AbortController();
   const timer = window.setTimeout(async () => {
     setForm(current => ({ ...current, zone: '', point: null }));
     setAddressLookup({ status: 'loading', message: '', formattedAddress: '' });
     try {
       const result = await lookupDeliveryAddress(address, { signal: controller.signal, zones });
       if (cancelled) return;
       setForm(current => ({ ...current, zone: result.zone.id, point: result.point }));
       setAddressLookup({ status: 'ready', message: result.precise ? '' : 'Ubicación aproximada: mueve el pin a tu casa para confirmar la zona.', formattedAddress: address });
     } catch (error) {
       if (cancelled) return;
       setForm(current => ({ ...current, point: error.point || null }));
       setAddressLookup({ status: error.code === 'DELIVERY_UNAVAILABLE' ? 'unavailable' : error.code === 'NEEDS_PIN' ? 'needs-pin' : 'error', message: error.message, formattedAddress: '' });
     }
   }, 900);
   return () => { cancelled = true; controller.abort(); window.clearTimeout(timer); };
 }, [form.address, addressFields.street, addressFields.number, mode, lookupAttempt, zones]);
 const pickPoint = point => {
   pinnedRef.current = true;
   const zone = zoneForPoint(point, zones);
   setForm(current => ({ ...current, point, zone: zone?.id || '' }));
   setAddressLookup(zone ? { status: 'ready', message: '', formattedAddress: form.address } : { status: 'unavailable', message: DELIVERY_UNAVAILABLE_MESSAGE, formattedAddress: '' });
   setError('');
   // Fill street and number from where the pin landed.
   const request = ++reverseRef.current;
   reverseGeocode(point).then(found => {
     if (!found || request !== reverseRef.current) return;
     const sameStreetNow = found.street.trim().toLowerCase() === addressFields.street.trim().toLowerCase();
     // The map has no house number here: ask for it instead of leaving it blank.
     if (!found.number && !(sameStreetNow && addressFields.number.trim())) { setNumberMissing(true); window.setTimeout(() => numberRef.current?.focus({ preventScroll: false }), 50); } else setNumberMissing(false);
     setAddressFields(current => {
       // Same street without a mapped number: keep what they typed. Another street: the old number no longer applies.
       const sameStreet = found.street.trim().toLowerCase() === current.street.trim().toLowerCase();
       const next = { ...current, street: found.street, number: found.number || (sameStreet ? current.number : '') };
       if (next.street === current.street && next.number === current.number) return current;
       skipLookupRef.current = true;
       setForm(prev => ({ ...prev, address: composeDeliveryAddress(next) }));
       return next;
     });
   });
 };
 const unavailableItems=cart.filter(item=>stock[item.product.id]===false||customizationUnavailable(item.customization,stock));
 const suggestions=storeOpen?products.filter(product=>product.category===upsellCategory&&stock[product.id]!==false&&!product.optionGroup).slice(0,4):[];
 useEffect(()=>{document.body.style.overflow='hidden';const escape=event=>{if(event.key==='Escape')onClose()};window.addEventListener('keydown',escape);return()=>{document.body.style.overflow='';window.removeEventListener('keydown',escape)}},[onClose]);
 const copy=async()=>{if(!paymentReady)return;await navigator.clipboard?.writeText(`${business.name}\n${business.bank}\n${business.account}\n${business.rut}\nMonto: ${money(total)}`);setCopied(true);window.setTimeout(()=>setCopied(false),1500)};
 const chooseReceipt=file=>{setError('');if(!file){setReceipt(null);return}if(file.size>8*1024*1024){setReceipt(null);setError('El comprobante no puede superar los 8 MB.');return}if(!allowedReceipts.includes(file.type)){setReceipt(null);setError('Usa un archivo JPG, PNG, WEBP o PDF.');return}setReceipt(file)};
 const submit=async event=>{event.preventDefault();setError('');if(!storeOpen){setError('La tienda está cerrada y no está recibiendo pedidos.');return}if(unavailableItems.length){setError('Retira o vuelve a elegir los productos agotados antes de continuar.');return}if(mode==='delivery'&&!form.zone){setError('Espera a que confirmemos tu dirección y el valor del delivery.');return}if(coupon&&couponError(coupon,subtotal,Date.now(),couponContext)){setError(couponError(coupon,subtotal,Date.now(),couponContext));return}setSaving(true);try{if(coupon){const fresh=await findCoupon(coupon.code);if(fresh.error)throw fresh.error;const issue=couponError(fresh.data,subtotal,Date.now(),couponContext);if(issue)throw new Error(issue);if(couponDiscount(fresh.data,subtotal,Date.now(),couponContext)!==discount){setCoupon(fresh.data);throw new Error('El descuento cambió. Revisa el total antes de enviar el pedido.')}}await onConfirm({coupon,mode,form:{...form,phone:`+569${form.phone}`},receipt});setSent(true)}catch(err){setError(err.message||'No se pudo enviar el pedido. Intenta nuevamente.')}finally{setSaving(false)}};
 const applyCoupon=async()=>{setCouponBusy(true);setCouponMessage('');try{const result=await findCoupon(couponCode);if(result.error)throw result.error;const issue=couponError(result.data,subtotal,Date.now(),couponContext);if(issue)throw new Error(issue);setCoupon(result.data);setCouponCode(result.data.code)}catch(error){setCouponMessage(error.message||'No se pudo validar el cupón.')}finally{setCouponBusy(false)}};
 const couponDetails=<section className="cart-coupon" aria-label="Cupón de descuento"><label htmlFor="cart-coupon-code">¿Tienes un cupón?</label><div><input id="cart-coupon-code" maxLength="30" placeholder="Ingresa tu código" value={couponCode} onChange={event=>{setCouponCode(event.target.value.toUpperCase());setCouponMessage('')}}/><button type="button" disabled={couponBusy||!couponCode.trim()} onClick={applyCoupon}>{couponBusy?'VALIDANDO...':'APLICAR'}</button></div>{coupon&&<p>{coupon.code} · {couponError(coupon,subtotal,Date.now(),couponContext)||('Ahorras '+money(discount))} <button type="button" onClick={()=>{setCoupon(null);setCouponCode('');setCouponMessage('')}}>Quitar</button></p>}{couponMessage&&<small role="alert">{couponMessage}</small>}{coupon&&<small>{couponConditions(coupon)}</small>}<small>Un cupón por pedido. Las condiciones dependen de la promo.</small></section>;
 const discountRow=discount>0?<div className="coupon-discount"><span>Cupón {coupon.code}</span><b>-{money(discount)}</b></div>:null;
 const viewStatus=()=>{onClose();onTrack?.()};
 const deliveryDetails = <section className="cart-delivery-details" aria-label="Entrega y valor del pedido">
   <div className="fulfillment-toggle"><button type="button" className={mode==='delivery'?'active':''} onClick={()=>{setMode('delivery');setError('')}}>A DOMICILIO<span>Calcula con tu dirección</span></button><button type="button" className={mode==='pickup'?'active':''} onClick={()=>{setMode('pickup');setError('')}}>RETIRO<span>Río Loa 130 · Sin costo</span></button></div>
   {mode==='delivery'?<>
     <div className="delivery-address-fields">
       <label htmlFor="order-delivery-street">Calle<input id="order-delivery-street" aria-describedby="delivery-address-help" required maxLength="80" autoComplete="address-line1" placeholder="Ej.: Río Itata" value={addressFields.street} onChange={event=>updateAddress('street',event.target.value)}/></label>
       <label htmlFor="order-delivery-number" className={numberMissing?'is-missing':''}>Número<input ref={numberRef} id="order-delivery-number" aria-invalid={numberMissing||undefined} aria-describedby={numberMissing?'delivery-number-missing':undefined} required maxLength="10" placeholder={numberMissing?'N° casa':'50'} pattern=".*[0-9].*" value={addressFields.number} onChange={event=>updateAddress('number',event.target.value)}/></label>
     </div>
     {numberMissing&&<p id="delivery-number-missing" className="delivery-number-missing" role="status">Ya marcamos tu calle en el mapa. <b>Escribe el número de tu casa</b> para que el repartidor la encuentre.</p>}
     <small id="delivery-address-help">Escribe tu calle y número; no hace falta la población. La ubicamos en el mapa y el despacho se cobra según la zona donde cae tu casa. Si el pin no quedó justo, tócalo o arrástralo.</small>
     <Suspense fallback={<div className="delivery-map delivery-map--loading">Cargando mapa…</div>}><DeliveryMap zones={zones} point={form.point} activeZoneId={form.zone} onPick={pickPoint}/></Suspense>
     <details className="delivery-coverage"><summary>Consultar zonas de reparto y tarifas</summary><ul>{zones.map(zone=><li key={zone.id}><span>{zone.label}</span><b>{money(zone.fee)}</b></li>)}</ul></details>
     <div className={`delivery-quote${paymentReady?' is-ready':''}${addressLookup.status==='unavailable'?' is-unavailable':''}`} role="status" aria-live="polite" aria-busy={addressLookup.status==='loading'}><MapPin aria-hidden="true"/><div><strong>{paymentReady ? `Delivery: ${money(deliveryFee)}` : addressLookup.status==='unavailable' ? 'Fuera de cobertura' : addressLookup.status==='needs-pin' ? 'Marca tu casa en el mapa' : addressLookup.status==='loading' ? 'Buscando tu dirección…' : 'Tu dirección de entrega'}</strong>{addressFields.street&&<span className="delivery-quote__address">{form.address}</span>}<span>{paymentReady ? `${getDeliveryZone(form.zone,zones)?.label} · Productos ${money(subtotal)}${addressLookup.message?` · ${addressLookup.message}`:''}` : ['error','unavailable','needs-pin'].includes(addressLookup.status) ? addressLookup.message : addressLookup.status==='loading' ? 'Estamos calculando el despacho para esta dirección.' : 'Completa calle y número para conocer el valor de entrega.'}</span>{paymentReady&&<b className="delivery-quote__total">Total a pagar <strong>{money(total)}</strong></b>}</div></div>
     {addressLookup.status==='error'&&<button className="cart-address-retry" type="button" onClick={()=>setLookupAttempt(value=>value+1)}>Volver a buscar dirección</button>}
   </>:<aside className="pickup-note"><MapPin/><div><strong>RETIRA EN EL CARRITO SHET</strong><span>{business.pickupAddress}</span><a href={directionsUrl} target="_blank" rel="noreferrer">VER CÓMO LLEGAR ↗︎</a></div></aside>}
 </section>;

 return <div className="cart-overlay" role="dialog" aria-modal="true" aria-label="Tu pedido">
  <button className="cart-overlay__backdrop" type="button" onClick={onClose} aria-label="Cerrar carrito"/>
  <aside className="cart-drawer">
   <header className="cart-drawer__header"><div><small>SHET BURGER</small><h2>{sent?'PEDIDO RECIBIDO':step==='cart'?'TU PEDIDO':'DATOS Y PAGO'}</h2></div><button type="button" onClick={onClose} aria-label="Cerrar"><X/></button></header>
   {!sent&&(!storeOpen||unavailableItems.length>0)&&<div className="cart-availability-alert" role="alert"><strong>{!storeOpen?'TIENDA CERRADA':'HAY PRODUCTOS AGOTADOS'}</strong><span>{!storeOpen?'No puedes confirmar pedidos hasta que la tienda vuelva a estar activa.':'Retira o vuelve a elegir los productos marcados para continuar.'}</span></div>}
   {sent?<div className="cart-success"><div className="cart-success__icon"><Check/></div><p className="cart-kicker">COMPROBANTE ENVIADO</p><h3>¡Pedido recibido!</h3><p>Revisaremos tu transferencia y actualizaremos el estado del pedido.</p><button className="cart-main-action" type="button" onClick={viewStatus}>VER ESTADO DEL PEDIDO <ArrowRight/></button></div>:step==='cart'?<>
    {!cart.length?<div className="cart-empty"><ShoppingBag/><h3>Tu carrito está vacío</h3><p>Agrega una hamburguesa o una promoción para comenzar.</p><button type="button" onClick={onExplore||onClose}>EXPLORAR MENÚ</button></div>:<div className="cart-drawer__body">
     <div className="cart-items">{cart.map(({key,product,variant,customization,quantity})=>{const unavailable=stock[product.id]===false||customizationUnavailable(customization,stock);return <article className={`cart-item${unavailable?' is-unavailable':''}`} key={key}><div className="cart-item__image">{productImage(product)?<BurgerPhoto product={product} sizes="84px"/>:<span>SHET</span>}</div><div className="cart-item__info"><h3>{product.name}</h3>{unavailable&&<small className="cart-item__unavailable">AGOTADO · VUELVE A ELEGIR</small>}<small className="cart-variant">{variant?.label}</small>{customization?.burgerChoices?.length>0&&<small className="cart-customization"><b>Hamburguesas:</b> {customization.burgerChoices.join(', ')}</small>}{customization?.selections?.map(item=><small className="cart-customization" key={`${item.label}-${item.value}`}><b>{item.label}:</b> {item.value}</small>)}{customization?.note&&<small className="cart-customization"><b>Nota:</b> {customization.note}</small>}<strong>{money(priceOf({product,variant}))}</strong><div className="cart-quantity"><button type="button" onClick={()=>onChange(key,quantity-1)} aria-label={`Quitar una unidad de ${product.name}`}><Minus/></button><span>{quantity}</span><button type="button" disabled={!storeOpen||unavailable||quantity>=25} onClick={()=>onChange(key,quantity+1)} aria-label={`Agregar una unidad de ${product.name}`}><Plus/></button></div></div><button className="cart-item__remove" type="button" onClick={()=>onChange(key,0)} aria-label={`Eliminar ${product.name}`}><Trash2/></button></article>})}</div>
     {deliveryDetails}{couponDetails}
     <section className="cart-upsell"><p>¿DESEAS AGREGAR ALGO MÁS?</p><div className="cart-upsell__tabs">{upsellCategories.map(([id,label])=><button type="button" className={upsellCategory===id?'active':''} key={id} onClick={()=>setUpsellCategory(id)}>{label}</button>)}</div><div className="cart-upsell__items">{suggestions.map(product=><button type="button" key={product.id} onClick={()=>onAdd?.(product,product.prices[0])}><span>{product.name}</span><b>{product.prices[0][1]}</b><Plus/></button>)}</div></section>
    </div>}
    {cart.length>0&&<footer className="cart-drawer__footer"><div className="cart-price-breakdown" aria-live="polite"><div><span>Productos</span><b>{money(subtotal)}</b></div><div><span>{mode==='pickup'?'Retiro':'Delivery'}</span><b>{mode==='pickup'?'Sin costo':paymentReady?money(deliveryFee):'Por calcular'}</b></div>{discountRow}<div className="cart-total"><span>Total del pedido</span><strong>{paymentReady?money(total):'Por calcular'}</strong></div></div>{!paymentReady&&<small className="cart-delivery-hint">Ingresa tu dirección para calcular automáticamente el total con delivery.</small>}<button className="cart-main-action" type="button" disabled={!storeOpen||unavailableItems.length>0} onClick={()=>setStep('checkout')}>{!storeOpen?'TIENDA CERRADA':unavailableItems.length?'REVISA PRODUCTOS AGOTADOS':'CONTINUAR PEDIDO'} <ArrowRight/></button><button className="cart-clear" type="button" onClick={onClear}>VACIAR CARRITO</button></footer>}
   </>:<form className="cart-checkout" onSubmit={submit}>
    <button type="button" className="cart-back" onClick={()=>setStep('cart')}><ArrowLeft/> VOLVER</button>
    {deliveryDetails}{couponDetails}
    <label>Nombre<input required maxLength="80" autoComplete="name" value={form.name} onChange={event=>setForm({...form,name:event.target.value})}/></label>
    <label>Teléfono<div className="phone-input"><span>+569</span><input required type="tel" inputMode="numeric" autoComplete="tel-national" pattern="[0-9]{8}" minLength="8" maxLength="8" placeholder="12345678" aria-label="Número móvil, 8 dígitos" value={form.phone} onChange={event=>setForm({...form,phone:event.target.value.replace(/\D/g,'').slice(0,8)})}/></div><small className="phone-input__hint">Ingresa los 8 dígitos restantes</small></label>
    <section className="transfer-box"><div><p>TRANSFERENCIA BANCARIA</p><strong>{business.name}</strong><span>{business.bank} · {business.account}</span><span>{business.rut}</span><span>Productos: {money(subtotal)}</span>{discount>0&&<span>Cupón {coupon.code}: -{money(discount)}</span>}{mode==='delivery'&&<span>Despacho: {form.zone?money(deliveryFee):'Dirección pendiente'}</span>}<b>{paymentReady?money(total):'TOTAL PENDIENTE'}</b></div><button type="button" onClick={copy} disabled={!paymentReady}>{copied?<Check/>:<Copy/>}{copied?'COPIADO':'COPIAR DATOS'}</button></section>
    <label className="receipt-upload"><span><Upload/> Comprobante de transferencia</span><input required type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={event=>chooseReceipt(event.target.files?.[0]||null)}/>{receipt&&<small>{receipt.name}</small>}</label>
    {error&&<p className="cart-error" role="alert">{error}</p>}
    <div className="checkout-summary checkout-summary--detailed"><div><span>Productos</span><b>{money(subtotal)}</b></div><div><span>{mode==='delivery'?'Despacho':'Retiro'}</span><b>{mode==='delivery'?(form.zone?money(deliveryFee):'—'):'$0'}</b></div>{discountRow}<div><span>Total del pedido</span><strong>{paymentReady?money(total):'Por calcular'}</strong></div></div>
    <button className="cart-main-action" type="submit" disabled={saving||!storeOpen||unavailableItems.length>0||!paymentReady}>{saving?'GUARDANDO...':!storeOpen?'TIENDA CERRADA':unavailableItems.length?'PRODUCTOS AGOTADOS':!paymentReady?'CONFIRMA TU DIRECCIÓN':'ENVIAR PEDIDO Y COMPROBANTE'} <Check/></button>
   </form>}
  </aside>
 </div>;
}
