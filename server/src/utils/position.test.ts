import { describe, expect, it } from 'vitest';
import { computePosition } from './position.js';

describe('computePosition', () => {
  it('đặt thẻ đầu tiên', () => expect(computePosition()).toEqual({ position: 65535, needsRebalance: false }));
  it('chèn đầu cột', () => expect(computePosition(undefined, 1000)).toEqual({ position: 500, needsRebalance: false }));
  it('chèn cuối cột', () => expect(computePosition(1000)).toEqual({ position: 66535, needsRebalance: false }));
  it('chèn giữa hai thẻ', () => expect(computePosition(1000, 2000)).toEqual({ position: 1500, needsRebalance: false }));
  it('yêu cầu đánh số lại khi hết khoảng', () => expect(computePosition(1, 1.0005).needsRebalance).toBe(true));
});
