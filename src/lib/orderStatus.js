// `status` is the value stored in the database; the label shown on screen
// depends on whether the order is delivered or picked up.
export const ORDER_STAGES = [
  { status: 'Pedido recibido', stage: 0 },
  { status: 'En preparación', stage: 1 },
  { status: 'Listo para servir', stage: 2 },
  { status: 'Pedido entregado', stage: 3 },
];

// Todo pedido pagado por transferencia entra como "Pedido recibido" (lo fija
// Supabase al crearlo) y espera a que el dueño revise el comprobante. Al
// confirmarlo pasa a "Pago confirmado", que sigue siendo la fase 0 y entra al
// flujo normal de cocina, logística y reparto.
export const PAYMENT_PENDING_STATUS = ORDER_STAGES[0].status;
export const PAYMENT_CONFIRMED_STATUS = 'Pago confirmado';

export const getOrderStage = order => Number(
  order?.status === PAYMENT_CONFIRMED_STATUS ? 0
    : ORDER_STAGES.find(item => item.status === order?.status)?.stage ?? order?.stage ?? 0,
);

export const isAwaitingPayment = order => (order?.status ?? PAYMENT_PENDING_STATUS) === PAYMENT_PENDING_STATUS;

export const isFinishedOrder = order => getOrderStage(order) >= 3;

export const isDeliveryOrder = order => (order?.mode || order?.fulfillment) === 'delivery';

export const stageLabel = (stage, order) => {
  if (stage === 0) return order && isAwaitingPayment(order) ? 'Pago en revisión' : PAYMENT_CONFIRMED_STATUS;
  if (stage === 2) return isDeliveryOrder(order) ? 'Listo para reparto' : 'Listo para retiro';
  return ORDER_STAGES.find(item => item.stage === stage)?.status ?? ORDER_STAGES[0].status;
};

export const orderStatusLabel = order => stageLabel(getOrderStage(order), order);
