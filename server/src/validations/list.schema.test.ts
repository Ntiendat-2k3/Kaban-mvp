import { describe, expect, it } from 'vitest';
import { updateListSchema } from './list.schema.js';

describe('màu cột', () => {
  it('chấp nhận màu trong bảng màu nền hiện có', () => {
    expect(updateListSchema.safeParse({ body: { color: 'purple' } }).success).toBe(true);
    expect(updateListSchema.safeParse({ body: { color: null } }).success).toBe(true);
  });

  it('từ chối màu lạ và bản cập nhật rỗng', () => {
    expect(updateListSchema.safeParse({ body: { color: 'black' } }).success).toBe(false);
    expect(updateListSchema.safeParse({ body: {} }).success).toBe(false);
  });
});
