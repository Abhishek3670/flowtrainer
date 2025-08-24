# FlowCraft - Collaborative ML Workflow Editor
[![CI/CD Pipeline](https://github.com/Abhishek3670/flowtrainer/actions/workflows/ci.yml/badge.svg?branch=feature%2Finfrastructure_foundation)](https://github.com/Abhishek3670/flowtrainer/actions/workflows/ci.yml)

A collaborative flow-based machine learning workflow editor inspired by Miro, with real-time collaboration features and ML model execution capabilities.

## Architecture Overview

### Recent Changes and Improvements

#### 1. Backend Architecture
- **Service Layer Enhancements**
  - Implemented robust file handling with TypeScript
  - Enhanced authentication and authorization
  - Added workflow version control
  - Improved real-time collaboration features

- **Controller Layer Improvements**
  - Implemented dependency injection
  - Enhanced error handling
  - Added proper type checking
  - Improved response formatting

- **Model Layer Improvements**
  - Enhanced schemas with proper types
  - Added version control support
  - Improved MongoDB indexing
  - Enhanced validation

#### 2. Infrastructure
- **Dependency Injection**
  - Implemented IoC container
  - Added service registration
  - Improved testability

- **Type Safety**
  - Added comprehensive TypeScript interfaces
  - Enhanced compile-time checks

- **Error Handling**
  - Implemented consistent error responses
  - Added proper logging

#### 3. API Improvements
- **Authentication**
  - Enhanced JWT handling
  - Added role-based access

- **File Operations**
  - Added streaming support
  - Improved upload handling

- **Workflow Management**
  - Added version control
  - Enhanced collaboration features

## Development Setup

### Prerequisites
- Node.js v20.x or later
- MongoDB v7.x or later
- Redis (latest version)
- TypeScript v5.x

### Installation Steps
1. Install dependencies:
```bash
npm install
```

2. Start Redis:
```bash
docker-compose -f docker-compose.redis.dev.yml up -d
```

3. Start MongoDB:
```bash
# MongoDB should be running locally on port 27017
mongod
```

4. Start the development server:
```bash
cd backend
npm run dev
```

5. In a new terminal, start the frontend:
```bash
cd frontend
npm run dev
```

### Environment Configuration
Create a `.env` file in the backend directory with:
```env
PORT=4000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/flowcraft
MONGODB_DB_NAME=flowcraft
JWT_SECRET=your_secure_secret_here
JWT_EXPIRES_IN=24h
CORS_ORIGIN=http://localhost:3000
```

## API Documentation

### Authentication Endpoints
- POST `/api/auth/signup` - Register new user
- POST `/api/auth/login` - Login user
- GET `/api/auth/profile` - Get user profile
- PUT `/api/auth/profile` - Update user profile

### File Management
- GET `/api/files` - List files
- POST `/api/files/upload` - Upload file
- GET `/api/files/:id` - Get file details
- GET `/api/files/:id/stream` - Stream file
- DELETE `/api/files/:id` - Delete file

### Workflow Management
- GET `/api/workflows` - List workflows
- POST `/api/workflows` - Create workflow
- GET `/api/workflows/:id` - Get workflow details
- PUT `/api/workflows/:id` - Update workflow
- DELETE `/api/workflows/:id` - Delete workflow
- POST `/api/workflows/:id/execute` - Execute workflow

## Testing
```bash
npm test                  # Run all tests
npm run test:stress      # Run stress tests
npm run test:connection  # Run connection tests
npm run test:cache       # Run cache tests
```

## Project Structure
```
FlowTrainer-v2/
├── backend/                   # Backend service
│   ├── src/
│   │   ├── app.ts            # Express app setup
│   │   ├── server.ts         # Server entry point
│   │   ├── cache/           # Redis cache implementation
│   │   ├── container.ts     # Dependency injection setup
│   │   ├── controllers/     # Request handlers
│   │   ├── database/        # Database configuration
│   │   ├── interfaces/      # TypeScript interfaces
│   │   ├── middleware/      # Express middleware
│   │   ├── models/         # MongoDB models
│   │   ├── routes/         # API route definitions
│   │   ├── services/       # Business logic layer
│   │   ├── tests/         # Unit and integration tests
│   │   ├── types/         # TypeScript type definitions
│   │   └── utils/         # Utility functions
│   ├── data/              # Data storage
│   ├── results/           # Execution results
│   ├── uploads/           # File uploads
│   └── workflows/         # Workflow definitions
│
├── frontend/                 # Frontend application
│   ├── src/
│   │   ├── App.tsx         # Root component
│   │   ├── main.tsx        # Entry point
│   │   ├── components/     # Reusable components
│   │   ├── constants/      # Configuration constants
│   │   ├── contexts/       # React contexts
│   │   ├── hooks/         # Custom React hooks
│   │   ├── services/      # API service integration
│   │   └── types/         # TypeScript types
│   ├── public/            # Static assets
│   └── __tests__/         # Frontend tests
│
├── docker/                  # Docker configurations
│   ├── Dockerfile.ml       # ML engine Dockerfile
│   └── ml-engine/         # ML engine code
│
├── scripts/                # Utility scripts
│   ├── build-ml-container.sh
│   ├── deploy.sh
│   └── seed-data.ts
│
├── test_scripts/           # Test utilities
├── data/                   # Application data
├── db/                     # Database files
└── workflows/              # Workflow templates

Key Configuration Files:
├── docker-compose.yml      # Main Docker composition
├── docker-compose.dev.yml  # Development Docker setup
├── requirements.txt        # Python dependencies
└── package.json           # Node.js dependencies
```
