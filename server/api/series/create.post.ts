import { defineEventHandler } from 'h3'
import prisma from '../../utils/prisma'
import { getUserFromSession, readRequestBody } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  try {
    const body = await readRequestBody(event)
    const { name, description, customUrl } = body

    if (!name) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Series name is required'
      })
    }

    const series = await prisma.series.create({
      data: {
        name,
        description,
        customUrl
      }
    })

    return {
      series,
      message: 'Series created successfully'
    }
  } catch (error: any) {
    console.error('Error creating series:', error)
    
    if (error.code === 'P2002') {
      throw createError({
        statusCode: 400,
        statusMessage: 'A series with this name or URL already exists'
      })
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create series'
    })
  }
})
