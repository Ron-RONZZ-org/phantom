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

  // Get articles that are deleted (soft deleted)
  const articles = await prisma.article.findMany({
    where: {
      authorId: user.id,
      deletedAt: {
        not: null
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
    },
    orderBy: {
      deletedAt: 'desc'
    }
  })

  return {
    articles
  }
})
