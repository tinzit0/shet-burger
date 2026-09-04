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
