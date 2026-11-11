import Hero from './Hero';
import BrandTape from './BrandTape';
import LocationSection from './LocationSection';
import FooterCTA from './FooterCTA';
import { CheckerBand, HeroIntro, HomePoster, PromoSection, ScrollMarquee, SidesSection, SignatureSection } from './HomeSections';

export default function HomePage({ content, products }) {
  return <><Hero content={content}/><BrandTape/><HomePoster content={content}/><HeroIntro/><ScrollMarquee rows={[['FAT SMASH', -1], ['PINK BOX', 1]]}/><SignatureSection products={products}/><PromoSection products={products}/><ScrollMarquee tone="dark" rows={[['PIDE SHET', 1], ['NONGUÉN', -1]]}/><SidesSection/><CheckerBand/><LocationSection/><FooterCTA footerOnly/></>;
}
