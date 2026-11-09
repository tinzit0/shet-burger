import useVideoPlayback from '../lib/useVideoPlayback';
import scrollVideo from '../../assets/fotos burger/scroll video.mp4';

export default function LocationVideo() {
  const { videoRef } = useVideoPlayback({ src: scrollVideo, lazy: true });
  return <div className="location__video" aria-label="SHET en movimiento, junto al mapa">
    <video ref={videoRef} width="480" height="872" muted loop playsInline preload="none" poster="/assets/campaign/scroll-video-poster.webp" aria-label="Video original de SHET Burger"/>
  </div>;
}
