import { clearUserSession } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await clearUserSession(event)
  
  return {
    success: true,
    message: 'Logged out successfully'
  }
})
