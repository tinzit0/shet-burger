import { lazy, Suspense } from 'react';
import Hero from './Hero';
import { BrandSignal, CampaignFilm, HomeActionBar, ShetClub, ShetMood } from './HomeMedia';
import LocationSection from './LocationSection';
import FooterCTA from './FooterCTA';

const ReviewsSection = lazy(() => import('./ReviewsSection'));

export default function HomePage() {
  return <><Hero/><HomeActionBar/><ShetMood/><BrandSignal/><CampaignFilm/><ShetClub/><Suspense fallback={<section className="reviews-section" aria-label="Cargando opiniones"/>}><ReviewsSection/></Suspense><LocationSection compact/><FooterCTA/></>;
}
