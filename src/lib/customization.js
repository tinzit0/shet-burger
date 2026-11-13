export const priceValue = value => typeof value === 'number' ? value : Number(String(value || '').replace(/\D/g, ''));
export const money = value => `$${Number(value || 0).toLocaleString('es-CL')}`;
export const FRIES_UPGRADE_ID = 'papas-cheddar-bacon';
export const FRIES_MAX_QUANTITY = 1;
export const standaloneExtra = product => product.standalone ?? product.id !== 'extra-0';
export const extraEnabled = (product, scope) => ['extras', 'salsas'].includes(product.category) && (scope === 'fries' ? (product.friesExtra ?? product.id === FRIES_UPGRADE_ID) : product.burgerExtra !== false);
export const promotionBurgerAllowed = (promo, index, burger) => (!promo.allowedBurgerIds?.length || promo.allowedBurgerIds.includes(burger.id)) && (!promo.promotionSlots?.[index]?.allowedBurgerIds?.length || promo.promotionSlots[index].allowedBurgerIds.includes(burger.id));
export const promotionExtraAllowed = (promo, index, burger, extra) => (!burger?.allowedExtraIds?.length || burger.allowedExtraIds.includes(extra.id)) && (!promo.promotionSlots?.[index]?.allowedExtraIds?.length || promo.promotionSlots[index].allowedExtraIds.includes(extra.id));
export function selectedAddons(quantities, products, scope) {
  return products.filter(product => extraEnabled(product, scope) && Number.isSafeInteger(quantities[product.id]) && quantities[product.id] > 0)
    .map(product => ({ product_id: product.id, name: product.name, quantity: scope === 'fries' ? Math.min(FRIES_MAX_QUANTITY, quantities[product.id]) : quantities[product.id], unit_price: priceValue(product.prices[0][1]), scope }));
}
export const addonsTotal = addons => (addons || []).reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
export const customizationTotal = entry => addonsTotal(entry.extras) + addonsTotal(entry.friesExtras) + (entry.burgers || []).reduce((sum, burger) => sum + (burger.surcharge || 0) + addonsTotal(burger.extras) + addonsTotal(burger.friesExtras), 0);
export function customizationUnavailable(entry, stock, products) {
  const ids = [...(entry?.burgerChoiceIds || []), ...(entry?.drinkChoiceIds || [])];
  const collect = item => ids.push(...(item?.extras || []).map(extra => extra.product_id), ...(item?.friesExtras || []).map(extra => extra.product_id));
  collect(entry);
  for (const burger of entry?.burgers || []) { ids.push(burger.product_id); collect(burger); }
  return ids.some(id => stock[id] === false || (products && !products.some(product => product.id === id)));
}
export function customizationLines(entry) {
  const lines = [];
  const collect = (item, prefix = '') => {
    for (const extra of item.extras || []) lines.push({ label: `${prefix}Extra hamburguesa`, value: `${extra.quantity} × ${extra.name}` });
    for (const extra of item.friesExtras || []) lines.push({ label: `${prefix}Mejora tus papas`, value: `${extra.quantity} × ${extra.name}` });
  };
  collect(entry);
  (entry.burgers || []).forEach((burger, index) => {
    const label = `Hamburguesa ${index + 1}`;
    lines.push({ label, value: `${burger.name} · ${burger.variant}` });
    collect(burger, `${label} · `);
  });
  return lines;
}
