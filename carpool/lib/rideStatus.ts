export const RIDE_STATUSES = [
  'requested',
  'matched',
  'waiting_for_passenger',
  'waiting_for_driver',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
] as const;

export type RideStatus = (typeof RIDE_STATUSES)[number];

/** Allowed transitions (cancelled can be reached from any non-terminal state). */
const ALLOWED: Record<RideStatus, RideStatus[]> = {
  requested: ['matched', 'waiting_for_passenger', 'waiting_for_driver', 'confirmed', 'cancelled'],
  matched: ['waiting_for_passenger', 'waiting_for_driver', 'confirmed', 'cancelled'],
  waiting_for_passenger: ['confirmed', 'cancelled'],
  waiting_for_driver: ['confirmed', 'cancelled'],
  confirmed: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

export function isRideStatus(value: string): value is RideStatus {
  return (RIDE_STATUSES as readonly string[]).includes(value);
}

export function canTransition(from: RideStatus, to: RideStatus): boolean {
  return ALLOWED[from]?.includes(to) ?? false;
}

/** Fare is agreed when timestamp + numeric fare fields are present. */
export function hasFareAgreed(ride: {
  fareAgreedAt: Date | string | null;
  totalFare: number | null;
  sharePerRider: number | null;
}): boolean {
  return (
    ride.fareAgreedAt != null &&
    ride.totalFare != null &&
    ride.sharePerRider != null
  );
}

export function assertCanConfirm(ride: {
  status: string;
  fareAgreedAt: Date | string | null;
  totalFare: number | null;
  sharePerRider: number | null;
}): void {
  if (!hasFareAgreed(ride)) {
    throw new Error('Cannot confirm ride without an agreed fare');
  }
  const validFrom = ['matched', 'requested', 'waiting_for_passenger', 'waiting_for_driver'];
  if (!validFrom.includes(ride.status)) {
    throw new Error(`Cannot confirm ride from status "${ride.status}"`);
  }
}
