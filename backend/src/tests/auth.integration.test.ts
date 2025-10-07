import request from 'supertest';
import { app } from '../app';
import { User } from '../models/User';
import mongoose from 'mongoose';

describe('Authentication API', () => {
  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/flowtrainer_test');
  });

  afterAll(async () => {
    // Clean up and close database connection
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.firstName).toBe(userData.firstName);
      expect(response.body.user.lastName).toBe(userData.lastName);
      expect(response.body.user.role).toBe('user');
      expect(response.body).toHaveProperty('accessToken');
    });

    it('should not allow duplicate email registration', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      };

      // Register user first time
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Try to register the same email again
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.error.code).toBe('user_exists');
    });
  });

  describe('POST /api/auth/login', () => {
    const userData = {
      email: 'login@test.com',
      password: 'password123',
      firstName: 'Login',
      lastName: 'User',
    };

    beforeAll(async () => {
      // Register a user for login tests
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);
    });

    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password,
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user).toHaveProperty('lastLogin');
    });

    it('should reject login with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body.error.code).toBe('invalid_credentials');
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    const userData = {
      email: 'forgot@test.com',
      password: 'password123',
      firstName: 'Forgot',
      lastName: 'User',
    };

    beforeAll(async () => {
      // Register a user for forgot password tests
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);
    });

    it('should send password reset email for existing user', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: userData.email,
        })
        .expect(200);

      expect(response.body.message).toContain('password reset link has been sent');
    });

    it('should return success even for non-existing email (security)', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'nonexistent@test.com',
        })
        .expect(200);

      expect(response.body.message).toContain('password reset link has been sent');
    });
  });

  describe('POST /api/auth/reset-password', () => {
    const userData = {
      email: 'reset@test.com',
      password: 'password123',
      firstName: 'Reset',
      lastName: 'User',
    };

    let resetToken: string;

    beforeAll(async () => {
      // Register a user
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Trigger forgot password to get a reset token
      await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: userData.email,
        })
        .expect(200);

      // Get the user with reset token from database
      const user = await User.findOne({ email: userData.email });
      resetToken = user!.resetPasswordToken!;
    });

    it('should reset password with valid token', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          newPassword: 'newpassword123',
        })
        .expect(200);

      expect(response.body.message).toBe('Password has been reset successfully');
    });

    it('should reject reset with invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'invalid-token',
          newPassword: 'newpassword123',
        })
        .expect(400);

      expect(response.body.error.code).toBe('invalid_token');
    });
  });

  describe('GET /api/auth/me', () => {
    const userData = {
      email: 'me@test.com',
      password: 'password123',
      firstName: 'Me',
      lastName: 'User',
    };

    let accessToken: string;

    beforeAll(async () => {
      // Register and login to get access token
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      accessToken = registerResponse.body.accessToken;
    });

    it('should return user data for authenticated user', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.email).toBe(userData.email);
      expect(response.body.firstName).toBe(userData.firstName);
      expect(response.body.lastName).toBe(userData.lastName);
    });

    it('should reject request without valid token', async () => {
      await request(app)
        .get('/api/auth/me')
        .expect(401);
    });
  });
});