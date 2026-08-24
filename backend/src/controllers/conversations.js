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


/// --- REVIEW REPORT ---
export const reviewReport = async (req, res) => {
  const { reportId } = req.params;
  const { status, resolution_notes } = req.body;
  const currentUserId = req.user.id;
  const isDev = process.env.NODE_ENV === 'development';

  if (!reportId) {
    return res.status(400).json({
      success: false,
      message: 'Report ID is required.',
    });
  }

  if (!status) {
    return res.status(400).json({
      success: false,
      message: 'Status is required.',
    });
  }

  const validStatuses = ['reviewed', 'dismissed', 'resolved'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status. Must be one of: reviewed, dismissed, resolved.',
    });
  }

  if (resolution_notes && resolution_notes.length > 500) {
    return res.status(400).json({
      success: false,
      message: 'Resolution notes must not exceed 500 characters.',
    });
  }

  try {
    // Fetch current user details
    const { data: currentUser, error: currentUserError } = await supabaseAdmin
      .from('profiles')
      .select('id, role')
      .eq('id', currentUserId)
      .single();

    if (currentUserError || !currentUser) {
      return res.status(404).json({
        success: false,
        message: 'Current user not found.',
      });
    }

    // Check permissions: only admin and manager can review reports
    if (currentUser.role !== 'admin' && currentUser.role !== 'manager') {
      return res.status(403).json({
        success: false,
        message: 'Only admins and managers can review reports.',
      });
    }

    // Fetch report details
    const { data: report, error: reportError } = await supabaseAdmin
      .from('conversation_reports')
      .select('id, conversation_id, status')
      .eq('id', reportId)
      .single();

    if (reportError || !report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found.',
      });
    }

    // Check if report is pending
    if (report.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot review a ${report.status} report.`,
      });
    }

    // Fetch conversation details for response
    const { data: conversation, error: convError } = await supabaseAdmin
      .from('conversations')
      .select('id, subject')
      .eq('id', report.conversation_id)
      .single();

    if (convError || !conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found.',
      });
    }

    // Update report status
    const { data: updatedReport, error: updateError } = await supabaseAdmin
      .from('conversation_reports')
      .update({
        status: status,
        reviewed_at: new Date().toISOString(),
        reviewed_by: currentUserId,
        resolution_notes: resolution_notes || null,
      })
      .eq('id', reportId)
      .select('id, status, reviewed_at')
      .single();

    if (updateError) {
      console.error('[reviewReport] Error updating report:', updateError);
      throw new Error('Failed to review report');
    }

    // If resolved, mark conversation as no longer reported (if no other pending reports)
    if (status === 'resolved' || status === 'dismissed') {
      const { data: otherPendingReports, error: checkError } = await supabaseAdmin
        .from('conversation_reports')
        .select('id')
        .eq('conversation_id', report.conversation_id)
        .eq('status', 'pending')
        .limit(1);

      if (!checkError && (!otherPendingReports || otherPendingReports.length === 0)) {
        // No more pending reports for this conversation
        const { error: markClearError } = await supabaseAdmin
          .from('conversations')
          .update({
            is_reported: false,
          })
          .eq('id', report.conversation_id);

        if (markClearError) {
          console.error('[reviewReport] Error clearing conversation report flag:', markClearError);
          // Don't fail the request, the report review was successful
        }
      }
    }

    if (isDev) {
      console.log('[reviewReport] Report reviewed:', reportId, 'status:', status, 'by:', currentUserId);
    }

    res.status(200).json({
      success: true,
      message: `Report has been marked as ${status}.`,
      data: {
        report_id: reportId,
        conversation_id: report.conversation_id,
        conversation_subject: conversation.subject,
        status: updatedReport.status,
        reviewed_at: updatedReport.reviewed_at,
        resolution_notes: resolution_notes || null,
      },
    });
  } catch (err) {
    console.error('[reviewReport] error:', err);
    res.status(500).json({
      success: false,
      message: 'Unable to review report.',
    });
  }
};

/// --- LIST CONVERSATION REPORTS ---
export const listReports = async (req, res) => {
  const user_id = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = 20;
  const offset = (page - 1) * limit;
  const { status, sort_by } = req.query;
  const isDev = process.env.NODE_ENV === 'development';

  try {
    // Fetch current user details
    const { data: user, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('id, role')
      .eq('id', user_id)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Check permissions: only admin and manager can view reports
    if (user.role !== 'admin' && user.role !== 'manager') {
      return res.status(403).json({
        success: false,
        message: 'Only admins and managers can view conversation reports.',
      });
    }

    // Build query
    let query = supabaseAdmin
      .from('conversation_reports')
      .select(
        `
        id,
        conversation_id,
        reported_by,
        reason,
        status,
        created_at,
        reviewed_at,
        reviewed_by,
        resolution_notes,
        conversations(id, subject, conversation_type, created_by),
        reported_by_profile:profiles!conversation_reports_reported_by_fkey(id, username, full_name, email),
        reviewed_by_profile:profiles!conversation_reports_reviewed_by_fkey(id, username, full_name)
      `,
        { count: 'exact' }
      );

    // Filter by status if provided
    if (status) {
      const validStatuses = ['pending', 'reviewed', 'dismissed', 'resolved'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be one of: pending, reviewed, dismissed, resolved.',
        });
      }
      query = query.eq('status', status);
    }

    // Sort order
    let orderAscending = true;
    if (sort_by === 'oldest') {
      orderAscending = true;
    } else if (sort_by === 'newest') {
      orderAscending = false;
    }

    query = query.order('created_at', { ascending: orderAscending }).range(offset, offset + limit - 1);

    const { data: reports, error, count } = await query;

    if (error) {
      console.error('[listReports] Error fetching reports:', error);
      throw new Error('Failed to fetch reports');
    }

    if (isDev) {
      console.log('[listReports] user_id:', user_id, 'role:', user.role, 'total reports:', count);
    }

    // Transform response
    const transformedReports = reports.map((report) => ({
      id: report.id,
      conversation: {
        id: report.conversation_id,
        subject: report.conversations?.subject,
        type: report.conversations?.conversation_type,
        created_by: report.conversations?.created_by,
      },
      reported_by: {
        id: report.reported_by,
        username: report.reported_by_profile?.username,
        full_name: report.reported_by_profile?.full_name,
        email: report.reported_by_profile?.email,
      },
      reason: report.reason,
      status: report.status,
      created_at: report.created_at,
      reviewed_at: report.reviewed_at,
      reviewed_by: report.reviewed_by_profile
        ? {
            id: report.reviewed_by,
            username: report.reviewed_by_profile.username,
            full_name: report.reviewed_by_profile.full_name,
          }
        : null,
      resolution_notes: report.resolution_notes,
    }));

    res.status(200).json({
      success: true,
      data: transformedReports,
      pagination: {
        page,
        limit,
        total: count,
        has_more: offset + limit < count,
      },
    });
  } catch (err) {
    console.error('[listReports] error:', err);
    res.status(500).json({
      success: false,
      message: 'Unable to fetch reports.',
    });
  }
};


/// --- REPORT CONVERSATION ---
export const reportConversation = async (req, res) => {
  const { conversationId } = req.params;
  const { reason } = req.body;
  const user_id = req.user.id;
  const isDev = process.env.NODE_ENV === 'development';

  if (!conversationId) {
    return res.status(400).json({
      success: false,
      message: 'Conversation ID is required.',
    });
  }

  if (!reason || typeof reason !== 'string' || reason.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'Report reason is required and must be a non-empty string.',
    });
  }

  if (reason.length > 500) {
    return res.status(400).json({
      success: false,
      message: 'Report reason must not exceed 500 characters.',
    });
  }

  try {
    // Fetch conversation details
    const { data: conversation, error: convError } = await supabaseAdmin
      .from('conversations')
      .select('id, subject, conversation_type, created_by, is_group, group_id')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found.',
      });
    }

    // Check if user is a participant in this conversation
    let isParticipant = false;

    if (conversation.is_group) {
      // For group conversations, check if user is a member of the group
      const { data: groupMembership, error: groupMemberError } = await supabaseAdmin
        .from('group_members')
        .select('id')
        .eq('group_id', conversation.group_id)
        .eq('user_id', user_id)
        .is('left_at', null)
        .maybeSingle();

      if (!groupMemberError && groupMembership) {
        isParticipant = true;
      }
    } else {
      // For direct conversations, check conversation_participants
      const { data: participant, error: partError } = await supabaseAdmin
        .from('conversation_participants')
        .select('id')
        .eq('conversation_id', conversationId)
        .eq('user_id', user_id)
        .maybeSingle();

      if (!partError && participant) {
        isParticipant = true;
      }
    }

    // Only participants can report conversations
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You can only report conversations you are a member of.',
      });
    }

    // Check if user has already reported this conversation
    const { data: existingReport, error: existingReportError } = await supabaseAdmin
      .from('conversation_reports')
      .select('id, status')
      .eq('conversation_id', conversationId)
      .eq('reported_by', user_id)
      .maybeSingle();

    if (existingReportError) {
      console.error('[reportConversation] Error checking existing report:', existingReportError);
      throw new Error('Failed to check existing report');
    }

    // User can only have one report per conversation at a time
    if (existingReport) {
      if (existingReport.status === 'pending') {
        return res.status(400).json({
          success: false,
          message: 'You have already reported this conversation. Your report is pending review.',
        });
      }
      if (existingReport.status === 'resolved') {
        return res.status(400).json({
          success: false,
          message: 'You have already reported this conversation and it has been resolved.',
        });
      }
      // Allow re-reporting if previous was dismissed
      if (existingReport.status === 'dismissed') {
        // Delete the old dismissed report so we can create a new one
        await supabaseAdmin
          .from('conversation_reports')
          .delete()
          .eq('id', existingReport.id);
      }
    }

    // Create report
    const { data: report, error: reportError } = await supabaseAdmin
      .from('conversation_reports')
      .insert({
        conversation_id: conversationId,
        reported_by: user_id,
        reason: reason.trim(),
        status: 'pending',
      })
      .select('id, created_at')
      .single();

    if (reportError) {
      console.error('[reportConversation] Error creating report:', reportError);
      throw new Error('Failed to create report');
    }

    // Mark conversation as reported
    const { error: markReportedError } = await supabaseAdmin
      .from('conversations')
      .update({
        is_reported: true,
      })
      .eq('id', conversationId);

    if (markReportedError) {
      console.error('[reportConversation] Error marking conversation as reported:', markReportedError);
      // Don't fail the request, the report was created successfully
    }

    if (isDev) {
      console.log('[reportConversation] Conversation reported:', conversationId, 'by user:', user_id, 'report_id:', report.id);
    }

    res.status(201).json({
      success: true,
      message: 'Thank you for reporting this conversation. Our team will review it shortly.',
      data: {
        report_id: report.id,
        conversation_id: conversationId,
        conversation_subject: conversation.subject,
        reason: reason.trim(),
        status: 'pending',
        reported_at: report.created_at,
      },
    });
  } catch (err) {
    console.error('[reportConversation] error:', err);
    res.status(500).json({
      success: false,
      message: 'Unable to report conversation.',
    });
  }
};