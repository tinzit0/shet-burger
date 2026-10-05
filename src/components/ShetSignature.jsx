import { ArrowUpRight } from 'lucide-react';
import { products } from '../data';
import BurgerPhoto from './BurgerPhoto';

const featuredIds = ['bbq-beast', 'bacon-trip', 'cowboy-smoke', 'clasica-bacon'];

export default function ShetSignature() {
  const featured = featuredIds.map(id => products.find(product => product.id === id)).filter(Boolean);
  return <section className="signature section" id="burgers-insignia" aria-labelledby="signature-title">
    <div className="signature__heading" data-reveal><h2 id="signature-title">CUATRO FORMAS<br/><em>DE CAER.</em></h2><p>Costra por fuera. Jugosa por dentro.<br/>Todas incluyen papas fritas.</p></div>
    <div className="signature__rail">
      {featured.map(product => <article className="signature-card" key={product.id} data-reveal>
        <a href="/delivery" data-route aria-label={`Ver ${product.name} en el menú`}>
          <div className="signature-card__media"><BurgerPhoto product={product} sizes="(max-width: 720px) 82vw, (max-width: 1200px) 44vw, 28vw"/><div className="signature-card__title"><h3>{product.name}</h3><ArrowUpRight aria-hidden="true"/></div></div>
        </a>
      </article>)}
    </div>
    <a className="button button--outline" href="/delivery" data-route>VER MENÚ COMPLETO <ArrowUpRight/></a>
  </section>;
}
