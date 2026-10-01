import Hero from './Hero';
import HomeMedia from './HomeMedia';
import ShetSignature from './ShetSignature';
import ReviewsSection from './ReviewsSection';
import LocationSection from './LocationSection';
import FooterCTA from './FooterCTA';
import { navigate } from '../lib/navigation';

export default function HomePage() {
  return <><Hero onOrder={() => navigate('/delivery')}/><HomeMedia/><ShetSignature/><div className="campaign-verdict" aria-hidden="true"><span>AHORA TE TOCA A TI</span><i>↓</i><span>CUÉNTANOS QUÉ TAL</span></div><ReviewsSection/><LocationSection compact/><FooterCTA/></>;
}
