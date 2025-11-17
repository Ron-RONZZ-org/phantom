import { defineEventHandler } from 'h3'
import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    // Get or create default site settings
    let settings = await prisma.siteSettings.findFirst()
    
    if (!settings) {
      // Create default settings if none exist
      settings = await prisma.siteSettings.create({
        data: {
          siteTitle: 'Phantom Blog',
          siteDescription: 'A minimalist blogging platform for markdown lovers'
        }
      })
    }

    return {
      settings
    }
  } catch (error) {
    console.error('Error fetching site settings:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch site settings'
    })
  }
})
