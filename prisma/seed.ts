import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import crypto from 'crypto'

const prisma = new PrismaClient()

function generateRandomPassword(length: number = 16): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  const randomBytes = crypto.randomBytes(length)
  let password = ''
  
  for (let i = 0; i < length; i++) {
    password += charset[randomBytes[i] % charset.length]
  }
  
  return password
}

async function main() {
  console.log('Seeding database...')

  // Generate random password for admin user
  const adminPassword = generateRandomPassword(16)
  const adminPasswordHash = await bcrypt.hash(adminPassword, 10)

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: adminPasswordHash,
      totpEnabled: false
    }
  })

  console.log('\n' + '='.repeat(60))
  console.log('✅ Admin user created!')
  console.log('='.repeat(60))
  console.log('Username: admin')
  console.log('Password:', adminPassword)
  console.log('='.repeat(60))
  console.log('⚠️  IMPORTANT: Save this password securely!')
  console.log('⚠️  This password will not be shown again.')
  console.log('='.repeat(60) + '\n')

  // Create some sample tags
  const tags = await Promise.all([
    prisma.tag.upsert({
      where: { name: 'tutorial' },
      update: {},
      create: { name: 'tutorial' }
    }),
    prisma.tag.upsert({
      where: { name: 'web' },
      update: {},
      create: { name: 'web' }
    }),
    prisma.tag.upsert({
      where: { name: 'javascript' },
      update: {},
      create: { name: 'javascript' }
    })
  ])

  console.log('Created sample tags:', tags.map(t => t.name).join(', '))

  // Create a sample article
  const article = await prisma.article.upsert({
    where: { customUrl: 'welcome-to-phantom' },
    update: {},
    create: {
      title: 'Welcome to Phantom',
      content: `# Welcome to Phantom

This is your first article! Phantom is a minimalist blogging platform built with Nuxt.js and Prisma.

## Features

- **Markdown Support**: Write your articles in markdown
- **Tags**: Organize your content with tags
- **Custom URLs**: Create SEO-friendly URLs for your articles
- **TOTP Authentication**: Secure your editor with two-factor authentication
- **Article History**: Track all changes to your articles

## Getting Started

1. Log in to the editor at \`/editor\`
2. Create new articles using markdown
3. Add tags to organize your content
4. Publish when you're ready!

Enjoy writing!`,
      customUrl: 'welcome-to-phantom',
      published: true,
      authorId: admin.id,
      tags: {
        connect: [{ id: tags[0].id }, { id: tags[1].id }]
      }
    }
  })

  // Create history entry
  await prisma.articleHistory.create({
    data: {
      articleId: article.id,
      title: article.title,
      content: article.content
    }
  })

  console.log('Created sample article:', article.title)
  console.log('\n✅ Database seeded successfully!')
  console.log('\nYou can now:')
  console.log('1. Start the dev server: npm run dev')
  console.log('2. Visit http://localhost:3000')
  console.log('3. Log in to /editor with username: admin and the password shown above')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
