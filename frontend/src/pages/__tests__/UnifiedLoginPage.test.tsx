import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import UnifiedLoginPage from '../UnifiedLoginPage';
import { UnifiedAuthProvider } from '../../contexts/UnifiedAuthContext';

// Mock the useUnifiedAuth hook
jest.mock('../../contexts/UnifiedAuthContext', () => ({
  ...jest.requireActual('../../contexts/UnifiedAuthContext'),
  useUnifiedAuth: () => ({
    login: jest.fn(),
    isAuthenticated: false,
    isLoading: false,
  }),
}));

describe('UnifiedLoginPage', () => {
  const renderWithRouter = (component: React.ReactNode) => {
    return render(
      <BrowserRouter>
        <UnifiedAuthProvider>
          {component}
        </UnifiedAuthProvider>
      </BrowserRouter>
    );
  };

  it('renders login form correctly', () => {
    renderWithRouter(<UnifiedLoginPage />);
    
    expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByText('create a new account')).toBeInTheDocument();
    expect(screen.getByText('Forgot your password?')).toBeInTheDocument();
  });

  it('allows user to toggle password visibility', () => {
    renderWithRouter(<UnifiedLoginPage />);
    
    const passwordInput = screen.getByLabelText('Password');
    const toggleButton = screen.getByRole('button', { name: 'toggle password visibility' });
    
    expect(passwordInput).toHaveAttribute('type', 'password');
    
    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');
    
    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('shows error message on failed login', async () => {
    // Mock the login function to throw an error
    const mockLogin = jest.fn().mockRejectedValue(new Error('Invalid credentials'));
    
    jest.spyOn(require('../../contexts/UnifiedAuthContext'), 'useUnifiedAuth').mockReturnValue({
      login: mockLogin,
      isAuthenticated: false,
      isLoading: false,
    });
    
    renderWithRouter(<UnifiedLoginPage />);
    
    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'test@example.com' },
    });
    
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'wrongpassword' },
    });
    
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    
    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
    });
  });
});