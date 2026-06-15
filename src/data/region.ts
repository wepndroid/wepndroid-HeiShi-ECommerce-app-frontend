import i18n from '../i18n';

/** Internal sentinel values stored in region state (not for display). */
export const ALL_AREAS = '全部区域';
export const OTHER_AREAS = '其他地区';

export interface RegionSelection {
  state: string;
  city: string;
  area: string;
}

export interface RegionCity {
  name: string;
  cn: string;
  /** Well-known suburbs shown as primary chips. */
  areas: string[];
  /** Additional suburbs revealed when the user taps "Other areas". */
  otherAreas?: string[];
}

export interface RegionGroup {
  state: string;
  stateName: string;
  cities: RegionCity[];
}

export const DEFAULT_REGION: RegionSelection = {
  state: 'VIC',
  city: 'Melbourne',
  area: ALL_AREAS,
};

export const regionData: RegionGroup[] = [
  {
    state: 'NSW',
    stateName: '新南威尔士州',
    cities: [
      {
        name: 'Sydney',
        cn: '悉尼',
        areas: ['Chatswood', 'Eastwood', 'Hurstville', 'Burwood', 'Rhodes', 'Epping', 'Haymarket', 'Parramatta'],
        otherAreas: ['Ashfield', 'Campsie', 'Auburn', 'Zetland'],
      },
    ],
  },
  {
    state: 'VIC',
    stateName: '维多利亚州',
    cities: [
      {
        name: 'Melbourne',
        cn: '墨尔本',
        areas: [
          'Box Hill',
          'Glen Waverley',
          'Clayton',
          'Doncaster',
          'Melbourne CBD',
          'Southbank',
          'Carlton',
          'Burwood',
        ],
        otherAreas: ['Richmond', 'Docklands', 'Footscray', 'Hawthorn', 'Preston', 'Online', 'Melbourne East', 'Monash'],
      },
      {
        name: 'Geelong',
        cn: '吉朗',
        areas: ['Geelong CBD', 'Waurn Ponds', 'Waterfront'],
        otherAreas: ['Newtown', 'Belmont', 'Grovedale'],
      },
    ],
  },
  {
    state: 'QLD',
    stateName: '昆士兰州',
    cities: [
      { name: 'Brisbane', cn: '布里斯班', areas: ['Sunnybank', 'Robertson', 'South Brisbane', 'St Lucia', 'Toowong'], otherAreas: ['Fortitude Valley', 'Garden City'] },
      { name: 'Gold Coast', cn: '黄金海岸', areas: ['Southport'], otherAreas: ['Surfers Paradise', 'Broadbeach', 'Robina'] },
    ],
  },
  {
    state: 'WA',
    stateName: '西澳大利亚州',
    cities: [{ name: 'Perth', cn: '珀斯', areas: ['Cannington', 'Willetton', 'Victoria Park', 'Perth CBD', 'Northbridge'], otherAreas: ['Morley', 'Subiaco'] }],
  },
  {
    state: 'SA',
    stateName: '南澳大利亚州',
    cities: [{ name: 'Adelaide', cn: '阿德莱德', areas: ['Adelaide CBD', 'Chinatown', 'Mawson Lakes', 'Glen Osmond 附近'], otherAreas: ['Norwood', 'Prospect'] }],
  },
  {
    state: 'ACT',
    stateName: '澳洲首都领地',
    cities: [{ name: 'Canberra', cn: '堪培拉', areas: ['City', 'Dickson', 'Belconnen', 'Gungahlin'], otherAreas: ['Woden', 'Tuggeranong'] }],
  },
  {
    state: 'TAS',
    stateName: '塔斯马尼亚州',
    cities: [{ name: 'Hobart', cn: '霍巴特', areas: ['Sandy Bay', 'Hobart CBD'], otherAreas: ['North Hobart', 'Battery Point'] }],
  },
  {
    state: 'NT',
    stateName: '北领地',
    cities: [{ name: 'Darwin', cn: '达尔文', areas: ['Darwin CBD'], otherAreas: ['Palmerston', 'Casuarina'] }],
  },
];

export function getPrimaryAreas(city: RegionCity): string[] {
  return city.areas.filter((a) => a !== ALL_AREAS && a !== OTHER_AREAS);
}

export function getSecondaryAreas(city: RegionCity): string[] {
  return city.otherAreas ?? [];
}

export function cityHasSecondaryAreas(city: RegionCity): boolean {
  return getSecondaryAreas(city).length > 0;
}

export function isSecondaryArea(city: RegionCity, area: string): boolean {
  return getSecondaryAreas(city).includes(area);
}

export function allKnownAreas(city: RegionCity): string[] {
  return [...getPrimaryAreas(city), ...getSecondaryAreas(city)];
}

function isZhLanguage(lang = i18n.language): boolean {
  return lang.startsWith('zh');
}

export function formatCityLabel(city: RegionCity): string {
  return isZhLanguage() ? city.cn : city.name;
}

export function formatStateHeading(state: string, stateName: string): string {
  return formatStateName(state, stateName);
}

export function formatAreaLabel(area: string): string {
  if (area === ALL_AREAS) return i18n.t('region.allAreas');
  if (area === OTHER_AREAS) return i18n.t('region.otherAreas');
  const key = `region.areaNames.${area}`;
  const translated = i18n.t(key);
  return translated === key ? area : translated;
}

export function formatStateName(state: string, fallback: string): string {
  const key = `region.stateNames.${state}`;
  const translated = i18n.t(key);
  return translated === key ? fallback : translated;
}

export function regionLabel(region: RegionSelection): string {
  const group = regionData.find((g) => g.state === region.state);
  const city = group?.cities.find((c) => c.name === region.city);
  if (region.area === ALL_AREAS) return city ? formatCityLabel(city) : region.city;
  return formatAreaLabel(region.area);
}

export function regionSummary(region: RegionSelection): string {
  const group = regionData.find((g) => g.state === region.state);
  const city = group?.cities.find((c) => c.name === region.city);
  const stateLabel = formatStateName(region.state, group?.stateName ?? region.state);
  const cityLabel = city ? formatCityLabel(city) : region.city;
  const areaPart = region.area === ALL_AREAS ? '' : ` · ${formatAreaLabel(region.area)}`;
  return `${stateLabel} · ${cityLabel}${areaPart}`;
}

export function productInRegion(
  loc: string,
  region: RegionSelection,
): boolean {
  const group = regionData.find((g) => g.state === region.state);
  const city = group?.cities.find((c) => c.name === region.city);
  if (!city) return false;

  if (region.area === ALL_AREAS) return true;

  const normalizedLoc = loc === 'CBD' ? 'Melbourne CBD' : loc;

  if (region.area === OTHER_AREAS) {
    return !allKnownAreas(city).includes(normalizedLoc);
  }

  if (isSecondaryArea(city, region.area) || getPrimaryAreas(city).includes(region.area)) {
    return normalizedLoc === region.area || normalizedLoc.includes(region.area) || region.area.includes(normalizedLoc);
  }

  return normalizedLoc === region.area;
}
