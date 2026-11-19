const API_BASE_URL = "http://127.0.0.1:8000";


// ------------------------------------------------
// Handle API Response
// ------------------------------------------------

async function handleResponse(response) {
  let data;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    let errorMessage = "Request failed";

    if (data?.detail) {
      if (typeof data.detail === "string") {
        errorMessage = data.detail;
      } else {
        errorMessage = JSON.stringify(
          data.detail
        );
      }
    }

    throw new Error(errorMessage);
  }

  return data;
}


// ------------------------------------------------
// Health Check
// ------------------------------------------------

export async function checkHealth() {
  const response = await fetch(
    `${API_BASE_URL}/health`
  );

  return handleResponse(response);
}


// ------------------------------------------------
// Create Incident
// ------------------------------------------------

export async function createIncident(
  incidentData
) {
  const response = await fetch(
    `${API_BASE_URL}/incidents`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(
        incidentData
      ),
    }
  );

  return handleResponse(response);
}


// ------------------------------------------------
// Get All Incidents
// ------------------------------------------------

export async function getIncidents(
  skip = 0,
  limit = 100
) {
  const response = await fetch(
    `${API_BASE_URL}/incidents?skip=${skip}&limit=${limit}`
  );

  return handleResponse(response);
}


// ------------------------------------------------
// Get One Incident
// ------------------------------------------------

export async function getIncident(
  incidentId
) {
  const response = await fetch(
    `${API_BASE_URL}/incidents/${incidentId}`
  );

  return handleResponse(response);
}


// ------------------------------------------------
// Correlate Incident
//
// Embedding
// +
// Cosine Similarity
// +
// Historical RCA
// +
// Previous Resolution
// ------------------------------------------------

export async function correlateIncident(
  incidentId,
  topK = 5,
  minSimilarity = 0.5
) {
  const params = new URLSearchParams({
    top_k: String(topK),
    min_similarity: String(
      minSimilarity
    ),
  });

  const response = await fetch(
    `${API_BASE_URL}/incidents/${incidentId}/correlate?${params.toString()}`,
    {
      method: "POST",
    }
  );

  return handleResponse(response);
}


// ------------------------------------------------
// Complete Incident Analysis
//
// Correlation
// +
// RCA
// +
// Recommendation
// ------------------------------------------------

export async function analyzeIncident(
  incidentId,
  topK = 5,
  minSimilarity = 0.5
) {
  const params = new URLSearchParams({
    top_k: String(topK),
    min_similarity: String(
      minSimilarity
    ),
  });

  const response = await fetch(
    `${API_BASE_URL}/incidents/${incidentId}/analyze?${params.toString()}`,
    {
      method: "POST",
    }
  );

  return handleResponse(response);
}


// ------------------------------------------------
// ML Root Cause Prediction
// ------------------------------------------------

export async function predictRootCause(
  incidentId
) {
  const response = await fetch(
    `${API_BASE_URL}/incidents/${incidentId}/predict-root-cause`,
    {
      method: "POST",
    }
  );

  return handleResponse(response);
}


// ------------------------------------------------
// Recurring Incident Patterns
// ------------------------------------------------

export async function getRecurringPatterns(
  minimumCount = 2
) {
  const params = new URLSearchParams({
    minimum_count: String(
      minimumCount
    ),
  });

  const response = await fetch(
    `${API_BASE_URL}/patterns/recurring?${params.toString()}`
  );

  return handleResponse(response);
}

// ------------------------------------------------
// Dashboard Summary
// ------------------------------------------------

export async function getDashboardSummary() {
  const response = await fetch(
    `${API_BASE_URL}/dashboard/summary`
  );

  return handleResponse(response);
}