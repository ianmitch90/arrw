# ARRW Application TODO List

## Unimplemented Features

### Authentication & Security

- [ ] Implement proper VPN detection and blocking
- [ ] Research reliable VPN detection methods
- [ ] Implement IP reputation checking
- [ ] Add configurable security policies
- [ ] Add Google Location Services as fallback
- [ ] Implement Google Geolocation API integration
- [ ] Add proper error handling for failed geolocation
- [ ] Create fallback chain: Browser -> Google -> IP -> Default
- [ ] Fix login flow issues
- [ ] Handle session persistence properly
- [ ]Implement proper error messages for auth failures
- [ ]Add rate limiting for login attempts

### Map Features

- [ ] Implement camera capture UI in StoryCreator
- [ ] Complete approval/rejection logic in ProposalMap
- [ ] Add navigation to search results
- [ ] Implement proper location accuracy indicators

### Performance & Infrastructure

- [ ] Add proper subscription quantity checking
- [ ] Implement caching for frequently accessed data
- [ ] Add offline support for critical features

## Current Codebase Errors

### TypeScript Errors

- [ ] Fix type assertions in supabase/admin.ts
- [ ] Resolve GeolocateControl ref type mismatches
- [ ] Address missing type definitions in map components

### Runtime Errors

- [ ] Handle undefined coordinates in LiveUsersLayer
- [ ] Fix race conditions in location updates
- [ ] Address memory leaks in subscription cleanup

### Security Issues

- [ ] Fix potential XSS vulnerabilities in user content display
- [ ] Address CORS configuration issues
- [ ] Implement proper input sanitization

## Logical Inconsistencies

### User Experience

- [ ] Standardize error message display across components
- [ ] Implement consistent loading states
- [ ] Add proper feedback for async operations

### Data Management

- [ ] Implement proper data synchronization between tabs
- [ ] Add versioning for user preferences
- [ ] Create consistent state management pattern

### Location Services

- [ ] Standardize location format across components
- [ ] Implement proper location permission handling
- [ ] Add location update throttling

### Security Model

- [ ] Create consistent security policy enforcement
- [ ] Implement proper role-based access control
- [ ] Add audit logging for sensitive operations

### Feature Integration

- [ ] Standardize map marker behavior
- [ ] Implement consistent real-time update strategy
- [ ] Create unified notification system
