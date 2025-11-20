import prisma from '../../../utils/prisma'
import { getUserFromSession } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Not authenticated'
    })
  }

  // Parse query parameters
  let articleId: string | undefined
  
  try {
    const query = getQuery(event)
    articleId = query.id as string | undefined
  } catch (error) {
    // Fallback: parse from URL manually if getQuery fails
    const url = event.node?.req?.url || event.path || ''
    const urlObj = new URL(url, 'http://localhost')
    articleId = urlObj.searchParams.get('id') || undefined
  }

  if (!articleId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Article ID is required'
    })
  }

  const article = await prisma.article.findFirst({
    where: {
      id: articleId,
      authorId: user.id,
      deletedAt: null
    },
    include: {
      tags: true,
      series: true
    }
  })

  if (!article) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Article not found'
    })
  }

  return {
    article
  }
})
