import { useEffect, useState } from 'react';
import { Check, Eye, EyeOff, KeyRound, X } from 'lucide-react';
import { changeAdminPassword } from '../lib/supabase';

/** Lets the owner change the admin panel password (needs the current one). */
export default function AdminPasswordDialog({ token, onClose }) {
  const [current, setCurrent] = useState(''), [next, setNext] = useState(''), [repeat, setRepeat] = useState('');
  const [show, setShow] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState(''), [done, setDone] = useState(false);
  useEffect(() => { const escape = event => event.key === 'Escape' && onClose(); window.addEventListener('keydown', escape); return () => window.removeEventListener('keydown', escape); }, [onClose]);

  const submit = async event => {
    event.preventDefault(); setError('');
    if (next.length < 8) { setError('La nueva contraseña debe tener al menos 8 caracteres.'); return; }
    if (next !== repeat) { setError('Las contraseñas nuevas no coinciden.'); return; }
    if (next === current) { setError('La nueva contraseña debe ser distinta de la actual.'); return; }
    setBusy(true);
    const { error: failure } = await changeAdminPassword(token, current, next);
    setBusy(false);
    if (failure) {
      setError(/demo_admin_change_password|schema cache|function/i.test(failure.message || '') ? 'Falta instalar esta función: ejecuta supabase/admin-password.sql en Supabase.' : failure.message || 'No se pudo cambiar la contraseña.');
      return;
    }
    setDone(true);
  };

  const type = show ? 'text' : 'password';
  return <div className="admin-modal admin-password" role="dialog" aria-modal="true" aria-labelledby="admin-password-title">
    <button className="admin-modal__backdrop" type="button" onClick={onClose} aria-label="Cerrar"/>
    <article>
      <button className="admin-modal__close" type="button" onClick={onClose} aria-label="Cerrar"><X/></button>
      <p><KeyRound aria-hidden="true"/> SEGURIDAD</p>
      <h2 id="admin-password-title">Cambiar contraseña</h2>
      {done ? <div className="admin-password__done" role="status">
        <Check aria-hidden="true"/>
        <strong>Contraseña actualizada.</strong>
        <span>Úsala la próxima vez que entres. Se cerró la sesión en los demás dispositivos.</span>
        <button className="admin-submit" type="button" onClick={onClose}>LISTO</button>
      </div> : <form onSubmit={submit}>
        <label>Contraseña actual<input type={type} autoComplete="current-password" required value={current} onChange={event => setCurrent(event.target.value)}/></label>
        <label>Nueva contraseña<input type={type} autoComplete="new-password" required minLength="8" maxLength="72" value={next} onChange={event => setNext(event.target.value)}/><small>Mínimo 8 caracteres.</small></label>
        <label>Repite la nueva contraseña<input type={type} autoComplete="new-password" required minLength="8" maxLength="72" value={repeat} onChange={event => setRepeat(event.target.value)}/></label>
        <button className="admin-password__toggle" type="button" onClick={() => setShow(value => !value)}>{show ? <EyeOff aria-hidden="true"/> : <Eye aria-hidden="true"/>} {show ? 'Ocultar' : 'Mostrar'} contraseñas</button>
        {error && <p className="admin-error" role="alert">{error}</p>}
        <button className="admin-submit" type="submit" disabled={busy}>{busy ? 'GUARDANDO…' : 'GUARDAR CONTRASEÑA'}</button>
      </form>}
    </article>
  </div>;
}
