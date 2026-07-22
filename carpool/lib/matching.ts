export interface MatchUser {
  id: string;
  name: string;
  gender: string; // 'female' | 'male' | 'other'
  role: string;   // 'student' | 'office_worker'
  rating?: number;
  chatStyle?: string;
}

export interface MatchRequest {
  userId: string;
  pickupLat: number;
  pickupLng: number;
  destLat: number;
  destLng: number;
  departureTime: string; // "HH:MM" or "HH:MM AM/PM"
  flexibilityWindow: string; // "± X minutes"
  frequency?: string; // "daily" or "one_time"
  daysOfWeek?: string; // comma-separated, e.g. "M,T,W,T,F"
  womenOnly: boolean;
  user: MatchUser;
}

// Haversine formula to compute distance in km
export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Parse flexibility window string into minutes
export function parseFlexibility(windowStr: string): number {
  const match = windowStr.match(/(\d+)/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return 15; // default 15 minutes
}

// Convert "HH:MM" or "HH:MM AM/PM" to minutes since midnight
export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 480;
  const isPM = /pm/i.test(timeStr);
  const isAM = /am/i.test(timeStr);
  const clean = timeStr.replace(/(am|pm)/i, '').trim();
  const parts = clean.split(':');
  if (parts.length >= 2) {
    let hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    if (!isNaN(hours) && !isNaN(minutes)) {
      if (isPM && hours < 12) hours += 12;
      if (isAM && hours === 12) hours = 0;
      return hours * 60 + minutes;
    }
  }
  return 480; // default 8:00 AM (480 minutes)
}

export function computeMatch(requestA: MatchRequest, requestB: MatchRequest): number {
  const userA = requestA.user;
  const userB = requestB.user;

  // 1. Hard Filter: Women-only check
  const isAishaA = userA.gender === 'female';
  const isAishaB = userB.gender === 'female';
  
  if (requestA.womenOnly && userB.gender !== 'female') {
    return 0;
  }
  if (requestB.womenOnly && userA.gender !== 'female') {
    return 0;
  }

  // 2. Pickup Distance (weight 30%)
  const pickupDist = haversineDistance(
    requestA.pickupLat,
    requestA.pickupLng,
    requestB.pickupLat,
    requestB.pickupLng
  );
  // Max pickup score for distance = 0km, 0 score for distance >= 2km
  const pickupScore = Math.max(0, 1 - pickupDist / 2);

  // 3. Destination Distance (weight 25%)
  const destDist = haversineDistance(
    requestA.destLat,
    requestA.destLng,
    requestB.destLat,
    requestB.destLng
  );
  // Max destination score for distance = 0km, 0 score for distance >= 3km
  const destScore = Math.max(0, 1 - destDist / 3);

  // 4. Time & Schedule Overlap (weight 25%)
  const timeA = timeToMinutes(requestA.departureTime);
  const timeB = timeToMinutes(requestB.departureTime);
  const flexA = parseFlexibility(requestA.flexibilityWindow);
  const flexB = parseFlexibility(requestB.flexibilityWindow);

  const startA = timeA - flexA;
  const endA = timeA + flexA;
  const startB = timeB - flexB;
  const endB = timeB + flexB;

  const overlapStart = Math.max(startA, startB);
  const overlapEnd = Math.min(endA, endB);

  let timeScore = 0;
  if (overlapEnd >= overlapStart) {
    // There is an overlap
    timeScore = 1.0;
  } else {
    // Gap size in minutes
    const gap = overlapStart - overlapEnd;
    timeScore = Math.max(0, 1 - gap / 30); // 0 score if gap >= 30 mins
  }

  // Day-of-week compatibility penalty if daily commutes have no overlapping days
  if (requestA.daysOfWeek && requestB.daysOfWeek) {
    const daysA = requestA.daysOfWeek.split(',').map((d) => d.trim());
    const daysB = requestB.daysOfWeek.split(',').map((d) => d.trim());
    const hasCommonDay = daysA.some((day) => daysB.includes(day));
    if (!hasCommonDay) {
      timeScore *= 0.2; // heavy penalty if zero days overlap
    }
  }

  // 5. Rating Similarity (weight 10%)
  let ratingScore = 1.0; // default if not available
  if (userA.rating !== undefined && userB.rating !== undefined) {
    const diff = Math.abs(userA.rating - userB.rating);
    ratingScore = Math.max(0, 1 - diff / 1.0); // 0 score if difference >= 1 star
  }

  // 6. Preferences/Role Overlap (weight 10%)
  let prefScore = 0;
  if (userA.role === userB.role) {
    prefScore += 0.5; // 5% same role (e.g. both students)
  }
  if (userA.chatStyle && userB.chatStyle && userA.chatStyle === userB.chatStyle) {
    prefScore += 0.5; // 5% same chat preference
  } else if (userA.chatStyle && userB.chatStyle) {
    // Partial compatibility
    prefScore += 0.25;
  } else {
    prefScore += 0.5; // default compatibility
  }

  const finalScore =
    pickupScore * 30 +
    destScore * 25 +
    timeScore * 25 +
    ratingScore * 10 +
    prefScore * 10;

  return Math.round(finalScore);
}
