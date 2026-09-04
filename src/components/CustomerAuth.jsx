import { useState } from 'react';
import { ArrowRight, X } from 'lucide-react';
import { signInWithGoogle } from '../lib/supabase';

export default function CustomerAuth({ onClose }) {
  const [loading,setLoading]=useState(false),[error,setError]=useState('');
  const google=async()=>{setLoading(true);setError('');localStorage.setItem('shet-open-account-after-auth','true');const{error:googleError}=await signInWithGoogle();if(googleError){localStorage.removeItem('shet-open-account-after-auth');setError(googleError.message);setLoading(false)}};
  return <div className="customer-auth-overlay"><button className="customer-auth-backdrop" type="button" onClick={onClose} aria-label="Cerrar"/><section className="customer-auth-card customer-auth-card--google"><button className="customer-auth-close" type="button" onClick={onClose} aria-label="Cerrar"><X/></button><img src="/assets/logo shet burger.png" alt="SHET BURGER"/><small>CUENTA SHET</small><h2>Todos tus pedidos, en un lugar.</h2><p>Ingresa con Google para revisar el avance de tu pedido y consultar tus compras anteriores desde cualquier dispositivo.</p>{error&&<div className="customer-auth-error">{error}</div>}<button className="customer-auth-google" type="button" onClick={google} disabled={loading}><span className="customer-auth-google__mark">G</span>{loading?'CONECTANDO…':'CONTINUAR CON GOOGLE'}<ArrowRight/></button><p className="customer-auth-privacy">Usaremos tu cuenta únicamente para identificar y mostrar tus pedidos.</p></section></div>;
}
