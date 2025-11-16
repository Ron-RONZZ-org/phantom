# Phantom - Implementation Guide

> ⚠️ **Important**: This project uses Node.js native APIs to bypass h3 v2 compatibility issues in Nuxt 4. See [TROUBLESHOOTING_H3.md](./TROUBLESHOOTING_H3.md) for details on why we avoid h3 helper functions.

## Overview

Phantom is a minimalist FOSS blogging platform built with Nuxt.js and Prisma, designed for markdown lovers. This document explains the implementation details and how to use the platform.

## Architecture

### Frontend (Nuxt.js 4)

The frontend is built with Nuxt.js 4 and Vue 3, providing a modern, reactive user interface.

**Key Pages:**
- `/` - Home page with article search
- `/articles` - Browse all published articles with filtering
- `/articles/[id]` - View individual article (supports custom URLs)
- `/editor` - Authenticated editor for creating/editing articles

### Backend (Prisma + PostgreSQL)

The backend uses Prisma ORM with PostgreSQL for data persistence.

**Database Schema:**
- **User**: Stores authentication credentials and TOTP secrets
- **Article**: Main content with markdown, tags, and metadata
- **Tag**: Reusable tags for categorization
- **ArticleHistory**: Tracks all edits to articles

## Features

### 1. Authentication System

**Password-based authentication:**
- Passwords are hashed using bcrypt with 10 salt rounds
- Sessions are managed using secure HTTP-only cookies
- In-memory session storage (for production, use Redis or database)

**Optional TOTP (Two-Factor Authentication):**
- Users can enable TOTP for additional security
- QR codes are generated for easy setup with authenticator apps
- TOTP tokens are verified using speakeasy with a 2-window tolerance

**Implementation Notes:**
- **Does NOT use h3 helper functions** - See [TROUBLESHOOTING_H3.md](./TROUBLESHOOTING_H3.md)
- Uses Node.js native APIs for headers, cookies, and request bodies
- Cookie handling: Direct access via `event.node.req.headers['cookie']`
- Response headers: Direct setting via `event.node.res.setHeader()`

**Files:**
- `server/utils/auth.ts` - Authentication utilities with direct Node.js API access
- `server/api/auth/login.post.ts` - Login endpoint
- `server/api/auth/totp/setup.post.ts` - TOTP setup
- `server/api/auth/totp/enable.post.ts` - TOTP verification

### 2. Article Editor

**Features:**
- Markdown syntax support
- Tag management (comma-separated input)
- Custom URL slugs for SEO-friendly URLs
- Publish/draft toggle
- Edit history tracking

**Implementation:**
- `app/pages/editor/index.vue` - Editor UI
- `app/server/api/articles/create.post.ts` - Create article
- `app/server/api/articles/[id].put.ts` - Update article
- `app/server/api/articles/[id].delete.ts` - Delete article

### 3. Article Visualization

**Features:**
- Public viewing of published articles
- Markdown rendering using marked.js
- Tag display and filtering
- Author and date information
- Edit history preserved

**Implementation:**
- `app/pages/articles/[id].vue` - Article view with markdown rendering
- `app/server/api/articles/[id].get.ts` - Fetch article by ID or custom URL

### 4. Search and Filtering

**Features:**
- Full-text search on title and content
- Tag-based filtering
- Real-time search with debouncing

**Implementation:**
- `app/pages/index.vue` - Home page with search
- `app/pages/articles/index.vue` - Articles listing with filters
- `app/server/api/articles/index.get.ts` - Search endpoint

## Security Considerations

1. **Password Security**: Passwords are hashed with bcrypt before storage
2. **Session Security**: Session secrets should be changed in production
3. **TOTP**: Optional two-factor authentication adds extra security layer
4. **Authorization**: Article operations check ownership before allowing edits/deletes
5. **Input Validation**: All endpoints validate required fields

## Setup Instructions

### Prerequisites

- Node.js 18+
- PostgreSQL database (local or remote)

### Installation Steps

1. **Clone and install dependencies:**
   ```bash
   git clone https://github.com/Ron-RONZZ-org/phantom.git
   cd phantom
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials and secrets
   ```

3. **Setup database:**
   ```bash
   # Create migration
   npx prisma migrate dev --name init
   
   # Seed database with sample data
   npm run db:seed
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Access the application:**
   - Home: http://localhost:3000
   - Editor: http://localhost:3000/editor
   - Login with: username `admin` and the randomly generated password from the seed script output

### Production Deployment

1. **Build for production:**
   ```bash
   npm run build
   ```

2. **Set production environment variables:**
   - `DATABASE_URL`: PostgreSQL connection string
   - `JWT_SECRET`: Strong random secret
   - `SESSION_SECRET`: Strong random secret (currently not used, reserved for future)
   - `NODE_ENV`: Set to `production`

3. **Important for Production:**
   - The current implementation uses in-memory session storage
   - For production with multiple servers, implement Redis or database-backed sessions
   - Modify `server/utils/auth.ts` to use a persistent session store

3. **Run migrations:**
   ```bash
   npx prisma migrate deploy
   ```

4. **Start server:**
   ```bash
   node .output/server/index.mjs
   ```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with username/password/TOTP
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/totp/setup` - Generate TOTP secret and QR code
- `POST /api/auth/totp/enable` - Verify and enable TOTP

### Articles
- `GET /api/articles` - List articles (with optional search/tag filters)
- `GET /api/articles/[id]` - Get article by ID or custom URL
- `POST /api/articles/create` - Create new article (authenticated)
- `PUT /api/articles/[id]` - Update article (authenticated, owner only)
- `DELETE /api/articles/[id]` - Delete article (authenticated, owner only)

## Database Management

### Prisma Studio
Open a GUI to manage database records:
```bash
npm run db:studio
```

### Migrations
Create a new migration after schema changes:
```bash
npm run db:migrate
```

### Seed Data
Reset and seed the database:
```bash
npm run db:seed
```

## File Structure

```
phantom/
├── app/
│   ├── assets/
│   │   └── css/
│   │       └── main.css           # Global styles
│   ├── pages/
│   │   ├── index.vue              # Home page
│   │   ├── articles/
│   │   │   ├── index.vue          # Articles listing
│   │   │   └── [id].vue           # Article view
│   │   └── editor/
│   │       └── index.vue          # Editor
│   ├── server/
│   │   ├── api/
│   │   │   ├── articles/          # Article endpoints
│   │   │   └── auth/              # Auth endpoints
│   │   └── utils/
│   │       ├── auth.ts            # Auth utilities
│   │       └── prisma.ts          # Prisma client
│   └── app.vue                    # Root component
├── prisma/
│   ├── schema.prisma              # Database schema
│   └── seed.ts                    # Seed script
├── nuxt.config.ts                 # Nuxt configuration
├── package.json                   # Dependencies
└── README.md                      # Documentation
```

## Customization

### Styling
Edit `app/assets/css/main.css` for global styles. Component-specific styles are scoped in each Vue file.

### Markdown Rendering
The markdown rendering is handled by `marked.js`. To customize rendering, edit the rendering logic in `app/pages/articles/[id].vue`.

### Authentication
To add more authentication methods or modify the flow, edit files in `app/server/api/auth/` and `app/server/utils/auth.ts`.

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` in `.env`
- Ensure PostgreSQL is running
- Check database permissions

### Build Errors
- Clear `.nuxt` and `node_modules`: `rm -rf .nuxt node_modules && npm install`
- Regenerate Prisma client: `npx prisma generate`

### Authentication Issues
- Check session secrets are set
- Verify user exists in database
- Check browser console for errors

## Future Enhancements

Potential improvements for future versions:
- Rich text editor with markdown preview
- Image upload support
- Comment system
- RSS feed generation
- Social media sharing
- Dark mode
- Multi-language support
- Article scheduling
- Analytics integration

## License

MIT License - See LICENSE file for details
