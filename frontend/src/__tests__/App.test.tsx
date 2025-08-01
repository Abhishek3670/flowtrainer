import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { store } from '../store';
import App from '../App';

// Mock socketService to avoid connection issues in tests
jest.mock('../services/socketService', () => ({
  socketService: {
    connect: jest.fn(),
    disconnect: jest.fn(),
  },
}));

const AppWrapper = ({ children }: { children: React.ReactNode }) => (
  <Provider store={store}>
    <BrowserRouter>
      {children}
    </BrowserRouter>
  </Provider>
);

test('renders FlowCraft application', () => {
  render(
    <AppWrapper>
      <App />
    </AppWrapper>
  );
  
  expect(screen.getByText('FlowCraft')).toBeInTheDocument();
  expect(screen.getByText('Welcome to FlowCraft')).toBeInTheDocument();
});
