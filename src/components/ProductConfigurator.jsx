import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, MessageSquareText, X } from 'lucide-react';
import BurgerPhoto from './BurgerPhoto';
import { productImage } from '../lib/productImages';
import ExtraQuantities from './ExtraQuantities';
import QuantityControl from './QuantityControl';
import { selectedAddons, customizationTotal, customizationLines, customizationUnavailable, promotionBurgerAllowed, promotionExtraAllowed } from '../lib/customization';

const priceValue = price => Number(String(price || '').replace(/\D/g, ''));
const money = value => `$${Number(value || 0).toLocaleString('es-CL')}`;
const promoDrinkCounts = { 'triple-shet': 3, vicio: 1, tentacion: 2 };

export default function ProductConfigurator({ product, products, initialVariant, initialQuantity = 1, stock, storeOpen, onCancel, onConfirm }) {
  const availableBurgers = useMemo(
    () => products.filter(item => item.category === 'burgers' && stock[item.id] !== false && (!product.allowedBurgerIds?.length || product.allowedBurgerIds.includes(item.id))),
    [products, stock, product.allowedBurgerIds],
  );
  const availableDrinks = useMemo(
    () => products.filter(item => item.category === 'bebidas' && !item.optionGroup && stock[item.id] !== false),
    [products, stock],
  );
  const drinkChoiceCount = product.drinkChoiceCount ?? promoDrinkCounts[product.id] ?? 0;
  const productAvailable = stock[product.id] !== false;
  const [variant, setVariant] = useState(initialVariant || product.prices[0]);
  const [optionValue, setOptionValue] = useState('');
  const [note, setNote] = useState('');
  const [extraQuantities, setExtraQuantities] = useState({});
  const [friesQuantities, setFriesQuantities] = useState({});
  const [quantity, setQuantity] = useState(initialQuantity);
  const [burgerDetails, setBurgerDetails] = useState(() => Array.from({ length: product.burgerChoiceCount || 0 }, () => ({ variant: '', extras: {}, fries: {} })));
  const [burgerChoices, setBurgerChoices] = useState(() =>
    Array.from({ length: product.burgerChoiceCount || 0 }, (_, index) => availableBurgers.find(burger => promotionBurgerAllowed(product, index, burger))?.id || ''),
  );
  const [drinkChoices, setDrinkChoices] = useState(() =>
    Array.from({ length: drinkChoiceCount }, () => availableDrinks[0]?.id || ''),
  );
  const panelRef = useRef(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement;
    document.body.style.overflow = 'hidden';
    panelRef.current?.querySelector('button')?.focus();
    const closeOnEscape = event => {
      if (event.key === 'Escape') onCancel();
      if (event.key !== 'Tab') return;
      const controls = [...panelRef.current.querySelectorAll('button:not(:disabled),select,textarea,input')].filter(item => item.getClientRects().length);
      if (event.shiftKey && document.activeElement === controls[0]) { event.preventDefault(); controls.at(-1)?.focus(); }
      else if (!event.shiftKey && document.activeElement === controls.at(-1)) { event.preventDefault(); controls[0]?.focus(); }
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
      previousFocus?.focus();
    };
  }, [onCancel]);

  const updateChoice = (index, value) => {
    setBurgerChoices(items => items.map((item, itemIndex) => itemIndex === index ? value : item));
    setBurgerDetails(items => items.map((item, itemIndex) => itemIndex === index ? { ...item, variant: '' } : item));
  };
  const updateBurger = (index, changes) => setBurgerDetails(items => items.map((item, itemIndex) => itemIndex === index ? { ...item, ...changes } : item));
  const updateDrinkChoice = (index, value) => setDrinkChoices(items => items.map((item, itemIndex) => itemIndex === index ? value : item));
  const burgers = burgerChoices.map((id, index) => {
    const burger = products.find(item => item.id === id);
    const details = burgerDetails[index];
    const variants = burger?.prices.filter((_, i) => (product.allowBurgerVariants !== false && product.promotionSlots?.[index]?.allowBurgerVariants !== false) || i === 0);
    const selectedVariant = variants?.find(item => item[0] === details.variant) || variants?.[0];
    const extras = products.filter(extra => promotionExtraAllowed(product, index, burger, extra));
    return { product_id: id, name: burger?.name || '', variant: selectedVariant?.[0] || '', surcharge: selectedVariant ? priceValue(selectedVariant[1]) - priceValue(burger.prices[0][1]) : 0, extras: selectedAddons(details.extras, extras, 'burger'), friesExtras: selectedAddons(details.fries, extras, 'fries') };
  });
  const customization = { extras: selectedAddons(extraQuantities, products, 'burger'), friesExtras: selectedAddons(friesQuantities, products, 'fries'), burgers, drinkChoiceIds: drinkChoices };
  const unavailableCustomization = customizationUnavailable(customization, stock, products) || burgerChoices.some((id, index) => !availableBurgers.some(burger => burger.id === id && promotionBurgerAllowed(product, index, burger)));
  const total = priceValue(variant[1]) + customizationTotal(customization);
  const submit = event => {
    event.preventDefault();
    if (!storeOpen || !productAvailable || unavailableCustomization || (product.burgerChoiceCount > 0 && !availableBurgers.length) || (drinkChoiceCount > 0 && !availableDrinks.length) || (product.optionGroup && !optionValue)) return;
    const chosenNames = burgerChoices.map(id => availableBurgers.find(item => item.id === id)?.name).filter(Boolean);
    const drinkSelections = drinkChoices.map((id, index) => ({ label: drinkChoiceCount === 1 ? 'Bebida' : `Bebida ${index + 1}`, value: availableDrinks.find(item => item.id === id)?.name })).filter(item => item.value);
    const selections = [...(product.optionGroup && optionValue ? [{ label: product.optionGroup.label, value: optionValue }] : []), ...drinkSelections, ...customizationLines(customization)];
    onConfirm(product, variant, { ...customization, quantity, note: note.trim(), burgerChoices: chosenNames, burgerChoiceIds: burgerChoices.filter(Boolean), selections });
  };

  return <div className="product-configurator" role="dialog" aria-modal="true" aria-labelledby="product-configurator-title">
    <button className="product-configurator__backdrop" type="button" onClick={onCancel} aria-label="Cerrar personalización"/>
    <form ref={panelRef} className={`product-configurator__panel${productImage(product) ? ' has-photo' : ' no-photo'}${product.category === 'bebidas' ? ' is-drink' : ''}`} onSubmit={submit}>
      <button className="product-configurator__close" type="button" onClick={onCancel} aria-label="Cerrar"><X/></button>
      {productImage(product) && <div className="product-configurator__photo"><BurgerPhoto product={product} sizes="(max-width: 620px) 100vw, 30rem"/></div>}
      <div className="product-configurator__content">
        <div className="product-configurator__scroll">
        <span>ARMA TU PEDIDO</span>
        <h2 id="product-configurator-title">{product.name}</h2>
        <p>{product.description}</p>
        {product.prices.length > 1 && <fieldset className="product-configurator__variants">
          <legend>{product.category === 'burgers' ? 'Elige Simple o Doble' : 'Elige una opción'}</legend>
          <div>{product.prices.map(item => <button type="button" key={item[0]} className={variant[0] === item[0] ? 'active' : ''} onClick={() => setVariant(item)}><span>{item[0]}</span><b>{item[1]}</b></button>)}</div>
        </fieldset>}
        {product.category === 'burgers' && <ExtraQuantities allowedExtraIds={product.allowedExtraIds} title="MEJORA TUS PAPAS" scope="fries" products={products} stock={stock} quantities={friesQuantities} onChange={setFriesQuantities} disabled={!storeOpen}/>}
        {product.optionGroup && <fieldset className="product-configurator__options">
          <legend>{product.optionGroup.prompt}</legend>
          <div>{product.optionGroup.values.map(value => <button type="button" key={value} className={optionValue === value ? 'active' : ''} aria-pressed={optionValue === value} onClick={() => setOptionValue(value)}>{value}{optionValue === value && <Check aria-hidden="true"/>}</button>)}</div>
        </fieldset>}
        {product.category === 'burgers' && <ExtraQuantities allowedExtraIds={product.allowedExtraIds} title="Extras de tu hamburguesa" scope="burger" products={products} stock={stock} quantities={extraQuantities} onChange={setExtraQuantities} disabled={!storeOpen}/>}
        {product.burgerChoiceCount > 0 && <fieldset className="product-configurator__choices">
          <legend>Elige {product.burgerChoiceCount === 1 ? 'tu hamburguesa' : `tus ${product.burgerChoiceCount} hamburguesas`}</legend>
          {burgerChoices.map((choice, index) => {
            const slotBurgers = availableBurgers.filter(burger => promotionBurgerAllowed(product, index, burger));
            const burger = slotBurgers.find(item => item.id === choice);
            const extraProducts = products.filter(extra => promotionExtraAllowed(product, index, burger, extra));
            const details = burgerDetails[index];
            return <section className="promo-burger" key={index}><h3>Hamburguesa {index + 1}</h3><label>Elige tu hamburguesa<select required value={burger ? choice : ''} onChange={event => updateChoice(index, event.target.value)}><option value="" disabled>Selecciona una hamburguesa disponible</option>{slotBurgers.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
              {burger && <><fieldset className="product-configurator__variants"><legend>Simple o doble</legend><div>{burger.prices.filter((_, i) => (product.allowBurgerVariants !== false && product.promotionSlots?.[index]?.allowBurgerVariants !== false) || i === 0).map(item => <button type="button" key={item[0]} aria-pressed={burgers[index].variant === item[0]} className={burgers[index].variant === item[0] ? 'active' : ''} onClick={() => updateBurger(index, { variant: item[0] })}><span>{item[0]}</span><b>{item === burger.prices[0] ? 'Incluida' : `+${money(priceValue(item[1]) - priceValue(burger.prices[0][1]))}`}</b></button>)}</div></fieldset>
              <ExtraQuantities allowedExtraIds={burger.allowedExtraIds} title={`Hamburguesa ${index + 1}: MEJORA TUS PAPAS`} scope="fries" products={extraProducts} stock={stock} quantities={details.fries} onChange={fries => updateBurger(index, { fries })} disabled={!storeOpen}/>
              <ExtraQuantities allowedExtraIds={burger.allowedExtraIds} title={`Hamburguesa ${index + 1}: extras`} scope="burger" products={extraProducts} stock={stock} quantities={details.extras} onChange={extras => updateBurger(index, { extras })} disabled={!storeOpen}/></>}
            </section>;
          })}
          {!availableBurgers.length && <p className="product-configurator__warning">No hay hamburguesas disponibles para completar esta promoción.</p>}
        </fieldset>}
        {drinkChoiceCount > 0 && <fieldset className="product-configurator__choices product-configurator__drinks">
          <legend>Elige {drinkChoiceCount === 1 ? 'tu bebida' : `tus ${drinkChoiceCount} bebidas`}</legend>
          {drinkChoices.map((choice, index) => <label key={index}>Bebida {index + 1}<select required value={availableDrinks.some(item => item.id === choice) ? choice : ''} onChange={event => updateDrinkChoice(index, event.target.value)}><option value="" disabled>Selecciona una bebida disponible</option>{availableDrinks.map(drink => <option key={drink.id} value={drink.id}>{drink.name}</option>)}</select></label>)}
          {!availableDrinks.length && <p className="product-configurator__warning">No hay bebidas disponibles para completar esta promoción.</p>}
        </fieldset>}
        {!storeOpen && <p className="product-configurator__warning">La tienda está cerrada. Podrás elegir este producto cuando volvamos a abrir.</p>}
        {storeOpen && !productAvailable && <p className="product-configurator__warning">Este producto está agotado por el momento.</p>}
        {unavailableCustomization && <p className="product-configurator__warning" role="alert">Una selección se agotó. Retira el adicional o elige otro producto.</p>}
        {product.category === 'bebidas' && <QuantityControl label={product.name} value={quantity} min={1} max={25} disabled={!storeOpen} onChange={setQuantity}/>}
        <label className="product-configurator__note"><span><MessageSquareText/> Instrucciones especiales <small>Opcional</small></span><textarea maxLength="240" rows="3" value={note} onChange={event => setNote(event.target.value)} placeholder="Ej: sin pepinillos, sin cebolla o salsa aparte"/><small>{note.length}/240</small></label>
        </div>
        <button className="product-configurator__submit" type="submit" disabled={!storeOpen || !productAvailable || unavailableCustomization || (product.burgerChoiceCount > 0 && !availableBurgers.length) || (drinkChoiceCount > 0 && !availableDrinks.length) || (product.optionGroup && !optionValue)}><span>{!storeOpen ? 'TIENDA CERRADA' : !productAvailable ? 'PRODUCTO AGOTADO' : drinkChoiceCount > 0 && !availableDrinks.length ? 'SIN BEBIDAS DISPONIBLES' : product.optionGroup && !optionValue ? `ELIGE ${product.optionGroup.label.toUpperCase()}` : 'AGREGAR AL PEDIDO'}</span><b>{money(total * quantity)}</b><Check/></button>
      </div>
    </form>
  </div>;
}
