import { Minus, Plus } from 'lucide-react';

export default function QuantityControl({ label, value, onChange, disabled = false, min = 0, max = 100 }) {
  return <div className="quantity-control" role="group" aria-label={`Cantidad de ${label}`}>
    <button type="button" disabled={value <= min} onClick={() => onChange(value - 1)} aria-label={`Quitar ${label}`}><Minus/></button>
    <output aria-live="polite">{value}</output>
    <button type="button" disabled={disabled || value >= max} onClick={() => onChange(value + 1)} aria-label={`Agregar ${label}`}><Plus/></button>
  </div>;
}
