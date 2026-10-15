/** Match demo worker display names from seed (e.g. "Quba Worker 3"). */
const REGIONS = [
  { id: 'haram', prefix: 'Haram ', label: 'Haram (Masjid an-Nabawi)' },
  { id: 'quba', prefix: 'Quba ', label: 'Quba' },
  { id: 'uhud', prefix: 'Uhud ', label: 'Uhud' },
  { id: 'airport', prefix: 'Airport ', label: 'Airport' },
];

export const REGION_FILTERS = [
  { id: 'all', label: 'All of Medina' },
  ...REGIONS.map(({ id, label }) => ({ id, label })),
];

export function workerRegionKey(username = '') {
  return REGIONS.find((r) => username.startsWith(r.prefix))?.id || 'other';
}

export function matchesRegionFilter(username, filterId) {
  if (filterId === 'all') return true;
  return workerRegionKey(username) === filterId;
}

export function regionLabelForUsername(username) {
  const region = REGIONS.find((r) => r.id === workerRegionKey(username));
  return region ? region.prefix.trim() : username.split(' ')[0] || 'Worker';
}
