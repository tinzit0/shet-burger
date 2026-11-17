export const business = {
  // Datos de transferencia del dueño. Van fijos en el código para que una
  // variable antigua del hosting no muestre una cuenta equivocada al cliente.
  name: 'SHET SpA',
  rut: '78.201.534-6',
  bank: 'Banco de Chile',
  accountType: 'Cuenta corriente',
  account: '00-021-05251-89',
  email: 'shetburger@gmail.com',
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

// Hora diaria de apertura que muestran los avisos de local cerrado (formato 24 h).
export const openingTime = import.meta.env.VITE_OPENING_TIME || '18:00';
