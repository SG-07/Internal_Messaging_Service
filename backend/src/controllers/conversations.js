// backend/src/controllers/conversations.js

import supabaseAdmin from '../config/supabaseClient.js';

// --- CREATE CONVERSATION + FIRST MESSAGE ---
export const createConversation = async (req, res) => {
  const { recipient_id, subject, body } = req.body;
  const sender_id = req.user.id;

  if (!recipient_id || !body) {
    return res.status(400).json({
      success: false,
      message: 'Recipient and message body are required.',
    });
  }

  if (sender_id === recipient_id) {
    return res.status(400).json({
      success: false,
      message: 'Cannot send message to yourself.',
    });
  }

  try {
    // Check if recipient exists
    const { data: recipient, error: recipientError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', recipient_id)
      .single();

    if (recipientError || !recipient) {
      return res.status(404).json({
        success: false,
        message: 'Recipient not found.',
      });
    }

    // Always create a new conversation
    const { data: newConv, error: newConvError } = await supabaseAdmin
      .from('conversations')
      .insert({
        conversation_type: 'direct',
        subject: subject || null,
        created_by: sender_id,
      })
      .select('id, subject')
      .single();

    if (newConvError) {
      throw new Error('Failed to create conversation');
    }

    const conversation_id = newConv.id;

    // Add both participants
    const { error: participantError } = await supabaseAdmin
      .from('conversation_participants')
      .insert([
        { conversation_id, user_id: sender_id },
        { conversation_id, user_id: recipient_id },
      ]);

    if (participantError) {
      throw new Error('Failed to add participants');
    }

    // Create the first message
    const { data: newMessage, error: messageError } = await supabaseAdmin
      .from('messages')
      .insert({
        conversation_id,
        sender_id,
        content: body,
      })
      .select('id, content, created_at')
      .single();

    if (messageError) {
      throw new Error('Failed to create message');
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully.',
      data: {
        conversation_id,
        subject: newConv.subject,
        message_id: newMessage.id,
        content: newMessage.content,
        sent_at: newMessage.created_at,
      },
    });
  } catch (err) {
    console.error('Create conversation error:', err);
    res.status(500).json({
      success: false,
      message: 'Unable to send message.',
    });
  }
};

// --- GET CONVERSATIONS FOR CURRENT USER (PAGINATED, LIST VIEW) ---
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
          id,
          name,
          subject,
          conversation_type,
          created_by,
          created_at,
          updated_at
        )
      `, { count: 'exact' })
      .eq('user_id', user_id)
      .is('hidden_at', null)
      .order('joined_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (convError) {
      throw new Error('Failed to fetch conversations');
    }

    const formattedConversations = conversationLinks.map((cp) => {
      const conv = cp.conversations;
      return {
        id: conv.id,
        name: conv.name,
        subject: conv.subject,
        type: conv.conversation_type,
        created_by: conv.created_by,
        created_at: conv.created_at,
        updated_at: conv.updated_at,
      };
    });

    res.status(200).json({
      success: true,
      data: formattedConversations,
      pagination: {
        page,
        limit,
        total: count,
        has_more: offset + limit < count,
      },
    });
  } catch (err) {
    console.error('Get conversations error:', err);
    res.status(500).json({
      success: false,
      message: 'Unable to fetch conversations.',
    });
  }
};

// --- GET SINGLE CONVERSATION WITH PARTICIPANTS ---
export const getConversation = async (req, res) => {
  const { conversationId } = req.params;
  const user_id = req.user.id;

  try {
    // Step 1: Verify membership (lightweight, indexed lookup — no profile data fetched)
    const { data: isParticipant, error: participantError } = await supabaseAdmin
      .from('conversation_participants')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('user_id', user_id)
      .single();

    if (participantError || !isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You are not part of this conversation.',
      });
    }

    // Step 2: Fetch conversation + all participants' profiles in one query
    const { data: conversation, error: convError } = await supabaseAdmin
      .from('conversations')
      .select(`
        id, name, subject, conversation_type, created_by, created_at, updated_at,
        conversation_participants(
          profiles(id, username, full_name, email)
        )
      `)
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found.',
      });
    }

    const { conversation_participants, ...conversationData } = conversation;

    res.status(200).json({
      success: true,
      data: {
        ...conversationData,
        participants: conversation_participants.map(p => p.profiles),
      },
    });
  } catch (err) {
    console.error('Get conversation error:', err);
    res.status(500).json({
      success: false,
      message: 'Unable to fetch conversation.',
    });
  }
};

// --- UPDATE CONVERSATION ---
export const updateConversation = async (req, res) => {
  const { conversationId } = req.params;
  const { name, subject } = req.body;
  const user_id = req.user.id;

  if (!name && !subject) {
    return res.status(400).json({
      success: false,
      message: 'At least one field (name or subject) is required.',
    });
  }

  try {
    // Check if user is part of this conversation
    const { data: isParticipant } = await supabaseAdmin
      .from('conversation_participants')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('user_id', user_id)
      .single();

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You are not part of this conversation.',
      });
    }

    // Update conversation
    const updateData = {};
    if (name) updateData.name = name;
    if (subject) updateData.subject = subject;
    updateData.updated_at = new Date().toISOString();

    const { data: updatedConv, error: updateError } = await supabaseAdmin
      .from('conversations')
      .update(updateData)
      .eq('id', conversationId)
      .select('id, name, subject, updated_at')
      .single();

    if (updateError) {
      throw new Error('Failed to update conversation');
    }

    res.status(200).json({
      success: true,
      message: 'Conversation updated successfully.',
      data: updatedConv,
    });
  } catch (err) {
    console.error('Update conversation error:', err);
    res.status(500).json({
      success: false,
      message: 'Unable to update conversation.',
    });
  }
};

// --- DELETE (HIDE) CONVERSATION FOR CURRENT USER ---
export const deleteConversation = async (req, res) => {
  const { conversationId } = req.params;
  const user_id = req.user.id;

  try {
    // Check user is part of this conversation
    const { data: participant, error: participantError } = await supabaseAdmin
      .from('conversation_participants')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('user_id', user_id)
      .single();

    if (participantError || !participant) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found.',
      });
    }

    // Soft delete: mark as hidden for this user only.
    // The conversation, its messages, and the other participant's
    // access remain fully intact — this only affects this user's view.
    const { error: updateError } = await supabaseAdmin
      .from('conversation_participants')
      .update({ hidden_at: new Date().toISOString() })
      .eq('id', participant.id);

    if (updateError) {
      throw new Error('Failed to hide conversation');
    }

    res.status(200).json({
      success: true,
      message: 'Conversation removed from your dashboard.',
    });
  } catch (err) {
    console.error('Delete conversation error:', err);
    res.status(500).json({
      success: false,
      message: 'Unable to remove conversation.',
    });
  }
};