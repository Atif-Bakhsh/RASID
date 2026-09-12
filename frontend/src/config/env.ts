const API_PATH_SUFFIX = "/api/v1";

export function getApiBaseUrl(): string {
  const value = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();

  if (!value) {
    throw new Error(
      "NEXT_PUBLIC_API_BASE_URL is required. Copy .env.example to .env.local.",
    );
  }

  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error("NEXT_PUBLIC_API_BASE_URL must be an absolute URL.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("NEXT_PUBLIC_API_BASE_URL must use HTTP or HTTPS.");
  }

  if (url.username || url.password || url.search || url.hash) {
    throw new Error(
      "NEXT_PUBLIC_API_BASE_URL cannot include credentials, a query, or a fragment.",
    );
  }

  const normalizedPath = url.pathname.replace(/\/+$/, "");

  if (!normalizedPath.endsWith(API_PATH_SUFFIX)) {
    throw new Error(
      `NEXT_PUBLIC_API_BASE_URL must end with ${API_PATH_SUFFIX}.`,
    );
  }

  url.pathname = normalizedPath;
  return url.toString().replace(/\/$/, "");
}
