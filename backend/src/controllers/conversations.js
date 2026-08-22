// backend/src/controllers/conversations.js
// REFACTORED: Extracted utilities, removed duplication, improved maintainability

import supabaseAdmin from "../config/supabaseClient.js";

// ============= WORKFLOW CONFIGURATION =============
const ACTION_TRANSITIONS = {
  PENDING: ['WILL_DO', 'REJECTED', 'MORE_INFO'],
  MORE_INFO: ['WILL_DO', 'REJECTED'],
  WILL_DO: ['DONE', 'REJECTED'],
  DONE: [],
  REJECTED: [],
};

const APPROVAL_TRANSITIONS = {
  PENDING: ['APPROVED', 'REJECTED', 'MORE_INFO'],
  MORE_INFO: ['APPROVED', 'REJECTED'],
  APPROVED: [],
  REJECTED: [],
};

const FINAL_ACTION_STATUSES = ['DONE', 'REJECTED'];
const FINAL_APPROVAL_STATUSES = ['APPROVED', 'REJECTED'];

// ============= UTILITY FUNCTIONS =============

function buildWorkflow(conversation, currentUserId) {
  const { category, workflow_status, created_by, workflow_comment } = conversation;

  if (category !== "action_required" && category !== "approval_required") {
    return null;
  }

  const type = category === "action_required" ? "action" : "approval";
  const finalStatuses = type === "action" ? FINAL_ACTION_STATUSES : FINAL_APPROVAL_STATUSES;
  const isFinal = finalStatuses.includes(workflow_status);
  const isRequester = currentUserId === created_by;
  const canRespond = !isRequester && !isFinal;

  return {
    type,
    status: workflow_status,
    can_respond: canRespond,
    is_final: isFinal,
    workflow_comment: workflow_comment || null,
  };
}

async function verifyParticipant(conversationId, userId) {
  return supabaseAdmin
    .from('conversation_participants')
    .select('id')
    .eq('conversation_id', conversationId)
    .eq('user_id', userId)
    .single();
}

async function verifyConversationExists(conversationId) {
  return supabaseAdmin
    .from('conversations')
    .select('id, category, created_by, workflow_status')
    .eq('id', conversationId)
    .single();
}

async function fetchUserProfile(userId, selectFields = "id, username, full_name, email") {
  return supabaseAdmin
    .from('profiles')
    .select(selectFields)
    .eq('id', userId)
    .single();
}

async function fetchUserByEmail(email) {
  return supabaseAdmin
    .from('profiles')
    .select('id, username, full_name, email')
    .eq('email', email)
    .single();
}

async function fetchConversationFull(conversationId) {
  return supabaseAdmin
    .from('conversations')
    .select(`
      id, subject, conversation_type, category, created_by, created_at, updated_at,
      status, workflow_status, workflow_comment, workflow_updated_by, workflow_updated_at,
      conversation_participants(user_id, profiles(id, username, full_name, email))
    `)
    .eq('id', conversationId)
    .single();
}

async function fetchMessages(conversationId) {
  return supabaseAdmin
    .from('messages')
    .select(`id, content, created_at, sender_id, profiles:sender_id(id, username, full_name)`)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
}

async function fetchOtherParticipant(conversationId, currentUserId) {
  return supabaseAdmin
    .from('conversation_participants')
    .select('profiles(id, username, full_name, email)')
    .eq('conversation_id', conversationId)
    .neq('user_id', currentUserId)
    .single();
}

async function updateConversationTimestamp(conversationId) {
  return supabaseAdmin
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId);
}

function formatMessage(message) {
  return {
    id: message.id,
    content: message.content,
    created_at: message.created_at,
    sender_id: message.sender_id,
    sender_name: message.profiles?.full_name || message.profiles?.username || null,
  };
}

function formatParticipant(profile) {
  return {
    id: profile.id,
    username: profile.username,
    full_name: profile.full_name,
    email: profile.email,
  };
}

function formatConversationMeta(conv, senderProfile, otherProfile) {
  return {
    id: conv.id,
    subject: conv.subject,
    type: conv.conversation_type,
    category: conv.category,
    created_by: conv.created_by,
    created_by_name: senderProfile?.full_name || senderProfile?.username || null,
    created_by_email: senderProfile?.email || null,
    is_sender: conv.created_by === senderProfile?.id,
    other_user_name: otherProfile?.profiles?.full_name || otherProfile?.profiles?.username || null,
    other_user_email: otherProfile?.profiles?.email || null,
    created_at: conv.created_at,
    updated_at: conv.updated_at,
  };
}

function logIfDev(label, data) {
  if (process.env.NODE_ENV === 'development') {
    console.log(label, JSON.stringify(data, null, 2));
  }
}

async function validateWorkflowTransition(category, currentStatus, newStatus) {
  const isAction = category === 'action_required';
  const validStatuses = isAction
    ? Object.keys(ACTION_TRANSITIONS).concat(Object.values(ACTION_TRANSITIONS).flat())
    : Object.keys(APPROVAL_TRANSITIONS).concat(Object.values(APPROVAL_TRANSITIONS).flat());

  if (!validStatuses.includes(newStatus)) {
    return { valid: false, error: `Status must be one of: ${validStatuses.join(', ')}` };
  }

  const transitions = isAction ? ACTION_TRANSITIONS : APPROVAL_TRANSITIONS;
  const allowedNext = transitions[currentStatus] || [];

  if (!allowedNext.includes(newStatus)) {
    return { valid: false, error: `Cannot transition from ${currentStatus} to ${newStatus}.` };
  }

  return { valid: true };
}

// ============= ENDPOINT HANDLERS =============

export const createConversation = async (req, res) => {
  const { recipient_id, subject, type, body } = req.body;
  const sender_id = req.user.id;
  const recipient_email = recipient_id;

  if (!recipient_email || !body) {
    return res.status(400).json({
      success: false,
      message: "Recipient and message body are required.",
    });
  }

  try {
    // Resolve recipient
    const { data: recipient, error: recipientError } = await fetchUserByEmail(recipient_email);
    if (recipientError || !recipient) {
      return res.status(404).json({ success: false, message: "Recipient not found." });
    }

    const recipient_id_resolved = recipient.id;

    // Validate self-send
    if (sender_id === recipient_id_resolved) {
      return res.status(400).json({ success: false, message: "Cannot send message to yourself." });
    }

    // Validate category
    const validCategories = ["information", "discussion", "approval_required", "action_required"];
    if (!validCategories.includes(type)) {
      return res.status(400).json({ success: false, message: "Invalid conversation category." });
    }

    const needsWorkflow = type === "action_required" || type === "approval_required";
    const workflowStatus = needsWorkflow ? "PENDING" : null;

    // Create conversation
    const { data: newConversation, error: conversationError } = await supabaseAdmin
      .from('conversations')
      .insert({
        conversation_type: "direct",
        category: type,
        subject: subject || null,
        created_by: sender_id,
        workflow_status: workflowStatus,
      })
      .select('id, subject, conversation_type, category, created_by, created_at, updated_at, status, workflow_status')
      .single();

    if (conversationError) throw new Error("Failed to create conversation");

    const conversation_id = newConversation.id;

    // Add participants
    const { error: participantError } = await supabaseAdmin
      .from('conversation_participants')
      .insert([
        { conversation_id, user_id: sender_id },
        { conversation_id, user_id: recipient_id_resolved },
      ]);

    if (participantError) throw new Error("Failed to add participants");

    // Create initial message
    const { data: newMessage, error: messageError } = await supabaseAdmin
      .from('messages')
      .insert({ conversation_id, sender_id, content: body })
      .select('id, content, created_at, sender_id')
      .single();

    if (messageError) throw new Error("Failed to create message");

    // Fetch sender profile
    const { data: senderProfile } = await fetchUserProfile(sender_id);

    res.status(201).json({
      success: true,
      message: "Message sent successfully.",
      data: {
        id: newConversation.id,
        subject: newConversation.subject,
        conversation_type: newConversation.conversation_type,
        category: newConversation.category,
        created_by: newConversation.created_by,
        created_at: newConversation.created_at,
        updated_at: newConversation.updated_at,
        workflow_status: newConversation.workflow_status,
        messages: [
          {
            id: newMessage.id,
            content: newMessage.content,
            created_at: newMessage.created_at,
            sender_id: newMessage.sender_id,
            sender_name: senderProfile?.full_name || senderProfile?.username || null,
          },
        ],
        participants: [
          formatParticipant(senderProfile),
          formatParticipant(recipient),
        ],
      },
    });
  } catch (err) {
    console.error("Create conversation error:", err);
    res.status(500).json({ success: false, message: "Unable to send message." });
  }
};

export const getConversations = async (req, res) => {
  const user_id = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = 15;
  const offset = (page - 1) * limit;

  try {
    const { data: conversationLinks, error: convError, count } = await supabaseAdmin
      .from('conversation_participants')
      .select(`
        conversation_id,
        conversations(
          id, subject, conversation_type, category, created_by, created_at, updated_at,
          creator:profiles!conversations_created_by_fkey(id, username, full_name, email)
        )
      `, { count: "exact" })
      .eq('user_id', user_id)
      .is('hidden_at', null)
      .order('joined_at', { ascending: false })
      .range(offset, offset + limit - 1);

    logIfDev("[getConversations] count:", count);
    if (convError) throw new Error("Failed to fetch conversations");

    const formattedConversations = await Promise.all(
      conversationLinks.map(async (cp) => {
        const conv = cp.conversations;
        const { data: otherParticipant } = await fetchOtherParticipant(conv.id, user_id);
        return formatConversationMeta(conv, conv.creator, otherParticipant);
      })
    );

    res.status(200).json({
      success: true,
      data: formattedConversations,
      pagination: { page, limit, total: count, has_more: offset + limit < count },
    });
  } catch (err) {
    console.error("[getConversations] error:", err);
    res.status(500).json({ success: false, message: "Unable to fetch conversations." });
  }
};

export const getConversation = async (req, res) => {
  const { conversationId } = req.params;
  const user_id = req.user.id;

  try {
    // Verify participant
    const { error: participantError } = await verifyParticipant(conversationId, user_id);
    if (participantError) {
      return res.status(403).json({ success: false, message: "You are not part of this conversation." });
    }

    // Fetch full conversation
    const { data: conversation, error: convError } = await fetchConversationFull(conversationId);
    if (convError || !conversation) {
      return res.status(404).json({ success: false, message: "Conversation not found." });
    }

    // Format participants
    const participants = conversation.conversation_participants.map((p) => formatParticipant(p.profiles));

    // Build workflow state
    const workflow = buildWorkflow(conversation, user_id);

    // Fetch and format messages
    const { data: messages, error: messagesError } = await fetchMessages(conversationId);
    if (messagesError) throw new Error("Failed to fetch messages");

    const formattedMessages = messages.map(formatMessage);

    res.status(200).json({
      success: true,
      data: {
        id: conversation.id,
        subject: conversation.subject,
        conversation_type: conversation.conversation_type,
        category: conversation.category,
        created_by: conversation.created_by,
        created_at: conversation.created_at,
        updated_at: conversation.updated_at,
        workflow,
        messages: formattedMessages,
        participants,
      },
    });
  } catch (err) {
    console.error("Get conversation error:", err);
    res.status(500).json({ success: false, message: "Unable to fetch conversation." });
  }
};

export const updateConversation = async (req, res) => {
  const { conversationId } = req.params;
  const { subject } = req.body;
  const user_id = req.user.id;

  if (!subject) {
    return res.status(400).json({ success: false, message: "Subject is required." });
  }

  try {
    const { data: isParticipant, error: participantError } = await verifyParticipant(conversationId, user_id);
    if (participantError || !isParticipant) {
      return res.status(403).json({ success: false, message: "You are not part of this conversation." });
    }

    const { data: updatedConv, error: updateError } = await supabaseAdmin
      .from('conversations')
      .update({ subject, updated_at: new Date().toISOString() })
      .eq('id', conversationId)
      .select('id, subject, updated_at')
      .single();

    if (updateError) throw new Error("Failed to update conversation");

    res.status(200).json({
      success: true,
      message: "Conversation updated successfully.",
      data: updatedConv,
    });
  } catch (err) {
    console.error("Update conversation error:", err);
    res.status(500).json({ success: false, message: "Unable to update conversation." });
  }
};

export const deleteConversation = async (req, res) => {
  const { conversationId } = req.params;
  const user_id = req.user.id;

  try {
    const { data: participant, error: participantError } = await verifyParticipant(conversationId, user_id);
    if (participantError || !participant) {
      return res.status(404).json({ success: false, message: "Conversation not found." });
    }

    const { error: updateError } = await supabaseAdmin
      .from('conversation_participants')
      .update({ hidden_at: new Date().toISOString() })
      .eq('id', participant.id);

    if (updateError) throw new Error("Failed to hide conversation");

    res.status(200).json({ success: true, message: "Conversation removed from your dashboard." });
  } catch (err) {
    console.error("Delete conversation error:", err);
    res.status(500).json({ success: false, message: "Unable to remove conversation." });
  }
};

export const addMessage = async (req, res) => {
  const { conversationId } = req.params;
  const { body } = req.body;
  const sender_id = req.user.id;

  if (!body) {
    return res.status(400).json({ success: false, message: "Message body is required." });
  }

  try {
    // Verify participant
    const { error: participantError } = await verifyParticipant(conversationId, sender_id);
    if (participantError) {
      return res.status(403).json({ success: false, message: "You are not part of this conversation." });
    }

    // Insert message
    const { data: newMessage, error: messageError } = await supabaseAdmin
      .from('messages')
      .insert({ conversation_id: conversationId, sender_id, content: body })
      .select('id, content, created_at, sender_id')
      .single();

    if (messageError) throw new Error("Failed to create message");

    // Update conversation timestamp
    await updateConversationTimestamp(conversationId);

    // Fetch sender profile
    const { data: senderProfile } = await fetchUserProfile(sender_id, "username, full_name");

    res.status(201).json({
      success: true,
      message: "Message sent successfully.",
      data: {
        message_id: newMessage.id,
        conversation_id: conversationId,
        content: newMessage.content,
        sender_id: newMessage.sender_id,
        sender_name: senderProfile?.full_name || senderProfile?.username || null,
        sent_at: newMessage.created_at,
      },
    });
  } catch (err) {
    console.error("[addMessage] error:", err);
    res.status(500).json({ success: false, message: "Unable to send message." });
  }
};

export const getConversationsWithUser = async (req, res) => {
  const { email } = req.body;
  const user_id = req.user.id;

  if (!email) {
    return res.status(400).json({ success: false, message: "Provide an email to search." });
  }

  try {
    // Resolve other user
    const { data: otherUser, error: otherUserError } = await fetchUserByEmail(email);
    if (otherUserError || !otherUser) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    if (otherUser.id === user_id) {
      return res.status(400).json({ success: false, message: "Cannot search conversations with yourself." });
    }

    // Find shared conversations
    const { data: myConvLinks } = await supabaseAdmin
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', user_id);

    const myConvIds = myConvLinks.map((c) => c.conversation_id);

    if (myConvIds.length === 0) {
      return res.status(200).json({ success: true, message: "No conversations found.", data: [] });
    }

    const { data: sharedConvLinks } = await supabaseAdmin
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', otherUser.id)
      .in('conversation_id', myConvIds);

    const sharedConvIds = sharedConvLinks.map((c) => c.conversation_id);

    if (sharedConvIds.length === 0) {
      return res.status(200).json({ success: true, message: "No conversations found.", data: [] });
    }

    // Fetch conversations with messages
    const { data: conversations } = await supabaseAdmin
      .from('conversations')
      .select('id, subject, conversation_type, category, created_by, created_at, updated_at')
      .in('id', sharedConvIds)
      .order('updated_at', { ascending: false });

    const conversationsWithMessages = await Promise.all(
      conversations.map(async (conv) => {
        const { data: messages } = await fetchMessages(conv.id);
        return {
          ...conv,
          messages: (messages || []).map(formatMessage),
        };
      })
    );

    res.status(200).json({
      success: true,
      other_user: otherUser,
      data: conversationsWithMessages,
    });
  } catch (err) {
    console.error("[getConversationsWithUser] error:", err);
    res.status(500).json({ success: false, message: "Unable to fetch conversations." });
  }
};

export const getSentConversations = async (req, res) => {
  const user_id = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = 15;
  const offset = (page - 1) * limit;

  try {
    const { data: sentConversations, error, count } = await supabaseAdmin
      .from('conversations')
      .select('id, subject, conversation_type, category, created_at, updated_at', { count: "exact" })
      .eq('created_by', user_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error("Failed to fetch sent conversations");

    const formattedConversations = await Promise.all(
      sentConversations.map(async (conv) => {
        const { data: recipient } = await fetchOtherParticipant(conv.id, user_id);
        return {
          id: conv.id,
          subject: conv.subject,
          type: conv.conversation_type,
          category: conv.category,
          created_at: conv.created_at,
          updated_at: conv.updated_at,
          recipient_name: recipient?.profiles?.full_name || recipient?.profiles?.username || null,
          recipient_email: recipient?.profiles?.email || null,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: formattedConversations,
      pagination: { page, limit, total: count, has_more: offset + limit < count },
    });
  } catch (err) {
    console.error("[getSentConversations] error:", err);
    res.status(500).json({ success: false, message: "Unable to fetch sent conversations." });
  }
};

export const getPendingWorkflows = async (req, res) => {
  const user_id = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = 15;

  try {
    const { data: myLinks } = await supabaseAdmin
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', user_id);

    const convIds = myLinks.map((l) => l.conversation_id);

    if (convIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        pagination: { page, limit, total: 0, has_more: false },
      });
    }

    const { data: actionItems } = await supabaseAdmin
      .from('conversations')
      .select('id, subject, category, workflow_status, created_by, created_at, updated_at')
      .in('id', convIds)
      .eq('category', 'action_required')
      .in('workflow_status', ['PENDING', 'WILL_DO'])
      .neq('created_by', user_id);

    const { data: approvalItems } = await supabaseAdmin
      .from('conversations')
      .select('id, subject, category, workflow_status, created_by, created_at, updated_at')
      .in('id', convIds)
      .eq('category', 'approval_required')
      .in('workflow_status', ['PENDING', 'MORE_INFO'])
      .neq('created_by', user_id);

    const combined = [...(actionItems || []), ...(approvalItems || [])].sort(
      (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
    );

    const total = combined.length;
    const offset = (page - 1) * limit;
    const pageItems = combined.slice(offset, offset + limit);

    res.status(200).json({
      success: true,
      data: pageItems.map((c) => ({
        id: c.id,
        subject: c.subject,
        type: c.category === 'action_required' ? 'action' : 'approval',
        status: c.workflow_status,
        created_by: c.created_by,
        updated_at: c.updated_at,
      })),
      pagination: { page, limit, total, has_more: offset + limit < total },
    });
  } catch (err) {
    console.error("[getPendingWorkflows] error:", err);
    res.status(500).json({ success: false, message: "Unable to fetch pending items." });
  }
};

export const getMyWorkflowRequests = async (req, res) => {
  const user_id = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = 15;
  const offset = (page - 1) * limit;

  try {
    const { data: items, error, count } = await supabaseAdmin
      .from('conversations')
      .select('id, subject, category, workflow_status, created_at, updated_at', { count: "exact" })
      .eq('created_by', user_id)
      .in('category', ['action_required', 'approval_required'])
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error("Failed to fetch requests");

    res.status(200).json({
      success: true,
      data: items.map((c) => ({
        id: c.id,
        subject: c.subject,
        type: c.category === 'action_required' ? 'action' : 'approval',
        status: c.workflow_status,
        updated_at: c.updated_at,
      })),
      pagination: { page, limit, total: count, has_more: offset + limit < count },
    });
  } catch (err) {
    console.error("[getMyWorkflowRequests] error:", err);
    res.status(500).json({ success: false, message: "Unable to fetch your requests." });
  }
};

export const updateActionStatus = async (req, res) => {
  const { conversationId } = req.params;
  const { status, comment } = req.body;
  const user_id = req.user.id;

  const validStatuses = ['WILL_DO', 'DONE', 'REJECTED', 'MORE_INFO'];
  const requiresComment = status === 'REJECTED' || status === 'MORE_INFO';

  // Validate status
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Status must be one of: ${validStatuses.join(', ')}`,
    });
  }

  // Validate comment requirement
  if (requiresComment && (!comment || !comment.trim())) {
    return res.status(400).json({
      success: false,
      message: 'A comment is required when rejecting or requesting more info.',
    });
  }

  try {
    const { data: conversation, error: convError } = await verifyConversationExists(conversationId);
    if (convError || !conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    if (conversation.category !== 'action_required') {
      return res.status(400).json({
        success: false,
        message: 'This conversation does not have an action workflow.',
      });
    }

    const { error: participantError } = await verifyParticipant(conversationId, user_id);
    if (participantError) {
      return res.status(403).json({ success: false, message: 'You are not part of this conversation.' });
    }

    if (user_id === conversation.created_by) {
      return res.status(403).json({
        success: false,
        message: 'You cannot act on a request you created.',
      });
    }

    // Validate transition
    const validation = await validateWorkflowTransition(
      conversation.category,
      conversation.workflow_status,
      status
    );
    if (!validation.valid) {
      return res.status(400).json({ success: false, message: validation.error });
    }

    // Update status
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('conversations')
      .update({
        workflow_status: status,
        workflow_comment: comment || null,
        workflow_updated_by: user_id,
        workflow_updated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId)
      .select('id, category, workflow_status, workflow_comment, status')
      .single();

    logIfDev('[updateActionStatus]', { conversationId, from: conversation.workflow_status, to: status });
    if (updateError) throw new Error('Failed to update action status');

    res.status(200).json({
      success: true,
      message: `Action status updated to ${status}.`,
      data: updated,
    });
  } catch (err) {
    console.error('[updateActionStatus] error:', err);
    res.status(500).json({ success: false, message: 'Unable to update action status.' });
  }
};

export const updateApprovalStatus = async (req, res) => {
  const { conversationId } = req.params;
  const { status, comment } = req.body;
  const user_id = req.user.id;

  const validStatuses = ['APPROVED', 'REJECTED', 'MORE_INFO'];
  const requiresComment = status === 'REJECTED' || status === 'MORE_INFO';

  // Validate status
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Status must be one of: ${validStatuses.join(', ')}`,
    });
  }

  // Validate comment requirement
  if (requiresComment && (!comment || !comment.trim())) {
    return res.status(400).json({
      success: false,
      message: 'A comment is required when rejecting or requesting more info.',
    });
  }

  try {
    const { data: conversation, error: convError } = await verifyConversationExists(conversationId);
    if (convError || !conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    if (conversation.category !== 'approval_required') {
      return res.status(400).json({
        success: false,
        message: 'This conversation does not have an approval workflow.',
      });
    }

    const { error: participantError } = await verifyParticipant(conversationId, user_id);
    if (participantError) {
      return res.status(403).json({ success: false, message: 'You are not part of this conversation.' });
    }

    if (user_id === conversation.created_by) {
      return res.status(403).json({
        success: false,
        message: 'You cannot approve or reject your own request.',
      });
    }

    // Validate transition
    const validation = await validateWorkflowTransition(
      conversation.category,
      conversation.workflow_status,
      status
    );
    if (!validation.valid) {
      return res.status(400).json({ success: false, message: validation.error });
    }

    // Update status
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('conversations')
      .update({
        workflow_status: status,
        workflow_comment: comment || null,
        workflow_updated_by: user_id,
        workflow_updated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId)
      .select('id, category, workflow_status, workflow_comment, status')
      .single();

    logIfDev('[updateApprovalStatus]', { conversationId, from: conversation.workflow_status, to: status });
    if (updateError) throw new Error('Failed to update approval status');

    res.status(200).json({
      success: true,
      message: `Approval status updated to ${status}.`,
      data: updated,
    });
  } catch (err) {
    console.error('[updateApprovalStatus] error:', err);
    res.status(500).json({ success: false, message: 'Unable to update approval status.' });
  }
};