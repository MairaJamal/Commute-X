import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { splitFare, FARE_RATE_PER_KM } from './splitFare';

const BASE = {
  distanceKm: 8.4,
  tolls: 20,
  serviceFeePerRider: 6,
};

describe('splitFare', () => {
  it('splits evenly for 2 riders', () => {
    const result = splitFare({ ...BASE, riderCount: 2 });

    // 8.4 * 14 + 20 + 6 * 2 → 149.6
    assert.equal(result.totalCost, 149.6);
    assert.equal(result.sharePerRider, 74.8);
    assert.equal(result.shares.length, 2);
    assert.deepEqual(result.shares, [74.8, 74.8]);
  });

  it('splits evenly for 3 riders', () => {
    const result = splitFare({ ...BASE, riderCount: 3 });

    // 8.4 * 14 + 20 + 6 * 3 → 155.6
    assert.equal(result.totalCost, 155.6);
    assert.equal(result.sharePerRider, 51.87);
    assert.equal(result.shares.length, 3);
    assert.deepEqual(result.shares, [51.87, 51.87, 51.87]);
  });

  it('splits evenly for 4 riders', () => {
    const result = splitFare({ ...BASE, riderCount: 4 });

    // 8.4 * 14 + 20 + 6 * 4 → 161.6
    assert.equal(result.totalCost, 161.6);
    assert.equal(result.sharePerRider, 40.4);
    assert.equal(result.shares.length, 4);
    assert.deepEqual(result.shares, [40.4, 40.4, 40.4, 40.4]);
  });

  it('recalculates when distance changes', () => {
    const short = splitFare({ ...BASE, distanceKm: 5, riderCount: 3 });
    const long = splitFare({ ...BASE, distanceKm: 10, riderCount: 3 });
    assert.ok(long.totalCost > short.totalCost);
    assert.equal(long.totalCost - short.totalCost, 5 * FARE_RATE_PER_KM);
  });
});
