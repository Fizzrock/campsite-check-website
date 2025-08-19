
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
export default function middleware(request) {
  const url = new URL(request.url);

  // Allow static files
  if (url.pathname.match(/\.(css|js|png|jpg|jpeg|ico|svg|webp|woff2?)$/)) {
    return; // allow
  }

  const accessCode = process.env.ACCESS_CODE;
  if (!accessCode) {
    return new Response("Access code not configured on server.", { status: 500 });
  }

  const providedCode = url.searchParams.get("access_code");

  if (providedCode === accessCode) {
    return; // allow
  }

  return new Response("Access Denied", { status: 401 });
}