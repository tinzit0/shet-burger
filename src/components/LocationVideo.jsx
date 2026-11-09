import useVideoPlayback from '../lib/useVideoPlayback';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, ArrowUpRight } from 'lucide-react';
import { instagramUrl } from '../data';
import scrollVideo from '../../assets/fotos burger/scroll video.mp4';

export default function LocationVideo() {
  const { videoRef } = useVideoPlayback({ src: scrollVideo, lazy: true });
  return <article className="location__video" aria-label="Video de SHET Burger, presentación estilo Instagram">
    <header className="social-video__header">
      <a href={instagramUrl} target="_blank" rel="noreferrer" className="social-video__profile"><img src="/assets/logo shet burger.png" alt="SHET Burger" width="36" height="36" loading="lazy"/><span><strong>shetburger</strong><small>Nonguén, Concepción</small></span></a>
      <MoreHorizontal aria-hidden="true"/>
    </header>
    <div className="social-video__media"><video ref={videoRef} width="480" height="872" muted loop playsInline preload="none" poster="/assets/campaign/scroll-video-poster.webp" aria-label="Video original de SHET Burger"/></div>
    <footer className="social-video__footer">
      <div className="social-video__icons" aria-hidden="true"><Heart/><MessageCircle/><Send/><Bookmark/></div>
      <a href={instagramUrl} target="_blank" rel="noreferrer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg> VER EN INSTAGRAM <ArrowUpRight aria-hidden="true"/></a>
    </footer>
  </article>;
}
