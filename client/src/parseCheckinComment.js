/** Parse demo seed comment: `[Haram] onsite then away · check-in #10 · ~4532 m` */
export function parseCheckinComment(comment = '') {
  const regionMatch = comment.match(/^\[([^\]]+)\]/);
  const region = regionMatch?.[1]?.trim() || null;
  const rest = comment.slice(regionMatch?.[0]?.length ?? 0).trim();
  const parts = rest.split('·').map((s) => s.trim()).filter(Boolean);

  let scenario = parts[0] || null;
  let checkIn = null;
  let distanceKm = null;

  for (const part of parts.slice(1)) {
    const checkInMatch = part.match(/check-in\s+#(\d+)/i);
    if (checkInMatch) checkIn = checkInMatch[1];

    const metersMatch = part.match(/~?\s*([\d.]+)\s*m\b/i);
    if (metersMatch) {
      distanceKm = (Number(metersMatch[1]) / 1000).toFixed(1);
    }
  }

  if (scenario) {
    scenario = scenario.replace(/^./, (c) => c.toUpperCase());
  }

  return { region, scenario, checkIn, distanceKm };
}
