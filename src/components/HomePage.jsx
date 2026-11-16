import Hero from './Hero';
import { ShetMoodBoard } from './HomeMedia';
import { CrewCarousel, ScrollMarquee, TapeVideo } from './HomeJetset';
import HomeCommunity from './HomeCommunity';
import LocationSection from './LocationSection';
import FooterCTA from './FooterCTA';

export default function HomePage({ content }) {
  return <><Hero content={content}/><ScrollMarquee/><ShetMoodBoard/><CrewCarousel/><TapeVideo/><HomeCommunity/><LocationSection/><FooterCTA footerOnly/></>;
}
