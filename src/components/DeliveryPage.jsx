import { useState } from 'react';
import ProductConfigurator from './ProductConfigurator';
import MenuSection from './MenuSection';
import FooterCTA from './FooterCTA';
import MenuCover from './MenuCover';
import PublicCoupons from './PublicCoupons';
import StoreClosed from './StoreClosed';

export default function DeliveryPage({ onAdd, stock, storeOpen, products, content, cart = [], onChangeQuantity }) {
  const [selection, setSelection] = useState(null);
  return <>
    {!storeOpen && <StoreClosed content={content}/>}
    <MenuCover storeOpen={storeOpen} stock={stock} products={products} selectionOpen={Boolean(selection)} onChooseProduct={(product, variant = product.prices[0]) => setSelection({ product, variant })}/>
    {selection && <ProductConfigurator key={selection.product.id} product={selection.product} products={products} initialVariant={selection.variant} stock={stock} storeOpen={storeOpen} onCancel={() => setSelection(null)} onConfirm={(product, variant, customization) => {
      if (onAdd(product, variant, customization) !== false) setSelection(null);
    }}/>}
    <PublicCoupons/>
    <MenuSection onAdd={onAdd} cart={cart} onChangeQuantity={onChangeQuantity} stock={stock} storeOpen={storeOpen} products={products} content={content}/>
    <FooterCTA footerOnly/>
  </>;
}
