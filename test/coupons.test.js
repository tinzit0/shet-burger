import test from 'node:test';
import assert from 'node:assert/strict';
import { couponDiscount, couponError, normalizeCouponCode } from '../src/lib/couponRules.js';
const coupon={active:true,discount_type:'percent',value:15,min_subtotal:10000,expires_at:null};
test('normaliza el código',()=>assert.equal(normalizeCouponCode(' shet15 '),'SHET15'));
test('calcula porcentaje en pesos enteros',()=>assert.equal(couponDiscount(coupon,10001),1500));
test('acepta exactamente la compra mínima y rechaza menos',()=>{assert.equal(couponDiscount(coupon,10000),1500);assert.equal(couponDiscount(coupon,9999),0);assert.ok(couponError(coupon,9999));});
test('el monto fijo nunca supera los productos',()=>assert.equal(couponDiscount({...coupon,min_subtotal:0,discount_type:'fixed',value:20000},5000),5000));
test('rechaza cupones vencidos o pausados',()=>{assert.equal(couponDiscount({...coupon,active:false},20000),0);assert.equal(couponDiscount({...coupon,expires_at:'2026-01-01T00:00:00Z'},20000,Date.parse('2026-01-01T00:00:00Z')),0);});
test('sin cupón no hay descuento',()=>assert.equal(couponDiscount(null,20000),0));

const item=(id,price,quantity=1)=>({product:{id},variant:{price},quantity});
const context={items:[item('burger',9000,3),item('burger',11000,1),item('drink',1500,2)],mode:'delivery',deliveryFee:3000};
test('2×1 repite grupos y descuenta las unidades participantes de menor precio',()=>{
  const promo={...coupon,discount_type:'buy_x_pay_y',buy_quantity:2,pay_quantity:1,product_ids:['burger']};
  assert.equal(couponDiscount(promo,41000,Date.now(),context),18000);
  assert.ok(couponError(promo,20000,Date.now(),{items:[item('burger',9000)]}));
});
test('3×2 solo bonifica grupos completos y no cuenta bebidas ajenas',()=>{
  const promo={...coupon,discount_type:'buy_x_pay_y',buy_quantity:3,pay_quantity:2,product_ids:['burger']};
  assert.equal(couponDiscount(promo,41000,Date.now(),context),9000);
});
test('el porcentaje por cantidad se limita a productos participantes',()=>{
  const promo={...coupon,discount_type:'quantity_percent',value:20,min_quantity:3,product_ids:['burger']};
  assert.equal(couponDiscount(promo,41000,Date.now(),context),7600);
  assert.equal(couponDiscount(promo,20000,Date.now(),{items:[item('burger',9000,2)]}),0);
});
test('descuento fijo por producto no usa el resto del carrito',()=>{
  assert.equal(couponDiscount({...coupon,discount_type:'fixed',value:5000,product_ids:['drink']},41000,Date.now(),context),3000);
});
test('delivery gratis bonifica solo el despacho y requiere entrega',()=>{
  const promo={...coupon,discount_type:'free_delivery'};
  assert.equal(couponDiscount(promo,41000,Date.now(),context),3000);
  assert.equal(couponDiscount(promo,41000,Date.now(),{...context,mode:'pickup',deliveryFee:0}),0);
});
test('cambiar cantidades recalcula el beneficio y no regala unidades incompletas',()=>{
  const promo={...coupon,discount_type:'buy_x_pay_y',buy_quantity:3,pay_quantity:2};
  assert.equal(couponDiscount(promo,20000,Date.now(),{items:[item('burger',10000,2)]}),0);
  assert.equal(couponDiscount(promo,30000,Date.now(),{items:[item('burger',10000,3)]}),10000);
});
