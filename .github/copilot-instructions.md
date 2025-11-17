# GitHub Copilot Instructions for Phantom

This document provides guidance to GitHub Copilot for working with the Phantom blogging platform codebase.

## Project Overview

Phantom is a minimalist FOSS blogging platform for markdown lovers, built with:
- **Frontend**: Nuxt.js 4 + Vue 3
- **Backend**: Nuxt API routes with Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: bcrypt + optional TOTP (speakeasy)
- **Markdown Rendering**: marked.js

## Architecture

### Directory Structure
- `app/` - Frontend application code
  - `pages/` - Nuxt pages (index, articles, editor)
  - `assets/css/` - Global styles
  - `app.vue` - Root component
- `server/` - Backend API and utilities
  - `api/` - API endpoints
    - `auth/` - Authentication endpoints
    - `articles/` - Article CRUD endpoints
  - `utils/` - Server utilities (auth, prisma)
- `prisma/` - Database schema and seed scripts
- `public/` - Static assets

### Key Technologies
- **Nuxt.js 4** with Vue 3 for frontend
- **Prisma ORM** for database access
- **H3 v2** for HTTP server (with important compatibility notes - see below)
- **TypeScript** for type safety
- **bcrypt** for password hashing
- **speakeasy** for TOTP 2FA

## Important: H3 v2 Compatibility

⚠️ **CRITICAL**: This project uses **Node.js native APIs** instead of h3 helper functions due to h3 v2 compatibility issues in Nuxt 4. See `TROUBLESHOOTING_H3.md` for full details.

### DO NOT Use These h3 Functions:
- ❌ `getCookie()`, `setCookie()`, `deleteCookie()`
- ❌ `readBody()`, `readFormData()`
- ❌ `getQuery()`
- ❌ `getRequestHeader()`, `setResponseHeader()`
- ❌ `useSession()`

### DO Use These Patterns Instead:
- ✅ Access headers: `event.node.req.headers['cookie']`
- ✅ Set headers: `event.node.res.setHeader('Set-Cookie', ...)`
- ✅ Read body: Use `readRequestBody(event)` from `server/utils/auth.ts`
- ✅ Parse cookies: Manual parsing from header string
- ✅ Parse query: Manual URL parsing with `new URL(event.node.req.url, 'http://localhost')`

**Example Pattern:**
```typescript
// ✅ CORRECT - Use custom utility
import { readRequestBody } from '../../utils/auth'
const body = await readRequestBody(event)

// ❌ WRONG - Don't use h3 helpers
import { readBody } from 'h3'
const body = await readBody(event)  // This will fail!
```

## Database Schema

### Models
1. **User** - Authentication credentials, TOTP setup, article authorship
   - Fields: id (UUID), username (unique), passwordHash, totpSecret, totpEnabled
2. **Article** - Blog posts with markdown content
   - Fields: id (UUID), title, content, customUrl, published, authorId
   - Relations: author (User), tags (many-to-many), history (ArticleHistory[])
3. **Tag** - Article categorization
   - Fields: id (UUID), name (unique)
   - Relations: articles (many-to-many)
4. **ArticleHistory** - Edit tracking
   - Fields: id (UUID), articleId, title, content, editedAt
   - Relations: article (Article)

### Prisma Client Access
Always import from: `import prisma from '../../utils/prisma'`

## Authentication System

### Session Management
- Cookie-based sessions: `phantom_session`
- In-memory session storage (Map-based)
- 7-day session expiration
- **Note**: For production, should migrate to Redis or database-backed sessions

### Key Functions (in `server/utils/auth.ts`)
- `hashPassword(password)` - bcrypt hashing
- `verifyPassword(password, hash)` - bcrypt verification
- `getUserFromSession(event)` - Get current user from cookie
- `setUserSession(event, userId)` - Create session cookie
- `clearUserSession(event)` - Delete session
- `readRequestBody(event)` - Read JSON from request body
- `generateTOTPSecret()` - Create TOTP secret
- `verifyTOTPToken(token, secret)` - Verify TOTP code

### Protected Routes Pattern
```typescript
const user = await getUserFromSession(event)
if (!user) {
  throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
}
```

## Code Style & Conventions

### TypeScript
- Use TypeScript for all server code
- Import types from packages: `import { H3Event } from 'h3'`
- Define return types for functions when not obvious

### API Endpoints
- File naming: `[param].method.ts` (e.g., `[id].get.ts`, `create.post.ts`)
- Use `defineEventHandler()` for all endpoints
- Validate required fields and return appropriate errors
- Use `createError()` for error responses with statusCode and statusMessage

### Error Handling
```typescript
throw createError({
  statusCode: 400,
  statusMessage: 'Descriptive error message'
})
```

### Database Queries
- Use Prisma client methods: `findUnique`, `findMany`, `create`, `update`, `delete`
- Include relations when needed: `include: { tags: true, author: true }`
- Use `where` clauses for filtering
- Implement pagination for list endpoints

### Vue/Nuxt Frontend
- Use Vue 3 Composition API with `<script setup>`
- Use Nuxt's built-in composables: `useFetch`, `useRuntimeConfig`, `navigateTo`
- Scoped styles with `<style scoped>`

## Testing Approach

Currently, there is no automated test infrastructure. Manual testing is done via:
- `npm run dev` - Development server on http://localhost:3000
- Browser testing of UI and API endpoints
- Prisma Studio for database inspection: `npm run db:studio`

## Development Workflow

### Setup Commands
```bash
npm install                    # Install dependencies
npx prisma migrate dev        # Run migrations
npm run db:seed               # Seed database
npm run dev                   # Start dev server
```

### Database Commands
```bash
npm run db:migrate            # Create new migration
npm run db:seed               # Run seed script
npm run db:studio             # Open Prisma Studio GUI
```

### Build Commands
```bash
npm run build                 # Production build
npm run preview               # Preview production build
```

## Common Patterns

### Creating an Article
1. Validate user authentication
2. Check required fields (title, content)
3. Create/connect tags
4. Save article with Prisma
5. Return created article with relations

### Fetching Articles
- Support both ID and customUrl for lookups
- Filter by published status (unless authenticated owner)
- Include tags and author in response
- Implement search on title/content

### URL Routing
- Home: `/` - Featured articles
- Articles list: `/articles`
- Article detail: `/articles/[id-or-custom-url]`
- Editor: `/editor` (protected)
- Login: `/editor` with login form

## Security Considerations

1. **Password Security**: Always use bcrypt with 10+ salt rounds
2. **Session Security**: HTTP-only cookies, secure flag in production
3. **TOTP**: 2-window tolerance for clock drift
4. **Authorization**: Verify article ownership before update/delete
5. **Input Validation**: Validate all required fields
6. **SQL Injection**: Prisma handles parameterization automatically

## Key Files to Reference

- `TROUBLESHOOTING_H3.md` - H3 v2 compatibility guide (read this first!)
- `IMPLEMENTATION.md` - Detailed architecture documentation
- `QUICKSTART.md` - Quick setup guide
- `server/utils/auth.ts` - Authentication utilities and patterns
- `prisma/schema.prisma` - Database schema
- `nuxt.config.ts` - Nuxt configuration

## When Adding New Features

1. **New API Endpoint**: Follow existing patterns in `server/api/`
   - Use `readRequestBody()` for POST/PUT bodies
   - Don't use h3 helper functions
   - Validate inputs and return proper errors
   - Document in IMPLEMENTATION.md

2. **New Frontend Page**: Add to `app/pages/`
   - Use Composition API with `<script setup>`
   - Use `useFetch` for API calls
   - Handle loading and error states

3. **Database Changes**: 
   - Update `prisma/schema.prisma`
   - Run `npx prisma migrate dev --name description`
   - Update seed script if needed

4. **Authentication Changes**:
   - Modify `server/utils/auth.ts`
   - Test thoroughly with browser/curl
   - Remember: No h3 helper functions!

## Debugging Tips

- Check browser console for frontend errors
- Check terminal output for backend errors
- Use Prisma Studio to inspect database: `npm run db:studio`
- Test API endpoints with curl or browser DevTools
- If you see "event.req.headers.get is not a function" → you're using h3 helpers (don't!)

## Environment Variables

Required in `.env`:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT signing (currently unused but reserved)
- `SESSION_SECRET` - Secret for session encryption (currently unused but reserved)

## Future Enhancements

Consider these patterns when implementing new features:
- RSS feed generation
- Comment system
- Dark mode theme
- Multi-language support
