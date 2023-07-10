import type { ReactNode } from 'react';
import { default as ReactShadowRoot } from 'react-shadow';

import type { Matchroom, MetricsData } from 'src/shared/core';
import { Feature } from 'src/shared/core';
import { getColorScale } from 'src/shared/helpers';

import { useMetrics } from 'src/app/hooks/use-metrics';
import { FeaturesProvider } from 'src/app/providers/features';
import { MetricsProvider } from 'src/app/providers/metrics';
import { Metrics } from 'src/app/components/metrics';
import { Tooltip } from 'src/app/components/tooltip';

import stylesheetMetrics from 'src/app/components/metrics.module.scss?inline';
import stylesheetTooltip from 'src/app/components/tooltip.module.scss?inline';

import stylesheet from './map.module.scss?inline';
import styles from './map.module.scss';

/* Background color scale */
const backgroundColor = getColorScale(
  [-0.05, +0.05],
  {
    hue: [7, 113],
    saturation: [15, 15],
    lightness: [15, 15],
  },
);

/* Foreground color scale */
const foregroundColor = getColorScale(
  [-0.05, +0.05],
  {
    hue: [7, 113],
    saturation: [80, 80],
    lightness: [50, 50],
  },
);

/* Relative win rate */
const getRelativeWinRate = (metrics: MetricsData, teams: string[], map?: string): number => {
  const winRates = (map === undefined)
    ? teams.map((team) => metrics.teams[team].overall.winRate ?? 0)
    : teams.map((team) => metrics.teams[team].maps[map]?.winRate ?? 0);
  return winRates[0] - winRates[1];
}

/* Map component */
const MapComponent = (
  { matchroom, stylesheet, children }: {
    matchroom: Matchroom;
    stylesheet: string[];
    children: ReactNode | ReactNode[],
  },
) => {
  return (
    <ReactShadowRoot.Div>
      <FeaturesProvider configKey={['showMap']} hideOnFalse={true}>
        <MetricsProvider matchroom={matchroom}>
          {/* eslint-disable-next-line @typescript-eslint/naming-convention */}
          {
            stylesheet.map((style, index) =>
              <style key={index} dangerouslySetInnerHTML={{ __html: style }} />
            )
          }
          {children}
        </MetricsProvider>
      </FeaturesProvider>
    </ReactShadowRoot.Div>
  );
};

/* Sidebar component */
const SidebarComponent = (
  { matchroom, teams, map }: {
    matchroom: Matchroom;
    teams: string[];
    map: string;
  },
) => {
  const metrics = useMetrics();
  const relativeWinRate = getRelativeWinRate(metrics, teams, map);
  return (
    <MapComponent matchroom={matchroom} stylesheet={[stylesheet]}>
      <div
        className={styles['sidebar']}
        style={{ backgroundColor: foregroundColor(relativeWinRate) }}
      ></div>
    </MapComponent>
  );
};

/* Summary component */
const SummaryComponent = (
  { matchroom, teams, map }: {
    matchroom: Matchroom;
    teams: string[];
    map: string;
  },
) => {
  const metrics = useMetrics();
  const relativeWinRate = getRelativeWinRate(metrics, teams, map);
  return (
    <MapComponent
      matchroom={matchroom}
      stylesheet={[stylesheetTooltip, stylesheet]}
    >
      <div className={styles['kpi']}>
        <p style={{ color: foregroundColor(relativeWinRate) }}>
          {relativeWinRate.toFixed(0) + '%'}
        </p>
        <Tooltip message={'Relative win rate'} />
      </div>
    </MapComponent>
  );
}

/* Metrics component */
const MetricsComponent = (
  { matchroom, teams, map }: {
    matchroom: Matchroom;
    teams: string[];
    map: string;
  },
) => {
  const metrics = useMetrics();
  return (
    <MapComponent
      matchroom={matchroom}
      stylesheet={[stylesheetMetrics]}
    >
      <Metrics
        feature="map"
        data={[]}
      />
    </MapComponent>
  );
}

/* Map feature */
export const MapFeature = (matchroom: Matchroom) => new Feature('map',
  (feature) => {
    // retrieve matchroom teams
    const teams = matchroom.getTeams().map((team) => team.id);
    // retrieve matchroom maps
    const maps = matchroom.getMaps();

    // create components and actions for each map
    maps.forEach((map) => {

      // sidebar component
      feature.addComponent(
        <SidebarComponent matchroom={matchroom} teams={teams} map={map.id} />,
      ).prependTo(map.container);

      // summary component
      feature.addComponent(
        <SummaryComponent matchroom={matchroom} teams={teams} map={map.id} />
      ).appendTo(map.container);

      // metrics component
      feature.addComponent(
        <MetricsComponent matchroom={matchroom} teams={teams} map={map.id} />
      ).appendTo(map.container);

      // container
      feature.addAction({
        render: () => { map.container.style.backgroundColor = backgroundColor(1); },
        unmount: () => { map.container.style.backgroundColor = ''; },
      });
    });

    // listen for metrics changes
    matchroom.addListener(feature.render);
  },
);
