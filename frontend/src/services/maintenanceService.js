import { API_BASE_URL, apiFetch } from "./api";

export async function getMaintenanceLogs({
  search = "",
  location = "",
  facilityType = "",
  issueType = "",
  severity = "",
  page = 1,
  limit = 10,
} = {}) {
  const params = new URLSearchParams({
    search,
    location,
    facility_type: facilityType,
    issue_type: issueType,
    severity,
    page: String(page),
    limit: String(limit),
  });

  const response = await apiFetch(
    `${API_BASE_URL}/maintenance-logs?${params.toString()}`
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || "Unable to load maintenance logs.");
  }

  return data;
}
