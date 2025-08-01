# FlowCraft - Visual Workflow Designer

A full-stack drag-and-drop workflow designer with real-time collaboration features.

## Architecture Overview

```
Frontend (React + TS)  <-->  Backend (Node.js + TS)  <-->  Database (MongoDB)
- React Flow                 - Express.js                   - User Auth  
- Redux Toolkit             - Socket.IO                    - Workflows
- Tailwind CSS              - JWT Auth                     - Revisions
- Socket.IO Client          - Mongoose
```

## Features

### Frontend
- React 18 + TypeScript for type-safe development
- React Flow for interactive node-based workflow editor
- Redux Toolkit for state management
- Tailwind CSS for responsive styling
- Socket.IO Client for real-time collaboration
- Custom Node Types: Start, HTTP Call, Delay, Condition, Loop
- Keyboard Shortcuts: Ctrl+Z/Ctrl+Y (undo/redo), Delete (remove node)
- Dark/Light Mode toggle

### Backend
- Node.js 20 + TypeScript
- Express.js REST API framework
- MongoDB + Mongoose for data persistence
- JWT Authentication
- Socket.IO for real-time collaborative editing
- API Routes: Auth, Workflows, Revision History

## Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- Git

### 1. Start Development Environment
```bash
# Clone and navigate to project
git clone https://github.com/Abhishek3670/flowtrainer.git
cd flowtrainer

# Start all services (MongoDB, Backend, Frontend)
docker-compose up --build
```

### 2. Access Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- MongoDB: localhost:27017

## Development Setup

### Using Docker (Recommended)
```bash
# Start all services
docker-compose up --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Manual Setup
```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (in another terminal)
cd frontend
npm install
npm start
```

## Testing

### Unit Tests
```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

### E2E Tests
```bash
# Start services first
docker-compose up -d

# Run Cypress tests
cd frontend && npm run test:e2e
```

## API Endpoints

### Authentication
- POST /api/auth/signup - Register new user
- POST /api/auth/login - User login

### Workflows
- GET /api/workflows - Get user workflows
- GET /api/workflows/:id - Get specific workflow
- POST /api/workflows - Create new workflow
- PUT /api/workflows/:id - Update workflow
- DELETE /api/workflows/:id - Delete workflow
- GET /api/workflows/:id/history - Get revision history

## Deployment

### Frontend (Netlify)
```bash
cd frontend
npm run build
# Deploy build/ folder to Netlify
```

### Backend (Heroku/AWS ECS)
Set environment variables:
- MONGODB_URI
- JWT_SECRET
- CORS_ORIGIN

## Environment Variables

### Backend (.env)
```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://admin:password@mongodb:27017/flowcraft?authSource=admin
JWT_SECRET=your-super-secret-jwt-key
CORS_ORIGIN=http://localhost:3000
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000
REACT_APP_WS_URL=http://localhost:5000
```

## License

MIT License - Built with love by the FlowCraft Team
