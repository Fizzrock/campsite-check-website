
/**
 * Vercel Edge Middleware to protect the website with a URL-based access code.
 *
 * How it works:
 * 1. It intercepts all incoming requests to the website (except for API routes and static files).
 * 2. It reads the secret `ACCESS_CODE` from your Vercel Environment Variables.
 * 3. It checks if the request URL contains a matching `?access_code=...` query parameter.
 * 4. If the code is correct, it allows the user to see the page.
 * 5. If the code is incorrect or missing, it blocks the request with an "Access Denied" message.
 */
import { NextResponse } from "next/server";

export function middleware(req) {
  console.log(`[Middleware] Running for path: ${req.url}`);

  const accessCode = process.env.ACCESS_CODE;
  if (!accessCode) {
    return new NextResponse("Access code not configured on server.", { status: 500 });
  }

  const url = new URL(req.url);
  const providedCode = url.searchParams.get("access_code");

  if (providedCode === accessCode) {
    console.log("[Middleware] Access code matched. Allowing request.");
    return NextResponse.next(); // ✅ must explicitly return
  }

  console.log("[Middleware] Access code missing or incorrect. Denying access.");
  return new NextResponse("Access Denied", { status: 401 });
}

export const config = {
  matcher: "/((?!api|_next|favicon.ico).*)"
};