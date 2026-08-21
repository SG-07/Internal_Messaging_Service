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

// --- CREATE GROUP  ----

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

// --- GET GROUPS  ----
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

  if (isOpen !== undefined && isOpen !== null) {
    query.set('is_open', isOpen);
  }

  const endpoint = `/api/groups/listGroups?${query.toString()}`;

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