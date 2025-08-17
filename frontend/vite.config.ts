/**
 * Vite Configuration for FlowCraft Frontend
 * 
 * This file configures the Vite build tool for the React frontend application.
 * It sets up development server settings, API proxy configuration, and build options.
 * 
 * Key Features:
 * - React plugin for JSX support
 * - Development server on port 3000
 * - API proxy to backend server (port 4000)
 * - WebSocket support for real-time features
 * - CORS and caching headers configuration
 * - Environment variable support
 * 
 * Development Server:
 * - Port: 3000 (frontend)
 * - Proxy: /api -> http://localhost:4000 (backend)
 * - WebSocket: Enabled for real-time collaboration
 * - Host: true (accessible from network)
 */

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite configuration object
export default defineConfig({
  // ===== PLUGINS =====
  
  // React plugin for JSX transformation and HMR
  plugins: [react()],
  
  // ===== DEVELOPMENT SERVER =====
  
  server: {
    port: 3000,                    // Frontend development server port
    host: true,                    // Allow external network access
    
    // ===== API PROXY CONFIGURATION =====
    
    proxy: {
      // Proxy all /api requests to the backend server
      '/api': {
        target: 'http://localhost:4000',  // Backend server address
        changeOrigin: true,               // Change origin header for CORS
        ws: true,                         // Enable WebSocket proxy support
        secure: false,                    // Allow HTTP connections (development)
        
        // Custom proxy response configuration
        configure: (proxy, options) => {
          // Add CORS headers to proxied responses
          proxy.on('proxyRes', (proxyRes) => {
            proxyRes.headers['Access-Control-Allow-Origin'] = '*';
            proxyRes.headers['Cache-Control'] = 'no-cache';
          });
        },
      }
    }
  },
  
  // ===== BUILD CONFIGURATION =====
  
  // Define global constants and environment variables
  define: {
    'process.env': process.env  // Make environment variables available in client code
  }
})
