/**
 * Alternative Entry Point for FlowCraft Frontend Application
 * 
 * This file provides an alternative way to bootstrap the React application.
 * It uses a more explicit approach with separate container and root creation.
 * 
 * Note: This appears to be a duplicate of main.tsx with slightly different syntax.
 * Consider consolidating to use only one entry point.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Get the root DOM element where the React app will be mounted
const container = document.getElementById('root')!;
// Create a React root instance for concurrent features
const root = createRoot(container);

// Render the main App component wrapped in StrictMode
// StrictMode helps identify potential problems during development
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
