import bcrypt from 'bcrypt'
import speakeasy from 'speakeasy'
import { H3Event, getCookie, setCookie, deleteCookie } from 'h3'

const SALT_ROUNDS = 10
const SESSION_COOKIE_NAME = 'phantom_session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

// Simple session storage (in production, use Redis or database)
const sessions = new Map<string, { userId: string, expiresAt: number }>()

function generateSessionId(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

function cleanExpiredSessions() {
  const now = Date.now()
  for (const [sessionId, session] of sessions.entries()) {
    if (session.expiresAt < now) {
      sessions.delete(sessionId)
    }
  }
}

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
  cleanExpiredSessions()
  
  const sessionId = getCookie(event, SESSION_COOKIE_NAME)
  if (!sessionId) {
    return null
  }

  const session = sessions.get(sessionId)
  if (!session || session.expiresAt < Date.now()) {
    if (session) {
      sessions.delete(sessionId)
    }
    deleteCookie(event, SESSION_COOKIE_NAME)
    return null
  }

  return { id: session.userId }
}

export async function setUserSession(event: H3Event, userId: string) {
  const sessionId = generateSessionId()
  const expiresAt = Date.now() + (SESSION_MAX_AGE * 1000)
  
  sessions.set(sessionId, { userId, expiresAt })
  
  setCookie(event, SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/'
  })
}

export async function clearUserSession(event: H3Event) {
  const sessionId = getCookie(event, SESSION_COOKIE_NAME)
  if (sessionId) {
    sessions.delete(sessionId)
  }
  deleteCookie(event, SESSION_COOKIE_NAME)
}
