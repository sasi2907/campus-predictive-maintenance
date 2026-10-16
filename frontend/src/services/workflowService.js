
const API_BASE_URL = "https://campus-predictive-maintenance-api.onrender.com/api";

export async function getMaintenanceWorkflowStats() {
  const response = await fetch(
    `${API_BASE_URL}/maintenance-workflow-stats`
  );

  if (!response.ok) {
    throw new Error("Unable to load maintenance workflow statistics.");
  }

  return response.json();
}
