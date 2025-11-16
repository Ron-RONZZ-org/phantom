import { getUserFromSession } from '../../utils/auth'
import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Not authenticated'
    })
  }

  const userData = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      username: true,
      totpEnabled: true,
      createdAt: true
    }
  })

  return {
    user: userData
  }
})
