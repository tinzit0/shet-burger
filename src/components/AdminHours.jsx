import { useEffect, useState } from 'react';
import { Check, Clock, Save } from 'lucide-react';
import { isValidOpeningTime } from '../lib/openingTime';
import { openingTime as fallbackOpeningTime } from '../config';
import { formatCountdown, meridiem, minutesUntilOpening } from '../lib/useOpeningCountdown';

/** Apartado "Horario": el dueño fija la hora diaria de apertura que ve el cliente. */
export default function AdminHours({ siteContent = {}, onSaveContent }) {
  const saved = isValidOpeningTime(siteContent.openingTime) ? siteContent.openingTime : fallbackOpeningTime;
  const [time, setTime] = useState(saved), [busy, setBusy] = useState(false), [message, setMessage] = useState(null);
  useEffect(() => { setTime(saved); }, [saved]);
  const valid = isValidOpeningTime(time), dirty = time !== saved;

  const submit = async event => {
    event.preventDefault();
    if (!valid || !onSaveContent) return;
    setBusy(true); setMessage(null);
    const result = await onSaveContent({ ...siteContent, openingTime: time });
    setBusy(false);
    setMessage(result?.ok ? { ok: true, text: `Listo. El sitio ahora dice que abren a las ${time} hrs.` } : { ok: false, text: `No se pudo guardar: ${result?.error?.message || 'error desconocido'}` });
  };

  return <section className="admin-hours">
    <div className="admin-section-title"><h2>Horario</h2></div>
    <form className="admin-hours__card" onSubmit={submit}>
      <div className="admin-hours__field">
        <label htmlFor="admin-opening-time"><Clock aria-hidden="true"/> Hora de apertura</label>
        <input id="admin-opening-time" type="time" step="300" required value={time} onChange={event => { setTime(event.target.value); setMessage(null); }}/>
        <small>Formato 24 h. Se muestra en el aviso de local cerrado, la cuenta regresiva, la franja de inicio y el pie de página.</small>
      </div>
      <div className="admin-hours__preview" aria-live="polite">
        <span>ASÍ LO VE EL CLIENTE</span>
        <strong>ABRIMOS A LAS {valid ? time : '--:--'} <em>{valid ? meridiem(time) : ''}</em></strong>
        {valid && <small>Si hoy está cerrado, faltan {formatCountdown(minutesUntilOpening(new Date(), time))}</small>}
      </div>
      <button className="admin-hours__save" type="submit" disabled={busy || !valid || !dirty}>{busy ? 'GUARDANDO…' : dirty ? <><Save/> GUARDAR HORA</> : <><Check/> GUARDADO</>}</button>
      {message && <p className={message.ok ? 'admin-hours__ok' : 'admin-error'} role={message.ok ? 'status' : 'alert'}>{message.text}</p>}
      <p className="admin-hours__note">La hora no abre ni cierra la tienda sola: el interruptor <b>Abierto / Cerrado</b> sigue funcionando igual que antes.</p>
    </form>
  </section>;
}
