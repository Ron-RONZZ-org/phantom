import { getUserFromSession, readRequestBody } from '../../utils/auth'
import { writeFile } from 'fs/promises'
import { resolve } from 'path'

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Not authenticated'
    })
  }

  const body = await readRequestBody(event)
  const { css } = body

  if (!css || typeof css !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'CSS content is required'
    })
  }

  // Basic validation to ensure it's CSS-like content
  if (css.length > 1000000) { // 1MB limit
    throw createError({
      statusCode: 400,
      statusMessage: 'CSS file is too large (max 1MB)'
    })
  }

  try {
    // Save custom theme to public directory
    const customThemePath = resolve(process.cwd(), 'public', 'custom-theme.css')
    await writeFile(customThemePath, css, 'utf-8')
    
    return {
      success: true,
      message: 'Theme uploaded successfully'
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to save theme file'
    })
  }
})
