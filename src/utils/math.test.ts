import test from 'node:test';
import assert from 'node:assert/strict';
import { createRNG, lerpColor, calculateSunMoon, calculatePhyllotaxis, formatTimeOfDay } from './math';

test('Mulberry32 PRNG produces deterministic values within [0, 1)', () => {
  const rng1 = createRNG(42);
  const val1 = rng1();
  const val2 = rng1();

  const rng2 = createRNG(42);
  const val3 = rng2();
  const val4 = rng2();

  assert.equal(val1, val3, 'Same seed must produce identical first float');
  assert.equal(val2, val4, 'Same seed must produce identical second float');
  assert.ok(val1 >= 0 && val1 < 1, 'Value must be in [0, 1)');
  assert.ok(val2 >= 0 && val2 < 1, 'Value must be in [0, 1)');
});

test('lerpColor accurately interpolates boundary hex colors', () => {
  const black = '#000000';
  const white = '#ffffff';

  assert.equal(lerpColor(black, white, 0), '#000000');
  assert.equal(lerpColor(black, white, 1), '#ffffff');
  assert.equal(lerpColor(black, white, 0.5), '#808080');
});

test('calculateSunMoon distinguishes noon from midnight', () => {
  const noon = calculateSunMoon(12);
  assert.equal(noon.isNight, false, 'Noon must be daytime');
  assert.ok(noon.sunIntensity > 1.0, 'Noon sun intensity should be high');
  assert.ok(noon.sunPosition[1] > 5, 'Sun height at noon should be elevated');

  const midnight = calculateSunMoon(0);
  assert.equal(midnight.isNight, true, 'Midnight must be night');
  assert.equal(midnight.sunIntensity, 0, 'Night sun intensity must be zero');
  assert.ok(midnight.moonIntensity > 0, 'Midnight should have moon light');
});

test('calculatePhyllotaxis computes spiral distribution', () => {
  const count = 20;
  const maxR = 2.0;
  const leaf0 = calculatePhyllotaxis(0, count, maxR);
  const leaf19 = calculatePhyllotaxis(19, count, maxR);

  assert.equal(leaf0.radius, 0, 'Center leaf has radius 0');
  assert.ok(leaf19.radius > 1.8, 'Outer leaf radius approaches maxRadius');
});

test('formatTimeOfDay formats standard 12-hour strings', () => {
  assert.equal(formatTimeOfDay(12), '12:00 PM');
  assert.equal(formatTimeOfDay(0), '12:00 AM');
  assert.equal(formatTimeOfDay(6.5), '6:30 AM');
  assert.equal(formatTimeOfDay(18.25), '6:15 PM');
});
