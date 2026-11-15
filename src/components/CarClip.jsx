import useVideoPlayback from '../lib/useVideoPlayback';

export const CAR_VIDEO = '/assets/caricaturas/auto.mp4';
export const CAR_POSTER = '/assets/caricaturas/auto-poster.webp';

/**
 * The SHET delivery car loop. It is a tiny muted MP4 (much lighter and sharper than a GIF);
 * useVideoPlayback loads it near the viewport, keeps it playing on iPhone and shows the
 * poster instead when the visitor prefers reduced motion.
 */
export default function CarClip({ className, label }) {
  const { videoRef } = useVideoPlayback({ src: CAR_VIDEO, lazy: true });
  return <video
    ref={videoRef}
    className={className}
    poster={CAR_POSTER}
    muted
    loop
    playsInline
    preload="none"
    {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
  />;
}
