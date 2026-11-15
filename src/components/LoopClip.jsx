import useVideoPlayback from '../lib/useVideoPlayback';

// Short looping character clips (tiny muted MP4s: lighter and sharper than GIFs).
export const CLIPS = {
  delivery: { src: '/assets/caricaturas/auto.mp4', poster: '/assets/caricaturas/auto-poster.webp' },
  pickup: { src: '/assets/caricaturas/retiro.mp4', poster: '/assets/caricaturas/retiro-poster.webp' },
};

/**
 * Plays a character clip silently on loop. useVideoPlayback loads it near the viewport,
 * keeps it playing on iPhone and leaves the poster when the visitor prefers reduced motion.
 */
export default function LoopClip({ clip, className, label }) {
  const { src, poster } = CLIPS[clip];
  const { videoRef } = useVideoPlayback({ src, lazy: true });
  return <video
    ref={videoRef}
    className={className}
    poster={poster}
    muted
    loop
    playsInline
    preload="none"
    {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
  />;
}
