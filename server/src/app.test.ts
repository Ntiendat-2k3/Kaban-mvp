import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from './app.js';

describe('bảo vệ API xác thực', () => {
  it('trả header bảo mật và giới hạn lượt đăng nhập', async () => {
    const first = await request(app).post('/api/auth/login').send({});
    expect(first.headers['x-content-type-options']).toBe('nosniff');
    for (let attempt = 1; attempt < 20; attempt++) {
      await request(app).post('/api/auth/login').send({});
    }
    const limited = await request(app).post('/api/auth/login').send({});
    expect(limited.status).toBe(429);
    expect(limited.body.error.code).toBe('TOO_MANY_REQUESTS');
  });
});
