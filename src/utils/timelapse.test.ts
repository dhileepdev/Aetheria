import test from 'node:test';
import assert from 'node:assert/strict';
import { formatFrameLabel } from './timelapse';

test('formatFrameLabel creates clean description strings', () => {
  const label1 = formatFrameLabel(12, 1, 'sunny');
  assert.equal(label1, '12:00 PM • Sunny • 1 Plant');

  const label2 = formatFrameLabel(0, 5, 'fireflies');
  assert.equal(label2, '12:00 AM • Fireflies • 5 Plants');

  const label3 = formatFrameLabel(18.5, 0, 'rain');
  assert.equal(label3, '6:30 PM • Rain • 0 Plants');
});
