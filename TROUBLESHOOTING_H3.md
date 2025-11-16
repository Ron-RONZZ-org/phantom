# H3 v2 Compatibility Guide for Nuxt 4

This document explains the h3 v2 compatibility issues encountered during development and how to avoid them in future projects.

## Background

Nuxt 4 uses h3 v2 as its underlying HTTP server library. However, h3 v2 introduced breaking changes in its API that affect how event handlers access request/response data in development mode (via Nitro).

## The Problem

When using Nuxt 4 with h3 v2, many standard h3 helper functions fail with errors like:
- `event.req.headers.get is not a function`
- `event.req.text is not a function`
- `Invalid URL` when using `getQuery()`

These errors occur because h3 v2 expects a different event object structure than what Nitro provides in development mode.

## Failed Approaches

### ❌ Using h3's Session API
```typescript
// DOES NOT WORK
import { useSession } from 'h3'

const session = await useSession(event, { password: 'secret' })
// Error: event.req.headers.get is not a function
```

### ❌ Using h3's Cookie Functions
```typescript
// DOES NOT WORK
import { getCookie, setCookie, deleteCookie } from 'h3'

const value = getCookie(event, 'cookieName')
// Error: event.req.headers.get is not a function
```

### ❌ Using h3's Header Functions
```typescript
// DOES NOT WORK
import { getRequestHeader, setResponseHeader } from 'h3'

const header = getRequestHeader(event, 'cookie')
// Error: event.req.headers.get is not a function
```

### ❌ Using h3's Body Reading
```typescript
// DOES NOT WORK
import { readBody } from 'h3'

const body = await readBody(event)
// Error: event.req.text is not a function
```

### ❌ Using h3's Query Parsing
```typescript
// DOES NOT WORK
import { getQuery } from 'h3'

const query = getQuery(event)
// Error: Invalid URL
```

## ✅ Working Solution: Direct Node.js API Access

The solution is to **bypass all h3 helper functions** and access Node.js request/response objects directly through `event.node.req` and `event.node.res`.

### Reading Request Headers (Cookies)

```typescript
// ✅ WORKS - Direct header access
function getCookieValue(event: H3Event, name: string): string | null {
  // Access headers directly from Node.js request object
  const cookieHeader = event.node.req.headers['cookie'] as string | undefined
  
  if (!cookieHeader) return null
  
  // Manual cookie parsing
  const cookies = cookieHeader.split(';').map(c => c.trim())
  for (const cookie of cookies) {
    const [key, ...valueParts] = cookie.split('=')
    if (key === name) {
      return decodeURIComponent(valueParts.join('='))
    }
  }
  return null
}
```

### Setting Response Headers (Cookies)

```typescript
// ✅ WORKS - Direct header setting
function setCookieValue(
  event: H3Event, 
  name: string, 
  value: string, 
  options: CookieOptions
) {
  const parts = [`${name}=${encodeURIComponent(value)}`]
  
  if (options.httpOnly) parts.push('HttpOnly')
  if (options.secure) parts.push('Secure')
  if (options.sameSite) parts.push(`SameSite=${options.sameSite}`)
  if (options.maxAge) parts.push(`Max-Age=${options.maxAge}`)
  if (options.path) parts.push(`Path=${options.path}`)
  
  // Set header directly on Node.js response object
  event.node.res.setHeader('Set-Cookie', parts.join('; '))
}
```

### Reading Request Body

```typescript
// ✅ WORKS - Stream-based body reading
export async function readRequestBody(event: H3Event): Promise<any> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    
    // Use Node.js stream API
    event.node.req.on('data', (chunk: Buffer) => {
      chunks.push(chunk)
    })
    
    event.node.req.on('end', () => {
      try {
        const body = Buffer.concat(chunks).toString('utf-8')
        const parsed = JSON.parse(body)
        resolve(parsed)
      } catch (error) {
        reject(error)
      }
    })
    
    event.node.req.on('error', reject)
  })
}
```

### Parsing Query Parameters

```typescript
// ✅ WORKS - Manual URL parsing
function parseQueryParams(event: H3Event): Record<string, string> {
  const url = event.node.req.url
  if (!url) return {}
  
  try {
    // Parse URL with base to handle relative paths
    const parsedUrl = new URL(url, 'http://localhost')
    const params: Record<string, string> = {}
    
    parsedUrl.searchParams.forEach((value, key) => {
      params[key] = value
    })
    
    return params
  } catch (error) {
    return {}
  }
}
```

## Implementation in Phantom

Our authentication system uses these patterns extensively:

### Session Management
- **File**: `server/utils/auth.ts`
- **Pattern**: Cookie-based sessions with in-memory storage
- **Implementation**: Direct Node.js header access for reading/writing session cookies

### Authentication Endpoints
- **Login**: `server/api/auth/login.post.ts` - Uses `readRequestBody()` for credentials
- **Logout**: `server/api/auth/logout.post.ts` - Uses cookie deletion
- **Session Check**: `server/api/auth/me.get.ts` - Uses cookie reading

### Article Endpoints
- **List**: `server/api/articles/index.get.ts` - Uses manual query parsing
- **Create**: `server/api/articles/create.post.ts` - Uses `readRequestBody()`
- **Update**: `server/api/articles/[id].put.ts` - Uses `readRequestBody()`

## Key Principles

### 1. Don't Import h3 Helper Functions
```typescript
// ❌ AVOID
import { getCookie, setCookie, readBody, getQuery, getRequestHeader } from 'h3'

// ✅ USE ONLY
import { H3Event } from 'h3'  // Just the type
```

### 2. Access Node.js Objects Directly
```typescript
// ✅ Request object
event.node.req.headers
event.node.req.url
event.node.req.on('data', ...)

// ✅ Response object  
event.node.res.setHeader(...)
event.node.res.writeHead(...)
```

### 3. Implement Manual Parsing
Instead of relying on h3's convenience functions, implement your own parsers:
- Cookie parsing from header strings
- Query parameter extraction from URLs
- Request body reading from streams

### 4. Use Native Node.js APIs
- `Buffer` for data handling
- Stream events (`data`, `end`, `error`)
- Native `URL` object for parsing
- Native header access via object properties

## Benefits of This Approach

1. **No h3 API dependency**: Your code works regardless of h3 version changes
2. **Stable**: Node.js APIs are stable and well-documented
3. **Transparent**: Direct access makes it clear what's happening
4. **Future-proof**: Works in both development and production
5. **Debugging**: Easier to debug since you control the entire flow

## When to Use This Approach

**Use direct Node.js APIs when:**
- Building authentication systems
- Handling cookies or sessions
- Reading request bodies
- Parsing query parameters
- Setting response headers
- Working with Nuxt 4 / h3 v2

**Standard h3 functions might work when:**
- Using Nuxt 3 with h3 v1
- Production builds (sometimes)
- Future h3 versions fix these issues

## Testing Your Implementation

Always test with actual requests, not just builds:

```bash
# Start dev server
npm run dev

# Test in browser or with curl
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"test"}'
```

Watch the terminal for errors like:
- `event.req.headers.get is not a function`
- `event.req.text is not a function`
- `Invalid URL`

If you see these, switch to direct Node.js API access.

## Conclusion

While h3 provides convenient helper functions, they may not work reliably with Nuxt 4 in development mode. The solution is to bypass h3 entirely and use Node.js native APIs directly through `event.node.req` and `event.node.res`.

This approach is more verbose but provides stability, predictability, and future-proofing for your Nuxt applications.

## Reference Implementation

See our complete implementation in:
- `server/utils/auth.ts` - Authentication utilities with cookie handling
- `server/api/auth/*.ts` - Auth endpoints using these patterns
- `server/api/articles/*.ts` - API endpoints with body/query parsing

All of these use direct Node.js API access exclusively and work perfectly with Nuxt 4 and h3 v2.
