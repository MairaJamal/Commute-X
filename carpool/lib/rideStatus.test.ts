import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  assertCanConfirm,
  canTransition,
  hasFareAgreed,
  isRideStatus,
} from './rideStatus';

describe('rideStatus', () => {
  it('recognizes the full status lifecycle', () => {
    for (const s of [
      'requested',
      'matched',
      'confirmed',
      'in_progress',
      'completed',
      'cancelled',
    ]) {
      assert.equal(isRideStatus(s), true);
    }
    assert.equal(isRideStatus('pending'), false);
  });

  it('allows requested → matched → confirmed → in_progress → completed', () => {
    assert.equal(canTransition('requested', 'matched'), true);
    assert.equal(canTransition('matched', 'confirmed'), true);
    assert.equal(canTransition('confirmed', 'in_progress'), true);
    assert.equal(canTransition('in_progress', 'completed'), true);
  });

  it('blocks confirming without an agreed fare', () => {
    assert.equal(
      hasFareAgreed({ fareAgreedAt: null, totalFare: null, sharePerRider: null }),
      false
    );
    assert.throws(
      () =>
        assertCanConfirm({
          status: 'matched',
          fareAgreedAt: null,
          totalFare: null,
          sharePerRider: null,
        }),
      /agreed fare/
    );
  });

  it('allows confirm when fare is agreed on a matched ride', () => {
    assert.doesNotThrow(() =>
      assertCanConfirm({
        status: 'matched',
        fareAgreedAt: new Date(),
        totalFare: 155.6,
        sharePerRider: 51.87,
      })
    );
  });
});
