import { request } from './client';

const isDevelopment = import.meta.env.DEV;

function debugLog(label, data) {
  if (!isDevelopment) {
    return;
  }

  console.group(`[API DEBUG] ${label}`);
  console.log(data);
  console.groupEnd();
}

function buildQueryParams(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      value !== ''
    ) {
      query.set(key, value);
    }
  });

  const queryString = query.toString();

  return queryString ? `?${queryString}` : '';
}


// GET /api/admin/users
export async function getAdminUsers({
  page,
  limit,
  department,
  role,
} = {}) {
  const query = buildQueryParams({
    page,
    limit,
    department,
    role,
  });

  const endpoint = `/api/admin/users${query}`;

  debugLog('ADMIN USERS → Request', {
    endpoint,
    method: 'GET',
    params: {
      page,
      limit,
      department,
      role,
    },
  });

  try {
    const response = await request(endpoint);

    debugLog('ADMIN USERS ← Response', {
      endpoint,
      response,
    });

    return response;
  } catch (error) {
    debugLog('ADMIN USERS ← Error Response', {
      endpoint,
      error: error.message,
    });

    throw error;
  }
}


// PATCH /api/admin/users/:userId/role
export async function updateUserRole(userId, role) {
  const endpoint = `/api/admin/users/${userId}/role`;

  debugLog('ADMIN USER ROLE → Request', {
    endpoint,
    method: 'PATCH',
    userId,
    role,
  });

  try {
    const response = await request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify({
        role,
      }),
    });

    debugLog('ADMIN USER ROLE ← Response', {
      endpoint,
      response,
    });

    return response;
  } catch (error) {
    debugLog('ADMIN USER ROLE ← Error Response', {
      endpoint,
      error: error.message,
    });

    throw error;
  }
}


// PATCH /api/admin/users/:userId/manager
export async function updateUserManager(userId, managerId) {
  const endpoint = `/api/admin/users/${userId}/manager`;

  debugLog('ADMIN USER MANAGER → Request', {
    endpoint,
    method: 'PATCH',
    userId,
    managerId,
  });

  try {
    const response = await request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify({
        managerId,
      }),
    });

    debugLog('ADMIN USER MANAGER ← Response', {
      endpoint,
      response,
    });

    return response;
  } catch (error) {
    debugLog('ADMIN USER MANAGER ← Error Response', {
      endpoint,
      error: error.message,
    });

    throw error;
  }
}


// PATCH /api/admin/users/:userId/status
export async function updateUserStatus(userId, status) {
  const endpoint = `/api/admin/users/${userId}/status`;

  debugLog('ADMIN USER STATUS → Request', {
    endpoint,
    method: 'PATCH',
    userId,
    status,
  });

  try {
    const response = await request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify({
        status,
      }),
    });

    debugLog('ADMIN USER STATUS ← Response', {
      endpoint,
      response,
    });

    return response;
  } catch (error) {
    debugLog('ADMIN USER STATUS ← Error Response', {
      endpoint,
      error: error.message,
    });

    throw error;
  }
}


// PATCH /api/admin/users/:userId/team-status
export async function updateUserTeamStatus(
  userId,
  teamStatus
) {
  const endpoint =
    `/api/admin/users/${userId}/team-status`;

  debugLog('ADMIN USER TEAM STATUS → Request', {
    endpoint,
    method: 'PATCH',
    userId,
    teamStatus,
  });

  try {
    const response = await request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify({
        teamStatus,
      }),
    });

    debugLog('ADMIN USER TEAM STATUS ← Response', {
      endpoint,
      response,
    });

    return response;
  } catch (error) {
    debugLog('ADMIN USER TEAM STATUS ← Error Response', {
      endpoint,
      error: error.message,
    });

    throw error;
  }
}


// GET /api/admin/teams
export async function getAdminTeams({
  page,
  limit,
} = {}) {
  const query = buildQueryParams({
    page,
    limit,
  });

  const endpoint = `/api/admin/teams${query}`;

  debugLog('ADMIN TEAMS → Request', {
    endpoint,
    method: 'GET',
    params: {
      page,
      limit,
    },
  });

  try {
    const response = await request(endpoint);

    debugLog('ADMIN TEAMS ← Response', {
      endpoint,
      response,
    });

    return response;
  } catch (error) {
    debugLog('ADMIN TEAMS ← Error Response', {
      endpoint,
      error: error.message,
    });

    throw error;
  }
}


// POST /api/admin/teams
export async function createAdminTeam(payload) {
  const endpoint = '/api/admin/teams';

  debugLog('ADMIN CREATE TEAM → Request', {
    endpoint,
    method: 'POST',
    payload,
  });

  try {
    const response = await request(endpoint, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    debugLog('ADMIN CREATE TEAM ← Response', {
      endpoint,
      response,
    });

    return response;
  } catch (error) {
    debugLog('ADMIN CREATE TEAM ← Error Response', {
      endpoint,
      error: error.message,
    });

    throw error;
  }
}


// PATCH /api/admin/teams/:teamId/review
export async function reviewAdminTeam(
  teamId,
  decision
) {
  const endpoint =
    `/api/admin/teams/${teamId}/review`;

  debugLog('ADMIN TEAM REVIEW → Request', {
    endpoint,
    method: 'PATCH',
    teamId,
    decision,
  });

  try {
    const response = await request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify({
        decision,
      }),
    });

    debugLog('ADMIN TEAM REVIEW ← Response', {
      endpoint,
      response,
    });

    return response;
  } catch (error) {
    debugLog('ADMIN TEAM REVIEW ← Error Response', {
      endpoint,
      error: error.message,
    });

    throw error;
  }
}


// DELETE /api/admin/teams/:teamId
export async function deleteAdminTeam(teamId) {
  const endpoint =
    `/api/admin/teams/${teamId}`;

  debugLog('ADMIN DELETE TEAM → Request', {
    endpoint,
    method: 'DELETE',
    teamId,
  });

  try {
    const response = await request(endpoint, {
      method: 'DELETE',
    });

    debugLog('ADMIN DELETE TEAM ← Response', {
      endpoint,
      response,
    });

    return response;
  } catch (error) {
    debugLog('ADMIN DELETE TEAM ← Error Response', {
      endpoint,
      error: error.message,
    });

    throw error;
  }
}


// POST /api/admin/teams/:teamId/members
export async function addTeamMember(
  teamId,
  userId
) {
  const endpoint =
    `/api/admin/teams/${teamId}/members`;

  debugLog('ADMIN ADD TEAM MEMBER → Request', {
    endpoint,
    method: 'POST',
    teamId,
    userId,
  });

  try {
    const response = await request(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        userId,
      }),
    });

    debugLog('ADMIN ADD TEAM MEMBER ← Response', {
      endpoint,
      response,
    });

    return response;
  } catch (error) {
    debugLog(
      'ADMIN ADD TEAM MEMBER ← Error Response',
      {
        endpoint,
        error: error.message,
      }
    );

    throw error;
  }
}