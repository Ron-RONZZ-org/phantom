import prisma from '../../utils/prisma'
import { getUserFromSession, readRequestBody } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Not authenticated'
    })
  }

  const body = await readRequestBody(event)
  const { title, content, tags, customUrl, published, seriesId } = body

  if (!title || !content) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Title and content are required'
    })
  }

  // Check if custom URL is already taken
  if (customUrl) {
    const existing = await prisma.article.findUnique({
      where: { customUrl }
    })
    
    if (existing) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Custom URL already taken'
      })
    }
  }

  // Process tags
  const tagObjects = tags ? await Promise.all(
    tags.map(async (tagName: string) => {
      const tag = await prisma.tag.upsert({
        where: { name: tagName },
        update: {},
        create: { name: tagName }
      })
      return { id: tag.id }
    })
  ) : []

  // Create article
  const article = await prisma.article.create({
    data: {
      title,
      content,
      customUrl: customUrl || undefined,
      published: published || false,
      authorId: user.id,
      seriesId: seriesId || undefined,
      tags: {
        connect: tagObjects
      }
    },
    include: {
      author: {
        select: {
          id: true,
          username: true
        }
      },
      tags: true,
      series: true
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

  return {
    article
  }
})
