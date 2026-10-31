import acceptLanguage from 'accept-language';
import { type NextRequest, NextResponse } from 'next/server';
import type { Language } from 'shared/type/Language';
import { fallbackLng, languages } from './i18n/settings';

acceptLanguage.languages(languages);

export const config = {
  matcher: '/:lng*',
};

const cookieName = 'i18next';
const rootRewriteMarker = 'x-proxy-root-rewrite';
const rootRewriteToken = crypto.randomUUID();
const excludedPaths = ['/_next', '/favicon.ico', '/favicon.png', '/og.jpg', '/videos', '/images'];

function matchesPath(pathname: string, target: string) {
  return pathname === target || pathname.startsWith(`${target}/`);
}

function isLocalePath(pathname: string) {
  return languages.some((lng) => matchesPath(pathname, `/${lng}`));
}

function isExcludedPath(pathname: string) {
  return excludedPaths.some((target) => matchesPath(pathname, target));
}

function requestHeadersWithoutMarker(req: NextRequest, marker?: string) {
  const headers = new Headers(req.headers);
  headers.delete(rootRewriteMarker);
  if (marker) headers.set(rootRewriteMarker, marker);
  return headers;
}

export function proxy(req: NextRequest) {
  const cookieLng = req.cookies.get(cookieName)?.value;
  const headerLng = req.headers.get('Accept-Language');
  const lng =
    (cookieLng ? acceptLanguage.get(cookieLng) : undefined) ??
    (headerLng ? acceptLanguage.get(headerLng) : undefined) ??
    fallbackLng;

  const { pathname, search } = req.nextUrl;
  const isRoot = pathname === '/';

  if (!isLocalePath(pathname) && !isExcludedPath(pathname) && !isRoot) {
    return NextResponse.redirect(new URL(`/${lng}${pathname}${search}`, req.url));
  }

  const marker = req.headers.get(rootRewriteMarker);
  const nextHeaders = marker ? requestHeadersWithoutMarker(req) : null;

  const response = isRoot
    ? NextResponse.rewrite(new URL(`/${lng}${search}`, req.url), {
        request: { headers: requestHeadersWithoutMarker(req, rootRewriteToken) },
      })
    : nextHeaders
      ? NextResponse.next({ request: { headers: nextHeaders } })
      : NextResponse.next();

  if (isRoot || marker === rootRewriteToken) {
    response.headers.set('Cache-Control', 'private, no-store');
  }

  if (req.headers.has('referer')) {
    let lngInReferer: Language | undefined;
    try {
      const refererUrl = new URL(req.headers.get('referer') ?? req.url);
      if (refererUrl.host === (req.headers.get('host') ?? req.nextUrl.host)) {
        lngInReferer = languages.find((l) => matchesPath(refererUrl.pathname, `/${l}`));
      }
    } catch {
      // malformed Referer header: leave the cookie untouched
    }
    if (lngInReferer) response.cookies.set(cookieName, lngInReferer);
  }

  return response;
}
