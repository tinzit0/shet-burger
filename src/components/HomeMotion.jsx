import { useEffect, useId, useRef } from 'react';

// Marks a section as "in view" once, so CSS can choreograph its entrance.
// Without JS (or with reduced motion) the attribute is never "false", so nothing stays hidden.
export function useInView(threshold = 0.18) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) { el.dataset.inview = 'true'; return undefined; }
    el.dataset.inview = 'false';
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { el.dataset.inview = 'true'; observer.disconnect(); }
    }, { threshold, rootMargin: '0px 0px -6% 0px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);
  return ref;
}

// Splits a word into letters with a stagger index; screen readers get the whole word from the parent label.
export function Split({ text, className = 'ch', offset = 0 }) {
  return [...text].map((char, index) => <span key={index} className={className} style={{ '--i': index + offset }} aria-hidden="true">{char === ' ' ? ' ' : char}</span>);
}

export function Sparkle({ className = '', style }) {
  return <svg className={`sparkle ${className}`} style={style} viewBox="0 0 40 40" aria-hidden="true"><path d="M20 0c1.6 10.4 9.6 18.4 20 20-10.4 1.6-18.4 9.6-20 20-1.6-10.4-9.6-18.4-20-20C10.4 18.4 18.4 10.4 20 0Z" fill="currentColor"/></svg>;
}

// Rotating circular text badge.
export function SpinSeal({ text, className = '', children }) {
  const id = useId().replace(/:/g, '');
  return <div className={`spin-seal ${className}`} aria-hidden="true">
    <svg viewBox="0 0 120 120">
      <defs><path id={`seal-${id}`} d="M60 60m-46 0a46 46 0 1 1 92 0a46 46 0 1 1-92 0"/></defs>
      <text><textPath href={`#seal-${id}`} startOffset="0" textLength="286" lengthAdjust="spacing">{text}</textPath></text>
    </svg>
    <span className="spin-seal__core">{children ?? '✳'}</span>
  </div>;
}

// Giant outlined words that slide sideways as the page scrolls (driven by ScrollReveals' data-drift).
export function ScrollMarquee({ rows, tone = 'light' }) {
  return <div className={`scroll-marquee scroll-marquee--${tone}`} aria-hidden="true">
    {rows.map(([text, dir], index) => <div key={index} className={`scroll-marquee__row${index % 2 ? ' is-outline' : ''}`} style={{ '--dir': dir }} data-drift>
      {Array.from({ length: 6 }, (_, i) => <span key={i}>{text}<Sparkle className="scroll-marquee__star"/></span>)}
    </div>)}
  </div>;
}
