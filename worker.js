const CANONICAL_HOST = "oceanliners.net";
const LEGACY_ORIGIN = "https://www.oceanliners.net";
const CANONICAL_ORIGIN = "https://oceanliners.net";

function normalizeUrl(value) {
  if (!value || !value.startsWith(LEGACY_ORIGIN)) return value;
  return CANONICAL_ORIGIN + value.slice(LEGACY_ORIGIN.length);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.hostname.toLowerCase() === "www.oceanliners.net") {
      url.protocol = "https:";
      url.hostname = CANONICAL_HOST;
      return Response.redirect(url.toString(), 301);
    }

    const response = await env.ASSETS.fetch(request);
    const contentType = response.headers.get("content-type") || "";

    if (!contentType.toLowerCase().includes("text/html")) {
      return response;
    }

    return new HTMLRewriter()
      .on('[href^="https://www.oceanliners.net"]', {
        element(element) {
          element.setAttribute("href", normalizeUrl(element.getAttribute("href")));
        },
      })
      .on('[src^="https://www.oceanliners.net"]', {
        element(element) {
          element.setAttribute("src", normalizeUrl(element.getAttribute("src")));
        },
      })
      .on('meta[content^="https://www.oceanliners.net"]', {
        element(element) {
          element.setAttribute("content", normalizeUrl(element.getAttribute("content")));
        },
      })
      .transform(response);
  },
};
