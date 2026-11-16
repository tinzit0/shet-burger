import { useEffect, useState } from 'react';
import useOpeningTime, { getOpeningTime } from './openingTime';

/** Minutes until the next daily opening, refreshed every 30 seconds. */
export function minutesUntilOpening(now = new Date(), time = getOpeningTime()) {
  const [hours, minutes] = time.split(':').map(Number);
  const next = new Date(now);
  next.setHours(hours, minutes || 0, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return Math.ceil((next - now) / 60000);
}

/** "18:00" → "PM", "09:30" → "AM". */
export const meridiem = (time = getOpeningTime()) => Number(String(time).split(':')[0]) >= 12 ? 'PM' : 'AM';

export function formatCountdown(total) {
  const hours = Math.floor(total / 60), minutes = total % 60;
  if (!hours) return `${minutes} MIN`;
  return minutes ? `${hours} H ${minutes} MIN` : `${hours} H`;
}

export default function useOpeningCountdown(active = true) {
  const time = useOpeningTime();
  const [minutes, setMinutes] = useState(() => minutesUntilOpening(new Date(), time));
  useEffect(() => {
    if (!active) return;
    setMinutes(minutesUntilOpening(new Date(), time));
    const timer = window.setInterval(() => setMinutes(minutesUntilOpening(new Date(), time)), 30000);
    return () => window.clearInterval(timer);
  }, [active, time]);
  return { time, meridiem: meridiem(time), minutes, countdown: formatCountdown(minutes) };
}
