import { generateToken } from '../middleware/auth';

describe('Auth Middleware', () => {
  it('should generate a valid JWT token', () => {
    const userId = 'test-user-id';
    const email = 'test@example.com';
    
    const token = generateToken(userId, email);
    
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
  });
});
