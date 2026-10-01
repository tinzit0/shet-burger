import test from 'node:test';
import assert from 'node:assert/strict';
import { validateReview } from '../src/lib/reviewValidation.js';
const valid = { name: 'Cliente', rating: 5, comment: 'Muy buena.' };
test('review rejects missing, fractional and out-of-range ratings', () => {
  for (const rating of [undefined, null, 0, -1, 6, 1.5, '5', NaN]) assert.ok(validateReview({ ...valid, rating }));
  for (const rating of [1, 2, 3, 4, 5]) assert.equal(validateReview({ ...valid, rating }), null);
});
test('review requires trimmed name/comment and enforces lengths', () => {
  for (const name of ['', '   ', null, 'x'.repeat(81)]) assert.ok(validateReview({ ...valid, name }));
  for (const comment of ['', '\n\t', undefined, 'x'.repeat(1001)]) assert.ok(validateReview({ ...valid, comment }));
  assert.equal(validateReview({ name: 'x'.repeat(80), rating: 1, comment: 'x'.repeat(1000) }), null);
});
