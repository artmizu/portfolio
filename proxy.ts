import acceptLanguage from 'accept-language';
import { type NextRequest, NextResponse } from 'next/server';
import type { Language } from 'shared/type/Language';
import { fallbackLng, languages } from './i18n/settings';

acceptLanguage.languages(languages);

export const config = {
  matcher: '/:lng*',
};

const cookieName = 'i18next';

export function proxy(req: NextRequest) {
  const cookieLng = req.cookies.get(cookieName)?.value;
  const lng = acceptLanguage.get(cookieLng) ?? acceptLanguage.get(req.headers.get('Accept-Language')) ?? fallbackLng;

  if (
    !languages.some((loc) => req.nextUrl.pathname.startsWith(`/${loc}`)) &&
    !req.nextUrl.pathname.startsWith('/_next') &&
    !req.nextUrl.pathname.startsWith('/favicon') &&
    !req.nextUrl.pathname.startsWith('/og') &&
    !req.nextUrl.pathname.startsWith('/videos') &&
    !req.nextUrl.pathname.startsWith('/images')
  ) {
    return NextResponse.redirect(new URL(`/${lng}${req.nextUrl.pathname}`, req.url));
  }

  if (req.headers.has('referer')) {
    const response = NextResponse.next();
    let lngInReferer: Language | undefined;
    try {
      const refererUrl = new URL(req.headers.get('referer') ?? req.url);
      lngInReferer = languages.find((l) => refererUrl.pathname.startsWith(`/${l}`));
    } catch {
      // malformed Referer header: leave the cookie untouched
    }
    if (lngInReferer) response.cookies.set(cookieName, lngInReferer);
    return response;
  }

  return NextResponse.next();
}
