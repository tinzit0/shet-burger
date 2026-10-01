import { useState } from 'react';
import { Plus } from 'lucide-react';
import { categories, products } from '../data';
import BurgerPhoto from './BurgerPhoto';

export default function MenuSection({ onAdd, stock = {}, storeOpen = true }) {
  const [active, setActive] = useState('burgers'), [variants, setVariants] = useState({});
  const visible = products.filter(p => p.category === active);
  return <section className="menu-section editorial-menu" id="menu" aria-labelledby="menu-title">
    {!storeOpen && <div className="store-closed-banner">TIENDA CERRADA <span>Las compras están temporalmente deshabilitadas.</span></div>}
    <div className="editorial-meta"><span>02 / ELIGE TU VICIO</span><span>FAT SMASH BURGERS</span></div>
    <div className="editorial-menu-heading"><h2 id="menu-title" data-reveal>THE<br/><span>BURGERS.</span></h2><p>Todas las hamburguesas<br/>incluyen papas fritas. ↙</p></div>
    <div className="category-tabs" aria-label="Categorías del menú">{categories.map(category => <button type="button" key={category.id} aria-pressed={active === category.id} className={active === category.id ? 'active' : ''} onClick={() => setActive(category.id)}>{category.label}</button>)}</div>
    <div className="editorial-products">{visible.map((product, index) => {
      const sold = stock[product.id] === false || !storeOpen, selected = variants[product.id] || product.prices[0];
      return <article className={`menu-item${product.image ? '' : ' menu-item--text'}${sold ? ' is-sold-out' : ''}`} key={product.id}>
        <span className="menu-item-number">{String(index + 1).padStart(2, '0')} /</span>
        {product.image && <div className="menu-item-photo" data-tilt><BurgerPhoto product={product}/>{sold && <span>{storeOpen ? 'AGOTADO' : 'TIENDA CERRADA'}</span>}</div>}
        <div className="menu-item-copy"><h3>{product.name}</h3><p>{product.description}</p><div className="menu-item-options" role="group" aria-label={`Tamaño de ${product.name}`}>{product.prices.map(variant => <button type="button" key={variant[0]} aria-pressed={selected[0] === variant[0]} onClick={() => setVariants(items => ({ ...items, [product.id]: variant }))}>{variant[0]} <b>{variant[1]}</b></button>)}</div></div>
        <button className="menu-item-add" type="button" disabled={sold} aria-label={`${sold ? 'No disponible' : 'Agregar'} ${product.name} ${selected[0]} por ${selected[1]}`} onClick={() => onAdd(product, selected)}><span>{sold ? (storeOpen ? 'AGOTADO' : 'CERRADA') : 'PEDIR'}<b>{selected[1]}</b></span><Plus aria-hidden="true"/></button>
      </article>;
    })}</div>
  </section>;
}
