# FlowTrainer Admin Dashboard

This is the admin dashboard for the FlowTrainer application, built with React, TypeScript, and Material-UI.

## Features

- **User Management**: View, create, edit, and delete users
- **System Configuration**: Manage application settings and configurations
- **Database Management**: Monitor database health and perform maintenance
- **Model Management**: Configure and manage ML models
- **Activity Logs**: View system activity and audit logs
- **Responsive Design**: Works on desktop and mobile devices
- **Theme Support**: Light and dark mode with system preference detection
- **Role-Based Access Control**: Granular permissions for different user roles

## Getting Started

### Prerequisites

- Node.js 16.x or later
- npm or yarn
- Access to the FlowTrainer backend API

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   cd frontend
   npm install
   # or
   yarn install
   ```
3. Create a `.env` file in the frontend directory with the following variables:
   ```
   REACT_APP_API_URL=http://localhost:5000/api
   REACT_APP_ENV=development
   ```

### Running the Application

```bash
# Start the development server
npm start
# or
yarn start
```

The application will be available at `http://localhost:3000` by default.

## Project Structure

```
src/admin/
├── components/       # Reusable UI components
│   ├── common/      # Common components used across the app
│   ├── layout/      # Layout components (header, sidebar, etc.)
│   ├── users/       # User management components
│   ├── system/      # System configuration components
│   ├── metrics/     # Metrics and monitoring components
│   └── settings/    # Settings components
├── context/         # React context providers
├── hooks/           # Custom React hooks
├── pages/           # Page components
├── services/        # API services
├── stores/          # State management (Zustand)
├── theme/           # Theme configuration
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
├── App.tsx          # Main App component
└── index.tsx        # Entry point
```

## Available Scripts

- `npm start`: Start the development server
- `npm test`: Run tests
- `npm run build`: Build the application for production
- `npm run lint`: Run ESLint
- `npm run format`: Format code with Prettier

## Styling

This project uses:

- Material-UI for UI components
- Emotion for CSS-in-JS
- Custom theme with light/dark mode support
- Responsive design with Material-UI's grid system

## State Management

- **Zustand**: For global state management
- **React Query**: For server state management and data fetching
- **Context API**: For theme and authentication state

## API Integration

The admin dashboard communicates with the backend REST API. All API calls are defined in `src/admin/services/`.

## Authentication

The admin dashboard uses JWT for authentication. The authentication flow is handled by the `AuthProvider` context.

## Environment Variables

- `REACT_APP_API_URL`: Base URL for the backend API
- `REACT_APP_ENV`: Current environment (development, staging, production)

## Deployment

### Building for Production

```bash
npm run build
```

This will create a `build` directory with the production build of the admin dashboard.

### Docker

A `Dockerfile` is provided for containerized deployment:

```bash
docker build -t flowtrainer-admin .
docker run -p 3000:80 flowtrainer-admin
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
