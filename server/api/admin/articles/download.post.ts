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
  const { status, seriesId, search } = body

  const where: any = {
    authorId: user.id,
    deletedAt: null
  }

  // Filter by status
  if (status === 'published') {
    where.published = true
  } else if (status === 'draft') {
    where.published = false
  }

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
      tags: true,
      series: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  // Convert articles to markdown format with YAML frontmatter
  const markdownFiles = articles.map(article => {
    const frontmatter = [
      '---',
      `title: ${article.title}`,
      `published: ${article.published}`,
      `customUrl: ${article.customUrl || ''}`,
      `seriesId: ${article.seriesId || ''}`,
      `tags: [${article.tags.map(t => t.name).join(', ')}]`,
      `createdAt: ${article.createdAt.toISOString()}`,
      `updatedAt: ${article.updatedAt.toISOString()}`,
      '---',
      '',
      article.content
    ].join('\n')

    return {
      filename: `${article.customUrl || article.id}.md`,
      content: frontmatter
    }
  })

  // For simplicity, return as JSON array instead of ZIP
  // Frontend can handle downloading individual files or creating a simple bundle
  return {
    articles: markdownFiles,
    filename: `phantom-articles-${Date.now()}.json`,
    count: markdownFiles.length
  }
})
