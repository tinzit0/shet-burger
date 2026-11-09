import { useState } from 'react';
import { ArrowUpRight, Plus, Sparkles } from 'lucide-react';
import { categories } from '../data';
import BurgerPhoto from './BurgerPhoto';
import ProductConfigurator from './ProductConfigurator';
import QuantityControl from './QuantityControl';
import { standaloneExtra } from '../lib/customization';
import { productImage } from '../lib/productImages';

export default function MenuSection({ onAdd, stock = {}, storeOpen = true, products = [], content }) {
  const [quantities, setQuantities] = useState({});
  const visibleProducts = products.filter(product => !['extras','salsas'].includes(product.category) || standaloneExtra(product));
  const [variants, setVariants] = useState({});
  const [configuring, setConfiguring] = useState(null);
  const activeCategories = categories.filter(category => visibleProducts.some(product => product.category === category.id));

  const addProduct = (product, variant) => {
    if (product.category === 'burgers' || product.category === 'promos' || product.optionGroup) {
      setConfiguring({ product, variant, quantity: quantities[product.id] || 1 });
      return;
    }
    onAdd(product, variant, { quantity: quantities[product.id] || 1 });
  };

  return <>
    <nav className="menu-jump menu-reference-jump" aria-label="Categorías del menú">
      <span className="menu-jump__label">¿QUÉ SE TE ANTOJA?</span>
      <div className="menu-jump__links">{activeCategories.map(category => <a key={category.id} href={`#menu-category-${category.id}`}>{category.label}<ArrowUpRight aria-hidden="true"/></a>)}</div>
    </nav>
    <section className="menu-section editorial-menu menu-reference" id="menu" aria-labelledby="menu-title">
    {!storeOpen && <div className="store-closed-banner">PEDIDOS CERRADOS <span>Las compras están temporalmente deshabilitadas.</span></div>}
    <div className="editorial-menu-heading"><div><h2 id="menu-title" data-reveal><span>{content.menuAccent || content.menuTitle}</span></h2></div><p><Sparkles aria-hidden="true"/><span>{content.menuNote}</span></p></div>
    <div className="menu-catalog">
      {activeCategories.map(category => {
        const categoryProducts = visibleProducts.filter(product => product.category === category.id);
        return <section className={`menu-category menu-category--${category.id}`} aria-labelledby={`menu-category-${category.id}`} key={category.id}>
          <header className="menu-category__heading">
            <h3 id={`menu-category-${category.id}`}>{category.label}</h3><span>{String(categoryProducts.length).padStart(2, '0')} OPCIONES</span>
          </header>
          <div className="editorial-products">
            {categoryProducts.map(product => {
              const hasPhoto = Boolean(productImage(product));
              const hasQuantity = ['bebidas','fritos','extras'].includes(product.category);
              const pattern = visibleProducts.indexOf(product) % 2 === 0 ? content.menuPaperWhite : content.menuPaperPink;
              const sold = stock[product.id] === false || !storeOpen;
              const unavailableLabel = !storeOpen ? 'TIENDA CERRADA' : stock[product.id] === false ? 'AGOTADO' : '';
              const selected = variants[product.id] || product.prices[0];
              const chooseLabel = product.category === 'burgers'
                ? 'ELEGIR SIMPLE O DOBLE'
                : product.optionGroup
                  ? `ELEGIR ${product.optionGroup.label.toUpperCase()}`
                  : product.category === 'promos'
                    ? 'ELEGIR Y PERSONALIZAR'
                    : 'AGREGAR AL PEDIDO';
              return <article className={`menu-item${hasPhoto ? '' : ' menu-item--text'}${hasPhoto && product.category === 'bebidas' ? ' menu-item--drink-photo' : ''}${hasQuantity && product.category !== 'bebidas' ? ' menu-item--with-quantity' : ''}${sold ? ' is-sold-out' : ''}${pattern ? ' has-brand-paper' : ''}`} style={pattern ? { backgroundImage: `url(${JSON.stringify(pattern)})` } : undefined} id={`product-${product.id}`} key={product.id} data-product-id={product.id}>
                {hasPhoto && <div className="menu-item-photo" data-tilt><BurgerPhoto product={product} sizes="(max-width: 620px) 90vw, (max-width: 1179px) 44vw, 29vw"/>{sold ? <span className="menu-item-photo__unavailable">{storeOpen ? 'AGOTADO' : 'PEDIDOS CERRADOS'}</span> : product.featured && <span className="menu-item-photo__badge"><Sparkles aria-hidden="true"/> SELLO SHET</span>}</div>}
                <div className="menu-item-copy"><div className="menu-item-title"><h3>{product.name}</h3>{unavailableLabel && <span className="menu-item__status">{unavailableLabel}</span>}</div>{product.category === 'burgers' ? <div className="menu-item-price"><b>{product.prices[0][1]}</b></div> : product.optionGroup ? <div className="menu-item-price"><span>{product.prices[0][0]}</span><b>{product.prices[0][1]}</b></div> : <div className="menu-item-options" role="group" aria-label={`Opción de ${product.name}`}>{product.prices.map(variant => <button type="button" key={variant[0]} disabled={sold} aria-pressed={selected[0] === variant[0]} onClick={() => setVariants(items => ({ ...items, [product.id]: variant }))}>{variant[0]} <b>{variant[1]}</b></button>)}</div>}<p>{product.description}</p></div>
                {hasQuantity && <QuantityControl label={product.name} value={quantities[product.id] || 1} min={1} max={25} disabled={sold} onChange={value => setQuantities(items => ({ ...items, [product.id]: value }))}/>}
                <button className="menu-item-add" type="button" disabled={sold} aria-label={`${sold ? 'No disponible' : 'Elegir'} ${product.name} desde ${product.prices[0][1]}`} onClick={() => addProduct(product, selected)}><span><span className="menu-item-add__desktop">{sold ? (storeOpen ? 'AGOTADO' : 'CERRADA') : chooseLabel}</span><span className="menu-item-add__mobile">{sold ? 'NO' : 'ELEGIR'}</span><b>{product.prices[0][1]}</b></span><Plus aria-hidden="true"/></button>
              </article>;
            })}
          </div>
        </section>;
      })}
    </div>
  </section>
  {configuring && <ProductConfigurator
    product={configuring.product}
    products={products}
    initialVariant={configuring.variant}
    initialQuantity={configuring.quantity}
    stock={stock}
    storeOpen={storeOpen}
    onCancel={() => setConfiguring(null)}
    onConfirm={(product, variant, customization) => {
      if (onAdd(product, variant, customization) !== false) setConfiguring(null);
    }}
  />}
  </>;
}
