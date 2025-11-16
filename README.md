# Phantom

Minimalist FOSS blogging solution for markdown lovers

## Features

- **Nuxt.js Frontend**
  - Editor authentication with password and optional TOTP
  - Markdown article editor with syntax support
  - Custom URL slugs for articles
  - Tag-based organization
  - Public article visualization with search

- **Prisma PostgreSQL Backend**
  - Article management
  - Metadata tracking (tags, creation/edit history, author, custom URLs)
  - User authentication with TOTP support

## Setup

### Prerequisites

- Node.js 18+ 
- PostgreSQL database

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Ron-RONZZ-org/phantom.git
cd phantom
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
Create a `.env` file in the root directory:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/phantom?schema=public"
JWT_SECRET="your-jwt-secret-key"
SESSION_SECRET="your-session-secret-key"
```

4. Initialize the database:
```bash
npx prisma migrate dev --name init
```

5. Create a user (run in Node.js REPL or create a seed script):
```bash
npx prisma studio
```

Or create a user directly using the Prisma client in a script.

### Development

Start the development server on `http://localhost:3000`:

```bash
npm run dev
```

### Production

Build the application for production:

```bash
npm run build
```

Locally preview production build:

```bash
npm run preview
```

Check out the [Nuxt deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

## Usage

### Creating Articles

1. Navigate to `/editor`
2. Log in with your credentials
3. Write your article in Markdown
4. Add tags (comma-separated)
5. Optionally set a custom URL
6. Publish or save as draft

### Viewing Articles

- Home page: `/` - Shows featured articles with search
- All articles: `/articles` - Browse all published articles
- Individual article: `/articles/{id-or-custom-url}`

### Two-Factor Authentication

1. Log in to the editor
2. Navigate to the TOTP section
3. Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.)
4. Enter the verification code to enable TOTP

## Database Schema

### User
- Authentication credentials
- Optional TOTP secret
- Article authorship

### Article
- Title, content (Markdown)
- Custom URL slug
- Published status
- Tags (many-to-many)
- Creation and update timestamps

### Tag
- Name (unique)
- Associated articles

### ArticleHistory
- Tracks all edits to articles
- Stores previous versions of title and content

## Tech Stack

- **Frontend**: Nuxt.js 4, Vue 3
- **Backend**: Nuxt API routes
- **Database**: PostgreSQL with Prisma ORM
- **Markdown**: marked.js for rendering
- **Authentication**: bcrypt + speakeasy (TOTP)
- **Session Management**: h3 sessions

## License

MIT License - see LICENSE file for details
