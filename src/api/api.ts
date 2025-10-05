const BASE_URL = "https://wdp-cx4ay950n-huyphan1232203s-projects.vercel.app";

export async function apiRequest(
  endpoint: string,
  options?: RequestInit
) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    ...options,
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return response.json();
}