import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";
import { PATHNAME_HEADER, signInPath } from "@/lib/auth/paths";

// Optimistic check only: is there a session cookie at all? No database access.
// Pages, actions and route handlers must still call requireSession() / requireRole().
export const proxy = (request: NextRequest) => {
	const { pathname, search } = request.nextUrl;
	const currentPath = `${pathname}${search}`;

	if (!getSessionCookie(request)) {
		return NextResponse.redirect(new URL(signInPath(currentPath), request.url));
	}

	// lets requireSession() send the visitor back here after signing in again
	const requestHeaders = new Headers(request.headers);
	requestHeaders.set(PATHNAME_HEADER, currentPath);
	return NextResponse.next({ request: { headers: requestHeaders } });
};

// protected routes; Next.js needs this list to be a static literal
export const config = {
	matcher: ["/dashboard/:path*", "/admin/:path*", "/account/:path*"],
};
