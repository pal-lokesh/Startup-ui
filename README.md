# Record Service Frontend

A React TypeScript frontend application for the Record Service Management System with JWT authentication.

## Features

- **Authentication**: Login and signup with JWT tokens
- **User Management**: Complete CRUD operations for users
- **Vendor Management**: Manage vendor information
- **Business Management**: Handle business profiles
- **Theme Management**: Manage themes and categories
- **Image Management**: Handle image uploads and management
- **Responsive Design**: Material-UI components with mobile support
- **Protected Routes**: Role-based access control
- **Real-time Updates**: Live data synchronization with backend

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Backend API running on http://localhost:8080

## Installation

1. Navigate to the frontend directory:
   ```bash
   cd RecordService-Frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

The application will open in your browser at http://localhost:3000.

## Authentication

### Login
- Use your phone number and password to sign in
- JWT tokens are automatically stored and managed

### Signup
- Create a new account with:
  - First Name
  - Last Name
  - Email (must be unique)
  - Phone Number (must be unique)
  - Password (minimum 6 characters)
  - User Type (Client or Vendor)

### User Roles
- **USER**: Basic access to the system
- **ADMIN**: Full administrative access
- **VENDOR_ADMIN**: Vendor-specific administrative access

## API Integration

The frontend communicates with the backend API through:
- **Authentication**: `/api/auth/*` endpoints
- **User Management**: `/api/users/*` endpoints
- **Vendor Management**: `/api/vendors/*` endpoints
- **Business Management**: `/api/businesses/*` endpoints
- **Theme Management**: `/api/themes/*` endpoints
- **Image Management**: `/api/images/*` endpoints

## Security Features

- JWT token-based authentication
- Automatic token refresh
- Protected routes with role-based access
- Secure password handling
- CORS configuration for cross-origin requests

## Available Scripts

- `npm start`: Start development server
- `npm build`: Build for production
- `npm test`: Run tests
- `npm eject`: Eject from Create React App

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Login.tsx       # Login form
│   ├── Signup.tsx      # Registration form
│   ├── Navigation.tsx  # Main navigation
│   └── ProtectedRoute.tsx # Route protection
├── contexts/           # React contexts
│   └── AuthContext.tsx # Authentication context
├── pages/              # Page components
│   ├── Dashboard.tsx
│   ├── UserManagement.tsx
│   ├── VendorManagement.tsx
│   ├── BusinessManagement.tsx
│   ├── ThemeManagement.tsx
│   └── ImageManagement.tsx
├── services/           # API services
│   ├── authService.ts  # Authentication API
│   ├── userService.ts  # User management API
│   ├── vendorService.ts
│   ├── businessService.ts
│   ├── themeService.ts
│   └── imageService.ts
├── types/              # TypeScript type definitions
│   └── index.ts
├── App.tsx             # Main application component
└── index.tsx           # Application entry point
```

## Environment Configuration

The application uses the following environment variables:
- `REACT_APP_API_URL`: Backend API URL (default: http://localhost:8080)

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure the backend is running and CORS is properly configured
2. **Authentication Issues**: Check if JWT tokens are being stored correctly
3. **API Connection**: Verify the backend API is running on the correct port

### Development Tips

- Use browser developer tools to monitor network requests
- Check the console for any JavaScript errors
- Verify localStorage for stored authentication tokens
- Use the H2 console (http://localhost:8080/h2-console) to inspect the database

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
