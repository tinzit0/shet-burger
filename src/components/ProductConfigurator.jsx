import { useEffect, useMemo, useState } from 'react';
import { Check, MessageSquareText, X } from 'lucide-react';
import BurgerPhoto from './BurgerPhoto';

export default function ProductConfigurator({ product, products, initialVariant, stock, storeOpen, onCancel, onConfirm }) {
  const availableBurgers = useMemo(
    () => products.filter(item => item.category === 'burgers' && stock[item.id] !== false),
    [stock],
  );
  const [variant, setVariant] = useState(initialVariant || product.prices[0]);
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

  const updateChoice = (index, value) => setBurgerChoices(items => items.map((item, itemIndex) => itemIndex === index ? value : item));
  const submit = event => {
    event.preventDefault();
    const chosenNames = burgerChoices.map(id => availableBurgers.find(item => item.id === id)?.name).filter(Boolean);
    onConfirm(product, variant, { note: note.trim(), burgerChoices: chosenNames });
  };

  return <div className="product-configurator" role="dialog" aria-modal="true" aria-labelledby="product-configurator-title">
    <button className="product-configurator__backdrop" type="button" onClick={onCancel} aria-label="Cerrar personalización"/>
    <form className="product-configurator__panel" onSubmit={submit}>
      <button className="product-configurator__close" type="button" onClick={onCancel} aria-label="Cerrar"><X/></button>
      {product.image && <div className="product-configurator__photo"><BurgerPhoto product={product} sizes="(max-width: 620px) 100vw, 30rem"/></div>}
      <div className="product-configurator__content">
        <span>ARMA TU PEDIDO</span>
        <h2 id="product-configurator-title">{product.name}</h2>
        <p>{product.description}</p>
        {product.prices.length > 1 && <fieldset className="product-configurator__variants">
          <legend>Elige el tamaño</legend>
          <div>{product.prices.map(item => <button type="button" key={item[0]} className={variant[0] === item[0] ? 'active' : ''} onClick={() => setVariant(item)}><span>{item[0]}</span><b>{item[1]}</b></button>)}</div>
        </fieldset>}
        {product.burgerChoiceCount > 0 && <fieldset className="product-configurator__choices">
          <legend>Elige {product.burgerChoiceCount === 1 ? 'tu hamburguesa' : `tus ${product.burgerChoiceCount} hamburguesas`}</legend>
          {burgerChoices.map((choice, index) => <label key={index}>Hamburguesa {index + 1}<select required value={choice} onChange={event => updateChoice(index, event.target.value)}>{availableBurgers.map(burger => <option key={burger.id} value={burger.id}>{burger.name}</option>)}</select></label>)}
          {!availableBurgers.length && <p className="product-configurator__warning">No hay hamburguesas disponibles para completar esta promoción.</p>}
        </fieldset>}
        <label className="product-configurator__note"><span><MessageSquareText/> Instrucciones especiales <small>Opcional</small></span><textarea maxLength="240" rows="3" value={note} onChange={event => setNote(event.target.value)} placeholder="Ej: sin pepinillos, sin cebolla o salsa aparte"/><small>{note.length}/240</small></label>
        <button className="product-configurator__submit" type="submit" disabled={!storeOpen || (product.burgerChoiceCount > 0 && !availableBurgers.length)}><span>AGREGAR AL PEDIDO</span><b>{variant[1]}</b><Check/></button>
      </div>
    </form>
  </div>;
}
