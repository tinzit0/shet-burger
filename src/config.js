export const business = {
  name: import.meta.env.VITE_BUSINESS_NAME || 'SHET BURGER SpA',
  bank: import.meta.env.VITE_BANK_NAME || 'Banco Estado',
  account: import.meta.env.VITE_BANK_ACCOUNT || 'Cuenta por configurar',
  rut: import.meta.env.VITE_BUSINESS_RUT || 'RUT por configurar',
  pickupAddress: import.meta.env.VITE_PICKUP_ADDRESS || 'Retiro coordinado con SHET BURGER',
};

// TODO: insertar coordenadas exactas de Shet Burger. No usar la dirección DEMO.
const latitude = Number(import.meta.env.VITE_LOCATION_LAT);
const longitude = Number(import.meta.env.VITE_LOCATION_LNG);
export const location = {
  latitude, longitude,
  configured: Boolean(import.meta.env.VITE_LOCATION_LAT?.trim() && import.meta.env.VITE_LOCATION_LNG?.trim()) && Number.isFinite(latitude) && Math.abs(latitude) <= 90 && Number.isFinite(longitude) && Math.abs(longitude) <= 180,
};

export const directionsUrl = location.configured
  ? `https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}`
  : null;
