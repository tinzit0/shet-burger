import { useCallback, useEffect, useRef, useState } from 'react';

/** Keep the user's pause choice independent of visibility and media events. */
export default function useVideoPlayback({ src, lazy = false }) {
  const videoRef = useRef(null);
  const toggleRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let visible = false, nearby = !lazy, userPaused = false, manual = false, disposed = false;
    const allowed = () => manual || (!reduced.matches && !navigator.connection?.saveData);
    const shouldPlay = () => visible && allowed() && !userPaused && !document.hidden;
    const sync = () => {
      if (disposed) return;
      if (nearby && allowed() && !video.getAttribute('src')) { video.src = src; video.load(); }
      if (shouldPlay() && video.getAttribute('src')) {
        // A pause can reject an earlier play promise with AbortError; it must
        // never overwrite the user's latest choice to play or pause.
        if (video.paused) video.play().catch(() => {});
      } else video.pause();
    };
    const onPlay = () => {
      if (!shouldPlay()) { video.pause(); return; }
      setPlaying(true);
    };
    const onPause = () => setPlaying(false);
    toggleRef.current = () => {
      if (!video.paused) { userPaused = true; video.pause(); return; }
      userPaused = false;
      manual = true;
      nearby = true;
      visible = true;
      sync();
    };

    const player = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }, { threshold: 0.05 });
    const loader = new IntersectionObserver(entries => { nearby = entries[0].isIntersecting; sync(); }, { rootMargin: '300px' });
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('loadeddata', sync);
    reduced.addEventListener('change', sync);
    document.addEventListener('visibilitychange', sync);
    player.observe(video);
    loader.observe(video);
    sync();

    return () => {
      disposed = true;
      toggleRef.current = null;
      player.disconnect();
      loader.disconnect();
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('loadeddata', sync);
      reduced.removeEventListener('change', sync);
      document.removeEventListener('visibilitychange', sync);
      video.pause();
    };
  }, [src, lazy]);

  const togglePlayback = useCallback(() => toggleRef.current?.(), []);
  return { videoRef, playing, togglePlayback };
}
