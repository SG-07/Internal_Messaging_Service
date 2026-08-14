// backend/src/controllers/conversations.js

import supabaseAdmin from "../config/supabaseClient.js";

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
    const { data: recipient, error: recipientError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", recipient_email)
      .single();

    if (recipientError || !recipient) {
      return res.status(404).json({
        success: false,
        message: "Recipient not found.",
      });
    }

    const recipient_id_resolved = recipient.id;

    if (sender_id === recipient_id_resolved) {
      return res.status(400).json({
        success: false,
        message: "Cannot send message to yourself.",
      });
    }

    const { data: newConv, error: newConvError } = await supabaseAdmin
      .from("conversations")
      .insert({
        conversation_type: "direct", // Direct or Group
        category: type || null, // Info, Discussion, Approval, Action
        subject: subject || null,
        created_by: sender_id,
      })
      .select("id, subject, category")
      .single();

    if (newConvError) {
      console.error("Supabase insert error:", newConvError);
      throw new Error("Failed to create conversation");
    }

    const conversation_id = newConv.id;

    const { error: participantError } = await supabaseAdmin
      .from("conversation_participants")
      .insert([
        { conversation_id, user_id: sender_id },
        { conversation_id, user_id: recipient_id_resolved },
      ]);

    if (participantError) {
      throw new Error("Failed to add participants");
    }

    const { data: newMessage, error: messageError } = await supabaseAdmin
      .from("messages")
      .insert({
        conversation_id,
        sender_id,
        content: body,
      })
      .select("id, content, created_at")
      .single();

    if (messageError) {
      throw new Error("Failed to create message");
    }

    res.status(201).json({
      success: true,
      message: "Message sent successfully.",
      data: {
        conversation_id,
        subject: newConv.subject,
        category: newConv.category,
        message_id: newMessage.id,
        content: newMessage.content,
        sent_at: newMessage.created_at,
      },
    });
  } catch (err) {
    console.error("Create conversation error:", err);
    res.status(500).json({
      success: false,
      message: "Unable to send message.",
    });
  }
};

// --- GET CONVERSATIONS FOR CURRENT USER (PAGINATED, LIST VIEW) ---
export const getConversations = async (req, res) => {
  const user_id = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = 15;
  const offset = (page - 1) * limit;

  const isDev = process.env.NODE_ENV === "development";

  if (isDev) {
    console.log("[getConversations] Requesting user_id:", user_id);
    console.log("[getConversations] page:", page, "offset:", offset, "limit:", limit);
  }

  try {
    const {
      data: conversationLinks,
      error: convError,
      count,
    } = await supabaseAdmin
      .from("conversation_participants")
      .select(
        `
        conversation_id,
        conversations(
          id,
          subject,
          conversation_type,
          category,
          created_by,
          created_at,
          updated_at,
          creator:profiles!conversations_created_by_fkey(id, username, full_name, email)
        )
      `,
        { count: "exact" },
      )
      .eq("user_id", user_id)
      .is("hidden_at", null)
      .order("joined_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (isDev) {
      console.log("[getConversations] Raw conversationLinks:", JSON.stringify(conversationLinks, null, 2));
      console.log("[getConversations] count:", count);
    }

    if (convError) {
      console.error("[getConversations] Supabase fetch error:", convError);
      throw new Error("Failed to fetch conversations");
    }

    // For each conversation, find the OTHER participant (not the current user)
    const formattedConversations = await Promise.all(
      conversationLinks.map(async (cp) => {
        const conv = cp.conversations;

        const { data: otherParticipant, error: otherError } = await supabaseAdmin
          .from("conversation_participants")
          .select("profiles(id, username, full_name, email)")
          .eq("conversation_id", conv.id)
          .neq("user_id", user_id)
          .single();

        if (isDev && otherError) {
          console.log(
            `[getConversations] No other participant found for conversation ${conv.id}:`,
            otherError.message
          );
        }

        return {
          id: conv.id,
          subject: conv.subject,
          type: conv.conversation_type,
          category: conv.category,
          created_by: conv.created_by,
          created_by_name: conv.creator?.full_name || conv.creator?.username || null,
          created_by_email: conv.creator?.email || null,
          is_sender: conv.created_by === user_id,
          other_user_name:
            otherParticipant?.profiles?.full_name ||
            otherParticipant?.profiles?.username ||
            null,
          other_user_email: otherParticipant?.profiles?.email || null,
          created_at: conv.created_at,
          updated_at: conv.updated_at,
        };
      })
    );

    if (isDev) {
      console.log("[getConversations] Formatted response:", JSON.stringify(formattedConversations, null, 2));
    }

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
    console.error("[getConversations] Get conversations error:", err);
    res.status(500).json({
      success: false,
      message: "Unable to fetch conversations.",
    });
  }
};

// --- GET SINGLE CONVERSATION WITH PARTICIPANTS AND MESSAGES ---
export const getConversation = async (req, res) => {
  const { conversationId } = req.params;
  const user_id = req.user.id;

  try {
    const { data: isParticipant, error: participantError } = await supabaseAdmin
      .from("conversation_participants")
      .select("id")
      .eq("conversation_id", conversationId)
      .eq("user_id", user_id)
      .single();

    if (participantError || !isParticipant) {
      return res.status(403).json({
        success: false,
        message: "You are not part of this conversation.",
      });
    }

    const { data: conversation, error: convError } = await supabaseAdmin
      .from("conversations")
      .select(
        `
        id, subject, conversation_type, category, created_by, created_at, updated_at,
        conversation_participants(
          profiles(id, username, full_name, email)
        )
      `,
      )
      .eq("id", conversationId)
      .single();

    if (convError || !conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found.",
      });
    }

    // Fetch all messages in this conversation
    const { data: messages, error: messagesError } = await supabaseAdmin
      .from("messages")
      .select(
        `
        id, content, created_at, sender_id,
        profiles:sender_id(id, username, full_name)
      `,
      )
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (messagesError) {
      throw new Error("Failed to fetch messages");
    }

    const { conversation_participants, ...conversationData } = conversation;

    res.status(200).json({
      success: true,
      data: {
        ...conversationData,
        participants: conversation_participants.map((p) => p.profiles),
        messages: messages.map((m) => ({
          id: m.id,
          content: m.content,
          created_at: m.created_at,
          sender_id: m.sender_id,
          sender_name: m.profiles?.full_name || m.profiles?.username || null,
        })),
      },
    });
  } catch (err) {
    console.error("Get conversation error:", err);
    res.status(500).json({
      success: false,
      message: "Unable to fetch conversation.",
    });
  }
};

// --- UPDATE CONVERSATION ---
export const updateConversation = async (req, res) => {
  const { conversationId } = req.params;
  const { subject } = req.body;
  const user_id = req.user.id;

  if (!subject) {
    return res.status(400).json({
      success: false,
      message: "Subject is required.",
    });
  }

  try {
    const { data: isParticipant } = await supabaseAdmin
      .from("conversation_participants")
      .select("id")
      .eq("conversation_id", conversationId)
      .eq("user_id", user_id)
      .single();

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: "You are not part of this conversation.",
      });
    }

    const { data: updatedConv, error: updateError } = await supabaseAdmin
      .from("conversations")
      .update({ subject, updated_at: new Date().toISOString() })
      .eq("id", conversationId)
      .select("id, subject, updated_at")
      .single();

    if (updateError) {
      throw new Error("Failed to update conversation");
    }

    res.status(200).json({
      success: true,
      message: "Conversation updated successfully.",
      data: updatedConv,
    });
  } catch (err) {
    console.error("Update conversation error:", err);
    res.status(500).json({
      success: false,
      message: "Unable to update conversation.",
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
      .from("conversation_participants")
      .select("id")
      .eq("conversation_id", conversationId)
      .eq("user_id", user_id)
      .single();

    if (participantError || !participant) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found.",
      });
    }

    const { error: updateError } = await supabaseAdmin
      .from("conversation_participants")
      .update({ hidden_at: new Date().toISOString() })
      .eq("id", participant.id);

    if (updateError) {
      throw new Error("Failed to hide conversation");
    }

    res.status(200).json({
      success: true,
      message: "Conversation removed from your dashboard.",
    });
  } catch (err) {
    console.error("Delete conversation error:", err);
    res.status(500).json({
      success: false,
      message: "Unable to remove conversation.",
    });
  }
};


// --- ADD MESSAGE TO EXISTING CONVERSATION (REPLY) ---
export const addMessage = async (req, res) => {
  const { conversationId } = req.params;
  const { body } = req.body;
  const sender_id = req.user.id;

  const isDev = process.env.NODE_ENV === "development";

  if (isDev) {
    console.log("[addMessage] conversationId:", conversationId);
    console.log("[addMessage] sender_id:", sender_id);
    console.log("[addMessage] Request body:", JSON.stringify(req.body, null, 2));
  }

  if (!body) {
    return res.status(400).json({
      success: false,
      message: "Message body is required.",
    });
  }

  try {
    // Verify sender is a participant in this conversation
    const { data: isParticipant, error: participantError } = await supabaseAdmin
      .from("conversation_participants")
      .select("id")
      .eq("conversation_id", conversationId)
      .eq("user_id", sender_id)
      .single();

    if (isDev) {
      console.log("[addMessage] isParticipant:", isParticipant, "participantError:", participantError);
    }

    if (participantError || !isParticipant) {
      return res.status(403).json({
        success: false,
        message: "You are not part of this conversation.",
      });
    }

    // Insert the new message
    const { data: newMessage, error: messageError } = await supabaseAdmin
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id,
        content: body,
      })
      .select("id, content, created_at, sender_id")
      .single();

    if (messageError) {
      console.error("[addMessage] Supabase insert error:", messageError);
      throw new Error("Failed to create message");
    }

    // Bump conversation's updated_at so it sorts as most recently active
    const { error: convUpdateError } = await supabaseAdmin
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId);

    if (isDev && convUpdateError) {
      console.log("[addMessage] Failed to bump conversation updated_at:", convUpdateError);
    }

    // Fetch sender's name for the response
    const { data: senderProfile } = await supabaseAdmin
      .from("profiles")
      .select("username, full_name")
      .eq("id", sender_id)
      .single();

    const responsePayload = {
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
    };

    if (isDev) {
      console.log("[addMessage] Response payload sent to frontend:", JSON.stringify(responsePayload, null, 2));
    }

    res.status(201).json(responsePayload);
  } catch (err) {
    console.error("[addMessage] Add message error:", err);
    res.status(500).json({
      success: false,
      message: "Unable to send message.",
    });
  }
};