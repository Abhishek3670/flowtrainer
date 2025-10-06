import request from 'supertest';
import server from '../server';

describe('Admin API', () => {
  describe('GET /api/admin/health', () => {
    it('should return admin API health status', async () => {
      const res = await request(server)
        .get('/api/admin/health')
        .expect(200);
      
      expect(res.body.status).toBe('ok');
      expect(res.body.service).toBe('admin-api');
    });
  });

  describe('Authentication Required Endpoints', () => {
    it('should reject requests to /api/admin/users without authentication', async () => {
      const res = await request(server)
        .get('/api/admin/users')
        .expect(401);
      
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Authentication required');
    });

    it('should reject requests to /api/admin/system/health without authentication', async () => {
      const res = await request(server)
        .get('/api/admin/system/health')
        .expect(401);
      
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Authentication required');
    });

    it('should reject requests to /api/admin/config without authentication', async () => {
      const res = await request(server)
        .get('/api/admin/config')
        .expect(401);
      
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Authentication required');
    });

    it('should reject requests to /api/admin/audit/logs without authentication', async () => {
      const res = await request(server)
        .get('/api/admin/audit/logs')
        .expect(401);
      
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Authentication required');
    });
  });

  describe('Invalid Token Handling', () => {
    it('should reject requests with invalid token', async () => {
      const res = await request(server)
        .get('/api/admin/users')
        .set('Authorization', 'Bearer invalid-token')
        .expect(403);
      
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Invalid or expired token');
    });
  });

  describe('Missing Authorization Header', () => {
    it('should reject requests with missing Authorization header', async () => {
      const res = await request(server)
        .get('/api/admin/users')
        .set('Authorization', '')
        .expect(401);
      
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Authentication required');
    });

    it('should reject requests with malformed Authorization header', async () => {
      const res = await request(server)
        .get('/api/admin/users')
        .set('Authorization', 'InvalidFormat')
        .expect(401);
      
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Authentication required');
    });
  });
});