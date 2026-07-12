const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

if (!BASE_URL) {
  // Fails loudly in dev instead of silently hitting a relative path
  console.warn("NEXT_PUBLIC_BACKEND_URL is not set — API calls will fail.");
}

interface ApiOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

export async function apiFetch<T>(route: string, options: ApiOptions = {}): Promise<T> {
  const { params, ...init } = options;

  const url = new URL(`${BASE_URL ?? ""}${route.startsWith("/") ? route : `/${route}`}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
    });
  }

  const res = await fetch(url.toString(), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
    credentials: "include",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API ${route} failed: ${res.status} ${body}`);
  }

  // Handle empty responses (e.g. 204 on DELETE)
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}
