import prisma from '../../../utils/prisma'
import { getUserFromSession, verifyTOTPToken, readRequestBody } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Not authenticated'
    })
  }

  const body = await readRequestBody(event)
  const { token } = body

  if (!token) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Token is required'
    })
  }

  const userData = await prisma.user.findUnique({
    where: { id: user.id }
  })

  if (!userData || !userData.totpSecret) {
    throw createError({
      statusCode: 400,
      statusMessage: 'TOTP not set up'
    })
  }

  // Verify token
  const valid = verifyTOTPToken(token, userData.totpSecret)
  
  if (!valid) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid token'
    })
  }

  // Enable TOTP
  await prisma.user.update({
    where: { id: user.id },
    data: {
      totpEnabled: true
    }
  })

  return {
    success: true,
    message: 'TOTP enabled successfully'
  }
})
