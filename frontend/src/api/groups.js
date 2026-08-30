// src/api/groups.js

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
 * CREATE GROUP
 * ============================================================
 */

export async function createGroup(
  name,
  isOpen,
  department = null,
  managerId = null,
) {
  const endpoint = "/api/groups/createGroup";

  const payload = {
    name,
    is_open: isOpen,

    /*
     * Department is sent when provided.
     * Admin can provide it.
     * Non-admin can pass their own department.
     */
    ...(department !== null &&
      department !== undefined &&
      department !== "" && {
        department,
      }),

    /*
     * IMPORTANT:
     * Backend expects managerId.
     *
     * Send null explicitly when there is no manager.
     */
    managerId: managerId || null,
  };

  debugLog("CREATE GROUP → Request", {
    endpoint,
    method: "POST",
    payload,
  });

  try {
    const response = await request(endpoint, {
      method: "POST",

      /*
       * Pass the object.
       * client.js performs JSON.stringify().
       */
      body: payload,
    });

    debugLog("CREATE GROUP ← Response", {
      endpoint,
      response,
    });

    return response;
  } catch (error) {
    debugLog("CREATE GROUP ← Error", {
      endpoint,
      status: error?.status,
      message: error?.message,
      data: error?.data,
      error,
    });

    throw error;
  }
}

/*
 * ============================================================
 * GET GROUPS
 * ============================================================
 */

export async function getGroups({
  page = 1,
  department,
  status,
  isOpen,
} = {}) {
  const query = new URLSearchParams();

  query.set("page", String(page));

  if (
    department !== undefined &&
    department !== null &&
    department !== ""
  ) {
    query.set("department", department);
  }

  if (
    status !== undefined &&
    status !== null &&
    status !== ""
  ) {
    query.set("status", status);
  }

  if (isOpen !== undefined && isOpen !== null) {
    query.set("is_open", String(isOpen));
  }

  const endpoint = `/api/groups/listGroups?${query.toString()}`;

  debugLog("GROUPS → Request", {
    endpoint,
    method: "GET",
    params: {
      page,
      department,
      status,
      isOpen,
    },
  });

  try {
    const response = await request(endpoint);

    debugLog("GROUPS ← Response", {
      endpoint,
      response,
    });

    return response;
  } catch (error) {
    debugLog("GROUPS ← Error Response", {
      endpoint,
      error: error?.message,
      status: error?.status,
      data: error?.data,
    });

    throw error;
  }
}

/*
 * ============================================================
 * GET GROUP DETAILS
 * ============================================================
 */

export async function getGroup(groupId) {
  if (!groupId) {
    throw new Error("A valid group ID is required.");
  }

  const endpoint = `/api/groups/${groupId}`;

  debugLog("GET GROUP DETAILS → Request", {
    endpoint,
    method: "GET",
    payload: {
      groupId,
    },
  });

  try {
    const response = await request(endpoint, {
      method: "GET",
    });

    debugLog("GET GROUP DETAILS ← Response", {
      endpoint,
      groupId,
      response,
      data: response?.data || null,
      message: response?.message || null,
    });

    return response;
  } catch (error) {
    debugLog("GET GROUP DETAILS ← Error", {
      endpoint,
      groupId,
      status: error?.status,
      message: error?.message,
      data: error?.data,
      error,
    });

    throw error;
  }
}

/*
 * ============================================================
 * JOIN GROUP
 * ============================================================
 */

export async function joinGroup(groupId) {
  if (!groupId) {
    throw new Error("A valid group ID is required.");
  }

  const endpoint = `/api/groups/${groupId}/join`;

  debugLog("JOIN GROUP → Request", {
    endpoint,
    method: "POST",
    groupId,
  });

  try {
    const response = await request(endpoint, {
      method: "POST",
    });

    debugLog("JOIN GROUP ← Response", {
      endpoint,
      response,
    });

    return response;
  } catch (error) {
    debugLog("JOIN GROUP ← Error", {
      endpoint,
      groupId,
      status: error?.status,
      message: error?.message,
      data: error?.data,
      error,
    });

    throw error;
  }
}

/*
 * ============================================================
 * LEAVE GROUP
 * ============================================================
 */

export async function leaveGroup(groupId) {
  if (!groupId) {
    throw new Error("A valid group ID is required.");
  }

  const endpoint = `/api/groups/${groupId}/leave`;

  debugLog("LEAVE GROUP → Request", {
    endpoint,
    method: "POST",
    groupId,
  });

  try {
    const response = await request(endpoint, {
      method: "POST",
    });

    debugLog("LEAVE GROUP ← Response", {
      endpoint,
      response,
    });

    return response;
  } catch (error) {
    debugLog("LEAVE GROUP ← Error", {
      endpoint,
      groupId,
      status: error?.status,
      message: error?.message,
      data: error?.data,
      error,
    });

    throw error;
  }
}

/*
 * ============================================================
 * UPDATE GROUP
 * ============================================================
 */

export async function updateGroup(groupId, payload) {
  if (!groupId) {
    throw new Error("A valid group ID is required.");
  }

  const endpoint = `/api/groups/${groupId}`;

  debugLog("UPDATE GROUP → Request", {
    endpoint,
    method: "PATCH",
    groupId,
    payload,
  });

  try {
    const response = await request(endpoint, {
      method: "PATCH",

      /*
       * Do NOT JSON.stringify here.
       * client.js handles it.
       */
      body: payload,
    });

    debugLog("UPDATE GROUP ← Response", {
      endpoint,
      response,
    });

    return response;
  } catch (error) {
    debugLog("UPDATE GROUP ← Error", {
      endpoint,
      groupId,
      payload,
      status: error?.status,
      message: error?.message,
      data: error?.data,
      error,
    });

    throw error;
  }
}

/*
 * ============================================================
 * DELETE GROUP
 * ============================================================
 */

export async function deleteGroup(groupId) {
  if (!groupId) {
    throw new Error("A valid group ID is required.");
  }

  const endpoint = `/api/groups/${groupId}`;

  debugLog("DELETE GROUP → Request", {
    endpoint,
    method: "DELETE",
    payload: {
      groupId,
    },
  });

  try {
    const response = await request(endpoint, {
      method: "DELETE",
    });

    debugLog("DELETE GROUP ← Response", {
      endpoint,
      groupId,
      response,
    });

    return response;
  } catch (error) {
    debugLog("DELETE GROUP ← Error", {
      endpoint,
      groupId,
      status: error?.status,
      message: error?.message,
      data: error?.data,
      error,
    });

    throw error;
  }
}

/*
 * ============================================================
 * GET GROUP MEMBERS
 * ============================================================
 */

export async function getGroupMembers(groupId) {
  if (!groupId) {
    throw new Error("A valid group ID is required.");
  }

  const endpoint = `/api/groups/${groupId}/members`;

  debugLog("GET GROUP MEMBERS → Request", {
    endpoint,
    method: "GET",
    groupId,
  });

  try {
    const response = await request(endpoint, {
      method: "GET",
    });

    debugLog("GET GROUP MEMBERS ← Response", {
      endpoint,
      groupId,
      response,
    });

    return response;
  } catch (error) {
    debugLog("GET GROUP MEMBERS ← Error", {
      endpoint,
      groupId,
      status: error?.status,
      message: error?.message,
      data: error?.data,
      error,
    });

    throw error;
  }
}

/*
 * ============================================================
 * ADD GROUP MEMBER
 * ============================================================
 */

export async function addGroupMember(groupId, userId) {
  if (!groupId) {
    throw new Error("A valid group ID is required.");
  }

  if (!userId) {
    throw new Error("A valid user ID is required.");
  }

  const endpoint = `/api/groups/${groupId}/members`;

  const payload = {
    user_id: userId,
  };

  debugLog("ADD GROUP MEMBER → Request", {
    endpoint,
    method: "POST",
    groupId,
    userId,
    payload,
  });

  try {
    const response = await request(endpoint, {
      method: "POST",

      /*
       * Pass object directly.
       */
      body: payload,
    });

    debugLog("ADD GROUP MEMBER ← Response", {
      endpoint,
      groupId,
      userId,
      response,
    });

    return response;
  } catch (error) {
    debugLog("ADD GROUP MEMBER ← Error", {
      endpoint,
      groupId,
      userId,
      payload,
      status: error?.status,
      message: error?.message,
      data: error?.data,
      error,
    });

    throw error;
  }
}

/*
 * ============================================================
 * GET POTENTIAL MEMBERS
 * ============================================================
 */

export async function getPotentialMembers(
  groupId,
  {
    page = 1,
    email = "",
  } = {},
) {
  if (!groupId) {
    throw new Error("A valid group ID is required.");
  }

  const query = new URLSearchParams();

  query.set("page", String(page));

  if (
    email !== undefined &&
    email !== null &&
    email.trim() !== ""
  ) {
    query.set("email", email.trim());
  }

  const endpoint =
    `/api/groups/${groupId}/potential-members?${query.toString()}`;

  debugLog("GET POTENTIAL GROUP MEMBERS → Request", {
    endpoint,
    method: "GET",
    groupId,
    params: {
      page,
      email,
    },
  });

  try {
    const response = await request(endpoint);

    debugLog("GET POTENTIAL GROUP MEMBERS ← Response", {
      endpoint,
      groupId,
      response,
    });

    return response;
  } catch (error) {
    debugLog("GET POTENTIAL GROUP MEMBERS ← Error", {
      endpoint,
      groupId,
      status: error?.status,
      message: error?.message,
      data: error?.data,
      error,
    });

    throw error;
  }
}

/*
 * ============================================================
 * REMOVE GROUP MEMBER
 * ============================================================
 */

export async function removeGroupMember(groupId, userId) {
  if (!groupId) {
    throw new Error("A valid group ID is required.");
  }

  if (!userId) {
    throw new Error("A valid user ID is required.");
  }

  const endpoint =
    `/api/groups/${groupId}/members/${userId}`;

  debugLog("REMOVE GROUP MEMBER → Request", {
    endpoint,
    method: "DELETE",
    groupId,
    userId,
  });

  try {
    const response = await request(endpoint, {
      method: "DELETE",
    });

    debugLog("REMOVE GROUP MEMBER ← Response", {
      endpoint,
      groupId,
      userId,
      response,
    });

    return response;
  } catch (error) {
    debugLog("REMOVE GROUP MEMBER ← Error", {
      endpoint,
      groupId,
      userId,
      status: error?.status,
      message: error?.message,
      data: error?.data,
      error,
    });

    throw error;
  }
}

/*
 * ============================================================
 * GROUP JOIN REQUESTS
 * ============================================================
 */

/*
 * GET /api/groups/:groupId/requests
 */
export async function getGroupJoinRequests(
  groupId,
  params = {},
) {
  if (!groupId) {
    throw new Error("A valid group ID is required.");
  }

  const query = new URLSearchParams();

  query.set(
    "page",
    String(params.page || 1),
  );

  query.set(
    "status",
    params.status || "pending",
  );

  const endpoint =
    `/api/groups/${groupId}/requests?${query.toString()}`;

  debugLog("GET GROUP JOIN REQUESTS → Request", {
    endpoint,
    method: "GET",
    groupId,
    params: {
      page: params.page || 1,
      status: params.status || "pending",
    },
  });

  try {
    const response = await request(endpoint);

    debugLog("GET GROUP JOIN REQUESTS ← Response", {
      endpoint,
      groupId,
      response,
    });

    return response;
  } catch (error) {
    debugLog("GET GROUP JOIN REQUESTS ← Error", {
      endpoint,
      groupId,
      status: error?.status,
      message: error?.message,
      data: error?.data,
      error,
    });

    throw error;
  }
}

/*
 * PATCH /api/groups/:groupId/requests/:requestId/approve
 */
export async function approveGroupJoinRequest(
  groupId,
  requestId,
  payload = {},
) {
  if (!groupId) {
    throw new Error("A valid group ID is required.");
  }

  if (!requestId) {
    throw new Error("A valid request ID is required.");
  }

  const endpoint =
    `/api/groups/${groupId}/requests/${requestId}/approve`;

  debugLog("APPROVE GROUP JOIN REQUEST → Request", {
    endpoint,
    method: "PATCH",
    groupId,
    requestId,
    payload,
  });

  try {
    const response = await request(endpoint, {
      method: "PATCH",

      /*
       * Pass object directly.
       */
      body: payload,
    });

    debugLog("APPROVE GROUP JOIN REQUEST ← Response", {
      endpoint,
      groupId,
      requestId,
      response,
    });

    return response;
  } catch (error) {
    debugLog("APPROVE GROUP JOIN REQUEST ← Error", {
      endpoint,
      groupId,
      requestId,
      payload,
      status: error?.status,
      message: error?.message,
      data: error?.data,
      error,
    });

    throw error;
  }
}

/*
 * PATCH /api/groups/:groupId/requests/:requestId/reject
 */
export async function rejectGroupJoinRequest(
  groupId,
  requestId,
  payload = {},
) {
  if (!groupId) {
    throw new Error("A valid group ID is required.");
  }

  if (!requestId) {
    throw new Error("A valid request ID is required.");
  }

  const endpoint =
    `/api/groups/${groupId}/requests/${requestId}/reject`;

  debugLog("REJECT GROUP JOIN REQUEST → Request", {
    endpoint,
    method: "PATCH",
    groupId,
    requestId,
    payload,
  });

  try {
    const response = await request(endpoint, {
      method: "PATCH",

      /*
       * Pass object directly.
       */
      body: payload,
    });

    debugLog("REJECT GROUP JOIN REQUEST ← Response", {
      endpoint,
      groupId,
      requestId,
      response,
    });

    return response;
  } catch (error) {
    debugLog("REJECT GROUP JOIN REQUEST ← Error", {
      endpoint,
      groupId,
      requestId,
      payload,
      status: error?.status,
      message: error?.message,
      data: error?.data,
      error,
    });

    throw error;
  }
}

/*
 * ============================================================
 * GET USER'S GROUPS
 * ============================================================
 */

export async function getMyGroups(params = {}) {
  const query = new URLSearchParams();

  query.set(
    "page",
    String(params.page || 1),
  );

  if (params.status) {
    query.set(
      "status",
      params.status,
    );
  }

  query.set(
    "sort_by",
    params.sort_by || "newest",
  );

  const endpoint =
    `/api/groups/me/groups?${query.toString()}`;

  debugLog("GET MY GROUPS → Request", {
    endpoint,
    method: "GET",
    params: {
      page: params.page || 1,
      status: params.status || "all",
      sort_by: params.sort_by || "newest",
    },
  });

  try {
    const response = await request(endpoint, {
      method: "GET",
    });

    debugLog("GET MY GROUPS ← Response", {
      endpoint,
      response,
    });

    return response;
  } catch (error) {
    debugLog("GET MY GROUPS ← Error", {
      endpoint,
      status: error?.status,
      message: error?.message,
      data: error?.data,
      error,
    });

    throw error;
  }
}

/*
 * ============================================================
 * GROUP CONVERSATION
 * ============================================================
 */

/*
 * GET /api/groups/:groupId/conversation
 */
export async function getGroupConversation(groupId) {
  if (!groupId) {
    throw new Error("A valid group ID is required.");
  }

  const endpoint =
    `/api/groups/${groupId}/conversation`;

  if (isDevelopment) {
    console.group("[API] Get Group Conversation");

    console.log("Method:", "GET");
    console.log("Endpoint:", endpoint);
    console.log("Group ID:", groupId);

    console.groupEnd();
  }

  try {
    const response = await request(endpoint, {
      method: "GET",
    });

    if (isDevelopment) {
      console.group(
        "[API] Get Group Conversation Response",
      );

      console.log(
        "Endpoint:",
        endpoint,
      );

      console.log(
        "Response:",
        response,
      );

      console.log(
        "Conversation ID:",
        response?.data?.id,
      );

      console.log(
        "Group ID:",
        response?.data?.group_id,
      );

      console.groupEnd();
    }

    return response;
  } catch (error) {
    if (isDevelopment) {
      console.group(
        "[API] Get Group Conversation Error",
      );

      console.error(
        "Endpoint:",
        endpoint,
      );

      console.error(
        "Group ID:",
        groupId,
      );

      console.error(
        "Error:",
        error,
      );

      console.error(
        "Status:",
        error?.status,
      );

      console.error(
        "Message:",
        error?.message,
      );

      console.error(
        "Response data:",
        error?.data,
      );

      console.groupEnd();
    }

    throw error;
  }
}

/*
 * ============================================================
 * REVIEW GROUP REQUEST
 * ============================================================
 */

/*
 * PATCH /api/groups/:groupId/review
 *
 * Backend expects:
 *
 * {
 *   "decision": "approved"
 * }
 *
 * or
 *
 * {
 *   "decision": "rejected"
 * }
 */
export async function reviewGroupRequest(groupId, decision) {
  if (!groupId) {
    throw new Error("Group ID is required.");
  }

  if (!["approved", "rejected"].includes(decision)) {
    throw new Error("Invalid group review decision.");
  }

  const endpoint = `/api/admin/${groupId}/review`;

  const payload = {
    decision,
  };

  debugLog("REVIEW GROUP → Request", {
    endpoint,
    method: "PATCH",
    groupId,
    decision,
    payload,
  });

  try {
    const response = await request(endpoint, {
      method: "PATCH",
      body: payload,
    });

    debugLog("REVIEW GROUP ← Response", {
      endpoint,
      groupId,
      decision,
      response,
    });

    return response;
  } catch (error) {
    debugLog("REVIEW GROUP ← Error", {
      endpoint,
      groupId,
      decision,
      payload,
      status: error?.status,
      message: error?.message,
      data: error?.data,
      error,
    });

    throw error;
  }
}