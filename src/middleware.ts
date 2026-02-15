import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Match only internationalized pathnames, excluding API routes and static files
  matcher: ['/', '/(zh|en)/:path*', '/((?!api|_next|.*\\..*).*)']  
}; 