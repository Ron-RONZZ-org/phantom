import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  // Parse query parameters safely for h3 v2
  let search: string | undefined
  let tag: string | undefined
  
  try {
    const query = getQuery(event)
    search = query.search as string | undefined
    tag = query.tag as string | undefined
  } catch (error) {
    // Fallback: parse from URL manually if getQuery fails
    const url = event.node?.req?.url || event.path || ''
    const urlObj = new URL(url, 'http://localhost')
    search = urlObj.searchParams.get('search') || undefined
    tag = urlObj.searchParams.get('tag') || undefined
  }
  
  const where: any = {
    published: true
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { content: { contains: search, mode: 'insensitive' } }
    ]
  }

  if (tag) {
    where.tags = {
      some: {
        name: tag
      }
    }
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
      tags: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return {
    articles
  }
})
