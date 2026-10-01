import Hero from './Hero';
import HomeMedia from './HomeMedia';
import ReviewsSection from './ReviewsSection';
import LocationSection from './LocationSection';
import FooterCTA from './FooterCTA';
import { navigate } from '../lib/navigation';

export default function HomePage() {
  return <><Hero onOrder={() => navigate('/delivery')}/><HomeMedia/><ReviewsSection/><LocationSection compact/><FooterCTA/></>;
}
