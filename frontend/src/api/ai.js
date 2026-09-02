// frontend/src/api/ai.js

import { request } from "./client";

const isDevelopment = import.meta.env.DEV;

function debugLog(label, data) {
  if (!isDevelopment) return;

  console.group(`[AI API] ${label}`);
  console.log(data);
  console.groupEnd();
}

export async function generateConversationSummary(conversationId) {
  const endpoint = `/api/ai/conversations/${conversationId}/summary`;

  if (!conversationId) {
    debugLog("SUMMARY → Missing Conversation ID", {
      conversationId,
    });

    throw new Error("Conversation ID is required.");
  }

  debugLog("SUMMARY → Request", {
    endpoint,
    method: "POST",
    conversationId,
  });

  try {
    const response = await request(endpoint, {
      method: "POST",
    });

    debugLog("SUMMARY ← Response", {
      endpoint,
      conversationId,
      response,
    });

    return response;
  } catch (error) {
    debugLog("SUMMARY ← Error", {
      endpoint,
      conversationId,
      status: error.status,
      message: error.message,
      data: error.data,
    });

    throw error;
  }
}

export async function checkConversationImportance(conversationId) {
  const endpoint = `/api/ai/conversations/${conversationId}/importance`;

  if (!conversationId) {
    debugLog("IMPORTANCE → Missing Conversation ID", {
      conversationId,
    });

    throw new Error("Conversation ID is required.");
  }

  debugLog("IMPORTANCE → Request", {
    endpoint,
    method: "POST",
    conversationId,
  });

  try {
    const response = await request(endpoint, {
      method: "POST",
    });

    debugLog("IMPORTANCE ← Response", {
      endpoint,
      conversationId,
      response,
    });

    return response;
  } catch (error) {
    debugLog("IMPORTANCE ← Error", {
      endpoint,
      conversationId,
      status: error.status,
      message: error.message,
      data: error.data,
    });

    throw error;
  }
}

export async function getAiDigest() {
  const endpoint = "/api/ai/digest";

  debugLog("DIGEST → Request", {
    endpoint,
    method: "GET",
  });

  try {
    const response = await request(endpoint, {
      method: "GET",
    });

    debugLog("DIGEST ← Response", {
      endpoint,
      response,
    });

    return response;
  } catch (error) {
    debugLog("DIGEST ← Error", {
      endpoint,
      status: error.status,
      message: error.message,
      data: error.data,
    });

    throw error;
  }
}

export async function generateDraftReply(conversationId) {
  const endpoint = `/api/ai/conversations/${conversationId}/draft-reply`;

  if (!conversationId) {
    debugLog("DRAFT REPLY → Missing Conversation ID", {
      conversationId,
    });

    throw new Error("Conversation ID is required.");
  }

  debugLog("DRAFT REPLY → Request", {
    endpoint,
    method: "POST",
    conversationId,
  });

  try {
    const response = await request(endpoint, {
      method: "POST",
    });

    debugLog("DRAFT REPLY ← Response", {
      endpoint,
      conversationId,
      response,
    });

    return response;
  } catch (error) {
    debugLog("DRAFT REPLY ← Error", {
      endpoint,
      conversationId,
      status: error.status,
      message: error.message,
      data: error.data,
    });

    throw error;
  }
}