// The old Pages address sends people to the evaluation site.
// The path and query string are kept. /api stays here so the Pages functions still answer.
const PAGES_HOST = "thegoodspan-assessment.pages.dev";
const DESTINATION = "https://evaluation.thegoodspan.com";

export async function onRequest(context) {
  const url = new URL(context.request.url);
  if (url.hostname !== PAGES_HOST) return context.next();
  if (url.pathname === "/api" || url.pathname.startsWith("/api/")) return context.next();
  const target = new URL(DESTINATION);
  target.pathname = url.pathname;
  target.search = url.search;
  return Response.redirect(target.toString(), 302);
}
