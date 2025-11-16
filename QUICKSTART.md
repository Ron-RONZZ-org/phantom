# Quick Start Guide

Get Phantom up and running in 5 minutes!

## Prerequisites

- Node.js 18 or higher
- PostgreSQL database

## Installation

### 1. Clone and Install

```bash
git clone https://github.com/Ron-RONZZ-org/phantom.git
cd phantom
npm install
```

### 2. Configure Database

Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` and update the database URL:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/phantom?schema=public"
```

### 3. Initialize Database

Run migrations to create tables:
```bash
npx prisma migrate dev --name init
```

Seed the database with a default admin user and sample content:
```bash
npm run db:seed
```

This creates:
- Admin user: `admin` / `admin123`
- Sample article "Welcome to Phantom"
- Sample tags: tutorial, web, javascript

### 4. Start Development Server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## First Steps

### 1. View the Sample Article

Visit the home page to see the "Welcome to Phantom" article.

### 2. Log In to Editor

1. Navigate to http://localhost:3000/editor
2. Login with:
   - Username: `admin`
   - Password: `admin123`

⚠️ **Important**: Change the default password after first login!

### 3. Create Your First Article

1. Enter a title
2. Write content in Markdown
3. Add tags (comma-separated)
4. Optionally set a custom URL
5. Check "Publish article" to make it public
6. Click "Create Article"

### 4. Enable Two-Factor Authentication (Optional)

1. Scroll down to the TOTP section
2. Click "Setup TOTP"
3. Scan the QR code with Google Authenticator or similar app
4. Enter the 6-digit code
5. Click "Enable TOTP"

## What's Next?

- Explore the article listing at `/articles`
- Try the search functionality
- Click tags to filter articles
- Edit and delete articles you've created
- Check out the full documentation in IMPLEMENTATION.md

## Production Deployment

When ready to deploy:

1. Build the application:
   ```bash
   npm run build
   ```

2. Set production environment variables in `.env`

3. Run migrations:
   ```bash
   npx prisma migrate deploy
   ```

4. Start the server:
   ```bash
   node .output/server/index.mjs
   ```

## Need Help?

- Check IMPLEMENTATION.md for detailed documentation
- Review the README.md for more information
- Open an issue on GitHub

Enjoy writing with Phantom! ✨
