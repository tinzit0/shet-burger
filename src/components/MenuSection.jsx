import { useState } from 'react';
import { ArrowUpRight, Plus, Sparkles } from 'lucide-react';
import { categories } from '../data';
import BurgerPhoto from './BurgerPhoto';
import ProductConfigurator from './ProductConfigurator';

export default function MenuSection({ onAdd, stock = {}, storeOpen = true, products = [], content }) {
  const [variants, setVariants] = useState({});
  const [configuring, setConfiguring] = useState(null);
  const activeCategories = categories.filter(category => products.some(product => product.category === category.id));

  const addProduct = (product, variant) => {
    if (product.category === 'burgers' || product.category === 'promos') {
      setConfiguring({ product, variant });
      return;
    }
    onAdd(product, variant);
  };

  return <>
    <nav className="menu-jump menu-reference-jump" aria-label="Categorías del menú">
      <span className="menu-jump__label">¿QUÉ SE TE ANTOJA?</span>
      <div className="menu-jump__links">{activeCategories.map(category => <a key={category.id} href={`#menu-category-${category.id}`}>{category.label}<ArrowUpRight aria-hidden="true"/></a>)}</div>
    </nav>
    <section className="menu-section editorial-menu menu-reference" id="menu" aria-labelledby="menu-title">
    {!storeOpen && <div className="store-closed-banner">PEDIDOS CERRADOS <span>Las compras están temporalmente deshabilitadas.</span></div>}
    <div className="editorial-menu-heading"><div><span className="menu-eyebrow">{content.menuEyebrow}</span><h2 id="menu-title" data-reveal>{content.menuTitle}<br/><span>{content.menuAccent}</span></h2></div><p><Sparkles aria-hidden="true"/><span>{content.menuNote}</span></p></div>
    <div className="menu-catalog">
      {activeCategories.map(category => {
        const categoryProducts = products.filter(product => product.category === category.id);
        return <section className={`menu-category menu-category--${category.id}`} aria-labelledby={`menu-category-${category.id}`} key={category.id}>
          <header className="menu-category__heading">
            <h3 id={`menu-category-${category.id}`}>{category.label}</h3><span>{String(categoryProducts.length).padStart(2, '0')} OPCIONES</span>
          </header>
          <div className="editorial-products">
            {categoryProducts.map(product => {
              const sold = stock[product.id] === false || !storeOpen;
              const unavailableLabel = !storeOpen ? 'TIENDA CERRADA' : stock[product.id] === false ? 'AGOTADO' : '';
              const selected = variants[product.id] || product.prices[0];
              return <article className={`menu-item${product.image ? '' : ' menu-item--text'}${sold ? ' is-sold-out' : ''}`} id={`product-${product.id}`} key={product.id} data-product-id={product.id}>
                {product.image && <div className="menu-item-photo" data-tilt><BurgerPhoto product={product} sizes="(max-width: 620px) 90vw, (max-width: 1179px) 44vw, 29vw"/>{sold ? <span className="menu-item-photo__unavailable">{storeOpen ? 'AGOTADO' : 'PEDIDOS CERRADOS'}</span> : product.featured && <span className="menu-item-photo__badge"><Sparkles aria-hidden="true"/> SELLO SHET</span>}</div>}
                <div className="menu-item-copy"><div className="menu-item-title"><h3>{product.name}</h3>{unavailableLabel && <span className="menu-item__status">{unavailableLabel}</span>}</div><div className="menu-item-options" role="group" aria-label={`Tamaño de ${product.name}`}>{product.prices.map(variant => <button type="button" key={variant[0]} disabled={sold} aria-pressed={selected[0] === variant[0]} onClick={() => setVariants(items => ({ ...items, [product.id]: variant }))}>{variant[0]} <b>{variant[1]}</b></button>)}</div><p>{product.description}</p></div>
                <button className="menu-item-add" type="button" disabled={sold} aria-label={`${sold ? 'No disponible' : 'Elegir'} ${product.name} ${selected[0]} por ${selected[1]}`} onClick={() => addProduct(product, selected)}><span><span className="menu-item-add__desktop">{sold ? (storeOpen ? 'AGOTADO' : 'CERRADA') : (product.category === 'burgers' || product.category === 'promos' ? 'ELEGIR Y PERSONALIZAR' : 'AGREGAR AL PEDIDO')}</span><span className="menu-item-add__mobile">{sold ? 'NO' : 'ELEGIR'}</span><b>{selected[1]}</b></span><Plus aria-hidden="true"/></button>
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
    stock={stock}
    storeOpen={storeOpen}
    onCancel={() => setConfiguring(null)}
    onConfirm={(product, variant, customization) => {
      onAdd(product, variant, customization);
      setConfiguring(null);
    }}
  />}
  </>;
}
