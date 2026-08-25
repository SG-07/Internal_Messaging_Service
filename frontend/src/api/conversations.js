// frontend/src/api/conversations.js

import { request } from "./client";

// ============================================================
// Conversations
// ============================================================

// Get all conversations for the logged-in user
export async function getConversations() {
  const response = await request("/api/conversations");

  return response.data || [];
}

// Get one conversation
export async function getConversation(conversationId) {
  const response = await request(
    `/api/conversations/${conversationId}`
  );

  return response.data;
}

// Get all messages in a conversation
export async function getConversationMessages(conversationId) {
  return request(
    `/api/conversations/${conversationId}/messages`
  );
}

// Create a new conversation and its first message
export async function createConversation(payload) {
  return request("/api/conversations", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Send a reply/message in an existing conversation
export async function sendMessage(conversationId, body) {
  return request(
    `/api/conversations/${conversationId}/messages`,
    {
      method: "POST",
      body: JSON.stringify({
        body,
      }),
    }
  );
}

// ============================================================
// Group Conversations
// ============================================================

// Create or get the existing conversation for a group
//
// The backend is responsible for:
// 1. Checking that the group exists
// 2. Checking that the current user is an active member
// 3. Checking that the group is approved
// 4. Returning the existing group conversation if one exists
// 5. Creating a new group conversation if one does not exist
//
// Endpoint:
// POST /api/conversations/group/:groupId
export async function createGroupConversation(groupId) {
  return request(
    `/api/conversations/group/${groupId}`,
    {
      method: "POST",
    }
  );
}

// ============================================================
// Conversation Workflow
// ============================================================

// Update conversation status
export async function updateConversationStatus(
  conversationId,
  payload
) {
  return request(
    `/api/conversations/${conversationId}/status`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );
}

// Update conversation decision
export async function updateConversationDecision(
  conversationId,
  payload
) {
  return request(
    `/api/conversations/${conversationId}/decision`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );
}

// Update follow-up settings
export async function updateConversationFollowUp(
  conversationId,
  payload
) {
  return request(
    `/api/conversations/${conversationId}/follow-up`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );
}

// Get workflow items awaiting the current user's response
export async function getPendingWorkflows(page = 1) {
  const response = await request(
    `/api/conversations/workflow/pending?page=${page}`
  );

  return response;
}

// Get workflow requests created by the current user
export async function getMyWorkflowRequests(page = 1) {
  const response = await request(
    `/api/conversations/workflow/mine?page=${page}`
  );

  return response;
}

// ============================================================
// Messages
// ============================================================

// Mark a message as read
export async function markMessageAsRead(messageId) {
  return request(
    `/api/messages/${messageId}/read`,
    {
      method: "PATCH",
    }
  );
}

// Delete a message
export async function deleteMessage(messageId) {
  return request(
    `/api/messages/${messageId}`,
    {
      method: "DELETE",
    }
  );
}

// ============================================================
// User Conversations
// ============================================================

// Get conversations with another user
export async function getConversationsWithUser(identifier) {
  const response = await request(
    "/api/conversations/with-user",
    {
      method: "POST",
      body: JSON.stringify({
        identifier,
      }),
    }
  );

  return response;
}

// ============================================================
// Sent Conversations
// ============================================================

// Get sent conversations
export async function getSentConversations(page = 1) {
  const response = await request(
    `/api/conversations/sent?page=${page}`,
    {
      method: "GET",
    }
  );

  return response;
}