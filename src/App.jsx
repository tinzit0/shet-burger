import { useEffect, useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import BurgerStory from './components/BurgerStory';
import Campaign from './components/Campaign';
import MenuSection from './components/MenuSection';
import Ingredients from './components/Ingredients';
import FooterCTA from './components/FooterCTA';
import CartDrawer from './components/CartDrawer';
import AdminPanel from './components/AdminPanel';
import AdminAnalytics from './components/AdminAnalytics';
import OrderTracker from './components/OrderTracker';
import CustomerAccount from './components/CustomerAccount';
import CustomerAuth from './components/CustomerAuth';
import { products } from './data';
import { deleteStoredOrder, loadCustomerOrders, loadOrders, normalizeOrder, saveOrder, storedOrderExists, subscribeToOrders, updateStoredOrder } from './lib/orders';
import { isCurrentUserAdmin, signInWithGoogle, signOutCustomer, supabase } from './lib/supabase';
import { loadStoreState, subscribeToStore, updateProductAvailability, updateStoreOpen } from './lib/store';

const fileData=file=>new Promise(resolve=>{if(!file)return resolve(null);const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.readAsDataURL(file)});
const readStoredJSON=(key,fallback)=>{try{const value=localStorage.getItem(key);return value?JSON.parse(value):fallback}catch{localStorage.removeItem(key);return fallback}};

export default function App(){
 const[cart,setCart]=useState([]),[open,setOpen]=useState(false),[trackOpen,setTrackOpen]=useState(false),[authOpen,setAuthOpen]=useState(false),[accountOpen,setAccountOpen]=useState(false),[user,setUser]=useState(null),[authReady,setAuthReady]=useState(false),[demoAdmin,setDemoAdmin]=useState(()=>localStorage.getItem('shet-admin-auth')==='true'),[adminAllowed,setAdminAllowed]=useState(null),[customerOrders,setCustomerOrders]=useState([]),[customerLoading,setCustomerLoading]=useState(false),[storeOpen,setStoreOpen]=useState(()=>localStorage.getItem('shet-store-open')!=='false'),[orders,setOrders]=useState(()=>{const saved=readStoredJSON('shet-demo-orders',[]);return Array.isArray(saved)?saved:[]}),[stock,setStock]=useState(()=>{const base=Object.fromEntries(products.map(product=>[product.id,true]));const saved=readStoredJSON('shet-demo-stock',{});return saved&&typeof saved==='object'&&!Array.isArray(saved)?{...base,...saved}:base});
 const latestOrder=user?(customerOrders[0]||null):(orders[0]||null);
 useEffect(()=>{localStorage.setItem('shet-demo-orders',JSON.stringify(orders))},[orders]);
 useEffect(()=>{localStorage.setItem('shet-demo-stock',JSON.stringify(stock))},[stock]);
 useEffect(()=>{localStorage.setItem('shet-store-open',String(storeOpen))},[storeOpen]);
 useEffect(()=>{
  if(!supabase){setAuthReady(true);return}
  supabase.auth.getSession().then(({data})=>{setUser(data.session?.user||null);setAuthReady(true);if(data.session&&localStorage.getItem('shet-open-account-after-auth')==='true'){localStorage.removeItem('shet-open-account-after-auth');setAccountOpen(true)}}).catch(()=>setAuthReady(true));
  const{data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>{setUser(session?.user||null);setAuthReady(true)});
  return()=>subscription.unsubscribe();
 },[]);
 useEffect(()=>{
  if(!window.location.pathname.startsWith('/admin')||!authReady){return}
  if(!user){setAdminAllowed(demoAdmin);return}
  setAdminAllowed(null);
  isCurrentUserAdmin().then(setAdminAllowed);
 },[user,authReady,demoAdmin]);
 useEffect(()=>{
  let active=true;
  const refresh=async()=>{const result=await loadStoreState(products.map(product=>product.id));if(active&&!result.error){setStoreOpen(result.storeOpen);setStock(result.stock)}};
  refresh();const unsubscribe=subscribeToStore(refresh);
  return()=>{active=false;unsubscribe()};
 },[]);
 useEffect(()=>{
  if(!user){setCustomerOrders([]);return}
  let active=true;
  const refresh=async()=>{setCustomerLoading(true);const{data}=await loadCustomerOrders(user.id);if(active&&data)setCustomerOrders(data);if(active)setCustomerLoading(false)};
  refresh();
  const unsubscribe=subscribeToOrders(refresh),timer=window.setInterval(refresh,8000);
  return()=>{active=false;unsubscribe();window.clearInterval(timer)};
 },[user]);
 useEffect(()=>{
  if(user||window.location.pathname.startsWith('/admin')||!latestOrder)return;
  let active=true;
  const verify=async()=>{const exists=await storedOrderExists(latestOrder);if(active&&!exists){setOrders(items=>items.filter(order=>order.id!==latestOrder.id&&order.order_number!==latestOrder.order_number));setTrackOpen(false)}};
  verify();const timer=window.setInterval(verify,8000);
  return()=>{active=false;window.clearInterval(timer)};
 },[user,latestOrder?.id,latestOrder?.order_number]);
 useEffect(()=>{
  if(!window.location.pathname.startsWith('/admin')||(!adminAllowed&&!demoAdmin))return;
  let active=true;
  const refresh=async()=>{const{data}=await loadOrders();if(active&&data)setOrders(data)};
  refresh();
  const unsubscribe=subscribeToOrders(refresh);
  const refreshTimer=window.setInterval(refresh,8000);
  const onFocus=()=>refresh();
  window.addEventListener('focus',onFocus);
  return()=>{active=false;unsubscribe();window.clearInterval(refreshTimer);window.removeEventListener('focus',onFocus)};
 },[adminAllowed,demoAdmin]);
 const statusUpdate=async(id,status,stage)=>{const previous=orders;setOrders(items=>items.map(order=>order.id===id?{...order,status,stage}:order));const{error}=await updateStoredOrder(id,status,stage);if(error){setOrders(previous);window.alert(`No se pudo actualizar el pedido: ${error.message}`);return false}return true};
 const deleteOrder=async id=>{const previous=orders,previousCustomer=customerOrders,isSame=order=>order.id!==id&&order.order_number!==id;setOrders(items=>items.filter(isSame));setCustomerOrders(items=>items.filter(isSame));if(latestOrder&&(latestOrder.id===id||latestOrder.order_number===id))setTrackOpen(false);const{error}=await deleteStoredOrder(id);if(error){setOrders(previous);setCustomerOrders(previousCustomer);window.alert(`No se pudo eliminar el pedido: ${error.message}`);return false}return true};
 const toggleStore=async()=>{const next=!storeOpen;setStoreOpen(next);localStorage.setItem('shet-store-open',String(next));const{error}=await updateStoreOpen(next);if(error){setStoreOpen(!next);window.alert(`No se pudo cambiar el estado de la tienda: ${error.message}`)}};
 const toggleStock=async id=>{const next=stock[id]===false;setStock(items=>({...items,[id]:next}));const{error}=await updateProductAvailability(id,next);if(error){setStock(items=>({...items,[id]:!next}));window.alert(`No se pudo cambiar la disponibilidad: ${error.message}`)}};
 const openAccount=()=>{if(user){setAccountOpen(true);return}setAuthOpen(true)};
 const closeCustomerSession=async()=>{await signOutCustomer();setAccountOpen(false);setCustomerOrders([])};
 const demoLogin=(email,password)=>{if(email==='shet.burger@gmail.com'&&password==='shet2026'){localStorage.setItem('shet-admin-auth','true');setDemoAdmin(true);return {ok:true}}return {error:'Correo o contraseña incorrectos.'}};
 const logoutAdmin=async()=>{localStorage.removeItem('shet-admin-auth');setDemoAdmin(false);await signOutCustomer()};
 const adminProps={products,stock,onToggleStock:toggleStock,orders,onUpdateOrder:statusUpdate,onDeleteOrder:deleteOrder,storeOpen,onToggleStore:toggleStore,user,authReady:authReady&&(!user||adminAllowed!==null),adminAllowed,onSignOut:logoutAdmin,demoAdmin,onDemoLogin:demoLogin};
 if(window.location.pathname==='/admin/analytics'&&(!authReady||(!user&&!demoAdmin)||(!demoAdmin&&!adminAllowed)))return <AdminPanel {...adminProps} onLogin={()=>signInWithGoogle('/admin/analytics')}/>;
 if(window.location.pathname==='/admin/analytics')return <AdminAnalytics orders={orders}/>;
 if(window.location.pathname==='/admin')return <AdminPanel {...adminProps} onLogin={()=>signInWithGoogle('/admin')}/>;
 const add=(product,variant)=>{if(!storeOpen||stock[product.id]===false)return;const selected={label:variant[0],price:Number(variant[1].replace(/\D/g,''))},key=`${product.id}-${selected.label}`;setCart(items=>{const found=items.find(item=>item.key===key);return found?items.map(item=>item.key===key?{...item,quantity:item.quantity+1}:item):[...items,{key,product,variant:selected,quantity:1}]});setOpen(true)};
 const change=(key,quantity)=>setCart(items=>quantity<=0?items.filter(item=>item.key!==key):items.map(item=>item.key===key?{...item,quantity}:item));
 const confirm=async details=>{
  if(!storeOpen)throw new Error('La tienda está cerrada en este momento.');
  if(cart.some(item=>stock[item.product.id]===false))throw new Error('Uno de los productos ya no está disponible.');
  if(!details.form.name.trim()||details.form.name.trim().length>80)throw new Error('Revisa el nombre ingresado.');
  if(!/^\+569\d{8}$/.test(details.form.phone))throw new Error('El teléfono debe tener el formato +569 seguido de 8 números.');
  if(details.mode==='delivery'&&(!details.form.address.trim()||details.form.address.trim().length>180))throw new Error('Ingresa una dirección válida.');
  if(!details.receipt)throw new Error('Debes adjuntar el comprobante.');
  if(details.receipt.size>8*1024*1024)throw new Error('El comprobante no puede superar los 8 MB.');
  if(!['image/jpeg','image/png','image/webp','application/pdf'].includes(details.receipt.type))throw new Error('Usa un comprobante JPG, PNG, WEBP o PDF.');
  const preview=await fileData(details.receipt),order={order_number:`SHET-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0,4).toUpperCase()}`,user_id:user?.id||null,items:cart.map(item=>({product:item.product,quantity:item.quantity,price:item.variant.price,variant:item.variant.label})),total:details.total,fulfillment:details.mode,customer_name:details.form.name.trim(),customer_phone:details.form.phone,address:details.form.address.trim(),status:'Pedido recibido',stage:0,receipt_name:details.receipt?.name||'',receipt_preview:preview,created_at:new Date().toISOString()};
  const result=await saveOrder(order,details.receipt);
  if(result.error&&result.error.message!=='Supabase no configurado')throw result.error;
  const saved=result.data?normalizeOrder(result.data):normalizeOrder({...order,id:order.order_number,receipt_path:null});
  setOrders(items=>[saved,...items.filter(item=>item.id!==saved.id)]);
  if(user)setCustomerOrders(items=>[saved,...items.filter(item=>item.id!==saved.id)]);
  setCart([]);
 };
 const count=cart.reduce((sum,item)=>sum+item.quantity,0);
 return <><Header cartCount={count} onCart={()=>setOpen(true)} latestOrder={latestOrder} onTrack={()=>setTrackOpen(true)} user={user} onAccount={openAccount}/><main><Hero onOrder={()=>setOpen(true)}/><BurgerStory/><Campaign/><MenuSection onAdd={add} stock={stock} storeOpen={storeOpen}/><Ingredients/><FooterCTA onOrder={()=>setOpen(true)}/></main>{open&&<CartDrawer cart={cart} onClose={()=>setOpen(false)} onChange={change} onClear={()=>setCart([])} onConfirm={confirm} onTrack={()=>setTrackOpen(true)} products={products} stock={stock} onAdd={add}/>} {trackOpen&&<OrderTracker order={latestOrder} onClose={()=>setTrackOpen(false)}/>} {authOpen&&!user&&<CustomerAuth onClose={()=>setAuthOpen(false)}/>} {accountOpen&&user&&<CustomerAccount user={user} orders={customerOrders} loading={customerLoading} onClose={()=>setAccountOpen(false)} onSignOut={closeCustomerSession}/>}</>;
}
