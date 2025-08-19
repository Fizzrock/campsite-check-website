
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
export function middleware(request) {
  // Retrieve the secret access code from environment variables.
  const accessCode = process.env.ACCESS_CODE;

  // If the access code isn't configured on the server, it's a server error.
  if (!accessCode) {
    return new Response('Access code not configured on server.', { status: 500 });
  }

  // Use the standard URL API to parse the request URL.
  const url = new URL(request.url);
  const providedCode = url.searchParams.get('access_code');

  // If the provided code matches the secret, let the request proceed.
  // In Vercel Edge Middleware (for non-Next.js projects), returning nothing
  // allows the request to continue to its destination.
  if (providedCode === accessCode) {
    return;
  }

  // Otherwise, deny access using the standard Response API.
  return new Response('Access Denied', { status: 401 });
}

// This config ensures the middleware runs only on page requests, not on your API route.
export const config = {
  matcher: '/((?!api/).*)',
};