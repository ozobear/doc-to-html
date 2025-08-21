import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Rate limiting usando Map en memoria (para producción considerar Redis)
const rateLimitMap = new Map<string, { count: number; lastReset: number }>()

const RATE_LIMIT = {
  windowMs: 15 * 60 * 1000, // 15 minutos
  maxRequests: 100, // máximo 100 requests por ventana
  maxUploads: 10, // máximo 10 uploads por ventana para usuarios no autenticados
  maxUploadsAuth: 50, // máximo 50 uploads por ventana para usuarios autenticados
}

function getRateLimitKey(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown'
  return ip
}

function checkRateLimit(key: string, limit: number): boolean {
  const now = Date.now()
  const userLimit = rateLimitMap.get(key)

  if (!userLimit || now - userLimit.lastReset > RATE_LIMIT.windowMs) {
    rateLimitMap.set(key, { count: 1, lastReset: now })
    return true
  }

  if (userLimit.count >= limit) {
    return false
  }

  userLimit.count++
  return true
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Aplicar rate limiting
  const key = getRateLimitKey(request)
  
  // Rate limiting más estricto para uploads
  if (pathname.startsWith('/api/upload')) {
    const token = await getToken({ req: request })
    const uploadLimit = token ? RATE_LIMIT.maxUploadsAuth : RATE_LIMIT.maxUploads
    
    if (!checkRateLimit(`${key}:upload`, uploadLimit)) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Intenta más tarde.' },
        { status: 429 }
      )
    }
  }

  // Rate limiting general para APIs
  if (pathname.startsWith('/api/')) {
    if (!checkRateLimit(key, RATE_LIMIT.maxRequests)) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Intenta más tarde.' },
        { status: 429 }
      )
    }
  }

  // Headers de seguridad
  const response = NextResponse.next()

  // Content Security Policy
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' blob: data: https:;
    font-src 'self' https://fonts.gstatic.com;
    connect-src 'self' https://vercel.live;
    frame-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim()

  response.headers.set('Content-Security-Policy', cspHeader)
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  response.headers.set('X-DNS-Prefetch-Control', 'off')

  // Solo HTTPS en producción
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}