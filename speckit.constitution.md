# Constitution for Competitive Gaming Analytics Platform

## Code Quality & Architecture Principles

### TypeScript Usage
- Maintain strict TypeScript typing throughout the application with no 'any' types except when absolutely necessary

### Next.js 14+ App Router Best Practices
- Follow Next.js 14+ App Router best practices with server and client components properly separated

### Error Handling and Loading States
- Implement proper error boundaries and loading states for all async operations

### Component Design
- Use composition over inheritance for component design
- Keep components focused and single-responsibility

### File Structure
- Maintain consistent file structure: features/[feature]/components, features/[feature]/hooks, features/[feature]/utils