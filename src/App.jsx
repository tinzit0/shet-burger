import { lazy, Suspense, useEffect, useState } from 'react';
import Header from './components/Header';
import HomePage from './components/HomePage';
import DeliveryPage from './components/DeliveryPage';
import WhatsAppButton from './components/WhatsAppButton';
import { usePublicRoute, navigate } from './lib/navigation';
import ScrollReveals from './components/ScrollReveals';
import { products as defaultProducts, defaultSiteContent } from './data';
import { calculateOrderTotal, formatDeliveryAddress, getDeliveryZone } from './lib/delivery';

const CartDrawer = lazy(() => import('./components/CartDrawer'));
const AdminPanel = lazy(() => import('./components/AdminPanel'));
const AdminAnalytics = lazy(() => import('./components/AdminAnalytics'));
const AdminContentEditor = lazy(() => import('./components/AdminContentEditor'));
const OrderTracker = lazy(() => import('./components/OrderTracker'));
const CustomerAccount = lazy(() => import('./components/CustomerAccount'));
const CustomerAuth = lazy(() => import('./components/CustomerAuth'));
const AdminLoading = () => <main className="admin-login"><div className="admin-login__card"><p>ÁREA PRIVADA</p><h1>Cargando<br/><em>SHET.</em></h1></div></main>;
const ordersApi = () => import('./lib/orders');
const storeApi = () => import('./lib/store');
const supabaseApi = () => import('./lib/supabase');
const contentApi = () => import('./lib/content');

const fileData=file=>new Promise(resolve=>{if(!file)return resolve(null);const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.readAsDataURL(file)});
const readStoredJSON=(key,fallback)=>{try{const value=localStorage.getItem(key);return value?JSON.parse(value):fallback}catch{localStorage.removeItem(key);return fallback}};

export default function App(){
 const path = usePublicRoute();
 const[cart,setCart]=useState([]),[open,setOpen]=useState(false),[trackOpen,setTrackOpen]=useState(false),[authOpen,setAuthOpen]=useState(false),[accountOpen,setAccountOpen]=useState(false),[user,setUser]=useState(null),[authReady,setAuthReady]=useState(false),[demoToken,setDemoToken]=useState(()=>localStorage.getItem('shet-demo-admin-token')||''),[adminAllowed,setAdminAllowed]=useState(null),[customerOrders,setCustomerOrders]=useState([]),[customerLoading,setCustomerLoading]=useState(false),[shopNotice,setShopNotice]=useState(''),[storeOpen,setStoreOpen]=useState(()=>localStorage.getItem('shet-store-open')!=='false'),[orders,setOrders]=useState(()=>{const saved=readStoredJSON('shet-demo-orders',[]);return Array.isArray(saved)?saved:[]}),[stock,setStock]=useState(()=>{const base=Object.fromEntries(defaultProducts.map(product=>[product.id,true]));const saved=readStoredJSON('shet-demo-stock',{});return saved&&typeof saved==='object'&&!Array.isArray(saved)?{...base,...saved}:base});
 const demoAdmin=Boolean(demoToken);
 const[products,setProducts]=useState(()=>{const saved=readStoredJSON('shet-managed-products',defaultProducts);return Array.isArray(saved)&&saved.length?saved:defaultProducts});
 const[siteContent,setSiteContent]=useState(()=>({...defaultSiteContent,...readStoredJSON('shet-site-content',{})}));
 const[storeSyncState,setStoreSyncState]=useState('connecting');
 const latestOrder=user?(customerOrders[0]||null):(orders[0]||null);
 useEffect(()=>{localStorage.setItem('shet-demo-orders',JSON.stringify(orders))},[orders]);
 useEffect(()=>{localStorage.setItem('shet-demo-stock',JSON.stringify(stock))},[stock]);
 useEffect(()=>{localStorage.setItem('shet-store-open',String(storeOpen))},[storeOpen]);
 useEffect(()=>{localStorage.setItem('shet-managed-products',JSON.stringify(products))},[products]);
 useEffect(()=>{localStorage.setItem('shet-site-content',JSON.stringify(siteContent))},[siteContent]);
 useEffect(()=>{localStorage.removeItem('shet-admin-auth')},[]);
 useEffect(()=>{if(!shopNotice)return undefined;const timer=window.setTimeout(()=>setShopNotice(''),4500);return()=>window.clearTimeout(timer)},[shopNotice]);
 useEffect(()=>{const syncLocal=event=>{if(event.storageArea!==localStorage)return;if(event.key==='shet-store-open'&&event.newValue!==null)setStoreOpen(event.newValue!=='false');if(event.key==='shet-demo-stock'&&event.newValue){const value=readStoredJSON('shet-demo-stock',{});if(value&&typeof value==='object'&&!Array.isArray(value))setStock(items=>({...items,...value}))}};window.addEventListener('storage',syncLocal);return()=>window.removeEventListener('storage',syncLocal)},[]);
 useEffect(()=>{
  let active=true;
  contentApi().then(({loadManagedContent})=>loadManagedContent(products,siteContent)).then(result=>{if(!active)return;if(result.products?.length)setProducts(result.products);if(result.content)setSiteContent(result.content)}).catch(()=>{});
  return()=>{active=false};
 },[]);
 useEffect(()=>{
  let active=true,subscription;
  supabaseApi().then(({supabase})=>{
   if(!active)return;
   if(!supabase){setAuthReady(true);return}
   supabase.auth.getSession().then(({data})=>{if(!active)return;setUser(data.session?.user||null);setAuthReady(true);if(data.session&&localStorage.getItem('shet-open-account-after-auth')==='true'){localStorage.removeItem('shet-open-account-after-auth');setAccountOpen(true)}}).catch(()=>active&&setAuthReady(true));
   subscription=supabase.auth.onAuthStateChange((_event,session)=>{if(active){setUser(session?.user||null);setAuthReady(true)}}).data.subscription;
  }).catch(()=>active&&setAuthReady(true));
  return()=>{active=false;subscription?.unsubscribe()};
 },[]);
 useEffect(()=>{
  if(!path.startsWith('/admin')||!authReady){return}
  if(!user){setAdminAllowed(demoAdmin);return}
  setAdminAllowed(null);
  supabaseApi().then(({isCurrentUserAdmin})=>isCurrentUserAdmin()).then(setAdminAllowed);
 },[user,authReady,demoAdmin,path]);
 useEffect(()=>{
  setStoreSyncState('connecting');
  let active=true;
  let unsubscribe=()=>{};
  const refresh=async()=>{const{loadStoreState}=await storeApi();const result=await loadStoreState(products.map(product=>product.id));if(!active)return;if(result.error){setStoreSyncState(state=>state==='live'?'live':'degraded');return}setStoreOpen(result.storeOpen);setStock(result.stock)};
  const applyRealtime=payload=>{if(!active)return;const row=payload.new||payload.record;if(payload.table==='store_settings'&&typeof row?.is_open==='boolean'){setStoreOpen(row.is_open);return}if(payload.table==='product_availability'&&row?.product_id){setStock(items=>({...items,[row.product_id]:row.available!==false}));return}refresh()};
  const onStatus=status=>{if(!active)return;if(status==='SUBSCRIBED')setStoreSyncState('live');else if(['CHANNEL_ERROR','TIMED_OUT','CLOSED'].includes(status))setStoreSyncState('degraded')};
  refresh();storeApi().then(({subscribeToStore})=>{if(active)unsubscribe=subscribeToStore(applyRealtime,onStatus)});
  const timer=window.setInterval(refresh,10000),onFocus=()=>refresh();window.addEventListener('focus',onFocus);
  return()=>{active=false;unsubscribe();window.clearInterval(timer);window.removeEventListener('focus',onFocus)};
 },[products]);
 useEffect(()=>{
  if(!user){setCustomerOrders([]);return}
  let active=true;
  const refresh=async()=>{setCustomerLoading(true);const{loadCustomerOrders}=await ordersApi();const{data}=await loadCustomerOrders(user.id);if(active&&data)setCustomerOrders(data);if(active)setCustomerLoading(false)};
  refresh();
  let unsubscribe=()=>{};ordersApi().then(({subscribeToOrders})=>{if(active)unsubscribe=subscribeToOrders(refresh)});const timer=window.setInterval(refresh,8000);
  return()=>{active=false;unsubscribe();window.clearInterval(timer)};
 },[user]);
 useEffect(()=>{
  if(user||path.startsWith('/admin')||!latestOrder)return;
  let active=true;
  const verify=async()=>{const{loadPublicOrder}=await ordersApi();const result=await loadPublicOrder(latestOrder.order_number);if(!active||result.error)return;if(!result.data){setOrders(items=>items.filter(order=>order.id!==latestOrder.id&&order.order_number!==latestOrder.order_number));setTrackOpen(false);return}setOrders(items=>items.map(order=>order.order_number===latestOrder.order_number?result.data:order))};
  verify();const timer=window.setInterval(verify,trackOpen?3000:8000);
  return()=>{active=false;window.clearInterval(timer)};
 },[user,latestOrder?.id,latestOrder?.order_number,trackOpen,path]);
 useEffect(()=>{
  if(!path.startsWith('/admin')||(!adminAllowed&&!demoAdmin))return;
  let active=true;
  const refresh=async()=>{const{loadOrders}=await ordersApi();const{data}=await loadOrders();if(active&&data)setOrders(data)};
  refresh();
  let unsubscribe=()=>{};ordersApi().then(({subscribeToOrders})=>{if(active)unsubscribe=subscribeToOrders(refresh)});
  const refreshTimer=window.setInterval(refresh,8000);
  const onFocus=()=>refresh();
  window.addEventListener('focus',onFocus);
  return()=>{active=false;unsubscribe();window.clearInterval(refreshTimer);window.removeEventListener('focus',onFocus)};
 },[adminAllowed,demoAdmin,path]);
 const statusUpdate=async(id,status,stage)=>{const previous=orders;setOrders(items=>items.map(order=>order.id===id?{...order,status,stage}:order));const{updateStoredOrder}=await ordersApi();const{error}=await updateStoredOrder(id,status,stage);if(error){setOrders(previous);window.alert(`No se pudo actualizar el pedido: ${error.message}`);return false}return true};
 const deleteOrder=async id=>{const previous=orders,previousCustomer=customerOrders,isSame=order=>order.id!==id&&order.order_number!==id;setOrders(items=>items.filter(isSame));setCustomerOrders(items=>items.filter(isSame));if(latestOrder&&(latestOrder.id===id||latestOrder.order_number===id))setTrackOpen(false);const{deleteStoredOrder}=await ordersApi();const{error}=await deleteStoredOrder(id);if(error){setOrders(previous);setCustomerOrders(previousCustomer);window.alert(`No se pudo eliminar el pedido: ${error.message}`);return false}return true};
 const toggleStore=async()=>{const next=!storeOpen;setStoreOpen(next);localStorage.setItem('shet-store-open',String(next));const{updateStoreOpen}=await storeApi();const{error}=await updateStoreOpen(next,demoToken||null);if(error){setStoreOpen(!next);localStorage.setItem('shet-store-open',String(!next));window.alert(`No se pudo cambiar el estado global de la tienda: ${error.message}`);return false}return {ok:true,synced:true}};
 const toggleStock=async id=>{const next=stock[id]===false;const nextStock={...stock,[id]:next};setStock(nextStock);localStorage.setItem('shet-demo-stock',JSON.stringify(nextStock));const{updateProductAvailability}=await storeApi();const{error}=await updateProductAvailability(id,next,demoToken||null);if(error){const previous={...nextStock,[id]:!next};setStock(previous);localStorage.setItem('shet-demo-stock',JSON.stringify(previous));window.alert(`No se pudo cambiar la disponibilidad global: ${error.message}`);return false}return {ok:true,synced:true}};
 const openAccount=()=>{if(user){setAccountOpen(true);return}setAuthOpen(true)};
 const closeCustomerSession=async()=>{const{signOutCustomer}=await supabaseApi();await signOutCustomer();setAccountOpen(false);setCustomerOrders([])};
 const demoLogin=async(email,password)=>{const{signInAdminWithPassword,signInDemoAdmin}=await supabaseApi();const remote=await signInAdminWithPassword(email,password);if(!remote.error){localStorage.removeItem('shet-demo-admin-token');setDemoToken('');return {ok:true,synced:true}}const demo=await signInDemoAdmin(email,password);if(demo.token){localStorage.setItem('shet-demo-admin-token',demo.token);setDemoToken(demo.token);return {ok:true,synced:true}}const missingFunction=demo.error?.code==='PGRST202'||demo.error?.message?.includes('demo_admin_login');return {error:missingFunction?'Falta activar la sincronización del panel en Supabase. Ejecuta supabase/demo-admin.sql.':'Correo o contraseña incorrectos.'}};
 const logoutAdmin=async()=>{localStorage.removeItem('shet-admin-auth');localStorage.removeItem('shet-demo-admin-token');setDemoToken('');const{signOutCustomer}=await supabaseApi();await signOutCustomer()};
 const saveProduct=async product=>{const next=products.some(item=>item.id===product.id)?products.map(item=>item.id===product.id?product:item):[...products,product];setProducts(next);setStock(items=>({...items,[product.id]:items[product.id]??true}));const{saveManagedCatalog}=await contentApi();const result=await saveManagedCatalog(next);return {ok:true,synced:!result.error,error:result.error||null}};
 const removeProduct=async id=>{if(products.length<=1)return false;const next=products.filter(product=>product.id!==id);setProducts(next);setCart(items=>items.filter(item=>item.product.id!==id));const{removeManagedProduct}=await contentApi();const result=await removeManagedProduct(id);return {ok:true,synced:!result.error,error:result.error||null}};
 const saveContent=async content=>{const next={...defaultSiteContent,...content};setSiteContent(next);const{saveManagedContent}=await contentApi();const result=await saveManagedContent(next);return {ok:true,synced:!result.error,error:result.error||null}};
 const uploadProductImage=async(file,productId)=>{const{uploadManagedImage}=await contentApi();return uploadManagedImage(file,productId)};
 const connectAdmin=async redirectPath=>{localStorage.removeItem('shet-admin-auth');localStorage.removeItem('shet-demo-admin-token');setDemoToken('');const{signInWithGoogle}=await supabaseApi();return signInWithGoogle(redirectPath)};
 const adminProps={products,stock,onToggleStock:toggleStock,orders,onUpdateOrder:statusUpdate,onDeleteOrder:deleteOrder,storeOpen,onToggleStore:toggleStore,storeSyncState,user,authReady:authReady&&(!user||adminAllowed!==null),adminAllowed,onSignOut:logoutAdmin,demoAdmin,onDemoLogin:demoLogin};
 if(path==='/admin/content'&&(!authReady||(!user&&!demoAdmin)||(!demoAdmin&&!adminAllowed)))return <Suspense fallback={<AdminLoading/>}><AdminPanel {...adminProps} onLogin={()=>connectAdmin('/admin/content')}/></Suspense>;
 if(path==='/admin/content')return <Suspense fallback={<AdminLoading/>}><AdminContentEditor products={products} siteContent={siteContent} onSaveProduct={saveProduct} onDeleteProduct={removeProduct} onSaveContent={saveContent} onUploadImage={uploadProductImage}/></Suspense>;
 if(path==='/admin/analytics'&&(!authReady||(!user&&!demoAdmin)||(!demoAdmin&&!adminAllowed)))return <Suspense fallback={<AdminLoading/>}><AdminPanel {...adminProps} onLogin={()=>connectAdmin('/admin/analytics')}/></Suspense>;
 if(path==='/admin/analytics')return <Suspense fallback={<AdminLoading/>}><AdminAnalytics orders={orders}/></Suspense>;
 if(path==='/admin'&&(!authReady||(!user&&!demoAdmin)||(!demoAdmin&&!adminAllowed)))return <Suspense fallback={<AdminLoading/>}><AdminPanel {...adminProps} onLogin={()=>connectAdmin('/admin')}/></Suspense>;
 if(path==='/admin')return <Suspense fallback={<AdminLoading/>}><AdminPanel {...adminProps} onLogin={()=>connectAdmin('/admin')}/><a className="admin-content-fab" href="/admin/content">EDITAR SITIO</a></Suspense>;
 const add=(product,variant,customization={})=>{if(!storeOpen){setShopNotice('TIENDA CERRADA · Los pedidos están temporalmente deshabilitados.');return false}if(stock[product.id]===false){setShopNotice(`${product.name.toUpperCase()} ESTÁ AGOTADO · Elige otra opción disponible.`);return false}const selected={label:variant[0],price:Number(variant[1].replace(/\D/g,''))},normalizedCustomization={note:(customization.note||'').trim(),burgerChoices:Array.isArray(customization.burgerChoices)?customization.burgerChoices:[],burgerChoiceIds:Array.isArray(customization.burgerChoiceIds)?customization.burgerChoiceIds:[]},key=`${product.id}-${selected.label}-${JSON.stringify(normalizedCustomization)}`;setCart(items=>{const found=items.find(item=>item.key===key);return found?items.map(item=>item.key===key?{...item,quantity:item.quantity+1}:item):[...items,{key,product,variant:selected,customization:normalizedCustomization,quantity:1}]});setOpen(true);return true};
 const change=(key,quantity)=>{const current=cart.find(item=>item.key===key);if(current&&quantity>current.quantity){if(!storeOpen){setShopNotice('TIENDA CERRADA · No puedes aumentar productos mientras los pedidos están cerrados.');return}if(stock[current.product.id]===false){setShopNotice(`${current.product.name.toUpperCase()} ESTÁ AGOTADO.`);return}}setCart(items=>quantity<=0?items.filter(item=>item.key!==key):items.map(item=>item.key===key?{...item,quantity}:item))};
 const confirm=async details=>{
  if(!storeOpen)throw new Error('Los pedidos están cerrados en este momento.');
  if(cart.some(item=>stock[item.product.id]===false))throw new Error('Uno de los productos ya no está disponible.');
  if(cart.some(item=>item.customization?.burgerChoiceIds?.some(id=>stock[id]===false)))throw new Error('Una hamburguesa elegida dentro de una promoción se agotó. Vuelve a elegir la promoción.');
 if(!details.form.name.trim()||details.form.name.trim().length>80)throw new Error('Revisa el nombre ingresado.');
 if(!/^\+569\d{8}$/.test(details.form.phone))throw new Error('El teléfono debe tener el formato +569 seguido de 8 números.');
  const deliveryZone=details.mode==='delivery'?getDeliveryZone(details.form.zone):null;
  if(details.mode==='delivery'&&!deliveryZone)throw new Error('Selecciona una población disponible para delivery.');
  if(details.mode==='delivery'&&(!details.form.address.trim()||details.form.address.trim().length>180))throw new Error('Ingresa una dirección válida.');
  if(!details.receipt)throw new Error('Debes adjuntar el comprobante.');
  if(details.receipt.size>8*1024*1024)throw new Error('El comprobante no puede superar los 8 MB.');
  if(!['image/jpeg','image/png','image/webp','application/pdf'].includes(details.receipt.type))throw new Error('Usa un comprobante JPG, PNG, WEBP o PDF.');
  const subtotal=cart.reduce((sum,item)=>sum+item.variant.price*item.quantity,0);
  const total=calculateOrderTotal(subtotal,details.mode,details.form.zone);
  const address=details.mode==='delivery'?formatDeliveryAddress(details.form.zone,details.form.address):'';
  const preview=await fileData(details.receipt),order={order_number:`SHET-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0,4).toUpperCase()}`,user_id:user?.id||null,items:cart.map(item=>({product:item.product,quantity:item.quantity,price:item.variant.price,variant:item.variant.label,note:item.customization?.note||'',burger_choices:item.customization?.burgerChoices||[]})),total,fulfillment:details.mode,customer_name:details.form.name.trim(),customer_phone:details.form.phone,address,status:'Pedido recibido',stage:0,receipt_name:details.receipt?.name||'',receipt_preview:preview,created_at:new Date().toISOString()};
  const{saveOrder,normalizeOrder}=await ordersApi();const result=await saveOrder(order,details.receipt);
  if(result.error&&result.error.message!=='Supabase no configurado')throw result.error;
  const saved=result.data?normalizeOrder(result.data):normalizeOrder({...order,id:order.order_number,receipt_path:null});
  setOrders(items=>[saved,...items.filter(item=>item.id!==saved.id)]);
  if(user)setCustomerOrders(items=>[saved,...items.filter(item=>item.id!==saved.id)]);
  setCart([]);
 };
 const count=cart.reduce((sum,item)=>sum+item.quantity,0);
 return <><Header path={path} cartCount={count} onCart={()=>setOpen(true)} latestOrder={latestOrder} onTrack={()=>setTrackOpen(true)} user={user} onAccount={openAccount}/><a className="skip-link" href="#main-content">Ir al contenido</a><main id="main-content" tabIndex={-1} className={path==='/delivery'?'delivery-page':'home-page'}>{path==='/delivery'?<DeliveryPage onAdd={add} stock={stock} storeOpen={storeOpen} products={products} content={siteContent}/>:<HomePage content={siteContent}/>}</main>{!storeOpen&&<div className="global-store-alert" role="status"><strong>TIENDA CERRADA</strong><span>Por ahora no estamos recibiendo pedidos.</span></div>}{shopNotice&&<div className="shop-notice" role="alert">{shopNotice}</div>}<WhatsAppButton/><ScrollReveals key={path}/><Suspense fallback={<div className="overlay-loading" role="status">Cargando…</div>}>{open&&<CartDrawer cart={cart} onClose={()=>setOpen(false)} onChange={change} onClear={()=>setCart([])} onConfirm={confirm} onTrack={()=>setTrackOpen(true)} products={products} stock={stock} storeOpen={storeOpen} onAdd={add} onExplore={()=>{setOpen(false);navigate('/delivery')}}/>} {trackOpen&&<OrderTracker order={latestOrder} onClose={()=>setTrackOpen(false)}/>} {authOpen&&!user&&<CustomerAuth onClose={()=>setAuthOpen(false)}/>} {accountOpen&&user&&<CustomerAccount user={user} orders={customerOrders} loading={customerLoading} onClose={()=>setAccountOpen(false)} onSignOut={closeCustomerSession}/>}</Suspense></>;
}
