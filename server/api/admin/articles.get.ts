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
  let status: string | undefined
  let seriesId: string | undefined
  let search: string | undefined
  
  try {
    const query = getQuery(event)
    status = query.status as string | undefined
    seriesId = query.seriesId as string | undefined
    search = query.search as string | undefined
  } catch (error) {
    // Fallback: parse from URL manually if getQuery fails
    const url = event.node?.req?.url || event.path || ''
    const urlObj = new URL(url, 'http://localhost')
    status = urlObj.searchParams.get('status') || undefined
    seriesId = urlObj.searchParams.get('seriesId') || undefined
    search = urlObj.searchParams.get('search') || undefined
  }

  const where: any = {
    authorId: user.id,
    deletedAt: null // Only non-deleted articles
  }

  // Filter by status
  if (status === 'published') {
    where.published = true
  } else if (status === 'draft') {
    where.published = false
  }
  // 'all' means no filter on published

  // Filter by series
  if (seriesId) {
    where.seriesId = seriesId
  }

  // Search filter
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { content: { contains: search, mode: 'insensitive' } }
    ]
  }

  const articles = await prisma.article.findMany({
    where,
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
      updatedAt: 'desc'
    }
  })

  return {
    articles
  }
})
