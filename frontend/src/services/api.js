
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:5000/api"
).replace(/\/+$/, "");

const sleep = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

export async function apiFetch(url, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const shouldRetry = method === "GET";
  const maxAttempts = shouldRetry ? 3 : 1;

  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(url, options);

      // Retry temporary server errors for GET requests.
      if (
        shouldRetry &&
        response.status >= 500 &&
        attempt < maxAttempts
      ) {
        await response.body?.cancel();
        await sleep(attempt * 1500);
        continue;
      }

      return response;
    } catch (error) {
      lastError = error;

      if (attempt === maxAttempts) {
        throw error;
      }

      await sleep(attempt * 1500);
    }
  }

  throw lastError || new Error("The API request failed.");
}

export { API_BASE_URL };
