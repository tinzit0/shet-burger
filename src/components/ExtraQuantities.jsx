import QuantityControl from './QuantityControl';
import { extraEnabled, priceValue, money } from '../lib/customization';

export default function ExtraQuantities({ title, scope, products, stock, quantities, onChange, disabled, allowedExtraIds }) {
  const extras = products.filter(product => extraEnabled(product, scope) && (!allowedExtraIds?.length || allowedExtraIds.includes(product.id)));
  return <fieldset className="extra-quantities"><legend>{title}</legend>{!extras.length && <p>No hay adicionales configurados.</p>}{extras.map(extra => {
    const quantity = quantities[extra.id] || 0;
    const unavailable = stock[extra.id] === false;
    return <div className={`extra-quantities__row${unavailable ? ' is-unavailable' : ''}`} key={extra.id}>
      <span><strong>{extra.name}</strong><small>{unavailable ? 'SIN STOCK' : `${extra.prices[0][1]} por unidad`}</small></span>
      <QuantityControl label={`${title}: ${extra.name}`} value={quantity} disabled={unavailable || disabled} onChange={value => onChange({ ...quantities, [extra.id]: value })}/>
      <b>{money(priceValue(extra.prices[0][1]) * quantity)}</b>
    </div>;
  })}</fieldset>;
}
