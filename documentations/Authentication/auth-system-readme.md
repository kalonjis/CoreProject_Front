# CoreProject Authentication System

## Overview

The CoreProject implements a comprehensive authentication system that features:

- JWT-based authentication with short-lived access tokens and longer-lived refresh tokens
- HTTP-only cookies for secure token storage
- Device tracking and device trust levels
- Role-based access control
- Email verification and account confirmation
- Automatic token refresh via HTTP interceptor

## Key Components

### Frontend (Angular)

- **OldAuthService**: Central service for managing authentication state
- **AuthInterceptor**: HTTP interceptor for handling tokens and automatic refresh
- **Public Routes Configuration**: Defines which routes are accessible without authentication

### Backend (Spring Boot)

- **JwtFilter**: Extracts and validates JWT tokens from cookies
- **OldAuthService**: Handles authentication logic
- **Token Services**: Manages different types of tokens
- **Device Service**: Tracks and manages user devices

## How It Works

### Authentication Flow

1. User logs in with credentials
2. Backend validates credentials and identifies the device
3. If valid, access and refresh tokens are stored as HTTP-only cookies
4. OldAuthService updates the authentication state
5. User is redirected to the requested page

### Token Refresh Flow

1. When an API call returns a 401/403 error
2. AuthInterceptor catches the error
3. Interceptor makes a refresh token request
4. If successful, the original request is retried
5. If unsuccessful, user is redirected to login

### Device Tracking

1. On login, the system identifies the device
2. New devices start with UNTRUSTED level
3. User can confirm devices via email links
4. Sensitive operations require higher trust levels

## Configuration

### Public Routes

To add a new public route that doesn't require authentication:

1. Open `src/app/core/auth/config/public-routes.config.ts`
2. Add the route to `PUBLIC_FRONTEND_ROUTES` array
3. For API endpoints, add to `PUBLIC_API_ROUTES` array

```typescript
export const PUBLIC_FRONTEND_ROUTES = [
  '/auth/login',
  '/auth/signup',
  '/auth/test',
  // Add your new route here
  '/your/public/route'
];
```

### Authentication Guards

For protected routes requiring specific trust levels:

```typescript
{
  path: 'sensitive-area',
  canActivate: [sessionGuard('TRUSTED')], // Requires TRUSTED device
  loadComponent: () => import('...').then(m => m.Component)
}
```

## Troubleshooting

### Common Issues

1. **Unexpected redirects to login page**:
   - Check if the route is correctly added to `PUBLIC_FRONTEND_ROUTES`
   - Verify the interceptor is properly checking current routes

2. **Token refresh not working**:
   - Check browser console for errors
   - Verify cookies are being set correctly (view in Application tab)
   - Check if backend is recognizing the refresh token

3. **Device confirmation issues**:
   - Check email delivery 
   - Verify token validity and expiration
   - Check for proper error handling in confirmation components

## Development Guidelines

### Adding New Protected Routes

1. Create your component
2. Add route with appropriate guard in route configuration
3. Test both authenticated and unauthenticated access

### Adding Public Routes

1. Create your component
2. Add route to router configuration
3. Add route path to `PUBLIC_FRONTEND_ROUTES` in public-routes.config.ts
4. Test to ensure no redirects happen for unauthenticated users

### Modifying Auth Interceptor

The auth interceptor is a critical piece of the security infrastructure. When making changes:

1. Carefully test with both public and protected routes
2. Verify token refresh behavior
3. Check error handling for various scenarios
4. Test with and without existing sessions

## Security Best Practices

1. Never store sensitive data in localStorage or sessionStorage
2. Use HTTP-only cookies for token storage
3. Keep access tokens short-lived
4. Implement proper CSRF protection
5. Always validate tokens on the server side

## References

- [Angular HTTP Interceptors](https://angular.io/guide/http#intercepting-requests-and-responses)
- [Spring Security Documentation](https://docs.spring.io/spring-security/reference/index.html)
- [JWT.io](https://jwt.io/)
