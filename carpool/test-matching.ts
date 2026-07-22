import { computeMatch, MatchRequest } from './lib/matching';

// Define mock users
const userAisha = {
  id: 'aisha-id',
  name: 'Aisha Kapoor',
  gender: 'female',
  role: 'student',
  rating: 4.9,
  chatStyle: 'Quiet / headphones'
};

const userPriya = {
  id: 'priya-id',
  name: 'Priya Menon',
  gender: 'female',
  role: 'office_worker',
  rating: 4.8,
  chatStyle: 'Friendly'
};

const userRohan = {
  id: 'rohan-id',
  name: 'Rohan Sharma',
  gender: 'male',
  role: 'student',
  rating: 4.7,
  chatStyle: 'Quiet'
};

// Test Cases
const runTests = () => {
  console.log('--- RUNNING MATCHING ENGINE TESTS ---\n');

  // 1. Exact Match Test
  const reqAishaBase: MatchRequest = {
    userId: 'aisha-id',
    pickupLat: 11.25,
    pickupLng: 75.78,
    destLat: 11.35,
    destLng: 75.88,
    departureTime: '08:10',
    flexibilityWindow: '± 15 minutes',
    womenOnly: true,
    user: userAisha
  };

  const reqExactMatch: MatchRequest = {
    userId: 'priya-id',
    pickupLat: 11.25,
    pickupLng: 75.78,
    destLat: 11.35,
    destLng: 75.88,
    departureTime: '08:10',
    flexibilityWindow: '± 15 minutes',
    womenOnly: true,
    user: userPriya
  };

  const scoreExact = computeMatch(reqAishaBase, reqExactMatch);
  console.log(`Test 1: Exact Match (Same pickup, dest, time) -> Score: ${scoreExact}`);
  console.log(`Expected: >= 90 (actual score depends on rating/pref overlaps)`);
  console.log(scoreExact >= 90 ? '✅ PASSED\n' : '❌ FAILED\n');

  // 2. No Time Overlap Test
  const reqNoTimeOverlap: MatchRequest = {
    userId: 'priya-id',
    pickupLat: 11.25,
    pickupLng: 75.78,
    destLat: 11.35,
    destLng: 75.88,
    departureTime: '10:30', // Over 2 hours difference
    flexibilityWindow: '± 15 minutes',
    womenOnly: true,
    user: userPriya
  };

  const scoreNoTime = computeMatch(reqAishaBase, reqNoTimeOverlap);
  console.log(`Test 2: No Time Overlap (10:30 AM vs 8:10 AM) -> Score: ${scoreNoTime}`);
  console.log(`Expected: <= 75 (Since time score should be 0, losing 25 points)`);
  console.log(scoreNoTime <= 75 ? '✅ PASSED\n' : '❌ FAILED\n');

  // 3. Women-Only Mismatch Test
  const reqRohanMatch: MatchRequest = {
    userId: 'rohan-id',
    pickupLat: 11.25,
    pickupLng: 75.78,
    destLat: 11.35,
    destLng: 75.88,
    departureTime: '08:10',
    flexibilityWindow: '± 15 minutes',
    womenOnly: false, // Rohan doesn't filter, but Aisha is women-only
    user: userRohan
  };

  const scoreWomenOnly = computeMatch(reqAishaBase, reqRohanMatch);
  console.log(`Test 3: Women-Only Mismatch (Rohan is male, Aisha has womenOnly = true) -> Score: ${scoreWomenOnly}`);
  console.log(`Expected: 0`);
  console.log(scoreWomenOnly === 0 ? '✅ PASSED\n' : '❌ FAILED\n');

  // 4. Far Pickup Distance Test
  const reqFarPickup: MatchRequest = {
    userId: 'priya-id',
    pickupLat: 11.55, // Very far pickup (around 33km away)
    pickupLng: 75.78,
    destLat: 11.35,
    destLng: 75.88,
    departureTime: '08:10',
    flexibilityWindow: '± 15 minutes',
    womenOnly: true,
    user: userPriya
  };

  const scoreFarPickup = computeMatch(reqAishaBase, reqFarPickup);
  console.log(`Test 4: Far Pickup Distance (~33km away) -> Score: ${scoreFarPickup}`);
  console.log(`Expected: <= 70 (Pickup score is 0, losing 30 points)`);
  console.log(scoreFarPickup <= 70 ? '✅ PASSED\n' : '❌ FAILED\n');

  console.log('--- ALL TESTS COMPLETED ---');
};

runTests();
