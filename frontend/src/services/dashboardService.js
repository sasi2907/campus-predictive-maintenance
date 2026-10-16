
const API_BASE_URL = "https://campus-predictive-maintenance-api.onrender.com/api";

export async function getDashboardStats() {
  const response = await fetch(`${API_BASE_URL}/dashboard-stats`);

  if (!response.ok) {
    throw new Error("Failed to load dashboard statistics.");
  }

  return response.json();
}
