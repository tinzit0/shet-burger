// `status` is the value stored in the database; the label shown on screen
// depends on whether the order is delivered or picked up.
export const ORDER_STAGES = [
  { status: 'Pedido recibido', stage: 0 },
  { status: 'En preparación', stage: 1 },
  { status: 'Listo para servir', stage: 2 },
  { status: 'Pedido entregado', stage: 3 },
];

export const getOrderStage = order => Number(
  ORDER_STAGES.find(item => item.status === order?.status)?.stage ?? order?.stage ?? 0,
);

export const isFinishedOrder = order => getOrderStage(order) >= 3;

export const isDeliveryOrder = order => (order?.mode || order?.fulfillment) === 'delivery';

export const stageLabel = (stage, order) => {
  if (stage === 2) return isDeliveryOrder(order) ? 'Listo para reparto' : 'Listo para retiro';
  return ORDER_STAGES.find(item => item.stage === stage)?.status ?? ORDER_STAGES[0].status;
};

export const orderStatusLabel = order => stageLabel(getOrderStage(order), order);
