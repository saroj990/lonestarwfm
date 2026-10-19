const OPENFREE = 'https://tiles.openfreemap.org/styles';
const ESRI = 'https://server.arcgisonline.com/ArcGIS/rest/services';

/** Esri World Imagery + place labels (keyless for dev/demo). */
export const SATELLITE_STYLE = {
  version: 8,
  sources: {
    satellite: {
      type: 'raster',
      tiles: [`${ESRI}/World_Imagery/MapServer/tile/{z}/{y}/{x}`],
      tileSize: 256,
      attribution:
        'Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics, USDA FSA, USGS, AeroGRID, IGN, GIS User Community',
      maxzoom: 19,
    },
    labels: {
      type: 'raster',
      tiles: [`${ESRI}/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}`],
      tileSize: 256,
      maxzoom: 19,
    },
  },
  layers: [
    { id: 'satellite', type: 'raster', source: 'satellite' },
    { id: 'labels', type: 'raster', source: 'labels', paint: { 'raster-opacity': 0.85 } },
  ],
};

export const MAP_STYLE_OPTIONS = [
  { id: 'auto', label: 'Auto (match theme)', description: 'Light or dark street' },
  { id: 'street-light', label: 'Street map', description: 'Light gray streets' },
  { id: 'street-dark', label: 'Street map (dark)', description: 'Dark gray streets' },
  { id: 'satellite', label: 'Satellite', description: 'Aerial imagery' },
  { id: 'liberty', label: 'Liberty', description: 'Colorful OpenStreetMap' },
  { id: 'fiord', label: 'Fiord', description: 'Muted outdoor style' },
  { id: 'bright', label: 'Bright', description: 'High-contrast streets' },
];

const STYLE_URLS = {
  'street-light': `${OPENFREE}/positron`,
  'street-dark': `${OPENFREE}/dark`,
  liberty: `${OPENFREE}/liberty`,
  fiord: `${OPENFREE}/fiord`,
  bright: `${OPENFREE}/bright`,
};

export const MAP_STYLE_STORAGE_KEY = 'lonestar_map_style';

export function resolveMapStyle(styleId, appTheme = 'dark') {
  const id = styleId === 'auto' ? (appTheme === 'light' ? 'street-light' : 'street-dark') : styleId;

  if (id === 'satellite') return SATELLITE_STYLE;
  return STYLE_URLS[id] || STYLE_URLS['street-dark'];
}

export function mapStyleLabel(styleId) {
  return MAP_STYLE_OPTIONS.find((o) => o.id === styleId)?.label || 'Map style';
}
