import { useEffect, useMemo, useState } from 'react';
import { Check, MessageSquareText, X } from 'lucide-react';
import BurgerPhoto from './BurgerPhoto';

export default function ProductConfigurator({ product, products, initialVariant, stock, storeOpen, onCancel, onConfirm }) {
  const availableBurgers = useMemo(
    () => products.filter(item => item.category === 'burgers' && stock[item.id] !== false),
    [products, stock],
  );
  const productAvailable = stock[product.id] !== false;
  const [variant, setVariant] = useState(initialVariant || product.prices[0]);
  const [optionValue, setOptionValue] = useState('');
  const [note, setNote] = useState('');
  const [burgerChoices, setBurgerChoices] = useState(() =>
    Array.from({ length: product.burgerChoiceCount || 0 }, () => availableBurgers[0]?.id || ''),
  );

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = event => event.key === 'Escape' && onCancel();
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [onCancel]);

  useEffect(() => {
    setBurgerChoices(items => items.map(id => availableBurgers.some(burger => burger.id === id) ? id : (availableBurgers[0]?.id || '')));
  }, [availableBurgers]);

  const updateChoice = (index, value) => setBurgerChoices(items => items.map((item, itemIndex) => itemIndex === index ? value : item));
  const submit = event => {
    event.preventDefault();
    if (!storeOpen || !productAvailable || (product.burgerChoiceCount > 0 && !availableBurgers.length) || (product.optionGroup && !optionValue)) return;
    const chosenNames = burgerChoices.map(id => availableBurgers.find(item => item.id === id)?.name).filter(Boolean);
    const selections = product.optionGroup && optionValue ? [{ label: product.optionGroup.label, value: optionValue }] : [];
    onConfirm(product, variant, { note: note.trim(), burgerChoices: chosenNames, burgerChoiceIds: burgerChoices.filter(Boolean), selections });
  };

  return <div className="product-configurator" role="dialog" aria-modal="true" aria-labelledby="product-configurator-title">
    <button className="product-configurator__backdrop" type="button" onClick={onCancel} aria-label="Cerrar personalización"/>
    <form className={`product-configurator__panel${product.image ? ' has-photo' : ' no-photo'}`} onSubmit={submit}>
      <button className="product-configurator__close" type="button" onClick={onCancel} aria-label="Cerrar"><X/></button>
      {product.image && <div className="product-configurator__photo"><BurgerPhoto product={product} sizes="(max-width: 620px) 100vw, 30rem"/></div>}
      <div className="product-configurator__content">
        <span>ARMA TU PEDIDO</span>
        <h2 id="product-configurator-title">{product.name}</h2>
        <p>{product.description}</p>
        {product.prices.length > 1 && <fieldset className="product-configurator__variants">
          <legend>{product.category === 'burgers' ? 'Elige Simple o Doble' : 'Elige una opción'}</legend>
          <div>{product.prices.map(item => <button type="button" key={item[0]} className={variant[0] === item[0] ? 'active' : ''} onClick={() => setVariant(item)}><span>{item[0]}</span><b>{item[1]}</b></button>)}</div>
        </fieldset>}
        {product.optionGroup && <fieldset className="product-configurator__options">
          <legend>{product.optionGroup.prompt}</legend>
          <div>{product.optionGroup.values.map(value => <button type="button" key={value} className={optionValue === value ? 'active' : ''} aria-pressed={optionValue === value} onClick={() => setOptionValue(value)}>{value}{optionValue === value && <Check aria-hidden="true"/>}</button>)}</div>
        </fieldset>}
        {product.burgerChoiceCount > 0 && <fieldset className="product-configurator__choices">
          <legend>Elige {product.burgerChoiceCount === 1 ? 'tu hamburguesa' : `tus ${product.burgerChoiceCount} hamburguesas`}</legend>
          {burgerChoices.map((choice, index) => <label key={index}>Hamburguesa {index + 1}<select required value={choice} onChange={event => updateChoice(index, event.target.value)}>{availableBurgers.map(burger => <option key={burger.id} value={burger.id}>{burger.name}</option>)}</select></label>)}
          {!availableBurgers.length && <p className="product-configurator__warning">No hay hamburguesas disponibles para completar esta promoción.</p>}
        </fieldset>}
        {!storeOpen && <p className="product-configurator__warning">La tienda está cerrada. Podrás elegir este producto cuando volvamos a abrir.</p>}
        {storeOpen && !productAvailable && <p className="product-configurator__warning">Este producto está agotado por el momento.</p>}
        <label className="product-configurator__note"><span><MessageSquareText/> Instrucciones especiales <small>Opcional</small></span><textarea maxLength="240" rows="3" value={note} onChange={event => setNote(event.target.value)} placeholder="Ej: sin pepinillos, sin cebolla o salsa aparte"/><small>{note.length}/240</small></label>
        <button className="product-configurator__submit" type="submit" disabled={!storeOpen || !productAvailable || (product.burgerChoiceCount > 0 && !availableBurgers.length) || (product.optionGroup && !optionValue)}><span>{!storeOpen ? 'TIENDA CERRADA' : !productAvailable ? 'PRODUCTO AGOTADO' : product.optionGroup && !optionValue ? `ELIGE ${product.optionGroup.label.toUpperCase()}` : 'AGREGAR AL PEDIDO'}</span><b>{variant[1]}</b><Check/></button>
      </div>
    </form>
  </div>;
}
