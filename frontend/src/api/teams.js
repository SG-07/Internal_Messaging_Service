// src/api/teams.js
import { request } from "./client";

const isDevelopment = import.meta.env.DEV;

function debugLog(label, data) {
  if (!isDevelopment) {
    return;
  }

  console.group(`[API DEBUG] ${label}`);
  console.log(data);
  console.groupEnd();
}

/*
 * ============================================================
 * MY TEAMS
 * ============================================================
 */

// GET /api/teams/me/teams
export async function getMyTeams(params = {}) {
  const query = new URLSearchParams();

  query.set("page", String(params.page || 1));

  const queryString = query.toString();

  const endpoint = queryString
    ? `/api/teams/me/teams?${queryString}`
    : "/api/teams/me/teams";

  debugLog("MY TEAMS → Request", {
    endpoint,
    method: "GET",
    params,
  });

  try {
    const response = await request(endpoint);

    debugLog("MY TEAMS ← Response", {
      endpoint,
      response,
    });

    return response;
  } catch (error) {
    debugLog("MY TEAMS ← Error", {
      endpoint,
      error: error.message,
    });

    throw error;
  }
}

export const getTeamConversation = async (teamId) => {
  return request(`/api/teams/${teamId}/conversation`, {
    method: "GET",
  });
};

/*
 * ============================================================
 * MANAGER - TEAM REQUESTS
 * ============================================================
 */

// GET /api/teams/my-requests
export async function getMyTeamRequests() {
  const endpoint = "/api/teams/my-requests";

  debugLog("MY TEAM REQUESTS → Request", {
    endpoint,
    method: "GET",
  });

  try {
    const response = await request(endpoint);

    debugLog("MY TEAM REQUESTS ← Response", {
      endpoint,
      response,
    });

    return response;
  } catch (error) {
    debugLog("MY TEAM REQUESTS ← Error", {
      endpoint,
      error: error.message,
    });

    throw error;
  }
}

/*
 * ============================================================
 * MANAGER - CREATE TEAM REQUEST
 * ============================================================
 */

// POST /api/teams/request
export async function requestTeam(payload) {
  const endpoint = "/api/teams/request";

  debugLog("CREATE TEAM REQUEST → Request", {
    endpoint,
    method: "POST",
    payload,
  });

  try {
    const response = await request(endpoint, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    debugLog("CREATE TEAM REQUEST ← Response", {
      endpoint,
      response,
    });

    return response;
  } catch (error) {
    debugLog("CREATE TEAM REQUEST ← Error", {
      endpoint,
      error: error.message,
    });

    throw error;
  }
}

