import Hero from './Hero';
import { CampaignFilm, ShetMoodBoard } from './HomeMedia';
import LocationSection from './LocationSection';
import FooterCTA from './FooterCTA';

export default function HomePage({ content }) {
  return <><Hero content={content}/><ShetMoodBoard/><CampaignFilm/><LocationSection/><FooterCTA/></>;
}
