
const API_BASE_URL = "http://localhost:5000/api";

export async function predictFacilityRisk(formData) {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });
  } catch {
    throw new Error(
      "Unable to connect to the prediction API. Make sure the Flask server is running."
    );
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.error || `Prediction failed with status ${response.status}.`
    );
  }

  return data;
}
