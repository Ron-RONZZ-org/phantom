import prisma from '../../utils/prisma'
import { getUserFromSession, readRequestBody } from '../../utils/auth'

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

  const body = await readRequestBody(event)
  const { title, content, tags, customUrl, published, seriesId } = body

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
      statusMessage: 'Not authorized to edit this article'
    })
  }

  // Check if custom URL is already taken by another article
  if (customUrl && customUrl !== article.customUrl) {
    const existing = await prisma.article.findUnique({
      where: { customUrl }
    })
    
    if (existing && existing.id !== id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Custom URL already taken'
      })
    }
  }

  // Process tags
  const tagObjects = tags ? await Promise.all(
    tags.map(async (tagName: string) => {
      const tag = await prisma.tag.upsert({
        where: { name: tagName },
        update: {},
        create: { name: tagName }
      })
      return { id: tag.id }
    })
  ) : []

  // Update article
  const updatedArticle = await prisma.article.update({
    where: { id },
    data: {
      title: title !== undefined ? title : undefined,
      content: content !== undefined ? content : undefined,
      customUrl: customUrl !== undefined ? (customUrl || null) : undefined,
      published: published !== undefined ? published : undefined,
      seriesId: seriesId !== undefined ? (seriesId || null) : undefined,
      tags: tags !== undefined ? {
        set: [],
        connect: tagObjects
      } : undefined
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

  // Create history entry if content changed
  if (content !== undefined && content !== article.content) {
    await prisma.articleHistory.create({
      data: {
        articleId: id,
        title: updatedArticle.title,
        content: updatedArticle.content
      }
    })
  }

  return {
    article: updatedArticle
  }
})
