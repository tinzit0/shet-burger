export const layers = [
  { id: 'top', src: '/assets/pan-superior.png', label: 'Pan de papa', detail: 'Suave, dorado y tostado al momento.' },
  { id: 'sauce', src: '/assets/salsa.png', label: 'Salsa especial', detail: 'El sello secreto de la casa.' },
  { id: 'bacon', src: '/assets/bacon-cebolla.png', label: 'Bacon + cebolla', detail: 'Nuestra mermelada de tocino, la joya de la casa.' },
  { id: 'pattyTop', src: '/assets/carne-superior.png', label: 'Carne smash', detail: '125 gramos, costra intensa y centro jugoso.' },
  { id: 'cheese', src: '/assets/cheddar.png', label: 'Cheddar fundido', detail: 'Fundido sobre la carne recién salida de la plancha.' },
  { id: 'pattyBottom', src: '/assets/carne-inferior.png', label: 'Doble smash', detail: 'Más sabor, más textura, más SHET.' },
  { id: 'bottom', src: '/assets/pan-inferior.png', label: 'Pan tostado', detail: 'La base perfecta para sostener el vicio.' },
];
export const categories = [{id:'burgers',label:'Burgers'},{id:'promos',label:'Promociones'},{id:'fritos',label:'Fritos'},{id:'bebidas',label:'Bebidas'},{id:'extras',label:'Extras'}];
export const products = [
  {id:'bbq-beast',category:'burgers',name:'BBQ Beast',image:'/assets/menu/page-2-3.webp',description:'Burger 125g, cheddar, tocino, cebolla caramelizada en salsa BBQ, aros de cebolla, pepinillos y mayonesa en pan de papa.',prices:[['Simple','$9.490'],['Doble','$11.990']],featured:true},
  {id:'onion-shet',category:'burgers',name:'Onion SHET',image:'/assets/menu/page-2-4.webp',description:'Burger 125g, doble cheddar, tocino, cebolla crispy y salsa mayo sriracha —ligeramente picante— en pan de papa.',prices:[['Simple','$9.290'],['Doble','$11.290']]},
  {id:'bacon-trip',category:'burgers',name:'Bacon Trip',image:'/assets/menu/page-2-2.webp',description:'Burger 125g, doble cheddar, mermelada de tocino —la joya de la casa—, pepinillos y salsa Emmy en pan de papa.',prices:[['Simple','$9.590'],['Doble','$11.990']],featured:true},
  {id:'cowboy-smoke',category:'burgers',name:'Cowboy Smoke',image:'/assets/menu/page-2-1.webp',description:'Burger 125g, doble cheddar, pulled pork artesanal con cebolla crispy, pepinillos y salsa BBQ en pan de papa.',prices:[['Simple','$9.990'],['Doble','$12.990']]},
  {id:'blue-hit',category:'burgers',name:'Blue Hit',image:'/assets/menu/page-3-1.webp',description:'Burger 125g, queso chanco, champiñones salteados, rúcula y salsa de queso azul en pan de papa.',prices:[['Simple','$9.100'],['Doble','$11.800']]},
  {id:'clasica-bacon',category:'burgers',name:'Clásica Bacon',image:'/assets/menu/page-3-2.webp',description:'Burger 125g, cheddar, tocino, lechuga, tomate, cebolla, pepinillos y salsa SHET en pan de papa.',prices:[['Simple','$8.990'],['Doble','$10.990']]},
  {id:'cheeseburger-bacon',category:'burgers',name:'Cheeseburger Bacon',image:'/assets/menu/page-3-3.webp',description:'Burger 125g, triple cheddar, tocino, pepinillos, ketchup y mostaza en pan de papa.',prices:[['Simple','$7.990'],['Doble','$9.990']]},
  {id:'triple-shet',category:'promos',name:'Triple SHET',image:'/assets/menu/page-1-3.webp',description:'3 burgers simples a elección, papas fritas, 3 bebidas a elección y 6 empanadas de queso.',prices:[['Promo','$28.990']]},
  {id:'vicio',category:'promos',name:'Vicio',image:'/assets/menu/page-1-2.webp',description:'Burger a elección, papas fritas y bebida a elección.',prices:[['Promo','$9.990']]},
  {id:'tentacion',category:'promos',name:'Tentación',image:'/assets/menu/page-1-1.webp',description:'2 burgers simples a elección, papas fritas y 2 bebidas a elección.',prices:[['Combo','$18.990']]},
  {id:'empanadas',category:'fritos',name:'Empanadas',description:'8 empanadas de queso fritas.',prices:[['8 unidades','$4.990']]},
  {id:'aros',category:'fritos',name:'Aros de cebolla',description:'Aros de cebolla crujientes.',prices:[['Porción','$2.990']]},
  {id:'papas-pork',category:'fritos',name:'Papas Pork',description:'Papas fritas naturales con pulled pork, salsa BBQ, salsa cheddar y un toque de cebollín.',prices:[['Bowl','$7.990']]},
  ...['Coca Cola','Coca Cola Zero','Sprite','Sprite Zero','Fanta','Kem'].map((name,index)=>({id:`bebida-${index}`,category:'bebidas',name,description:'Bebida en lata 350 ml.',prices:[['Lata','$1.500']]})),
  ...[['Extra carne y cheddar','$2.500'],['Salsa queso azul','$2.000'],['Mermelada de tocino','$2.000'],['Pulled pork','$1.500'],['Salsa cheddar','$1.000'],['Cebolla crispy','$800'],['Tocino','$800'],['Champiñones','$800'],['Salsa Emmy','$800'],['Jalapeño','$800']].map(([name,price],index)=>({id:`extra-${index}`,category:'extras',name,description:'Agregado para personalizar tu pedido.',prices:[['Extra',price]]})),
];
export const instagramUrl='https://www.instagram.com/shetburger/';
