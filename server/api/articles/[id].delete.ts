import prisma from '../../utils/prisma'
import { getUserFromSession } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Not authenticated'
    })
  }

  const id = getRouterParam(event, 'id')
  
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Article ID is required'
    })
  }

  // Check ownership
  const article = await prisma.article.findUnique({
    where: { id }
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
      statusMessage: 'Not authorized to delete this article'
    })
  }

  // Delete article (cascade will delete history)
  await prisma.article.delete({
    where: { id }
  })

  return {
    success: true,
    message: 'Article deleted successfully'
  }
})
