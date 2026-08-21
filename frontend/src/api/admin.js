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
      value === undefined ||
      value === null ||
      value === ''
    ) {
      return;
    }

    if (Array.isArray(value)) {
      if (value.length > 0) {
        query.set(key, value.join(','));
      }

      return;
    }

    query.set(key, value);
  });

  const queryString = query.toString();

  return queryString
    ? `?${queryString}`
    : '';
}


// ============================================================
// ADMIN USERS
// ============================================================


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

  const endpoint =
    `/api/admin/users${query}`;

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
    const response =
      await request(endpoint);

    debugLog('ADMIN USERS ← Response', {
      endpoint,
      response,
    });

    return response;
  } catch (error) {
    debugLog(
      'ADMIN USERS ← Error Response',
      {
        endpoint,
        error: error.message,
      }
    );

    throw error;
  }
}


// GET /api/admin/users/:userId/profile
export async function getUserProfile(
  userId
) {
  const endpoint =
    `/api/admin/users/${userId}/profile`;

  debugLog(
    'ADMIN USER PROFILE → Request',
    {
      endpoint,
      method: 'GET',
      userId,
    }
  );

  try {
    const response =
      await request(endpoint);

    debugLog(
      'ADMIN USER PROFILE ← Response',
      {
        endpoint,
        response,
      }
    );

    return response;
  } catch (error) {
    debugLog(
      'ADMIN USER PROFILE ← Error Response',
      {
        endpoint,
        error: error.message,
      }
    );

    throw error;
  }
}


// PATCH /api/admin/users/:userId/role
export async function updateUserRole(
  userId,
  payload
) {
  const endpoint =
    `/api/admin/users/${userId}/role`;

  const body =
    typeof payload === 'string'
      ? { role: payload }
      : payload;

  debugLog(
    'ADMIN USER ROLE → Request',
    {
      endpoint,
      method: 'PATCH',
      userId,
      payload: body,
    }
  );

  try {
    const response =
      await request(endpoint, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });

    debugLog(
      'ADMIN USER ROLE ← Response',
      {
        endpoint,
        response,
      }
    );

    return response;
  } catch (error) {
    debugLog(
      'ADMIN USER ROLE ← Error Response',
      {
        endpoint,
        error: error.message,
      }
    );

    throw error;
  }
}


// PATCH /api/admin/users/:userId/manager
//
// Accepts either:
// updateUserManager(userId, managerId)
//
// or:
// updateUserManager(userId, {
//   manager_id: 'uuid'
// })
export async function updateUserManager(
  userId,
  payload
) {
  const endpoint =
    `/api/admin/users/${userId}/manager`;

  const body =
    typeof payload === 'object' &&
    payload !== null
      ? payload
      : {
          manager_id: payload || null,
        };

  debugLog(
    'ADMIN USER MANAGER → Request',
    {
      endpoint,
      method: 'PATCH',
      userId,
      payload: body,
    }
  );

  try {
    const response =
      await request(endpoint, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });

    debugLog(
      'ADMIN USER MANAGER ← Response',
      {
        endpoint,
        response,
      }
    );

    return response;
  } catch (error) {
    debugLog(
      'ADMIN USER MANAGER ← Error Response',
      {
        endpoint,
        error: error.message,
      }
    );

    throw error;
  }
}


// PATCH /api/admin/users/:userId/department
//
// Backend endpoint to add:
// PATCH /api/admin/users/:userId/department
//
// Expected body:
// {
//   department: 'HR'
// }
//
// or:
// {
//   department: null
// }
export async function updateUserDepartment(
  userId,
  payload
) {
  const endpoint =
    `/api/admin/users/${userId}/department`;

  const body =
    typeof payload === 'object' &&
    payload !== null
      ? payload
      : {
          department: payload || null,
        };

  debugLog(
    'ADMIN USER DEPARTMENT → Request',
    {
      endpoint,
      method: 'PATCH',
      userId,
      payload: body,
    }
  );

  try {
    const response =
      await request(endpoint, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });

    debugLog(
      'ADMIN USER DEPARTMENT ← Response',
      {
        endpoint,
        response,
      }
    );

    return response;
  } catch (error) {
    debugLog(
      'ADMIN USER DEPARTMENT ← Error Response',
      {
        endpoint,
        error: error.message,
      }
    );

    throw error;
  }
}


// PATCH /api/admin/users/:userId/status
//
// Expected body:
// {
//   is_active: true,
//   comment: 'Reason for activation'
// }
export async function updateUserStatus(
  userId,
  payload
) {
  const endpoint =
    `/api/admin/users/${userId}/status`;

  const body =
    typeof payload === 'object' &&
    payload !== null
      ? payload
      : {
          is_active: Boolean(payload),
        };

  debugLog(
    'ADMIN USER STATUS → Request',
    {
      endpoint,
      method: 'PATCH',
      userId,
      payload: body,
    }
  );

  try {
    const response =
      await request(endpoint, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });

    debugLog(
      'ADMIN USER STATUS ← Response',
      {
        endpoint,
        response,
      }
    );

    return response;
  } catch (error) {
    debugLog(
      'ADMIN USER STATUS ← Error Response',
      {
        endpoint,
        error: error.message,
      }
    );

    throw error;
  }
}


// PATCH /api/admin/users/:userId/team-status
//
// Expected body:
// {
//   team_status: 'active'
// }
export async function updateUserTeamStatus(
  userId,
  payload
) {
  const endpoint =
    `/api/admin/users/${userId}/team-status`;

  const body =
    typeof payload === 'object' &&
    payload !== null
      ? payload
      : {
          team_status: payload,
        };

  debugLog(
    'ADMIN USER TEAM STATUS → Request',
    {
      endpoint,
      method: 'PATCH',
      userId,
      payload: body,
    }
  );

  try {
    const response =
      await request(endpoint, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });

    debugLog(
      'ADMIN USER TEAM STATUS ← Response',
      {
        endpoint,
        response,
      }
    );

    return response;
  } catch (error) {
    debugLog(
      'ADMIN USER TEAM STATUS ← Error Response',
      {
        endpoint,
        error: error.message,
      }
    );

    throw error;
  }
}


// ============================================================
// ADMIN TEAMS
// ============================================================


// GET /api/admin/teams
export async function getAdminTeams({
  page,
  limit,
} = {}) {
  const query = buildQueryParams({
    page,
    limit,
  });

  const endpoint =
    `/api/admin/teams${query}`;

  debugLog(
    'ADMIN TEAMS → Request',
    {
      endpoint,
      method: 'GET',
      params: {
        page,
        limit,
      },
    }
  );

  try {
    const response =
      await request(endpoint);

    debugLog(
      'ADMIN TEAMS ← Response',
      {
        endpoint,
        response,
      }
    );

    return response;
  } catch (error) {
    debugLog(
      'ADMIN TEAMS ← Error Response',
      {
        endpoint,
        error: error.message,
      }
    );

    throw error;
  }
}


// GET /api/admin/teams/:teamId/edit
export async function getAdminTeam(
  teamId
) {
  const endpoint =
    `/api/admin/teams/${teamId}/edit`;

  debugLog(
    'ADMIN TEAM → Request',
    {
      endpoint,
      method: 'GET',
      teamId,
    }
  );

  try {
    const response =
      await request(endpoint);

    debugLog(
      'ADMIN TEAM ← Response',
      {
        endpoint,
        response,
      }
    );

    return response;
  } catch (error) {
    debugLog(
      'ADMIN TEAM ← Error Response',
      {
        endpoint,
        error: error.message,
      }
    );

    throw error;
  }
}


// POST /api/admin/teams
export async function createAdminTeam(
  payload
) {
  const endpoint =
    '/api/admin/teams';

  debugLog(
    'ADMIN CREATE TEAM → Request',
    {
      endpoint,
      method: 'POST',
      payload,
    }
  );

  try {
    const response =
      await request(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

    debugLog(
      'ADMIN CREATE TEAM ← Response',
      {
        endpoint,
        response,
      }
    );

    return response;
  } catch (error) {
    debugLog(
      'ADMIN CREATE TEAM ← Error Response',
      {
        endpoint,
        error: error.message,
      }
    );

    throw error;
  }
}


// PATCH /api/admin/teams/:teamId
export async function updateAdminTeam(
  teamId,
  payload
) {
  const endpoint =
    `/api/admin/teams/${teamId}`;

  debugLog(
    'ADMIN UPDATE TEAM → Request',
    {
      endpoint,
      method: 'PATCH',
      teamId,
      payload,
    }
  );

  try {
    const response =
      await request(endpoint, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });

    debugLog(
      'ADMIN UPDATE TEAM ← Response',
      {
        endpoint,
        response,
      }
    );

    return response;
  } catch (error) {
    debugLog(
      'ADMIN UPDATE TEAM ← Error Response',
      {
        endpoint,
        error: error.message,
      }
    );

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

  debugLog(
    'ADMIN TEAM REVIEW → Request',
    {
      endpoint,
      method: 'PATCH',
      teamId,
      decision,
    }
  );

  try {
    const response =
      await request(endpoint, {
        method: 'PATCH',
        body: JSON.stringify({
          decision,
        }),
      });

    debugLog(
      'ADMIN TEAM REVIEW ← Response',
      {
        endpoint,
        response,
      }
    );

    return response;
  } catch (error) {
    debugLog(
      'ADMIN TEAM REVIEW ← Error Response',
      {
        endpoint,
        error: error.message,
      }
    );

    throw error;
  }
}


// DELETE /api/admin/teams/:teamId
export async function deleteAdminTeam(
  teamId
) {
  const endpoint =
    `/api/admin/teams/${teamId}`;

  debugLog(
    'ADMIN DELETE TEAM → Request',
    {
      endpoint,
      method: 'DELETE',
      teamId,
    }
  );

  try {
    const response =
      await request(endpoint, {
        method: 'DELETE',
      });

    debugLog(
      'ADMIN DELETE TEAM ← Response',
      {
        endpoint,
        response,
      }
    );

    return response;
  } catch (error) {
    debugLog(
      'ADMIN DELETE TEAM ← Error Response',
      {
        endpoint,
        error: error.message,
      }
    );

    throw error;
  }
}


// ============================================================
// TEAM MEMBERS
// ============================================================


// POST /api/admin/teams/:teamId/members
export async function addTeamMember(
  teamId,
  userId
) {
  const endpoint =
    `/api/admin/teams/${teamId}/members`;

  debugLog(
    'ADMIN ADD TEAM MEMBER → Request',
    {
      endpoint,
      method: 'POST',
      teamId,
      userId,
    }
  );

  try {
    const response =
      await request(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          userId,
        }),
      });

    debugLog(
      'ADMIN ADD TEAM MEMBER ← Response',
      {
        endpoint,
        response,
      }
    );

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


// DELETE /api/admin/teams/:teamId/members/:userId
export async function removeTeamMember(
  teamId,
  userId
) {
  const endpoint =
    `/api/admin/teams/${teamId}/members/${userId}`;

  debugLog(
    'ADMIN REMOVE TEAM MEMBER → Request',
    {
      endpoint,
      method: 'DELETE',
      teamId,
      userId,
    }
  );

  try {
    const response =
      await request(endpoint, {
        method: 'DELETE',
      });

    debugLog(
      'ADMIN REMOVE TEAM MEMBER ← Response',
      {
        endpoint,
        response,
      }
    );

    return response;
  } catch (error) {
    debugLog(
      'ADMIN REMOVE TEAM MEMBER ← Error Response',
      {
        endpoint,
        error: error.message,
      }
    );

    throw error;
  }
}