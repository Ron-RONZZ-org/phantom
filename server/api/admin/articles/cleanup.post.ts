import prisma from '../../../../utils/prisma'
import { getUserFromSession } from '../../../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Not authenticated'
    })
  }

  // Find all articles deleted more than 30 days ago
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const articlesToDelete = await prisma.article.findMany({
    where: {
      authorId: user.id,
      deletedAt: {
        not: null,
        lt: thirtyDaysAgo
      }
    }
  })

  // Delete them permanently
  const deleteResult = await prisma.article.deleteMany({
    where: {
      authorId: user.id,
      deletedAt: {
        not: null,
        lt: thirtyDaysAgo
      }
    }
  })

  return {
    success: true,
    deletedCount: deleteResult.count
  }
})
