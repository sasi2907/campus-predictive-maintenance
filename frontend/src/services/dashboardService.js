import { API_BASE_URL, apiFetch } from "./api";

export async function getDashboardStats() {
  const response = await apiFetch(`${API_BASE_URL}/dashboard-stats`);

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.error || "Failed to load dashboard statistics."
    );
  }

  return data;
}
