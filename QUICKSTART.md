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

Edit `.env` and update the database URL with your PostgreSQL credentials:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/phantom?schema=public"
```

**Important:** Replace `username`, `password`, and database connection details with your actual PostgreSQL credentials.

### 3. Initialize Database

Run migrations to create tables:
```bash
npx prisma migrate dev --name init
```

If you get an error about missing DATABASE_URL, make sure:
1. The `.env` file exists in the root directory (same level as `package.json`)
2. The `DATABASE_URL` is properly set in the `.env` file
3. PostgreSQL is running and accessible

Seed the database with a default admin user and sample content:
```bash
npm run db:seed
```

This creates:
- Admin user with username `admin` and a randomly generated password (displayed in terminal)
- Sample article "Welcome to Phantom"
- Sample tags: tutorial, web, javascript

**Important:** The randomly generated password will be displayed in the terminal. Save it securely as it won't be shown again!

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
   - Password: The randomly generated password from the seed script output

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

## Troubleshooting

### "Missing required environment variable: DATABASE_URL"

This error means Prisma cannot find your `.env` file or the DATABASE_URL variable. To fix:

1. **Verify the .env file exists:**
   ```bash
   ls -la .env
   ```
   If it doesn't exist, create it from the example:
   ```bash
   cp .env.example .env
   ```

2. **Check the .env file content:**
   ```bash
   cat .env
   ```
   Make sure it contains:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/phantom?schema=public"
   JWT_SECRET="your-secret-key-change-in-production"
   SESSION_SECRET="your-session-secret-change-in-production"
   ```

3. **Update with your actual database credentials:**
   - Replace `username` with your PostgreSQL username
   - Replace `password` with your PostgreSQL password
   - Adjust `localhost:5432` if your PostgreSQL runs on a different host/port
   - Change `phantom` to your actual database name if different

4. **Ensure PostgreSQL is running:**
   ```bash
   # Check if PostgreSQL is running
   sudo systemctl status postgresql
   # Or on some systems:
   pg_isready
   ```

5. **Create the database if it doesn't exist:**
   ```bash
   psql -U postgres -c "CREATE DATABASE phantom;"
   ```

6. **Try the migration again:**
   ```bash
   npx prisma migrate dev --name init
   ```

### Database Connection Errors

If you get connection errors:
- Verify PostgreSQL is running
- Check your credentials are correct
- Ensure the database exists
- Check firewall settings if using remote database

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
