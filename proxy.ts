import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV === "development";

  const contentSecurityPolicy = [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "form-action 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    // No nonce here on purpose: a nonce makes browsers ignore 'unsafe-inline',
    // and next/image, Radix and the loading skeleton all set style attributes,
    // which cannot carry a nonce. Scripts keep the strict nonce policy.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://www.thesportsdb.com https://r2.thesportsdb.com https://images.thesportsdb.com https://upload.wikimedia.org https://thumb.wikimedia.org",
    "font-src 'self' https://fonts.gstatic.com",
    `connect-src 'self' https://api.the-odds-api.com https://www.thesportsdb.com https://generativelanguage.googleapis.com${isDev ? " ws: wss:" : ""}`,
    "upgrade-insecure-requests",
  ]
    .join("; ")
    .replace(/\s{2,}/g, " ")
    .trim();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", contentSecurityPolicy);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set("Content-Security-Policy", contentSecurityPolicy);
  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
