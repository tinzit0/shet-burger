import { ArrowUpRight } from 'lucide-react';
import Asterisk from './Asterisk';
import planchaVideo from '../../assets/videos shet o fotos/video1.mp4';
import useVideoPlayback from '../lib/useVideoPlayback';

/** Muted, looping background video that only loads near the viewport. */
export function AutoVideo({ src, poster, className = '', label }) {
  const { videoRef } = useVideoPlayback({ src, lazy: true });
  return <video ref={videoRef} className={className} poster={poster} muted loop playsInline preload="none" aria-label={label} aria-hidden={label ? undefined : 'true'}/>;
}

/** Grey band: a tilted tape over a framed kitchen video, with giant words drifting behind it as you scroll. */
export function TapeVideo() {
  const words = ['FAT SMASH', 'PINK BOX', 'SHET MOOD'];
  return <section className="tape-video" aria-label="SHET en la plancha">
    <div className="tape-video__tape" aria-hidden="true">{[0, 1].map(track => <div key={track}>{words.map(word => <span key={word}>{word}<i><Asterisk/></i></span>)}</div>)}</div>
    <div className="tape-video__bg" aria-hidden="true">
      {[['SMASH', 1], ['PLANCHA', -1], ['CHEDDAR', 1]].map(([word, dir], row) => <div key={word} className={`tape-video__bg-row${row % 2 ? ' is-filled' : ''}`} style={{ '--dir': dir }} data-drift>
        {Array.from({ length: 8 }, (_, i) => <span key={i}>{word}<i><Asterisk/></i></span>)}
      </div>)}
    </div>
    <div className="tape-video__media">
      <AutoVideo src={planchaVideo} className="tape-video__main" poster="/assets/campaign/hero-poster-960.webp" label="Hamburguesa SHET doble con cheddar recién hecha"/>
      <p className="tape-video__caption" aria-hidden="true">#MUERDE<br/><em>LA TENTACIÓN</em></p>
    </div>
  </section>;
}

/** Giant words on black running as an endless carousel; the two rows travel in opposite directions. */
const marqueeRows = [
  ['PIDE SHET', '#MUERDELATENTACIÓN', 'HECHA AL MOMENTO'],
  ['NONGUÉN', 'PINK BOX', 'FAT SMASH'],
];
const Star = () => <svg className="scroll-marquee__star" viewBox="0 0 24 24"><path d="M12 0c.6 6.4 5.6 11.4 12 12-6.4.6-11.4 5.6-12 12-.6-6.4-5.6-11.4-12-12C6.4 11.4 11.4 6.4 12 0z" fill="currentColor"/></svg>;

export function ScrollMarquee({ rows = marqueeRows }) {
  return <div className="scroll-marquee" aria-hidden="true">
    {rows.map((phrases, index) => <div key={index} className={`scroll-marquee__row${index % 2 ? ' is-outline is-reverse' : ''}`}>
      {/* Two identical halves so translating by -50% loops without a seam. */}
      {[0, 1].map(half => <div key={half} className="scroll-marquee__half">
        {[...phrases, ...phrases].map((phrase, i) => <span key={i}>{phrase}<Star/></span>)}
      </div>)}
    </div>)}
  </div>;
}

// The animated GIF characters, repeated to fill the loop. Reduced motion swaps them for their stills.
const crew = [
  { src: '/assets/caricaturas/abrazo.gif', still: '/assets/caricaturas/abrazo-still.png', name: 'BFF', alt: 'Lata y hamburguesa SHET abrazándose' },
  { src: '/assets/caricaturas/tocino.gif', still: '/assets/caricaturas/tocino-still.png', name: 'BACON LOVERS', alt: 'Hamburguesa SHET comiendo tocino' },
  { src: '/assets/caricaturas/pepinillo.gif', still: '/assets/caricaturas/pepinillo-still.png', name: 'AJÍ PEPINILLO', alt: 'Hamburguesa SHET se come un ají y arde por lo picante' },
  { src: '/assets/caricaturas/auto.gif', still: '/assets/caricaturas/auto-still.png', name: 'DELIVERY', alt: 'Auto de reparto SHET con la hamburguesa al volante y el tocino de copiloto, avanzando por la calle' },
  { src: '/assets/caricaturas/bolsa.gif', still: '/assets/caricaturas/bolsa-still.png', name: 'PARA LLEVAR', alt: 'Hamburguesa SHET saltando con su bolsa de pedido' },
  { src: '/assets/caricaturas/cool.gif', still: '/assets/caricaturas/cool-still.png', name: 'LOS COOL', alt: 'Hamburguesa y tocino SHET con lentes de sol y papas fritas' },
  { src: '/assets/caricaturas/playa.gif', still: '/assets/caricaturas/playa-still.png', name: 'BACON BEACH', alt: 'Tocino SHET descansando bajo un quitasol' },
];
// Two rounds of seven fill wide screens while keeping the scroll speed the same as before.
const loop = [0, 1].flatMap(round => crew.map(member => ({ ...member, key: `${member.name}-${round}`, hidden: round > 0 })));

function CrewCard({ member }) {
  return <li className="crew__card" aria-hidden={member.hidden || undefined}>
    <picture>
      <source media="(prefers-reduced-motion: reduce)" srcSet={member.still}/>
      <img src={member.src} alt={member.hidden ? '' : member.alt} width="160" height="160" loading="lazy" decoding="async"/>
    </picture>
    <span>{member.name}</span>
  </li>;
}

/** Endless row of small GIF sticker cards; hover pauses it, reduced motion shows the two stills. */
export function CrewCarousel() {
  return <section className="crew" aria-labelledby="crew-title">
    <header className="crew__head">
      <span>PERSONAJES SHET</span>
      <h2 id="crew-title">LA CREW<br/><em>DE LA CAJA ROSA</em></h2>
    </header>
    <div className="crew__viewport">
      <ul className="crew__track">
        {[...loop, ...loop.map(member => ({ ...member, key: `${member.key}-copy`, hidden: true }))].map(member => <CrewCard key={member.key} member={member}/>)}
      </ul>
    </div>
  </section>;
}

/** Plain facts strip: when we open, where to pick up, how delivery works. */
export function InfoStrip({ openingTime }) {
  return <section className="info-strip" aria-label="Información de SHET Burger">
    <div><small>HORARIO</small><b>ABRIMOS {openingTime} HRS</b></div>
    <div><small>RETIRO</small><b>RÍO LOA 130 · NONGUÉN</b></div>
    <div><small>DELIVERY</small><b>COSTO SEGÚN TU POBLACIÓN</b></div>
    <a href="/delivery" data-route>VER LA CARTA <ArrowUpRight aria-hidden="true"/></a>
  </section>;
}
