// The three best sellers, in rank order. Used by the menu cover carousel.
export const bestSellerIds = ['bacon-trip', 'cowboy-smoke', 'onion-shet'];

export function bestSellers(products = []) {
  return bestSellerIds.map(id => products.find(product => product.id === id)).filter(Boolean);
}
