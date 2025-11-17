import { getUserFromSession } from '../../utils/auth'
import { readFile } from 'fs/promises'
import { resolve } from 'path'

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Not authenticated'
    })
  }

  try {
    // Check if custom theme exists, otherwise return default theme
    const customThemePath = resolve(process.cwd(), 'public', 'custom-theme.css')
    const defaultThemePath = resolve(process.cwd(), 'app', 'assets', 'css', 'main.css')
    
    let cssContent: string
    
    try {
      cssContent = await readFile(customThemePath, 'utf-8')
    } catch {
      // If custom theme doesn't exist, return default theme
      cssContent = await readFile(defaultThemePath, 'utf-8')
    }
    
    return {
      css: cssContent
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to read theme file'
    })
  }
})
