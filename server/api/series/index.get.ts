import { defineEventHandler } from 'h3'
import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const series = await prisma.series.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        articles: {
          select: {
            id: true,
            title: true
          }
        }
      }
    })

    return {
      series
    }
  } catch (error) {
    console.error('Error fetching series:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch series'
    })
  }
})
