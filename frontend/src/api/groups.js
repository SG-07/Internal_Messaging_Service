// frontend/src/api/groups.js

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

/*
 * --------------------------------------------------
 * CREATE GROUP
 * --------------------------------------------------
 */

export async function createGroup(
  name,
  isOpen,
  department = null,
  managerId = null
) {
  const endpoint = '/api/groups/createGroup';

  const payload = {
    name,
    is_open: isOpen,

    ...(department !== null && {
      department,
    }),

    ...(managerId && {
      manager_id: managerId,
    }),
  };

  debugLog('CREATE GROUP → Request', {
    endpoint,
    method: 'POST',
    payload,
  });

  try {
    const response = await request(
      endpoint,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );

    debugLog('CREATE GROUP ← Response', {
      endpoint,
      response,
    });

    return response;
  } catch (error) {
    debugLog('CREATE GROUP ← Error', {
      endpoint,
      status: error?.status,
      message: error?.message,
      error,
    });

    throw error;
  }
}

/*
 * --------------------------------------------------
 * GET GROUPS
 * --------------------------------------------------
 */

export async function getGroups({
  page = 1,
  department,
  status,
  isOpen,
} = {}) {
  const query = new URLSearchParams();

  query.set('page', page);

  if (
    department !== undefined &&
    department !== null &&
    department !== ''
  ) {
    query.set('department', department);
  }

  if (
    status !== undefined &&
    status !== null &&
    status !== ''
  ) {
    query.set('status', status);
  }

  if (
    isOpen !== undefined &&
    isOpen !== null
  ) {
    query.set('is_open', isOpen);
  }

  const endpoint =
    `/api/groups/listGroups?${query.toString()}`;

  debugLog('GROUPS → Request', {
    endpoint,
    method: 'GET',
    params: {
      page,
      department,
      status,
      isOpen,
    },
  });

  try {
    const response = await request(endpoint);

    debugLog('GROUPS ← Response', {
      endpoint,
      response,
    });

    return response;
  } catch (error) {
    debugLog('GROUPS ← Error Response', {
      endpoint,
      error: error?.message,
      status: error?.status,
    });

    throw error;
  }
}

// ------- Get group details -------
export async function getGroup(groupId) {
  if (!groupId) {
    throw new Error(
      'A valid group ID is required.'
    );
  }

  const endpoint =
    `/api/groups/${groupId}`;

  /*
   * ----------------------------------------
   * Request debug log
   * ----------------------------------------
   */
  debugLog(
    'GET GROUP DETAILS → Request',
    {
      endpoint,
      method: 'GET',

      /*
       * GET requests do not normally contain
       * a request body, so the group ID is
       * sent through the URL path.
       */
      payload: {
        groupId,
      },
    }
  );

  try {
    const response = await request(
      endpoint,
      {
        method: 'GET',
      }
    );


    /*
     * ----------------------------------------
     * Response debug log
     * ----------------------------------------
     */
    debugLog(
      'GET GROUP DETAILS ← Response',
      {
        endpoint,
        groupId,

        response,

        data:
          response?.data || null,

        message:
          response?.message || null,
      }
    );


    return response;

  } catch (error) {

    /*
     * ----------------------------------------
     * Error debug log
     * ----------------------------------------
     */
    debugLog(
      'GET GROUP DETAILS ← Error',
      {
        endpoint,
        groupId,

        status:
          error?.status,

        message:
          error?.message,

        error,
      }
    );

    throw error;
  }
}


// ------- Join a group -------
export async function joinGroup(groupId) {
  if (!groupId) {
    throw new Error(
      'A valid group ID is required.'
    );
  }

  const endpoint =
    `/api/groups/${groupId}/join`;

  debugLog('JOIN GROUP → Request', {
    endpoint,
    method: 'POST',
    groupId,
  });

  try {
    const response = await request(
      endpoint,
      {
        method: 'POST',
      }
    );

    debugLog('JOIN GROUP ← Response', {
      endpoint,
      response,
    });

    return response;
  } catch (error) {
    debugLog('JOIN GROUP ← Error', {
      endpoint,
      groupId,
      status: error?.status,
      message: error?.message,
      error,
    });

    throw error;
  }
}


// ------- Leave a group -------
export async function leaveGroup(groupId) {
  if (!groupId) {
    throw new Error(
      'A valid group ID is required.'
    );
  }

  const endpoint =
    `/api/groups/${groupId}/leave`;

  debugLog('LEAVE GROUP → Request', {
    endpoint,
    method: 'POST',
    groupId,
  });

  try {
    const response = await request(
      endpoint,
      {
        method: 'POST',
      }
    );

    debugLog('LEAVE GROUP ← Response', {
      endpoint,
      response,
    });

    return response;
  } catch (error) {
    debugLog('LEAVE GROUP ← Error', {
      endpoint,
      groupId,
      status: error?.status,
      message: error?.message,
      error,
    });

    throw error;
  }
}


// ------- Update group -------
export async function updateGroup(
  groupId,
  payload
) {
  if (!groupId) {
    throw new Error(
      'A valid group ID is required.'
    );
  }

  const endpoint =
    `/api/groups/${groupId}`;


  debugLog(
    'UPDATE GROUP → Request',
    {
      endpoint,
      method: 'PATCH',
      groupId,
      payload,
    }
  );


  try {
    const response =
      await request(
        endpoint,
        {
          method: 'PATCH',
          body: JSON.stringify(
            payload
          ),
        }
      );


    debugLog(
      'UPDATE GROUP ← Response',
      {
        endpoint,
        response,
      }
    );


    return response;

  } catch (error) {

    debugLog(
      'UPDATE GROUP ← Error',
      {
        endpoint,
        groupId,
        payload,
        status: error?.status,
        message: error?.message,
        error,
      }
    );

    throw error;
  }
}

// ------- Delete group -------

export async function deleteGroup(groupId) {
  if (!groupId) {
    throw new Error(
      'A valid group ID is required.'
    );
  }

  const endpoint =
    `/api/groups/${groupId}`;


  debugLog(
    'DELETE GROUP → Request',
    {
      endpoint,
      method: 'DELETE',
      payload: {
        groupId,
      },
    }
  );


  try {
    const response =
      await request(
        endpoint,
        {
          method: 'DELETE',
        }
      );


    debugLog(
      'DELETE GROUP ← Response',
      {
        endpoint,
        groupId,
        response,
      }
    );


    return response;

  } catch (error) {

    debugLog(
      'DELETE GROUP ← Error',
      {
        endpoint,
        groupId,
        status: error?.status,
        message: error?.message,
        error,
      }
    );

    throw error;
  }
}

// ------- Get group members -------
export async function getGroupMembers(groupId) {
  if (!groupId) {
    throw new Error(
      'A valid group ID is required.'
    );
  }

  const endpoint =
    `/api/groups/${groupId}/members`;

  debugLog(
    'GET GROUP MEMBERS → Request',
    {
      endpoint,
      method: 'GET',
      groupId,
    }
  );

  try {
    const response =
      await request(
        endpoint,
        {
          method: 'GET',
        }
      );

    debugLog(
      'GET GROUP MEMBERS ← Response',
      {
        endpoint,
        groupId,
        response,
      }
    );

    return response;

  } catch (error) {
    debugLog(
      'GET GROUP MEMBERS ← Error',
      {
        endpoint,
        groupId,
        status: error?.status,
        message: error?.message,
        error,
      }
    );

    throw error;
  }
}


// ------- Add member to group -------
export async function addGroupMember(
  groupId,
  userId
) {
  if (!groupId) {
    throw new Error(
      'A valid group ID is required.'
    );
  }

  if (!userId) {
    throw new Error(
      'A valid user ID is required.'
    );
  }

  const endpoint =
    `/api/groups/${groupId}/members`;

  const payload = {
    user_id: userId,
  };

  debugLog(
    'ADD GROUP MEMBER → Request',
    {
      endpoint,
      method: 'POST',
      groupId,
      userId,
      payload,
    }
  );

  try {
    const response =
      await request(
        endpoint,
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      );

    debugLog(
      'ADD GROUP MEMBER ← Response',
      {
        endpoint,
        groupId,
        userId,
        response,
      }
    );

    return response;

  } catch (error) {
    debugLog(
      'ADD GROUP MEMBER ← Error',
      {
        endpoint,
        groupId,
        userId,
        payload,
        status: error?.status,
        message: error?.message,
        error,
      }
    );

    throw error;
  }
}
// ------- Get potential members -------
export async function getPotentialMembers(
  groupId,
  {
    page = 1,
    email = '',
  } = {}
) {
  if (!groupId) {
    throw new Error(
      'A valid group ID is required.'
    );
  }

  const query = new URLSearchParams();

  query.set('page', page);

  if (
    email !== undefined &&
    email !== null &&
    email.trim() !== ''
  ) {
    query.set(
      'email',
      email.trim()
    );
  }

  const endpoint =
    `/api/groups/${groupId}/potential-members?${query.toString()}`;

  debugLog(
    'GET POTENTIAL GROUP MEMBERS → Request',
    {
      endpoint,
      method: 'GET',
      groupId,
      params: {
        page,
        email,
      },
    }
  );

  try {
    const response =
      await request(endpoint);

    debugLog(
      'GET POTENTIAL GROUP MEMBERS ← Response',
      {
        endpoint,
        groupId,
        response,
      }
    );

    return response;

  } catch (error) {
    debugLog(
      'GET POTENTIAL GROUP MEMBERS ← Error',
      {
        endpoint,
        groupId,
        status: error?.status,
        message: error?.message,
        error,
      }
    );

    throw error;
  }
}

// ------- Remove member from group -------
export async function removeGroupMember(
  groupId,
  userId
) {
  if (!groupId) {
    throw new Error(
      'A valid group ID is required.'
    );
  }

  if (!userId) {
    throw new Error(
      'A valid user ID is required.'
    );
  }

  const endpoint =
    `/api/groups/${groupId}/members/${userId}`;

  debugLog(
    'REMOVE GROUP MEMBER → Request',
    {
      endpoint,
      method: 'DELETE',
      groupId,
      userId,
    }
  );

  try {
    const response =
      await request(
        endpoint,
        {
          method: 'DELETE',
        }
      );

    debugLog(
      'REMOVE GROUP MEMBER ← Response',
      {
        endpoint,
        groupId,
        userId,
        response,
      }
    );

    return response;

  } catch (error) {
    debugLog(
      'REMOVE GROUP MEMBER ← Error',
      {
        endpoint,
        groupId,
        userId,
        status: error?.status,
        message: error?.message,
        error,
      }
    );

    throw error;
  }
}

export async function getGroupJoinRequests(groupId, params = {}) {
  const query = new URLSearchParams();

  query.set("page", String(params.page || 1));
  query.set("status", params.status || "pending");

  const response = await api.get(
    `/api/groups/${groupId}/requests?${query.toString()}`,
  );

  return response.data;
}

export async function approveGroupJoinRequest(
  groupId,
  requestId,
  payload = {},
) {
  const response = await api.patch(
    `/api/groups/${groupId}/requests/${requestId}/approve`,
    payload,
  );

  return response.data;
}

export async function rejectGroupJoinRequest(
  groupId,
  requestId,
  payload = {},
) {
  const response = await api.patch(
    `/api/groups/${groupId}/requests/${requestId}/reject`,
    payload,
  );

  return response.data;
}