import Hero from './Hero';
import { MoodStickers, ShetMoodBoard } from './HomeMedia';
import BrandTape from './BrandTape';
import LocationSection from './LocationSection';
import FooterCTA from './FooterCTA';
import HomeCommunity from './HomeCommunity';

export default function HomePage({ content }) {
  return <><Hero content={content}/><BrandTape/><ShetMoodBoard/><MoodStickers/><div className="street-texture" aria-hidden="true"/><HomeCommunity/><LocationSection/><FooterCTA footerOnly/></>;
}
