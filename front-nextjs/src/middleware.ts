import { NextRequest, NextResponse } from "next/server";
import { DASHBOARD_PAGES } from "./config/pages/dashboard.config";
import { PUBLIC_PAGES } from "./config/pages/public.config";
import { protectDashboardPages } from "./server-actions/middlewares/protect-dashboard.middleware";
import { protectLoginPages } from "./server-actions/middlewares/protect-login.middleware";

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith(PUBLIC_PAGES.AUTH)) {
    return protectLoginPages(request);
  }

  if (
    pathname.startsWith(DASHBOARD_PAGES.HOME) ||
    pathname.startsWith("/admin") ||
    pathname.startsWith('/turniket')
  ) {
    return protectDashboardPages(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/auth/:path*", '/turniket/:path*'],
};
