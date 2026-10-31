import acceptLanguage from 'accept-language';
import { type NextRequest, NextResponse } from 'next/server';
import type { Language } from 'shared/type/Language';
import { fallbackLng, languages } from './i18n/settings';

acceptLanguage.languages(languages);

export const config = {
  matcher: '/:lng*',
};

const cookieName = 'i18next';
const rootRewriteHeader = 'x-proxy-root-rewrite';

function rootRewriteRequestHeaders(req: NextRequest) {
  const headers = new Headers(req.headers);
  headers.set(rootRewriteHeader, '1');
  return headers;
}

export function proxy(req: NextRequest) {
  const cookieLng = req.cookies.get(cookieName)?.value;
  const headerLng = req.headers.get('Accept-Language');
  const lng =
    (cookieLng ? acceptLanguage.get(cookieLng) : undefined) ??
    (headerLng ? acceptLanguage.get(headerLng) : undefined) ??
    fallbackLng;

  if (
    !languages.some((loc) => req.nextUrl.pathname.startsWith(`/${loc}`)) &&
    !req.nextUrl.pathname.startsWith('/_next') &&
    !req.nextUrl.pathname.startsWith('/favicon') &&
    !req.nextUrl.pathname.startsWith('/og') &&
    !req.nextUrl.pathname.startsWith('/videos') &&
    !req.nextUrl.pathname.startsWith('/images') &&
    req.nextUrl.pathname !== '/'
  ) {
    return NextResponse.redirect(new URL(`/${lng}${req.nextUrl.pathname}`, req.url));
  }

  const isRoot = req.nextUrl.pathname === '/';
  const isRootRewrite = req.headers.get(rootRewriteHeader) === '1';
  const response = isRoot
    ? NextResponse.rewrite(new URL(`/${lng}`, req.url), { request: { headers: rootRewriteRequestHeaders(req) } })
    : NextResponse.next();

  if (isRoot || (isRootRewrite && req.nextUrl.pathname === `/${lng}`)) {
    response.headers.set('Cache-Control', 'private, no-store');
  }

  if (req.headers.has('referer')) {
    let lngInReferer: Language | undefined;
    try {
      const refererUrl = new URL(req.headers.get('referer') ?? req.url);
      lngInReferer = languages.find((l) => refererUrl.pathname.startsWith(`/${l}`));
    } catch {
      // malformed Referer header: leave the cookie untouched
    }
    if (lngInReferer) response.cookies.set(cookieName, lngInReferer);
  }

  return response;
}
