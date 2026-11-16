import { useSyncExternalStore } from 'react';
import { openingTime as fallbackOpeningTime } from '../config';

// Hora de apertura que el dueño fija desde el panel (contenido del sitio en Supabase).
// Si no hay una guardada, se usa la de VITE_OPENING_TIME / 18:00.
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
export const isValidOpeningTime = value => TIME_PATTERN.test(String(value || ''));

let current = fallbackOpeningTime;
const listeners = new Set();

export function setOpeningTime(value) {
  const next = isValidOpeningTime(value) ? value : fallbackOpeningTime;
  if (next === current) return;
  current = next;
  listeners.forEach(listener => listener());
}

export const getOpeningTime = () => current;

const subscribe = listener => { listeners.add(listener); return () => listeners.delete(listener); };

export default function useOpeningTime() {
  return useSyncExternalStore(subscribe, getOpeningTime, getOpeningTime);
}
