// Managed catalog images take priority over these local drink packshots.
const drinkImages = {
  'bebida-0': '/assets/drinks/coca-cola.webp',
  'bebida-1': '/assets/drinks/coca-cola-zero.webp',
  'bebida-2': '/assets/drinks/sprite.webp',
  'bebida-3': '/assets/drinks/sprite-zero.webp',
  'bebida-4': '/assets/drinks/fanta.webp',
  'bebida-5': '/assets/drinks/kem.webp',
  'jugo-jumex': '/assets/drinks/jumex-durazno.webp',
};

export const productImage = product => product.image || (product.category === 'bebidas' ? drinkImages[product.id] : undefined);
