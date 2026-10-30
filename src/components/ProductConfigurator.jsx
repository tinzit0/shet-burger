import { useEffect, useMemo, useState } from 'react';
import { Check, MessageSquareText, X } from 'lucide-react';
import BurgerPhoto from './BurgerPhoto';

const priceValue = price => Number(String(price || '').replace(/\D/g, ''));
const money = value => `$${Number(value || 0).toLocaleString('es-CL')}`;
const promoDrinkCounts = { 'triple-shet': 3, vicio: 1, tentacion: 2 };

export default function ProductConfigurator({ product, products, initialVariant, stock, storeOpen, onCancel, onConfirm }) {
  const availableBurgers = useMemo(
    () => products.filter(item => item.category === 'burgers' && stock[item.id] !== false),
    [products, stock],
  );
  const extras = useMemo(
    () => product.category === 'burgers' ? products.filter(item => item.category === 'extras') : [],
    [product.category, products],
  );
  const availableDrinks = useMemo(
    () => products.filter(item => item.category === 'bebidas' && !item.optionGroup && stock[item.id] !== false),
    [products, stock],
  );
  const drinkChoiceCount = product.drinkChoiceCount || promoDrinkCounts[product.id] || 0;
  const productAvailable = stock[product.id] !== false;
  const [variant, setVariant] = useState(initialVariant || product.prices[0]);
  const [optionValue, setOptionValue] = useState('');
  const [note, setNote] = useState('');
  const [selectedExtraIds, setSelectedExtraIds] = useState([]);
  const [burgerChoices, setBurgerChoices] = useState(() =>
    Array.from({ length: product.burgerChoiceCount || 0 }, () => availableBurgers[0]?.id || ''),
  );
  const [drinkChoices, setDrinkChoices] = useState(() =>
    Array.from({ length: drinkChoiceCount }, () => availableDrinks[0]?.id || ''),
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

  useEffect(() => {
    setSelectedExtraIds(items => items.filter(id => extras.some(extra => extra.id === id && stock[extra.id] !== false)));
  }, [extras, stock]);

  useEffect(() => {
    setDrinkChoices(items => Array.from({ length: drinkChoiceCount }, (_, index) => {
      const id = items[index];
      return availableDrinks.some(drink => drink.id === id) ? id : (availableDrinks[0]?.id || '');
    }));
  }, [availableDrinks, drinkChoiceCount]);

  const updateChoice = (index, value) => setBurgerChoices(items => items.map((item, itemIndex) => itemIndex === index ? value : item));
  const updateDrinkChoice = (index, value) => setDrinkChoices(items => items.map((item, itemIndex) => itemIndex === index ? value : item));
  const toggleExtra = id => setSelectedExtraIds(items => items.includes(id) ? items.filter(item => item !== id) : [...items, id]);
  const selectedExtras = extras.filter(extra => selectedExtraIds.includes(extra.id));
  const total = priceValue(variant[1]) + selectedExtras.reduce((sum, extra) => sum + priceValue(extra.prices[0][1]), 0);
  const submit = event => {
    event.preventDefault();
    if (!storeOpen || !productAvailable || (product.burgerChoiceCount > 0 && !availableBurgers.length) || (drinkChoiceCount > 0 && !availableDrinks.length) || (product.optionGroup && !optionValue)) return;
    const chosenNames = burgerChoices.map(id => availableBurgers.find(item => item.id === id)?.name).filter(Boolean);
    const drinkSelections = drinkChoices.map((id, index) => ({ label: drinkChoiceCount === 1 ? 'Bebida' : `Bebida ${index + 1}`, value: availableDrinks.find(item => item.id === id)?.name })).filter(item => item.value);
    const selections = [...(product.optionGroup && optionValue ? [{ label: product.optionGroup.label, value: optionValue }] : []), ...drinkSelections];
    onConfirm(product, variant, { note: note.trim(), burgerChoices: chosenNames, burgerChoiceIds: burgerChoices.filter(Boolean), selections, extraProducts: selectedExtras });
  };

  return <div className="product-configurator" role="dialog" aria-modal="true" aria-labelledby="product-configurator-title">
    <button className="product-configurator__backdrop" type="button" onClick={onCancel} aria-label="Cerrar personalización"/>
    <form className={`product-configurator__panel${product.image ? ' has-photo' : ' no-photo'}`} onSubmit={submit}>
      <button className="product-configurator__close" type="button" onClick={onCancel} aria-label="Cerrar"><X/></button>
      {product.image && <div className="product-configurator__photo"><BurgerPhoto product={product} sizes="(max-width: 620px) 100vw, 30rem"/></div>}
      <div className="product-configurator__content">
        <div className="product-configurator__scroll">
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
        {extras.length > 0 && <fieldset className="product-configurator__extras">
          <legend>Agrega extras <small>Opcional · puedes elegir varios</small></legend>
          <div>{extras.map(extra => {
            const selected = selectedExtraIds.includes(extra.id);
            const unavailable = stock[extra.id] === false;
            return <button type="button" key={extra.id} className={selected ? 'active' : ''} disabled={unavailable} aria-pressed={selected} onClick={() => toggleExtra(extra.id)}><span>{extra.name}<small>{unavailable ? 'Agotado' : selected ? 'Agregado' : 'Toca para agregar'}</small></span><b>{extra.prices[0][1]}</b>{selected && <Check aria-hidden="true"/>}</button>;
          })}</div>
        </fieldset>}
        {product.burgerChoiceCount > 0 && <fieldset className="product-configurator__choices">
          <legend>Elige {product.burgerChoiceCount === 1 ? 'tu hamburguesa' : `tus ${product.burgerChoiceCount} hamburguesas`}</legend>
          {burgerChoices.map((choice, index) => <label key={index}>Hamburguesa {index + 1}<select required value={choice} onChange={event => updateChoice(index, event.target.value)}>{availableBurgers.map(burger => <option key={burger.id} value={burger.id}>{burger.name}</option>)}</select></label>)}
          {!availableBurgers.length && <p className="product-configurator__warning">No hay hamburguesas disponibles para completar esta promoción.</p>}
        </fieldset>}
        {drinkChoiceCount > 0 && <fieldset className="product-configurator__choices product-configurator__drinks">
          <legend>Elige {drinkChoiceCount === 1 ? 'tu bebida' : `tus ${drinkChoiceCount} bebidas`}</legend>
          {drinkChoices.map((choice, index) => <label key={index}>Bebida {index + 1}<select required value={choice} onChange={event => updateDrinkChoice(index, event.target.value)}>{availableDrinks.map(drink => <option key={drink.id} value={drink.id}>{drink.name}</option>)}</select></label>)}
          {!availableDrinks.length && <p className="product-configurator__warning">No hay bebidas disponibles para completar esta promoción.</p>}
        </fieldset>}
        {!storeOpen && <p className="product-configurator__warning">La tienda está cerrada. Podrás elegir este producto cuando volvamos a abrir.</p>}
        {storeOpen && !productAvailable && <p className="product-configurator__warning">Este producto está agotado por el momento.</p>}
        <label className="product-configurator__note"><span><MessageSquareText/> Instrucciones especiales <small>Opcional</small></span><textarea maxLength="240" rows="3" value={note} onChange={event => setNote(event.target.value)} placeholder="Ej: sin pepinillos, sin cebolla o salsa aparte"/><small>{note.length}/240</small></label>
        </div>
        <button className="product-configurator__submit" type="submit" disabled={!storeOpen || !productAvailable || (product.burgerChoiceCount > 0 && !availableBurgers.length) || (drinkChoiceCount > 0 && !availableDrinks.length) || (product.optionGroup && !optionValue)}><span>{!storeOpen ? 'TIENDA CERRADA' : !productAvailable ? 'PRODUCTO AGOTADO' : drinkChoiceCount > 0 && !availableDrinks.length ? 'SIN BEBIDAS DISPONIBLES' : product.optionGroup && !optionValue ? `ELIGE ${product.optionGroup.label.toUpperCase()}` : selectedExtras.length ? `AGREGAR CON ${selectedExtras.length} ${selectedExtras.length === 1 ? 'EXTRA' : 'EXTRAS'}` : 'AGREGAR AL PEDIDO'}</span><b>{money(total)}</b><Check/></button>
      </div>
    </form>
  </div>;
}
