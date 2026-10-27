import { useState } from 'react';
import { ArrowUpRight, Check, Flame, Heart, Plus, Sparkles } from 'lucide-react';
import { products } from '../data';
import BurgerPhoto from './BurgerPhoto';

const flavors = [
  { id: 'smoky', label: 'Ahumado', note: 'Fuego lento, sabor largo.', productId: 'cowboy-smoke', detail: 'Pulled pork artesanal, cebolla crispy y BBQ. Para quienes quieren ir un poco más allá.', ingredients: ['PULLED PORK', 'CEBOLLA CRISPY', 'SALSA BBQ'], icon: Flame, accent: '#a95334', tint: '#ecd8cc' },
  { id: 'sweet', label: 'Dulce & salado', note: 'El equilibrio más adictivo.', productId: 'bacon-trip', detail: 'La mermelada de tocino se encuentra con el cheddar y la salsa Emmy. Un viaje de ida.', ingredients: ['MERMELADA DE TOCINO', 'DOBLE CHEDDAR', 'SALSA EMMY'], icon: Heart, accent: '#994368', tint: '#eddae4' },
  { id: 'spicy', label: 'Un poco de fuego', note: 'Justo ese toque picante.', productId: 'onion-shet', detail: 'Cebolla crispy, tocino y mayo sriracha ligeramente picante. Cruje desde el primer mordisco.', ingredients: ['CEBOLLA CRISPY', 'TOCINO', 'MAYO SRIRACHA'], icon: Flame, accent: '#a13c31', tint: '#eed8cf' },
  { id: 'bold', label: 'Algo distinto', note: 'Para salir de lo de siempre.', productId: 'blue-hit', detail: 'Queso azul, champiñones salteados y rúcula. Una combinación con mucha personalidad.', ingredients: ['SALSA DE QUESO AZUL', 'CHAMPIÑONES', 'RÚCULA'], icon: Sparkles, accent: '#49634b', tint: '#dce2d5' },
];

export default function FlavorFinder({ onAdd, stock = {}, storeOpen = true }) {
  const [selected, setSelected] = useState('sweet');
  const [size, setSize] = useState(0);
  const flavor = flavors.find(item => item.id === selected);
  const product = products.find(item => item.id === flavor.productId);
  const variant = product.prices[size];
  const available = storeOpen && stock[product.id] !== false;

  return <section className="flavor-finder section" id="tu-antojo" aria-labelledby="flavor-title" style={{ '--flavor-accent': flavor.accent, '--flavor-tint': flavor.tint }}>
    <div className="experience-rule"><span><i/> UNA BURGER MUY TÚ</span><span>02 / ELIGE</span></div>
    <header className="flavor-finder__heading" data-reveal><h2 id="flavor-title">Sigue tu<br/><em>antojo.</em></h2><p>Cada antojo tiene su burger.<br/>Dinos qué te mueve y encuentra la tuya.</p><span className="flavor-finder__spark" aria-hidden="true">✳</span></header>
    <div className="flavor-finder__choices" role="group" aria-label="Elige el sabor que se te antoja">
      {flavors.map(item => { const Icon = item.icon; return <button key={item.id} type="button" aria-pressed={item.id === selected} onClick={() => setSelected(item.id)}><Icon aria-hidden="true"/><span>{item.label}</span><span className="flavor-finder__check" aria-hidden="true">{item.id === selected ? <Check/> : <Plus/>}</span></button>; })}
    </div>
    <div className="flavor-finder__result">
      <div className="flavor-finder__visual">
        <div className="flavor-finder__photo" data-tilt><BurgerPhoto key={product.id} product={product} sizes="(max-width: 720px) 90vw, 46vw"/></div>
        <span className="flavor-finder__photo-note"><span aria-hidden="true">✳</span> CON PAPAS. SIEMPRE.</span>
        <span className="flavor-finder__serial" aria-hidden="true">SHET SELECT / 0{flavors.indexOf(flavor) + 1}</span>
      </div>
      <div className="flavor-finder__details">
        <div className="flavor-finder__recommendation" aria-live="polite" aria-atomic="true">
          <span className="experience-eyebrow">TU ANTOJO TIENE NOMBRE</span>
          <div key={product.id} className="flavor-finder__reveal"><h3>{product.name}<span>.</span></h3><p className="flavor-finder__note">{flavor.note}</p><p className="flavor-finder__description">{flavor.detail}</p><div className="flavor-finder__ingredients">{flavor.ingredients.map(ingredient => <span key={ingredient}>{ingredient}</span>)}</div></div>
        </div>
        <div className="flavor-finder__order">
          <div className="flavor-finder__size" role="group" aria-label={`Tamaño de ${product.name}`}>{product.prices.map((option, index) => <button type="button" key={option[0]} aria-pressed={size === index} onClick={() => setSize(index)}>{option[0]}<span>{option[1]}</span></button>)}</div>
          <button className="flavor-finder__add" type="button" disabled={!available} onClick={() => onAdd(product, variant)} aria-label={available ? `Agregar ${product.name} ${variant[0]} por ${variant[1]}` : !storeOpen ? 'Pedidos cerrados' : `${product.name} agotada`}><span>{available ? 'ESTA ES LA MÍA' : !storeOpen ? 'PEDIDOS CERRADOS' : 'AGOTADA POR AHORA'}</span><strong>{variant[1]}</strong><ArrowUpRight aria-hidden="true"/></button>
          <a className="flavor-finder__menu" href="/delivery" data-route>O EXPLORA TODA LA CARTA <ArrowUpRight aria-hidden="true"/></a>
        </div>
      </div>
    </div>
  </section>;
}
