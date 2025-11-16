import prisma from '~/server/utils/prisma'
import { verifyPassword, setUserSession, verifyTOTPToken } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { username, password, totpToken } = body

  if (!username || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Username and password are required'
    })
  }

  // Find user
  const user = await prisma.user.findUnique({
    where: { username }
  })

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid credentials'
    })
  }

  // Verify password
  const validPassword = await verifyPassword(password, user.passwordHash)
  if (!validPassword) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid credentials'
    })
  }

  // Check TOTP if enabled
  if (user.totpEnabled && user.totpSecret) {
    if (!totpToken) {
      return {
        requireTotp: true,
        message: 'TOTP token required'
      }
    }

    const validTotp = verifyTOTPToken(totpToken, user.totpSecret)
    if (!validTotp) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid TOTP token'
      })
    }
  }

  // Set session
  await setUserSession(event, user.id)

  return {
    success: true,
    user: {
      id: user.id,
      username: user.username
    }
  }
})
