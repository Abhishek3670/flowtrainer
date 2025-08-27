/**
 * Main Entry Point for FlowCraft Frontend Application
 * 
 * This file serves as the primary entry point for the React application.
 * It initializes the React DOM and renders the main App component.
 * 
 * Key Responsibilities:
 * - Bootstrap React application
 * - Mount the root component to the DOM
 * - Enable React Strict Mode for development debugging
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { Provider } from 'react-redux'
import { store } from './store'

// Create the root React element and mount the application
// The '!' operator asserts that the element exists (non-null assertion)
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>,
)
