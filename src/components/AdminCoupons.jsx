import { useEffect, useState } from 'react';
import { loadCoupons, saveCoupon } from '../lib/coupons';
import { couponLabel, couponConditions, promotionTypes } from '../lib/couponRules';
import { categories } from '../data';

const empty = { code: '', title: '', description: '', discount_type: 'percent', value: '', min_subtotal: 0, min_quantity: 2, buy_quantity: 2, pay_quantity: 1, scope: 'all', target: '', expires_at: '', active: true, published: true };
export default function AdminCoupons({ token, products = [] }) {
  const [coupons, setCoupons] = useState([]), [form, setForm] = useState(empty), [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const refresh = async () => { const result = await loadCoupons(token, true); if (result.error) throw result.error; setCoupons(result.data || []); };
  useEffect(() => { refresh().catch(error => setError(error.message)); }, [token]);
  const persist = async coupon => {
    setBusy(true); setError(''); setNotice('');
    try { const result = await saveCoupon(coupon, token); if (result.error) throw result.error; await refresh(); setNotice('Cupón guardado. El cambio ya está disponible en la página.'); return true; }
    catch (error) { setError(error.code === '23505' ? 'Ya existe un cupón con ese código.' : error.message); return false; }
    finally { setBusy(false); }
  };
  const needsValue = ['percent','fixed','quantity_percent'].includes(form.discount_type);
  const submit = async event => {
    event.preventDefault();
    const selected = form.scope === 'category' ? products.filter(p => p.category === form.target) : products.filter(p => p.id === form.target);
    if (form.discount_type !== 'free_delivery' && form.scope !== 'all' && !selected.length) { setError('Elige productos participantes.'); return; }
    if (form.discount_type === 'buy_x_pay_y' && Number(form.pay_quantity) >= Number(form.buy_quantity)) { setError('La cantidad a pagar debe ser menor que la cantidad que lleva el cliente.'); return; }
    const scope_label = form.scope === 'category' ? `Categoría: ${categories.find(c => c.id === form.target)?.label || form.target} (productos seleccionados al crear la promoción).` : form.scope === 'product' ? `Producto: ${selected[0]?.name}.` : 'Todos los productos.';
    if (await persist({ ...form, product_ids: form.discount_type === 'free_delivery' || form.scope === 'all' ? [] : selected.map(p => p.id), scope_label: form.discount_type === 'free_delivery' ? 'Despacho.' : scope_label, value: needsValue ? Number(form.value) : 1, min_subtotal: Number(form.min_subtotal), min_quantity: Number(form.min_quantity), buy_quantity: Number(form.buy_quantity), pay_quantity: Number(form.pay_quantity), expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null })) setForm(empty);
  };
  return <section className="admin-coupons"><div className="admin-section-title"><h2>Cupones y promociones</h2></div><p>Elige el beneficio, los productos participantes y sus condiciones. El cliente lo activa con el código en el carrito.</p>
    <form className="coupon-form" onSubmit={submit}>
      <label>Código<input required pattern="[A-Za-z0-9_-]{3,30}" maxLength="30" placeholder="SHET10" value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}/><small>Entre 3 y 30 letras, números, guiones o guiones bajos.</small></label>
      <label>Nombre de la promoción<input maxLength="80" placeholder="Martes de 2×1" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}/></label>
      <label>Tipo de promoción<select value={form.discount_type} onChange={e => setForm({ ...form, discount_type: e.target.value, value: '' })}>{promotionTypes.map(([id,label]) => <option key={id} value={id}>{label}</option>)}</select></label>
      {needsValue&&<label>{form.discount_type === 'fixed' ? 'Descuento ($)' : 'Descuento (%)'}<input required type="number" min="1" max={form.discount_type === 'fixed' ? 1000000 : 100} step="1" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })}/></label>}
      {form.discount_type==='buy_x_pay_y'&&<><label>Unidades que lleva<input required type="number" min="2" max="50" value={form.buy_quantity} onChange={e => setForm({...form,buy_quantity:e.target.value})}/></label><label>Unidades que paga<input required type="number" min="1" max={Number(form.buy_quantity)-1} value={form.pay_quantity} onChange={e => setForm({...form,pay_quantity:e.target.value})}/></label><p>Ejemplos: lleva 2 y paga 1 (2×1), o lleva 3 y paga 2 (3×2). Se descuentan las unidades de menor precio y se repite por cada grupo completo.</p></>}
      {form.discount_type==='quantity_percent'&&<label>Unidades mínimas participantes<input required type="number" min="2" max="50" value={form.min_quantity} onChange={e => setForm({...form,min_quantity:e.target.value})}/><small>Al alcanzar esta cantidad, el porcentaje se aplica a todos los productos participantes del pedido.</small></label>}
      {form.discount_type!=='free_delivery'&&<><label>Aplicar a<select value={form.scope} onChange={e => setForm({...form,scope:e.target.value,target:''})}><option value="all">Todos los productos</option><option value="category">Una categoría</option><option value="product">Un producto</option></select></label>{form.scope!=='all'&&<label>{form.scope==='category'?'Categoría':'Producto'}<select required value={form.target} onChange={e => setForm({...form,target:e.target.value})}><option value="">Selecciona una opción</option>{(form.scope==='category'?categories.filter(c=>products.some(p=>p.category===c.id)):products).map(p=><option key={p.id} value={p.id}>{p.label||p.name}</option>)}</select><small>Incluye los productos actuales de la selección. No se aplica a componentes internos de combos.</small></label>}</>}
      <label>Descripción (opcional)<input maxLength="200" placeholder="Cuéntale al cliente de qué se trata" value={form.description} onChange={e => setForm({...form,description:e.target.value})}/></label>
      <label>Compra mínima en productos ($)<input required type="number" min="0" max="10000000" step="1" value={form.min_subtotal} onChange={e => setForm({ ...form, min_subtotal: e.target.value })}/></label>
      <label>Vencimiento (opcional)<input type="datetime-local" value={form.expires_at} onChange={e => setForm({ ...form, expires_at: e.target.value })}/></label>
      <label className="coupon-check"><input type="checkbox" checked={form.published} onChange={e => setForm({ ...form, published: e.target.checked })}/>Mostrar en la página de pedidos</label>
      <div className="promotion-preview"><strong>Vista previa: {form.title||'Tu promoción'}</strong><span>{couponLabel({...form,value:form.value||0})}</span><small>Un código por pedido. {form.discount_type==='free_delivery'?'Solo delivery dentro de cobertura.':'No incluye despacho.'}</small></div>
      <button className="admin-submit" disabled={busy} type="submit">{busy ? 'GUARDANDO…' : 'CREAR PROMOCIÓN'}</button>
    </form>
    {error && <p className="admin-error" role="alert">{error}</p>}{notice && <p role="status">{notice}</p>}
    <div className="coupon-list">{coupons.map(coupon => <article key={coupon.id}><div><strong>{coupon.title||coupon.code}</strong><b>{coupon.code} · {couponLabel(coupon)}</b><span>Mínimo ${Number(coupon.min_subtotal).toLocaleString('es-CL')} · {coupon.active?'Activa':'Pausada'}</span><small>{couponConditions(coupon)}</small><small>{coupon.expires_at ? `Vence ${new Date(coupon.expires_at).toLocaleString('es-CL')}` : 'Sin vencimiento'} · {coupon.published ? 'Visible en la página' : 'Solo con código'}</small></div><button type="button" disabled={busy} onClick={() => persist({ ...coupon, active: !coupon.active })}>{coupon.active ? 'PAUSAR' : 'ACTIVAR'}</button></article>)}</div>{!coupons.length && !error && <p>Aún no hay promociones creadas.</p>}
  </section>;
}
