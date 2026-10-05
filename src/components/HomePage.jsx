import { lazy, Suspense } from 'react';
import Hero from './Hero';
import { BrandPromise, CampaignFilm } from './HomeMedia';
import ShetSignature from './ShetSignature';
import LocationSection from './LocationSection';
import FooterCTA from './FooterCTA';

const ReviewsSection = lazy(() => import('./ReviewsSection'));

export default function HomePage() {
  return <><Hero/><BrandPromise/><ShetSignature/><CampaignFilm/><Suspense fallback={<section className="reviews-section" aria-label="Cargando opiniones"/>}><ReviewsSection/></Suspense><LocationSection compact/><FooterCTA/></>;
}
