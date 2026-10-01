export const business = {
  name: import.meta.env.VITE_BUSINESS_NAME || 'SHET BURGER SpA',
  bank: import.meta.env.VITE_BANK_NAME || 'Banco Estado',
  account: import.meta.env.VITE_BANK_ACCOUNT || 'Cuenta por configurar',
  rut: import.meta.env.VITE_BUSINESS_RUT || 'RUT por configurar',
  pickupAddress: import.meta.env.VITE_PICKUP_ADDRESS || 'Río Loa 130, Nonguén, Concepción, Chile',
};

// Las coordenadas son opcionales; si faltan, Maps utiliza la dirección de retiro.
const latitude = Number(import.meta.env.VITE_LOCATION_LAT);
const longitude = Number(import.meta.env.VITE_LOCATION_LNG);
export const location = {
  latitude, longitude,
  configured: Boolean(import.meta.env.VITE_LOCATION_LAT?.trim() && import.meta.env.VITE_LOCATION_LNG?.trim()) && Number.isFinite(latitude) && Math.abs(latitude) <= 90 && Number.isFinite(longitude) && Math.abs(longitude) <= 180,
};

export const directionsUrl = location.configured
  ? `https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}`
  : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(business.pickupAddress)}`;

export const pickupMapEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(business.pickupAddress)}&output=embed`;
