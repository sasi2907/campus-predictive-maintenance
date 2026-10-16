
const API_BASE_URL = "http://localhost:5000/api";

export async function getDashboardStats() {
  const response = await fetch(`${API_BASE_URL}/dashboard-stats`);

  if (!response.ok) {
    throw new Error("Failed to load dashboard statistics.");
  }

  return response.json();
}
