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
  const { articles } = body

  if (!articles || !Array.isArray(articles)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid articles data'
    })
  }

  let successCount = 0
  const errors: string[] = []

  for (const articleData of articles) {
    try {
      // Parse frontmatter and content
      const { title, content, published, customUrl, tags, seriesId } = articleData

      if (!title || !content) {
        errors.push(`Skipped article: Missing title or content`)
        continue
      }

      // Process tags
      const tagObjects = tags && Array.isArray(tags) 
        ? await Promise.all(
            tags.map(async (tagName: string) => {
              const tag = await prisma.tag.upsert({
                where: { name: tagName },
                update: {},
                create: { name: tagName }
              })
              return { id: tag.id }
            })
          )
        : []

      // Create article
      await prisma.article.create({
        data: {
          title,
          content,
          published: published === true || published === 'true',
          customUrl: customUrl || null,
          authorId: user.id,
          seriesId: seriesId || null,
          tags: {
            connect: tagObjects
          }
        }
      })

      successCount++
    } catch (err: any) {
      errors.push(`Failed to import "${articleData.title}": ${err.message}`)
    }
  }

  return {
    success: true,
    count: successCount,
    errors: errors.length > 0 ? errors : undefined
  }
})
