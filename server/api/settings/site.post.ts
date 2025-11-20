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
    const { siteTitle, siteDescription, logoUrl, faviconUrl, headerHtml, footerHtml } = body

    // Get existing settings or create new
    let settings = await prisma.siteSettings.findFirst()
    
    if (settings) {
      // Update existing settings
      settings = await prisma.siteSettings.update({
        where: { id: settings.id },
        data: {
          siteTitle: siteTitle || settings.siteTitle,
          siteDescription: siteDescription || settings.siteDescription,
          logoUrl: logoUrl !== undefined ? logoUrl : settings.logoUrl,
          faviconUrl: faviconUrl !== undefined ? faviconUrl : settings.faviconUrl,
          headerHtml: headerHtml !== undefined ? headerHtml : settings.headerHtml,
          footerHtml: footerHtml !== undefined ? footerHtml : settings.footerHtml
        }
      })
    } else {
      // Create new settings
      settings = await prisma.siteSettings.create({
        data: {
          siteTitle: siteTitle || 'Phantom Blog',
          siteDescription: siteDescription || 'A minimalist blogging platform for markdown lovers',
          logoUrl,
          faviconUrl,
          headerHtml,
          footerHtml
        }
      })
    }

    return {
      settings,
      message: 'Site settings updated successfully'
    }
  } catch (error) {
    console.error('Error updating site settings:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update site settings'
    })
  }
})
