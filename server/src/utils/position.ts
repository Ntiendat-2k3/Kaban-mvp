export const POSITION_STEP = 65535;
export const MIN_POSITION_GAP = 0.001;

/** Tính vị trí chèn; báo cần đánh số lại khi không còn khoảng trống an toàn. */
export function computePosition(prev?: number, next?: number): { position: number; needsRebalance: boolean } {
  if (prev === undefined && next === undefined) return { position: POSITION_STEP, needsRebalance: false };
  if (prev === undefined) return { position: next! / 2, needsRebalance: next! <= MIN_POSITION_GAP };
  if (next === undefined) return { position: prev + POSITION_STEP, needsRebalance: false };
  return { position: (prev + next) / 2, needsRebalance: next - prev < MIN_POSITION_GAP };
}
