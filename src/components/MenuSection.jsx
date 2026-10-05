import { useState } from 'react';
import { Plus } from 'lucide-react';
import { categories, products } from '../data';
import BurgerPhoto from './BurgerPhoto';

export default function MenuSection({ onAdd, stock = {}, storeOpen = true }) {
  const [variants, setVariants] = useState({});

  return <section className="menu-section editorial-menu" id="menu" aria-labelledby="menu-title">
    {!storeOpen && <div className="store-closed-banner">PEDIDOS CERRADOS <span>Las compras están temporalmente deshabilitadas.</span></div>}
    <div className="editorial-menu-heading"><h2 id="menu-title" data-reveal>EL<br/><span>MENÚ.</span></h2><p>Todas las hamburguesas<br/>incluyen papas fritas.</p></div>
    <div className="menu-catalog">
      {categories.map(category => {
        const categoryProducts = products.filter(product => product.category === category.id);
        return <section className="menu-category" aria-labelledby={`menu-category-${category.id}`} key={category.id}>
          <header className="menu-category__heading">
            <h3 id={`menu-category-${category.id}`}>{category.label}</h3>
          </header>
          <div className="editorial-products">
            {categoryProducts.map(product => {
              const sold = stock[product.id] === false || !storeOpen;
              const selected = variants[product.id] || product.prices[0];
              return <article className={`menu-item${product.image ? '' : ' menu-item--text'}${sold ? ' is-sold-out' : ''}`} key={product.id}>
                {product.image && <div className="menu-item-photo" data-tilt><BurgerPhoto product={product}/>{sold && <span>{storeOpen ? 'AGOTADO' : 'PEDIDOS CERRADOS'}</span>}</div>}
                <div className="menu-item-copy"><h3>{product.name}</h3><p>{product.description}</p><div className="menu-item-options" role="group" aria-label={`Tamaño de ${product.name}`}>{product.prices.map(variant => <button type="button" key={variant[0]} aria-pressed={selected[0] === variant[0]} onClick={() => setVariants(items => ({ ...items, [product.id]: variant }))}>{variant[0]} <b>{variant[1]}</b></button>)}</div></div>
                <button className="menu-item-add" type="button" disabled={sold} aria-label={`${sold ? 'No disponible' : 'Agregar'} ${product.name} ${selected[0]} por ${selected[1]}`} onClick={() => onAdd(product, selected)}><span>{sold ? (storeOpen ? 'AGOTADO' : 'CERRADA') : 'PEDIR'} <b>{selected[1]}</b></span><Plus aria-hidden="true"/></button>
              </article>;
            })}
          </div>
        </section>;
      })}
    </div>
  </section>;
}
