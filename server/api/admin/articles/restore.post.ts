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
  const article = await prisma.article.findUnique({
    where: { id: articleId }
  })

  if (!article) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Article not found'
    })
  }

  if (article.authorId !== user.id) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Not authorized'
    })
  }

  // Restore by clearing deletedAt
  const updatedArticle = await prisma.article.update({
    where: { id: articleId },
    data: {
      deletedAt: null
    }
  })

  return {
    success: true,
    article: updatedArticle
  }
})
