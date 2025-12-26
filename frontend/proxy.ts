import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';

const handleI18nRouting = createMiddleware({
    // A list of all locales that are supported
    locales: ['vi', 'en', 'zh'],

    // Used when no locale matches
    defaultLocale: 'vi',

    // Hide the prefix for the default locale
    localePrefix: 'as-needed'
});

export default function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Force 'vi' locale (which is now root path) for all admin paths
    // Redirect /en/admin or /zh/admin or /vi/admin (though as-needed handles vi) to /admin
    if (pathname.includes('/admin')) {
        const localePattern = /^\/(en|zh)\/admin/;
        if (localePattern.test(pathname)) {
            // Redirect to /admin (which renders vi under the hood due to defaultLocale)
            const newUrl = new URL(pathname.replace(localePattern, '/admin'), request.url);
            return NextResponse.redirect(newUrl);
        }

        // 2. Prevent next-intl from redirecting purely based on cookie/header user preference
        // by tricking it into thinking the user wants 'vi'.
        // This stops the infinite loop: /admin (w/ en cookie) -> /en/admin -> /admin ...
        request.headers.set('accept-language', 'vi');
        request.cookies.set('NEXT_LOCALE', 'vi');
    }

    return handleI18nRouting(request);
}

export const config = {
    // Match all pathnames except for
    // - … if they start with `/api`, `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
