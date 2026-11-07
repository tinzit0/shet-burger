export const normalizeCouponCode = value => String(value || '').trim().toUpperCase();

export const promotionTypes = [
  ['percent', 'Porcentaje de descuento'], ['fixed', 'Monto fijo de descuento'],
  ['buy_x_pay_y', 'Lleva X y paga Y (2×1, 3×2…)'],
  ['quantity_percent', 'Descuento por cantidad'], ['free_delivery', 'Delivery gratis'],
];

export function eligibleUnits(coupon, items = []) {
  return items.filter(item => !coupon.product_ids?.length || coupon.product_ids.includes(item.product?.id))
    .flatMap(item => Array.from({ length: Math.max(0, Math.min(25, Number(item.quantity) || 0)) }, () =>
      Number(typeof item.variant === 'object' ? item.variant.price : item.price)));
}

export function couponError(coupon, subtotal, now = Date.now(), context = {}) {
  if (!coupon || !coupon.active) return 'Este cupón no está disponible.';
  if (coupon.expires_at && new Date(coupon.expires_at).getTime() <= now) return 'Este cupón venció.';
  if (subtotal < coupon.min_subtotal) return `Compra mínima de $${Number(coupon.min_subtotal).toLocaleString('es-CL')} en productos.`;
  if (coupon.discount_type === 'free_delivery') return context.mode === 'delivery' && context.deliveryFee > 0 ? '' : 'Esta promoción requiere un pedido con delivery confirmado.';
  const units = eligibleUnits(coupon, context.items);
  if (coupon.product_ids?.length && !units.length) return 'Agrega productos participantes para usar esta promoción.';
  const quantity = coupon.discount_type === 'buy_x_pay_y' ? coupon.buy_quantity : coupon.discount_type === 'quantity_percent' ? coupon.min_quantity : 0;
  if (quantity && units.length < quantity) return `Agrega al menos ${quantity} unidades participantes para usar esta promoción.`;
  return '';
}

export function couponDiscount(coupon, subtotal, now = Date.now(), context = {}) {
  if (couponError(coupon, subtotal, now, context)) return 0;
  if (coupon.discount_type === 'free_delivery') return context.deliveryFee;
  const units = eligibleUnits(coupon, context.items);
  const eligible = coupon.product_ids?.length ? units.reduce((a,b) => a+b, 0) : subtotal;
  let amount;
  if (coupon.discount_type === 'buy_x_pay_y') {
    const free = Math.floor(units.length / coupon.buy_quantity) * (coupon.buy_quantity - coupon.pay_quantity);
    amount = units.sort((a,b) => a-b).slice(0,free).reduce((a,b) => a+b,0);
  } else amount = ['percent','quantity_percent'].includes(coupon.discount_type) ? Math.floor(eligible * coupon.value / 100) : coupon.value;
  return Math.max(0, Math.min(eligible, amount));
}

export const couponLabel = coupon => {
  if (coupon.discount_type === 'buy_x_pay_y') return `Lleva ${coupon.buy_quantity} y paga ${coupon.pay_quantity}`;
  if (coupon.discount_type === 'quantity_percent') return `${coupon.value}% desde ${coupon.min_quantity} unidades`;
  if (coupon.discount_type === 'free_delivery') return 'Delivery gratis';
  return coupon.discount_type === 'percent' ? `${coupon.value}% de descuento` : `$${Number(coupon.value).toLocaleString('es-CL')} de descuento`;
};
export const couponConditions = coupon => [coupon.scope_label || 'Todos los productos',
  coupon.discount_type === 'buy_x_pay_y' ? 'Se bonifican las unidades de menor precio; se repite por cada grupo completo.' : '',
  coupon.discount_type === 'free_delivery' ? 'Solo pedidos a domicilio dentro de cobertura.' : 'No incluye despacho.',
  'No acumulable con otros códigos.',
].filter(Boolean).join(' ');
