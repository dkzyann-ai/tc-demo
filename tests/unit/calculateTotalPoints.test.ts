import { describe, expect, it } from 'vitest';
import { calculateTotalPoints } from '../../src/features/test-builder/calculateTotalPoints';

describe('calculateTotalPoints', () => {
  it('テスト内の問題の配点を合計する', () => {
    expect(calculateTotalPoints([
      { problemId: 'problem-1', points: 5, order: 1 },
      { problemId: 'problem-2', points: 8, order: 2 },
    ])).toBe(13);
  });

  it('問題がないテストは0点になる', () => {
    expect(calculateTotalPoints([])).toBe(0);
  });
});
