import { useState } from 'react';
import { ArrowDown, ArrowUpRight, MoveHorizontal, Plus } from 'lucide-react';
import { layers } from '../data';

const positions = [
  { closed: 34, travel: -24 },
  { closed: 44, travel: -20 },
  { closed: 49, travel: -12.5 },
  { closed: 54, travel: -3 },
  { closed: 59, travel: 6.5 },
  { closed: 64, travel: 16 },
  { closed: 70, travel: 23.5 },
];

export default function BurgerAtelier() {
  const [spread, setSpread] = useState(90);
  const [selected, setSelected] = useState(2);
  const activeLayer = layers[selected];

  const selectLayer = index => {
    setSelected(index);
    setSpread(100);
  };

  return <section className="atelier section" id="ritual" aria-labelledby="atelier-title">
    <div className="experience-rule"><span><i/> EL RITUAL SHET</span><span>01 / EXPLORA</span></div>
    <div className="atelier__layout">
      <div className="atelier__copy" data-reveal>
        <span className="experience-eyebrow">LOS DETALLES HACEN EL ANTOJO</span>
        <h2 id="atelier-title">El sabor,<br/><em>al desnudo.</em></h2>
        <p className="atelier__intro">Acércate. Separa las capas. Descubre todo lo que pasa entre dos panes.</p>
        <div className="atelier__ingredients" role="group" aria-label="Explorar ingredientes">
          {layers.map((layer, index) => <button type="button" key={layer.id} className={selected === index ? 'is-selected' : ''} aria-pressed={selected === index} onClick={() => selectLayer(index)}>
            <span className="atelier__number">0{index + 1}</span><span>{layer.label}</span><Plus aria-hidden="true"/>
          </button>)}
        </div>
        <a className="atelier__link" href="#tu-antojo">ENCUENTRA TU FAVORITA <ArrowDown aria-hidden="true"/></a>
      </div>
      <div className="atelier__experience" data-reveal>
        <div className="atelier__scene">
          <span className="atelier__edition">SHET / ANATOMÍA DEL SABOR</span>
          <div className="atelier__orbit" aria-hidden="true"/>
          <span className="atelier__watermark" aria-hidden="true">SHET.</span>
          <div className="atelier__stack" data-tilt style={{ '--spread': spread / 100 }} aria-hidden="true">
            {layers.map((layer, index) => <img key={layer.id} className={`atelier__layer${selected === index ? ' is-selected' : ''}`} src={layer.src.replace('/assets/', '/assets/atelier/').replace('.png', '.webp')} alt="" loading="lazy" decoding="async" style={{ '--closed': `${positions[index].closed}%`, '--travel': `${positions[index].travel}%`, '--layer-order': layers.length - index }}/>) }
          </div>
          <span className="atelier__scene-mark" aria-hidden="true"><Plus/><span>HECHA<br/>DE DETALLES.</span></span>
        </div>
        <div className="atelier__caption" aria-live="polite" aria-atomic="true"><span>0{selected + 1} / 07</span><div><strong>{activeLayer.label}</strong><p>{activeLayer.detail}</p></div></div>
        <div className="atelier__control">
          <div className="atelier__control-heading"><label htmlFor="burger-spread"><MoveHorizontal aria-hidden="true"/><span>DESLIZA PARA EXPLORAR</span></label><button className="atelier__assemble" type="button" onClick={() => setSpread(spread > 0 ? 0 : 100)} aria-label={spread > 0 ? 'Unir las capas de la burger' : 'Separar las capas de la burger'}>{spread > 0 ? 'UNIR CAPAS' : 'SEPARAR CAPAS'}<ArrowUpRight aria-hidden="true"/></button></div>
          <input id="burger-spread" type="range" min="0" max="100" value={spread} onChange={event => setSpread(Number(event.target.value))} aria-label="Separación de las capas" aria-valuetext={spread === 0 ? 'Burger armada' : spread === 100 ? 'Capas separadas' : `${spread}% de separación`} style={{ '--range-progress': `${spread}%` }}/>
          <div className="atelier__range-labels" aria-hidden="true"><span>TODO JUNTO</span><span>CADA DETALLE</span></div>
        </div>
      </div>
    </div>
  </section>;
}
