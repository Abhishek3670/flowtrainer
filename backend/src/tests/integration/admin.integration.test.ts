import request from 'supertest';
import mongoose from 'mongoose';
import server from '../../server';
import { User } from '../../models/User';
import { generateTokens } from '../../utils/jwt';

// Test database configuration
const TEST_DB_URI = process.env.TEST_MONGO_URI || 'mongodb://localhost:27017/flowtrainer-test';

describe('Admin API Integration Tests', () => {
  let adminToken: string;
  let superAdminToken: string;
  let regularUserToken: string;
  let testAdminUser: any;
  let testSuperAdminUser: any;
  let testRegularUser: any;

  // Connect to test database before all tests
  beforeAll(async () => {
    await mongoose.connect(TEST_DB_URI);
    
    // Clear test users
    await User.deleteMany({
      email: {
        $in: [
          'test-admin@example.com',
          'test-superadmin@example.com',
          'test-user@example.com'
        ]
      }
    });

    // Create test users
    testAdminUser = new User({
      email: 'test-admin@example.com',
      password: 'TestPass123!',
      role: 'admin',
      permissions: ['read_users', 'manage_users', 'read_system_metrics', 'manage_system_config', 'read_audit_logs']
    });
    await testAdminUser.save();

    testSuperAdminUser = new User({
      email: 'test-superadmin@example.com',
      password: 'SuperTestPass123!',
      role: 'super-admin',
      permissions: ['read_users', 'manage_users', 'read_system_metrics', 'manage_system_config', 'read_audit_logs', 'manage_roles', 'manage_system', 'manage_database', 'view_sensitive_data', 'impersonate_users']
    });
    await testSuperAdminUser.save();

    testRegularUser = new User({
      email: 'test-user@example.com',
      password: 'UserPass123!',
      role: 'user',
      permissions: ['read_own_profile', 'update_own_profile', 'read_own_workflows']
    });
    await testRegularUser.save();

    // Generate tokens for each user
    const adminTokens = generateTokens({
      id: testAdminUser._id.toString(),
      role: testAdminUser.role,
      permissions: testAdminUser.permissions
    });
    adminToken = adminTokens.accessToken;

    const superAdminTokens = generateTokens({
      id: testSuperAdminUser._id.toString(),
      role: testSuperAdminUser.role,
      permissions: testSuperAdminUser.permissions
    });
    superAdminToken = superAdminTokens.accessToken;

    const userTokens = generateTokens({
      id: testRegularUser._id.toString(),
      role: testRegularUser.role,
      permissions: testRegularUser.permissions
    });
    regularUserToken = userTokens.accessToken;
  });

  // Clean up test data after all tests
  afterAll(async () => {
    // Delete test users
    await User.deleteMany({
      email: {
        $in: [
          'test-admin@example.com',
          'test-superadmin@example.com',
          'test-user@example.com'
        ]
      }
    });
    
    // Close database connection
    await mongoose.connection.close();
  });

  describe('Admin Health Endpoint', () => {
    it('should return admin API health status without authentication', async () => {
      const res = await request(server)
        .get('/api/admin/health')
        .expect(200);
      
      expect(res.body.status).toBe('ok');
      expect(res.body.service).toBe('admin-api');
    });
  });

  describe('Authentication and Authorization', () => {
    it('should reject requests without authentication', async () => {
      const res = await request(server)
        .get('/api/admin/users')
        .expect(401);
      
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Authentication required');
    });

    it('should reject requests with invalid token', async () => {
      const res = await request(server)
        .get('/api/admin/users')
        .set('Authorization', 'Bearer invalid-token')
        .expect(403);
      
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Invalid or expired token');
    });

    it('should reject requests from regular users', async () => {
      const res = await request(server)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(403);
      
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Insufficient permissions');
    });
  });

  describe('User Management Endpoints', () => {
    it('should allow admin to list users', async () => {
      const res = await request(server)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should allow admin to get user by ID', async () => {
      const res = await request(server)
        .get(`/api/admin/users/${testRegularUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(testRegularUser._id.toString());
    });
  });

  describe('System Management Endpoints', () => {
    it('should allow admin to get system health', async () => {
      const res = await request(server)
        .get('/api/admin/system/health')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      expect(res.body.success).toBe(true);
    });

    it('should allow admin to get system metrics', async () => {
      const res = await request(server)
        .get('/api/admin/system/metrics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      expect(res.body.success).toBe(true);
    });
  });

  describe('Configuration Endpoints', () => {
    it('should allow admin to get system configuration', async () => {
      const res = await request(server)
        .get('/api/admin/config')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      expect(res.body.success).toBe(true);
    });
  });

  describe('Audit Log Endpoints', () => {
    it('should allow admin to get audit logs', async () => {
      const res = await request(server)
        .get('/api/admin/audit/logs')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('Super Admin Specific Endpoints', () => {
    it('should allow super admin to update user role', async () => {
      const res = await request(server)
        .put(`/api/admin/users/${testRegularUser._id}/role`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ role: 'admin' })
        .expect(200);
      
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('User role updated successfully');
    });

    it('should reject role update by regular admin', async () => {
      const res = await request(server)
        .put(`/api/admin/users/${testRegularUser._id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'admin' })
        .expect(403);
      
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Insufficient permissions');
    });
  });
});