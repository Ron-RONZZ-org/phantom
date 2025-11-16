import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Article ID is required'
    })
  }

  const article = await prisma.article.findFirst({
    where: {
      OR: [
        { id },
        { customUrl: id }
      ],
      published: true
    },
    include: {
      author: {
        select: {
          id: true,
          username: true
        }
      },
      tags: true
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
