import Hero from './Hero';
import { ShetMoodBoard } from './HomeMedia';
import { CrewCarousel, InfoStrip, ScrollMarquee, TapeVideo } from './HomeJetset';
import HomeCommunity from './HomeCommunity';
import LocationSection from './LocationSection';
import FooterCTA from './FooterCTA';
import useOpeningTime from '../lib/openingTime';

export default function HomePage({ content }) {
  const openingTime = useOpeningTime();
  return <><Hero content={content}/><InfoStrip openingTime={openingTime}/><ScrollMarquee/><ShetMoodBoard/><CrewCarousel/><TapeVideo/><HomeCommunity/><LocationSection/><FooterCTA footerOnly/></>;
}
