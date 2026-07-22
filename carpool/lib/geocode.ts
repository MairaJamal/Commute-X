import crypto from 'crypto';

/** Known landmark coordinates from the original mockup, used as anchors. */
const KNOWN_PLACES: Array<{ match: string; lat: number; lng: number }> = [
  { match: 'sector 17', lat: 11.25, lng: 75.78 },
  { match: 'tech park', lat: 11.35, lng: 75.88 },
];

/**
 * Turns an address string into a lat/lng.
 *
 * This is a placeholder, not real geocoding — there's no Google Maps / Mapbox
 * API key configured. It's deterministic (the same address always resolves to
 * the same point, unlike random jitter) by hashing the address text into a
 * small, stable offset from a city-center anchor point. Distances computed
 * from these coordinates are only meaningful as a rough, consistent ordering
 * for matching demo data — not as real-world distances.
 *
 * To use real geocoding: set GOOGLE_MAPS_API_KEY (or MAPBOX_API_KEY) and
 * replace the body of this function with a call to that provider's geocoding
 * endpoint, keeping the same (lat, lng) return shape.
 */
export function approximateCoordinates(address: string): { lat: number; lng: number } {
  const normalized = address.toLowerCase();

  for (const place of KNOWN_PLACES) {
    if (normalized.includes(place.match)) {
      return { lat: place.lat, lng: place.lng };
    }
  }

  // City-center anchor (midpoint of the known landmarks above).
  const anchorLat = 11.3;
  const anchorLng = 75.83;

  // Hash the address into two independent, deterministic offsets in [-0.05, 0.05].
  const hash = crypto.createHash('sha256').update(normalized.trim()).digest();
  const offsetLat = (hash.readUInt16BE(0) / 0xffff - 0.5) * 0.1;
  const offsetLng = (hash.readUInt16BE(2) / 0xffff - 0.5) * 0.1;

  return { lat: anchorLat + offsetLat, lng: anchorLng + offsetLng };
}
