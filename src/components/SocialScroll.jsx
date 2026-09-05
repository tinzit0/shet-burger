import { ArrowUpRight } from 'lucide-react';
import scrollVideo from '../../assets/scroll.mp4';
import scrollPcVideo from '../../assets/scrollpc.mp4';
import { instagramUrl } from '../data';

function InstagramMark() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".7" fill="currentColor" stroke="none" /></svg>;
}

export default function SocialScroll() {
  return (
    <section className="social-scroll" aria-label="Instagram de SHET BURGER">
      <video className="social-scroll__video" autoPlay muted loop playsInline preload="auto" aria-hidden="true">
        <source src={scrollPcVideo} type="video/mp4" media="(min-width: 901px)" />
        <source src={scrollVideo} type="video/mp4" />
      </video>
      <div className="social-scroll__shade" aria-hidden="true" />
      <div className="social-scroll__content">
        <p className="social-scroll__phrase">El antojo también se comparte.</p>
        <a className="social-scroll__follow" href={instagramUrl} target="_blank" rel="noreferrer"><InstagramMark /><span>@shetburger</span><ArrowUpRight aria-hidden="true" /></a>
      </div>
    </section>
  );
}
