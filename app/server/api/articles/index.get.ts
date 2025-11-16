import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const search = query.search as string | undefined
  const tag = query.tag as string | undefined
  
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
