const hubs = {
  ATLANTA: { lat: 33.749, lon: -84.388 },
  DALLAS: { lat: 32.7767, lon: -96.797 },
};

const knownCities: Record<string, { lat: number; lon: number }> = {
  'atlanta ga': hubs.ATLANTA,
  'decatur ga': { lat: 33.7748, lon: -84.2963 },
  'sandy springs ga': { lat: 33.9304, lon: -84.3733 },
  'marietta ga': { lat: 33.9526, lon: -84.5499 },
  'alpharetta ga': { lat: 34.0754, lon: -84.2941 },
  'dallas tx': hubs.DALLAS,
  'plano tx': { lat: 33.0198, lon: -96.6989 },
  'irving tx': { lat: 32.814, lon: -96.9489 },
  'addison tx': { lat: 32.9618, lon: -96.8292 },
  'richardson tx': { lat: 32.9483, lon: -96.7299 },
  'garland tx': { lat: 32.9126, lon: -96.6389 },
  'fort worth tx': { lat: 32.7555, lon: -97.3308 },
};

function radians(value: number) { return value * Math.PI / 180; }

export function milesBetween(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const R = 3958.8;
  const dLat = radians(b.lat - a.lat);
  const dLon = radians(b.lon - a.lon);
  const lat1 = radians(a.lat);
  const lat2 = radians(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function inferMetro(location: string, radiusMiles: number): 'ATLANTA' | 'DALLAS' | undefined {
  const normalized = location.toLowerCase().replace(/[,.]/g, ' ').replace(/\s+/g, ' ').trim();
  const match = Object.entries(knownCities).find(([name]) => normalized.includes(name));
  if (!match) {
    if (/atlanta|decatur|sandy springs|marietta|alpharetta/.test(normalized)) return 'ATLANTA';
    if (/dallas|plano|irving|addison|richardson|garland/.test(normalized)) return 'DALLAS';
    return undefined;
  }
  const point = match[1];
  if (milesBetween(point, hubs.ATLANTA) <= radiusMiles) return 'ATLANTA';
  if (milesBetween(point, hubs.DALLAS) <= radiusMiles) return 'DALLAS';
  return undefined;
}

export function remoteEligibleForGeorgiaOrTexas(text: string): boolean {
  const t = text.toLowerCase();
  const exclusions = [
    /not available in (?:[^.]*\bgeorgia\b[^.]*\btexas\b|[^.]*\btexas\b[^.]*\bgeorgia\b)/,
    /excluding (?:[^.]*\bga\b[^.]*\btx\b|[^.]*\btx\b[^.]*\bga\b)/,
    /cannot hire in (?:[^.]*\bgeorgia\b[^.]*\btexas\b|[^.]*\btexas\b[^.]*\bgeorgia\b)/,
  ];
  if (exclusions.some(r => r.test(t))) return false;

  // Common restricted-state language. When a posting explicitly lists eligible states,
  // require Georgia or Texas to appear rather than assuming nationwide eligibility.
  const restricted = t.match(/(?:eligible states?|hiring in|remote in|must reside in|candidates? (?:must )?be located in)\s*[:\-]?\s*([^.;]{2,300})/i)?.[1];
  if (restricted) {
    const stateTokens = restricted.match(/\b(?:al|ak|az|ar|ca|co|ct|de|fl|ga|hi|id|il|in|ia|ks|ky|la|me|md|ma|mi|mn|ms|mo|mt|ne|nv|nh|nj|nm|ny|nc|nd|oh|ok|or|pa|ri|sc|sd|tn|tx|ut|vt|va|wa|wv|wi|wy)\b/gi) ?? [];
    const stateNames = restricted.match(/\b(?:georgia|texas|california|new york|florida|washington|virginia|colorado|illinois|massachusetts|north carolina|south carolina|tennessee|pennsylvania|ohio|michigan|arizona|maryland)\b/gi) ?? [];
    if (stateTokens.length + stateNames.length >= 2 && !/\b(?:ga|georgia|tx|texas)\b/i.test(restricted)) return false;
  }
  return true;
}
