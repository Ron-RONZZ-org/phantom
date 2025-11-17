import prisma from '../../utils/prisma'
import { getUserFromSession, verifyPassword, hashPassword, readRequestBody } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Not authenticated'
    })
  }

  const body = await readRequestBody(event)
  const { currentPassword, newPassword } = body

  if (!currentPassword || !newPassword) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Current password and new password are required'
    })
  }

  if (newPassword.length < 8) {
    throw createError({
      statusCode: 400,
      statusMessage: 'New password must be at least 8 characters'
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

  // Verify current password
  const isValid = await verifyPassword(currentPassword, userData.passwordHash)
  
  if (!isValid) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Current password is incorrect'
    })
  }

  // Hash and update new password
  const newPasswordHash = await hashPassword(newPassword)
  
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: newPasswordHash
    }
  })

  return {
    success: true,
    message: 'Password changed successfully'
  }
})
