import bcrypt from 'bcrypt'
import speakeasy from 'speakeasy'
import { H3Event } from 'h3'

const SALT_ROUNDS = 10

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateTOTPSecret() {
  return speakeasy.generateSecret({
    name: 'Phantom Blog',
    length: 32
  })
}

export function verifyTOTPToken(token: string, secret: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2
  })
}

export async function getUserFromSession(event: H3Event) {
  const session = await useSession(event, {
    password: process.env.SESSION_SECRET || 'change-me-in-production'
  })
  
  return session.data.userId ? { id: session.data.userId as string } : null
}

export async function setUserSession(event: H3Event, userId: string) {
  const session = await useSession(event, {
    password: process.env.SESSION_SECRET || 'change-me-in-production'
  })
  
  await session.update({ userId })
}

export async function clearUserSession(event: H3Event) {
  const session = await useSession(event, {
    password: process.env.SESSION_SECRET || 'change-me-in-production'
  })
  
  await session.clear()
}
