import test from 'node:test';
import assert from 'node:assert/strict';
import { getOrderStage, isAwaitingPayment, isFinishedOrder, isRejectedOrder, ORDER_REJECTED_STATUS, REJECTED_STAGE, PAYMENT_CONFIRMED_STATUS, ORDER_STAGES, orderStatusLabel, stageLabel } from '../src/lib/orderStatus.js';

test('mantiene las cuatro fases en orden',()=>{
  assert.deepEqual(ORDER_STAGES.map(item=>item.stage),[0,1,2,3]);
});

test('el texto del estado prevalece frente a una fase antigua',()=>{
  assert.equal(getOrderStage({status:'Listo para servir',stage:0}),2);
});

test('solo considera terminados los pedidos entregados',()=>{
  assert.equal(isFinishedOrder({status:'En preparación'}),false);
  assert.equal(isFinishedOrder({status:'Pedido entregado'}),true);
});

test('el estado listo se muestra según delivery o retiro',()=>{
  assert.equal(orderStatusLabel({status:'Listo para servir',fulfillment:'delivery'}),'Listo para reparto');
  assert.equal(orderStatusLabel({status:'Listo para servir',mode:'pickup'}),'Listo para retiro');
  assert.equal(orderStatusLabel({status:'Listo para servir'}),'Listo para retiro');
  assert.equal(stageLabel(1,{fulfillment:'delivery'}),'En preparación');
});

test('los pedidos nuevos esperan la confirmación del pago',()=>{
  assert.equal(isAwaitingPayment({status:'Pedido recibido',stage:0}),true);
  assert.equal(orderStatusLabel({status:'Pedido recibido'}),'Pago en revisión');
  assert.equal(isAwaitingPayment({status:PAYMENT_CONFIRMED_STATUS,stage:0}),false);
  assert.equal(getOrderStage({status:PAYMENT_CONFIRMED_STATUS,stage:0}),0);
  assert.equal(orderStatusLabel({status:PAYMENT_CONFIRMED_STATUS}),'Pago confirmado');
  assert.equal(isAwaitingPayment({status:'En preparación'}),false);
});

test('un pedido rechazado sale del flujo y muestra su estado',()=>{
  const order={status:ORDER_REJECTED_STATUS,stage:REJECTED_STAGE,rejection_reason:'Monto distinto'};
  assert.equal(isRejectedOrder(order),true);
  assert.equal(isAwaitingPayment(order),false);
  assert.equal(getOrderStage({status:ORDER_REJECTED_STATUS,stage:0}),REJECTED_STAGE);
  assert.equal(orderStatusLabel(order),'Pedido rechazado');
  assert.equal(isRejectedOrder({status:'Pedido recibido'}),false);
});
