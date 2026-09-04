import { Check, Clock3, LogOut, PackageCheck, ShoppingBag, Truck, X } from 'lucide-react';

const money = value => `$${Number(value || 0).toLocaleString('es-CL')}`;
const stages = [
  ['Pedido recibido', Clock3],
  ['En preparación', ShoppingBag],
  ['Listo para servir', PackageCheck],
  ['Pedido entregado', Check],
];

export default function CustomerAccount({ user, orders, loading, onClose, onSignOut }) {
  const name = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Cliente';
  const avatar = user?.user_metadata?.avatar_url;

  return <div className="account-overlay">
    <button className="account-backdrop" type="button" onClick={onClose} aria-label="Cerrar cuenta"/>
    <aside className="account-panel">
      <header className="account-header">
        <div className="account-user">{avatar ? <img src={avatar} alt="" referrerPolicy="no-referrer"/> : <span>{name.charAt(0).toUpperCase()}</span>}<div><small>MI CUENTA</small><strong>{name}</strong><p>{user?.email}</p></div></div>
        <button type="button" onClick={onClose} aria-label="Cerrar"><X/></button>
      </header>
      <div className="account-body">
        <div className="account-title"><div><small>HISTORIAL PERSONAL</small><h2>Mis pedidos</h2></div><b>{orders.length}</b></div>
        {loading ? <div className="account-empty"><Clock3/><p>Cargando tus pedidos…</p></div> : !orders.length ? <div className="account-empty"><ShoppingBag/><h3>Aún no tienes pedidos</h3><p>Los pedidos que hagas con esta cuenta aparecerán aquí.</p></div> : <div className="account-orders">{orders.map(order => {
          const currentStage = Number(order.stage || 0);
          return <article className="account-order" key={order.id}>
            <div className="account-order__top"><div><small>PEDIDO</small><strong>#{order.order_number || order.id}</strong></div><div><b>{money(order.total)}</b><span>{new Date(order.created_at || Date.now()).toLocaleDateString('es-CL')}</span></div></div>
            <div className="account-order__items">{order.items?.map((item,index)=><p key={`${order.id}-${index}`}><span>{item.quantity} × {item.product?.name || item.name || 'Producto'}{item.variant ? ` · ${item.variant}` : ''}</span><b>{money(Number(item.price || 0) * Number(item.quantity || 1))}</b></p>)}</div>
            <div className="account-progress">{stages.map(([label,Icon],index)=><div className={index<=currentStage?'is-done':''} key={label}><span><Icon/></span><small>{label}</small></div>)}</div>
            <div className="account-order__status"><Truck/><span>{order.fulfillment==='delivery'?'Delivery':'Retiro en tienda'}</span><b>{order.status}</b></div>
          </article>;
        })}</div>}
      </div>
      <footer className="account-footer"><button type="button" onClick={onSignOut}><LogOut/> CERRAR SESIÓN</button></footer>
    </aside>
  </div>;
}
