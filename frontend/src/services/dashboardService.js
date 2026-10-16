
const API_BASE_URL = "https://campuscare-api-ko8d.onrender.com/api";

export async function getDashboardStats() {
  const response = await fetch(`${API_BASE_URL}/dashboard-stats`);

  if (!response.ok) {
    throw new Error("Failed to load dashboard statistics.");
  }

  return response.json();
}
