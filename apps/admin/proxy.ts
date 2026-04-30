import { NextResponse, type NextRequest } from "next/server";

const ADMIN_ROLE = "ADMIN";
const ADMIN_BASE_PATH = "/admin";
const ACCESS_DENIED_PATH = "/access-denied";

function getApiBaseUrl(): string {
  const value = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (value) return value.replace(/\/+$/, "");
  return "http://localhost:3001";
}

function getWebBaseUrl(): string {
  const value = process.env.NEXT_PUBLIC_WEB_URL?.trim();
  if (value) return value.replace(/\/+$/, "");
  return "http://localhost:3000";
}

function toAdminRelativePath(pathname: string): string {
  if (pathname === ADMIN_BASE_PATH) return "/";
  if (pathname.startsWith(`${ADMIN_BASE_PATH}/`)) {
    return pathname.slice(ADMIN_BASE_PATH.length);
  }
  return pathname;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignore non-admin paths in case matcher is broadened later.
  if (!(pathname === ADMIN_BASE_PATH || pathname.startsWith(`${ADMIN_BASE_PATH}/`))) {
    return NextResponse.next();
  }

  const adminRelativePath = toAdminRelativePath(pathname);
  if (adminRelativePath === ACCESS_DENIED_PATH) {
    return NextResponse.next();
  }

  const cookieHeader = request.headers.get("cookie") ?? "";
  const hasSessionCookie = cookieHeader.includes("access_token=") || cookieHeader.includes("refresh_token=");
  if (!hasSessionCookie) {
    return NextResponse.redirect(`${getWebBaseUrl()}/login`);
  }

  try {
    const response = await fetch(`${getApiBaseUrl()}/auth/profile`, {
      method: "GET",
      headers: { cookie: cookieHeader },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.redirect(`${getWebBaseUrl()}/login`);
    }

    const payload = (await response.json()) as { role?: string } | null;
    if (payload?.role !== ADMIN_ROLE) {
      const deniedUrl = request.nextUrl.clone();
      deniedUrl.pathname = `${ADMIN_BASE_PATH}${ACCESS_DENIED_PATH}`;
      deniedUrl.search = "";
      return NextResponse.redirect(deniedUrl);
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(`${getWebBaseUrl()}/login`);
  }
}

export const config = {
  matcher: ["/admin/:path*"],
};
