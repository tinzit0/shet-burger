import { instagramUrl, products } from '../data';
import BurgerPhoto from './BurgerPhoto';
export default function SocialScroll() {
  return <section className="editorial-social" aria-labelledby="social-title">
    <div className="editorial-meta"><span>06 / EL ANTOJO SE COMPARTE</span><span>@SHETBURGER</span></div>
    <div className="social-heading"><h2 id="social-title" data-reveal>SHET<br/>ON THE GRAM.</h2><a className="editorial-link" href={instagramUrl} target="_blank" rel="noreferrer">FOLLOW US ↗</a></div>
    <div className="social-gallery">{[products[0],products[2],products[3]].map((product,index)=><a href={instagramUrl} key={product.id} target="_blank" rel="noreferrer" aria-label={`Ver Shet Burger en Instagram: ${product.name}`}><BurgerPhoto product={product} sizes="(max-width: 600px) 65vw, 30vw"/><span>SHET / 0{index+1}<b aria-hidden="true">↗</b></span></a>)}</div>
  </section>;
}
