import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  console.log("req is ", req)
  const token = await getToken({ req })
  console.log("middleware token is ", token)
  if (!token) {
    return NextResponse.redirect(new URL('/sign-in', req.nextUrl))
  }
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ['/r/:path*/submit', '/r/create'],
}
