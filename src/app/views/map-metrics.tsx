import { SuntzuFeature } from '../../shared/settings';
import { Section, SectionHeader, SectionBody } from '../components/section';

export const MapMetrics = () => (
  <Section>
    <SectionHeader
      title="Map metrics"
      feature={SuntzuFeature.MapMetrics}
    />
    <SectionBody description="Display map metrics (win rate, average kills, headshots, kills/death, and kills/round) for each map in the matchroom map cards." />
  </Section>
);

export default MapMetrics;
