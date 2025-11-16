import prisma from '../../../utils/prisma'
import { getUserFromSession } from '../../../utils/auth'
import { generateTOTPSecret } from '../../../utils/auth'
import QRCode from 'qrcode'

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

  // Generate new TOTP secret
  const secret = generateTOTPSecret()
  
  // Generate QR code
  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!)

  // Save secret to database (not enabled yet)
  await prisma.user.update({
    where: { id: user.id },
    data: {
      totpSecret: secret.base32,
      totpEnabled: false
    }
  })

  return {
    secret: secret.base32,
    qrCode: qrCodeUrl
  }
})
