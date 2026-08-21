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