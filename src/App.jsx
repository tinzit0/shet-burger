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
import { deleteStoredOrder, loadCustomerOrders, loadOrders, normalizeOrder, saveOrder, subscribeToOrders, updateStoredOrder } from './lib/orders';
import { signOutCustomer, supabase } from './lib/supabase';

const fileData=file=>new Promise(resolve=>{if(!file)return resolve(null);const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.readAsDataURL(file)});

export default function App(){
 const[cart,setCart]=useState([]),[open,setOpen]=useState(false),[trackOpen,setTrackOpen]=useState(false),[authOpen,setAuthOpen]=useState(false),[accountOpen,setAccountOpen]=useState(false),[user,setUser]=useState(null),[customerOrders,setCustomerOrders]=useState([]),[customerLoading,setCustomerLoading]=useState(false),[storeOpen,setStoreOpen]=useState(()=>localStorage.getItem('shet-store-open')!=='false'),[orders,setOrders]=useState(()=>JSON.parse(localStorage.getItem('shet-demo-orders')||'[]')),[stock,setStock]=useState(()=>{const base=Object.fromEntries(products.map(product=>[product.id,true]));return {...base,...JSON.parse(localStorage.getItem('shet-demo-stock')||'{}')}});
 const latestOrder=(user?customerOrders[0]:null)||orders[0]||null;
 useEffect(()=>{localStorage.setItem('shet-demo-orders',JSON.stringify(orders))},[orders]);
 useEffect(()=>{localStorage.setItem('shet-demo-stock',JSON.stringify(stock))},[stock]);
 useEffect(()=>{localStorage.setItem('shet-store-open',String(storeOpen))},[storeOpen]);
 useEffect(()=>{
  if(!supabase)return;
  supabase.auth.getSession().then(({data})=>{setUser(data.session?.user||null);if(data.session&&localStorage.getItem('shet-open-account-after-auth')==='true'){localStorage.removeItem('shet-open-account-after-auth');setAccountOpen(true)}});
  const{data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>setUser(session?.user||null));
  return()=>subscription.unsubscribe();
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
  if(!window.location.pathname.startsWith('/admin'))return;
  let active=true;
  const refresh=async()=>{const{data}=await loadOrders();if(active&&data)setOrders(data)};
  refresh();
  const unsubscribe=subscribeToOrders(refresh);
  const refreshTimer=window.setInterval(refresh,8000);
  const onFocus=()=>refresh();
  window.addEventListener('focus',onFocus);
  return()=>{active=false;unsubscribe();window.clearInterval(refreshTimer);window.removeEventListener('focus',onFocus)};
 },[]);
 const statusUpdate=async(id,status,stage)=>{setOrders(items=>items.map(order=>order.id===id?{...order,status,stage}:order));await updateStoredOrder(id,status,stage)};
 const deleteOrder=async id=>{setOrders(items=>items.filter(order=>order.id!==id));await deleteStoredOrder(id)};
 const openAccount=()=>{if(user){setAccountOpen(true);return}setAuthOpen(true)};
 const closeCustomerSession=async()=>{await signOutCustomer();setAccountOpen(false);setCustomerOrders([])};
 if(window.location.pathname==='/admin/analytics')return <AdminAnalytics orders={orders}/>;
 if(window.location.pathname==='/admin')return <AdminPanel products={products} stock={stock} onToggleStock={id=>setStock(items=>({...items,[id]:!items[id]}))} orders={orders} onUpdateOrder={statusUpdate} onDeleteOrder={deleteOrder} storeOpen={storeOpen} onToggleStore={()=>setStoreOpen(value=>!value)}/>;
 const add=(product,variant)=>{if(!storeOpen||stock[product.id]===false)return;const selected={label:variant[0],price:Number(variant[1].replace(/\D/g,''))},key=`${product.id}-${selected.label}`;setCart(items=>{const found=items.find(item=>item.key===key);return found?items.map(item=>item.key===key?{...item,quantity:item.quantity+1}:item):[...items,{key,product,variant:selected,quantity:1}]});setOpen(true)};
 const change=(key,quantity)=>setCart(items=>quantity<=0?items.filter(item=>item.key!==key):items.map(item=>item.key===key?{...item,quantity}:item));
 const confirm=async details=>{
  const preview=await fileData(details.receipt),order={order_number:String(Date.now()).slice(-8),user_id:user?.id||null,items:cart.map(item=>({product:item.product,quantity:item.quantity,price:item.variant.price,variant:item.variant.label})),total:details.total,fulfillment:details.mode,customer_name:details.form.name,customer_phone:details.form.phone,address:details.form.address,status:'Pedido recibido',stage:0,receipt_name:details.receipt?.name||'',receipt_preview:preview,created_at:new Date().toISOString()};
  const result=await saveOrder(order,details.receipt);
  if(result.error&&result.error.message!=='Supabase no configurado')throw result.error;
  const saved=result.data?normalizeOrder(result.data):normalizeOrder({...order,id:order.order_number,receipt_path:null});
  setOrders(items=>[saved,...items.filter(item=>item.id!==saved.id)]);
  if(user)setCustomerOrders(items=>[saved,...items.filter(item=>item.id!==saved.id)]);
  setCart([]);
 };
 const count=cart.reduce((sum,item)=>sum+item.quantity,0);
 return <><Header cartCount={count} onCart={()=>setOpen(true)} latestOrder={latestOrder} onTrack={()=>setTrackOpen(true)} user={user} onAccount={openAccount}/><main><Hero onOrder={()=>setOpen(true)}/><BurgerStory/><Campaign/><MenuSection onAdd={add} stock={stock} storeOpen={storeOpen}/><Ingredients/><FooterCTA onOrder={()=>setOpen(true)}/></main>{open&&<CartDrawer cart={cart} onClose={()=>setOpen(false)} onChange={change} onClear={()=>setCart([])} onConfirm={confirm}/>} {trackOpen&&<OrderTracker order={latestOrder} onClose={()=>setTrackOpen(false)}/>} {authOpen&&!user&&<CustomerAuth onClose={()=>setAuthOpen(false)} onAuthenticated={()=>{setAuthOpen(false);setAccountOpen(true)}}/>} {accountOpen&&user&&<CustomerAccount user={user} orders={customerOrders} loading={customerLoading} onClose={()=>setAccountOpen(false)} onSignOut={closeCustomerSession}/>}</>;
}
