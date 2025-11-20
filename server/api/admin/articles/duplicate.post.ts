import prisma from '../../../utils/prisma'
import { getUserFromSession, readRequestBody } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Not authenticated'
    })
  }

  const body = await readRequestBody(event)
  const { articleId } = body

  if (!articleId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Article ID is required'
    })
  }

  // Check ownership
  const originalArticle = await prisma.article.findUnique({
    where: { id: articleId },
    include: {
      tags: true
    }
  })

  if (!originalArticle) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Article not found'
    })
  }

  if (originalArticle.authorId !== user.id) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Not authorized'
    })
  }

  // Create a duplicate with modified title
  const duplicatedArticle = await prisma.article.create({
    data: {
      title: `${originalArticle.title} (Copy)`,
      content: originalArticle.content,
      published: false, // Always create duplicates as drafts
      authorId: user.id,
      seriesId: originalArticle.seriesId,
      tags: {
        connect: originalArticle.tags.map(tag => ({ id: tag.id }))
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

  return {
    success: true,
    article: duplicatedArticle
  }
})
