// frontend/src/api/conversations.js

import { request } from './client';

// Get all conversations for the logged-in user
export async function getConversations() {
  const response = await request('/api/conversations');

  return response.data || [];
}

// Get one conversation
export async function getConversation(conversationId) {
  const response = await request(`/api/conversations/${conversationId}`);

  return response.data;
}

// Get all messages in a conversation
export function getConversationMessages(conversationId) {
  return request(`/api/conversations/${conversationId}/messages`);
}

// Create a new conversation and its first message
export function createConversation(payload) {
  return request('/api/conversations', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// Update conversation status
export function updateConversationStatus(conversationId, payload) {
  return request(
    `/api/conversations/${conversationId}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }
  );
}

// Update conversation decision
export function updateConversationDecision(conversationId, payload) {
  return request(
    `/api/conversations/${conversationId}/decision`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }
  );
}

// Update follow-up settings
export function updateConversationFollowUp(conversationId, payload) {
  return request(
    `/api/conversations/${conversationId}/follow-up`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }
  );
}

// Send a new message or reply
export function sendMessage(payload) {
  return request('/api/messages', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// Mark a message as read
export function markMessageAsRead(messageId) {
  return request(
    `/api/messages/${messageId}/read`,
    {
      method: 'PATCH',
    }
  );
}

// Delete a message
export function deleteMessage(messageId) {
  return request(
    `/api/messages/${messageId}`,
    {
      method: 'DELETE',
    }
  );
}