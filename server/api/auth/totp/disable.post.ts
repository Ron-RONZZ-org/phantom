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

  const userData = await prisma.user.findUnique({
    where: { id: user.id }
  })

  if (!userData) {
    throw createError({
      statusCode: 404,
      statusMessage: 'User not found'
    })
  }

  // Disable TOTP
  await prisma.user.update({
    where: { id: user.id },
    data: {
      totpEnabled: false,
      totpSecret: null
    }
  })

  return {
    success: true,
    message: 'TOTP disabled successfully'
  }
})
