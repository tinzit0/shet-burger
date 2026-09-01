import { Flame, Hand, MapPin } from 'lucide-react';

const principles = [
  { number: '01', icon: Flame, title: 'Plancha', copy: 'Calor alto, bordes crocantes y sabor sin vueltas.' },
  { number: '02', icon: Hand, title: 'Al momento', copy: 'Cada pedido empieza cuando tú lo pides. Nunca antes.' },
  { number: '03', icon: MapPin, title: 'De Conce', copy: 'Una marca nacida acá, con actitud y sello propio.' },
];

export default function BurgerStory() {
  return <section className="burger-story story-manifesto" id="experiencia">
    <div className="story-noise" />
    <p className="story-side">NUESTRA FORMA<br/>DE HACER LAS COSAS</p>
    <div className="story-manifesto__intro">
      <span>SHET / 02</span>
      <h2>POCAS REGLAS.<br/><em>MUCHO SABOR.</em></h2>
      <p>Lo esencial bien hecho. Sin adornos, sin atajos y con el carácter de una cocina que se toma el antojo en serio.</p>
    </div>
    <div className="story-manifesto__cards">
      {principles.map(({ number, icon: Icon, title, copy }) => <article key={number}>
        <div><span>{number}</span><Icon aria-hidden="true" /></div>
        <h3>{title}</h3><p>{copy}</p>
      </article>)}
    </div>
    <div className="story-manifesto__ticker" aria-hidden="true"><span>FAT SMASH · HECHO EN CONCE · SIN ATAJOS · </span></div>
  </section>;
}
