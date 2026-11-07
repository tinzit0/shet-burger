import { useState } from 'react';
import ProductConfigurator from './ProductConfigurator';
import MenuSection from './MenuSection';
import FooterCTA from './FooterCTA';
import { directionsUrl } from '../config';
import { instagramUrl } from '../data';
import MenuCover from './MenuCover';
import PublicCoupons from './PublicCoupons';

export default function DeliveryPage({ onAdd, stock, storeOpen, products, content }) {
  const [selection, setSelection] = useState(null);
  return <>
    <MenuCover storeOpen={storeOpen} stock={stock} products={products} selectionOpen={Boolean(selection)} onChooseProduct={(product, variant = product.prices[0]) => setSelection({ product, variant })}/>
    {selection && <ProductConfigurator key={selection.product.id} product={selection.product} products={products} initialVariant={selection.variant} stock={stock} storeOpen={storeOpen} onCancel={() => setSelection(null)} onConfirm={(product, variant, customization) => {
      const { extraProducts = [], ...choices } = customization;
      if (onAdd(product, variant, choices) !== false) {
        extraProducts.forEach(extra => onAdd(extra, extra.prices[0], { selections: [{ label: 'Para', value: product.name }] }));
        setSelection(null);
      }
    }}/>}
    <PublicCoupons/>
    <MenuSection onAdd={onAdd} stock={stock} storeOpen={storeOpen} products={products} content={content}/>
    <section className="delivery-outro"><h2>HECHO EN<br/><em>NONGUÉN.</em></h2><div><a href={directionsUrl} target="_blank" rel="noreferrer" className="text-link">PUNTO DE RETIRO ↗</a><a href={instagramUrl} target="_blank" rel="noreferrer" className="text-link">INSTAGRAM ↗</a></div></section>
    <FooterCTA footerOnly/>
  </>;
}
