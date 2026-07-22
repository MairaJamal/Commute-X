/** Base fare rate used by the fare-split calculator (₹ per km). */
export const FARE_RATE_PER_KM = 14;

export interface SplitFareInput {
  distanceKm: number;
  riderCount: number;
  tolls: number;
  serviceFeePerRider: number;
}

export interface SplitFareResult {
  /** Full trip cost before rounding for display. */
  totalCost: number;
  /** Even share for every rider (totalCost / riderCount). */
  sharePerRider: number;
  /** One entry per rider, each equal to sharePerRider. */
  shares: number[];
}

/**
 * Pure fare splitter: distance fare + tolls + per-rider service fees,
 * divided evenly across all riders.
 */
export function splitFare({
  distanceKm,
  riderCount,
  tolls,
  serviceFeePerRider,
}: SplitFareInput): SplitFareResult {
  if (riderCount < 1) {
    throw new Error('riderCount must be at least 1');
  }
  if (distanceKm < 0 || tolls < 0 || serviceFeePerRider < 0) {
    throw new Error('distanceKm, tolls, and serviceFeePerRider must be non-negative');
  }

  const rawTotal =
    distanceKm * FARE_RATE_PER_KM + tolls + serviceFeePerRider * riderCount;
  const totalCost = Math.round(rawTotal * 100) / 100;
  const sharePerRider = Math.round((totalCost / riderCount) * 100) / 100;
  const shares = Array.from({ length: riderCount }, () => sharePerRider);

  return { totalCost, sharePerRider, shares };
}
