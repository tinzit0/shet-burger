import { useCallback, useEffect, useRef, useState } from 'react';

/** Keep the user's pause choice independent of visibility and media events. */
export default function useVideoPlayback({ src, lazy = false }) {
  const videoRef = useRef(null);
  const toggleRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    // iOS Safari only autoplays inline when muted/playsinline are real attributes; React sets muted as a property only.
    video.muted = true;
    video.defaultMuted = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let visible = false, nearby = !lazy, userPaused = false, manual = false, disposed = false, retry = 0;
    const allowed = () => manual || (!reduced.matches && !navigator.connection?.saveData);
    const shouldPlay = () => visible && allowed() && !userPaused && !document.hidden;
    // iOS blocks autoplay in Low Power Mode and after some interruptions; the
    // next tap anywhere on the page counts as a gesture and lets it start.
    const onGesture = () => { removeGesture(); sync(); };
    const addGesture = () => ['touchend', 'pointerup', 'keydown'].forEach(type => document.addEventListener(type, onGesture, { passive: true }));
    const removeGesture = () => ['touchend', 'pointerup', 'keydown'].forEach(type => document.removeEventListener(type, onGesture));
    const sync = () => {
      if (disposed) return;
      if (nearby && allowed() && !video.getAttribute('src')) { video.src = src; video.load(); }
      if (shouldPlay() && video.getAttribute('src')) {
        // A pause can reject an earlier play promise with AbortError; it must
        // never overwrite the user's latest choice to play or pause.
        if (video.paused) video.play().catch(error => { if (error?.name === 'NotAllowedError') addGesture(); });
      } else video.pause();
    };
    // Safari can pause or stall a muted inline video by itself (scroll, memory,
    // a lost loop); if it should still be playing, start it again shortly after.
    const resume = () => {
      clearTimeout(retry);
      retry = setTimeout(() => { if (shouldPlay() && video.paused) sync(); }, 250);
    };
    const onPlay = () => {
      if (!shouldPlay()) { video.pause(); return; }
      removeGesture();
      setPlaying(true);
    };
    const onPause = () => { setPlaying(false); resume(); };
    const onEnded = () => { video.currentTime = 0; resume(); };
    const onPageShow = event => { if (event.persisted) sync(); };
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
    video.addEventListener('canplay', sync);
    video.addEventListener('ended', onEnded);
    video.addEventListener('stalled', resume);
    reduced.addEventListener('change', sync);
    document.addEventListener('visibilitychange', sync);
    window.addEventListener('pageshow', onPageShow);
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
      video.removeEventListener('canplay', sync);
      video.removeEventListener('ended', onEnded);
      video.removeEventListener('stalled', resume);
      reduced.removeEventListener('change', sync);
      document.removeEventListener('visibilitychange', sync);
      window.removeEventListener('pageshow', onPageShow);
      clearTimeout(retry);
      removeGesture();
      video.pause();
    };
  }, [src, lazy]);

  const togglePlayback = useCallback(() => toggleRef.current?.(), []);
  return { videoRef, playing, togglePlayback };
}
