
import { API_BASE_URL, apiFetch } from "./api";

export async function getMaintenanceWorkflowStats() {
  const response = await apiFetch(
    `${API_BASE_URL}/maintenance-workflow-stats`
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.error || "Unable to load maintenance workflow statistics."
    );
  }

  return data;
}
