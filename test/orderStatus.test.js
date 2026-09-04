import test from 'node:test';
import assert from 'node:assert/strict';
import { getOrderStage, isFinishedOrder, ORDER_STAGES } from '../src/lib/orderStatus.js';

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
