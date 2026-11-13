import { useEffect, useState } from 'react';
import { openingTime } from '../config';

/** Minutes until the next daily opening, refreshed every 30 seconds. */
export function minutesUntilOpening(now = new Date(), time = openingTime) {
  const [hours, minutes] = time.split(':').map(Number);
  const next = new Date(now);
  next.setHours(hours, minutes || 0, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return Math.ceil((next - now) / 60000);
}

/** "18:00" → "PM", "09:30" → "AM". */
export const meridiem = (time = openingTime) => Number(String(time).split(':')[0]) >= 12 ? 'PM' : 'AM';

export function formatCountdown(total) {
  const hours = Math.floor(total / 60), minutes = total % 60;
  if (!hours) return `${minutes} MIN`;
  return minutes ? `${hours} H ${minutes} MIN` : `${hours} H`;
}

export default function useOpeningCountdown(active = true) {
  const [minutes, setMinutes] = useState(() => minutesUntilOpening());
  useEffect(() => {
    if (!active) return;
    setMinutes(minutesUntilOpening());
    const timer = window.setInterval(() => setMinutes(minutesUntilOpening()), 30000);
    return () => window.clearInterval(timer);
  }, [active]);
  return { time: openingTime, meridiem: meridiem(openingTime), minutes, countdown: formatCountdown(minutes) };
}
