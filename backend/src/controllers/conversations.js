// backend/src/controllers/conversations.js

import supabaseAdmin from "../config/supabaseClient.js";

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

function buildWorkflow(conversation, currentUserId) {
  const { category, workflow_status, created_by, workflow_comment } = conversation;

  // Information and Discussion do not have workflow
  if (category !== "action_required" && category !== "approval_required") {
    return null;
  }

  const type = category === "action_required" ? "action" : "approval";

  const isFinal =
    type === "action"
      ? FINAL_ACTION_STATUSES.includes(workflow_status)
      : FINAL_APPROVAL_STATUSES.includes(workflow_status);

  // The user who created the workflow request
  // is the requester and cannot respond.
  const isRequester = currentUserId === created_by;

  // Only the recipient can respond while NOT in a truly final state.
  // MORE_INFO is NOT final - user can still update from MORE_INFO
  const canRespond = !isRequester && !isFinal;

  return {
    type,
    status: workflow_status,
    can_respond: canRespond,
    is_final: isFinal,
    workflow_comment: workflow_comment || null,
  };
}

// --- CREATE NEW CONVERSATION WITH INITIAL MESSAGE ---
export const createConversation = async (req, res) => {
  const { recipient_id, subject, type, body } = req.body;
  const sender_id = req.user.id;

  // recipient_id currently contains recipient email
  const recipient_email = recipient_id;

  if (!recipient_email || !body) {
    return res.status(400).json({
      success: false,
      message: "Recipient and message body are required.",
    });
  }

  try {
    // --------------------------------------------------
    // 1. Resolve recipient email to user ID
    // --------------------------------------------------

    const { data: recipient, error: recipientError } = await supabaseAdmin
      .from("profiles")
      .select("id, username, full_name, email")
      .eq("email", recipient_email)
      .single();

    if (recipientError || !recipient) {
      return res.status(404).json({
        success: false,
        message: "Recipient not found.",
      });
    }

    const recipient_id_resolved = recipient.id;

    // --------------------------------------------------
    // 2. Prevent sending message to yourself
    // --------------------------------------------------

    if (sender_id === recipient_id_resolved) {
      return res.status(400).json({
        success: false,
        message: "Cannot send message to yourself.",
      });
    }

    // --------------------------------------------------
    // 3. Validate conversation category
    // --------------------------------------------------

    const resolvedCategory = type || null;

    const validCategories = [
      "information",
      "discussion",
      "approval_required",
      "action_required",
    ];

    if (!validCategories.includes(resolvedCategory)) {
      return res.status(400).json({
        success: false,
        message: "Invalid conversation category.",
      });
    }

    // --------------------------------------------------
    // 4. Initialize workflow status
    //
    // Information / Discussion:
    //     workflow_status = null
    //
    // Approval / Action:
    //     workflow_status = PENDING
    // --------------------------------------------------

    const needsWorkflow =
      resolvedCategory === "action_required" ||
      resolvedCategory === "approval_required";

    const workflowStatus = needsWorkflow ? "PENDING" : null;

    // --------------------------------------------------
    // 5. Create conversation
    // --------------------------------------------------

    const { data: newConversation, error: conversationError } =
      await supabaseAdmin
        .from("conversations")
        .insert({
          conversation_type: "direct",
          category: resolvedCategory,
          subject: subject || null,
          created_by: sender_id,
          workflow_status: workflowStatus,
        })
        .select(
          `
          id,
          subject,
          conversation_type,
          category,
          created_by,
          created_at,
          updated_at,
          status,
          workflow_status
        `,
        )
        .single();

    if (conversationError) {
      console.error("Conversation creation error:", conversationError);

      throw new Error("Failed to create conversation");
    }

    const conversation_id = newConversation.id;

    // --------------------------------------------------
    // 6. Add sender and recipient as participants
    // --------------------------------------------------

    const { error: participantError } = await supabaseAdmin
      .from("conversation_participants")
      .insert([
        {
          conversation_id,
          user_id: sender_id,
        },
        {
          conversation_id,
          user_id: recipient_id_resolved,
        },
      ]);

    if (participantError) {
      console.error("Participant creation error:", participantError);

      throw new Error("Failed to add participants");
    }

    // --------------------------------------------------
    // 7. Create initial message
    // --------------------------------------------------

    const { data: newMessage, error: messageError } = await supabaseAdmin
      .from("messages")
      .insert({
        conversation_id,
        sender_id,
        content: body,
      })
      .select(
        `
          id,
          content,
          created_at,
          sender_id
        `,
      )
      .single();

    if (messageError) {
      console.error("Message creation error:", messageError);

      throw new Error("Failed to create message");
    }

    // --------------------------------------------------
    // 8. Fetch sender profile
    // --------------------------------------------------

    const { data: senderProfile, error: senderError } = await supabaseAdmin
      .from("profiles")
      .select("id, username, full_name, email")
      .eq("id", sender_id)
      .single();

    if (senderError) {
      console.error("Sender profile fetch error:", senderError);
    }

    // --------------------------------------------------
    // 9. Return created conversation
    //
    // No buildWorkflow() here.
    // workflow_status is already stored in DB.
    // --------------------------------------------------

    return res.status(201).json({
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

        // Raw workflow state stored in DB
        workflow_status: newConversation.workflow_status,

        messages: [
          {
            id: newMessage.id,
            content: newMessage.content,
            created_at: newMessage.created_at,
            sender_id: newMessage.sender_id,
            sender_name:
              senderProfile?.full_name || senderProfile?.username || null,
          },
        ],

        participants: [
          {
            id: senderProfile?.id || sender_id,
            username: senderProfile?.username || null,
            full_name: senderProfile?.full_name || null,
            email: senderProfile?.email || null,
          },
          {
            id: recipient.id,
            username: recipient.username || null,
            full_name: recipient.full_name || null,
            email: recipient.email || null,
          },
        ],
      },
    });
  } catch (err) {
    console.error("Create conversation error:", err);

    return res.status(500).json({
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
    console.log(
      "[getConversations] page:",
      page,
      "offset:",
      offset,
      "limit:",
      limit,
    );
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
      console.log(
        "[getConversations] Raw conversationLinks:",
        JSON.stringify(conversationLinks, null, 2),
      );
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

        const { data: otherParticipant, error: otherError } =
          await supabaseAdmin
            .from("conversation_participants")
            .select("profiles(id, username, full_name, email)")
            .eq("conversation_id", conv.id)
            .neq("user_id", user_id)
            .single();

        if (isDev && otherError) {
          console.log(
            `[getConversations] No other participant found for conversation ${conv.id}:`,
            otherError.message,
          );
        }

        return {
          id: conv.id,
          subject: conv.subject,
          type: conv.conversation_type,
          category: conv.category,
          created_by: conv.created_by,
          created_by_name:
            conv.creator?.full_name || conv.creator?.username || null,
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
      }),
    );

    if (isDev) {
      console.log(
        "[getConversations] Formatted response:",
        JSON.stringify(formattedConversations, null, 2),
      );
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

// --- GET SINGLE CONVERSATION WITH PARTICIPANTS, MESSAGES AND WORKFLOW ---
export const getConversation = async (req, res) => {
  const { conversationId } = req.params;
  const user_id = req.user.id;

  try {
    // --------------------------------------------------
    // 1. Verify current user is a participant
    // --------------------------------------------------

    const { data: currentParticipant, error: participantError } =
      await supabaseAdmin
        .from("conversation_participants")
        .select("id")
        .eq("conversation_id", conversationId)
        .eq("user_id", user_id)
        .single();

    if (participantError || !currentParticipant) {
      return res.status(403).json({
        success: false,
        message: "You are not part of this conversation.",
      });
    }

    // --------------------------------------------------
    // 2. Fetch conversation
    // --------------------------------------------------

    const { data: conversation, error: convError } = await supabaseAdmin
      .from("conversations")
      .select(
        `
        id,
        subject,
        conversation_type,
        category,
        created_by,
        created_at,
        updated_at,
        status,
        workflow_status,
        workflow_comment,
        workflow_updated_by,
        workflow_updated_at,

        conversation_participants(
          user_id,
          profiles(
            id,
            username,
            full_name,
            email
          )
        )
      `,
      )
      .eq("id", conversationId)
      .single();

    if (convError || !conversation) {
      console.error("Conversation fetch error:", convError);

      return res.status(404).json({
        success: false,
        message: "Conversation not found.",
      });
    }

    // --------------------------------------------------
    // 3. Build participants
    // --------------------------------------------------

    const participants = conversation.conversation_participants.map(
      (participant) => ({
        id: participant.profiles.id,
        username: participant.profiles.username,
        full_name: participant.profiles.full_name,
        email: participant.profiles.email,
      }),
    );

    // --------------------------------------------------
    // 5. Build workflow
    // --------------------------------------------------

    const workflow = buildWorkflow(conversation, user_id);

    // --------------------------------------------------
    // 6. Fetch messages
    // --------------------------------------------------

    const { data: messages, error: messagesError } = await supabaseAdmin
      .from("messages")
      .select(
        `
        id,
        content,
        created_at,
        sender_id,
        profiles:sender_id(
          id,
          username,
          full_name
        )
      `,
      )
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (messagesError) {
      console.error("Messages fetch error:", messagesError);

      throw new Error("Failed to fetch messages");
    }

    // --------------------------------------------------
    // 7. Build messages
    // --------------------------------------------------

    const formattedMessages = messages.map((message) => ({
      id: message.id,
      content: message.content,
      created_at: message.created_at,
      sender_id: message.sender_id,
      sender_name:
        message.profiles?.full_name || message.profiles?.username || null,
    }));

    // --------------------------------------------------
    // 8. Return final conversation
    // --------------------------------------------------

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

    // Soft delete: mark as hidden for this user only.
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
    console.log(
      "[addMessage] Request body:",
      JSON.stringify(req.body, null, 2),
    );
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
      console.log(
        "[addMessage] isParticipant:",
        isParticipant,
        "participantError:",
        participantError,
      );
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
      console.log(
        "[addMessage] Failed to bump conversation updated_at:",
        convUpdateError,
      );
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
        sender_name:
          senderProfile?.full_name || senderProfile?.username || null,
        sent_at: newMessage.created_at,
      },
    };

    if (isDev) {
      console.log(
        "[addMessage] Response payload sent to frontend:",
        JSON.stringify(responsePayload, null, 2),
      );
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

// --- GET ALL CONVERSATIONS BETWEEN CURRENT USER AND A SPECIFIC OTHER USER ---
export const getConversationsWithUser = async (req, res) => {
  const { email } = req.body; 
  const user_id = req.user.id;

  const isDev = process.env.NODE_ENV === "development";

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Provide an email to search.",
    });
  }

  try {
    // Resolve the other user by email
    const { data: otherUser, error: otherUserError } = await supabaseAdmin
      .from("profiles")
      .select("id, email, username, full_name")
      .eq("email", email)
      .single();

    if (otherUserError || !otherUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (otherUser.id === user_id) {
      return res.status(400).json({
        success: false,
        message: "Cannot search conversations with yourself.",
      });
    }

    if (isDev) {
      console.log(
        "[getConversationsWithUser] user_id:",
        user_id,
        "otherUser:",
        otherUser.id,
      );
    }

    // Find all conversation_ids the CURRENT user is part of
    const { data: myConvLinks, error: myConvError } = await supabaseAdmin
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", user_id);

    if (myConvError) {
      throw new Error("Failed to fetch your conversations");
    }

    const myConvIds = myConvLinks.map((c) => c.conversation_id);

    if (myConvIds.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No conversations found.",
        data: [],
      });
    }

    // Find which of those conversation_ids the OTHER user is also part of
    const { data: sharedConvLinks, error: sharedError } = await supabaseAdmin
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", otherUser.id)
      .in("conversation_id", myConvIds);

    if (sharedError) {
      throw new Error("Failed to fetch shared conversations");
    }

    const sharedConvIds = sharedConvLinks.map((c) => c.conversation_id);

    if (sharedConvIds.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No conversations found.",
        data: [],
      });
    }

    // Fetch full conversation + messages for each shared conversation
    const { data: conversations, error: convError } = await supabaseAdmin
      .from("conversations")
      .select(
        "id, subject, conversation_type, category, created_by, created_at, updated_at",
      )
      .in("id", sharedConvIds)
      .order("updated_at", { ascending: false });

    if (convError) {
      throw new Error("Failed to fetch conversations");
    }

    const conversationsWithMessages = await Promise.all(
      conversations.map(async (conv) => {
        const { data: messages, error: messagesError } = await supabaseAdmin
          .from("messages")
          .select(
            `
            id, content, created_at, sender_id,
            profiles:sender_id(id, username, full_name)
          `,
          )
          .eq("conversation_id", conv.id)
          .order("created_at", { ascending: true });

        if (isDev && messagesError) {
          console.log(
            `[getConversationsWithUser] Failed to fetch messages for ${conv.id}:`,
            messagesError.message,
          );
        }

        return {
          ...conv,
          messages: (messages || []).map((m) => ({
            id: m.id,
            content: m.content,
            created_at: m.created_at,
            sender_id: m.sender_id,
            sender_name: m.profiles?.full_name || m.profiles?.username || null,
          })),
        };
      }),
    );

    if (isDev) {
      console.log(
        "[getConversationsWithUser] Found",
        conversationsWithMessages.length,
        "shared conversations",
      );
    }

    res.status(200).json({
      success: true,
      other_user: otherUser,
      data: conversationsWithMessages,
    });
  } catch (err) {
    console.error("[getConversationsWithUser] error:", err);
    res.status(500).json({
      success: false,
      message: "Unable to fetch conversations.",
    });
  }
};

// --- Fetch Conversations sent by the current user ---
export const getSentConversations = async (req, res) => {
  const user_id = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = 15;
  const offset = (page - 1) * limit;

  const isDev = process.env.NODE_ENV === "development";

  try {
    const {
      data: sentConversations,
      error: sentError,
      count,
    } = await supabaseAdmin
      .from("conversations")
      .select(
        `
        id, subject, conversation_type, category, created_at, updated_at
      `,
        { count: "exact" },
      )
      .eq("created_by", user_id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (sentError) {
      console.error("[getSentConversations] Supabase error:", sentError);
      throw new Error("Failed to fetch sent conversations");
    }

    // For each conversation, find the recipient (the other participant)
    const formattedConversations = await Promise.all(
      sentConversations.map(async (conv) => {
        const { data: recipient, error: recipientError } = await supabaseAdmin
          .from("conversation_participants")
          .select("profiles(id, username, full_name, email)")
          .eq("conversation_id", conv.id)
          .neq("user_id", user_id)
          .single();

        if (isDev && recipientError) {
          console.log(
            `[getSentConversations] No recipient found for conversation ${conv.id}:`,
            recipientError.message,
          );
        }

        return {
          id: conv.id,
          subject: conv.subject,
          type: conv.conversation_type,
          category: conv.category,
          created_at: conv.created_at,
          updated_at: conv.updated_at,
          recipient_name:
            recipient?.profiles?.full_name ||
            recipient?.profiles?.username ||
            null,
          recipient_email: recipient?.profiles?.email || null,
        };
      }),
    );

    if (isDev) {
      console.log("[getSentConversations] user_id:", user_id, "count:", count);
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
    console.error("[getSentConversations] error:", err);
    res.status(500).json({
      success: false,
      message: "Unable to fetch sent conversations.",
    });
  }
};

// --- GET WORKFLOW ITEMS PENDING ON CURRENT USER (as recipient) ---
export const getPendingWorkflows = async (req, res) => {
  const user_id = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = 15;

  try {
    const { data: myLinks, error: linksError } = await supabaseAdmin
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", user_id);

    if (linksError) throw new Error("Failed to fetch conversations");

    const convIds = myLinks.map((l) => l.conversation_id);

    if (convIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        pagination: { page, limit, total: 0, has_more: false },
      });
    }

    const { data: actionItems, error: actionError } = await supabaseAdmin
      .from("conversations")
      .select(
        "id, subject, category, workflow_status, created_by, created_at, updated_at",
      )
      .in("id", convIds)
      .eq("category", "action_required")
      .in("workflow_status", ["PENDING", "WILL_DO"])
      .neq("created_by", user_id);

    if (actionError) throw new Error("Failed to fetch action items");

    const { data: approvalItems, error: approvalError } = await supabaseAdmin
      .from("conversations")
      .select(
        "id, subject, category, workflow_status, created_by, created_at, updated_at",
      )
      .in("id", convIds)
      .eq("category", "approval_required")
      .in("workflow_status", ["PENDING", "MORE_INFO"])
      .neq("created_by", user_id);

    if (approvalError) throw new Error("Failed to fetch approval items");

    const combined = [...actionItems, ...approvalItems].sort(
      (a, b) => new Date(b.updated_at) - new Date(a.updated_at),
    );

    const total = combined.length;
    const offset = (page - 1) * limit;
    const pageItems = combined.slice(offset, offset + limit);

    res.status(200).json({
      success: true,
      data: pageItems.map((c) => ({
        id: c.id,
        subject: c.subject,
        type: c.category === "action_required" ? "action" : "approval",
        status: c.workflow_status,
        created_by: c.created_by,
        updated_at: c.updated_at,
      })),
      pagination: { page, limit, total, has_more: offset + limit < total },
    });
  } catch (err) {
    console.error("[getPendingWorkflows] error:", err);
    res.status(500).json({
      success: false,
      message: "Unable to fetch pending items.",
    });
  }
};

// --- GET WORKFLOW REQUESTS CREATED BY CURRENT USER ---
export const getMyWorkflowRequests = async (req, res) => {
  const user_id = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = 15;
  const offset = (page - 1) * limit;

  try {
    const {
      data: items,
      error,
      count,
    } = await supabaseAdmin
      .from("conversations")
      .select(
        "id, subject, category, workflow_status, created_at, updated_at",
        {
          count: "exact",
        },
      )
      .eq("created_by", user_id)
      .in("category", ["action_required", "approval_required"])
      .order("updated_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error("Failed to fetch requests");

    res.status(200).json({
      success: true,
      data: items.map((c) => ({
        id: c.id,
        subject: c.subject,
        type: c.category === "action_required" ? "action" : "approval",
        status: c.workflow_status,
        updated_at: c.updated_at,
      })),
      pagination: {
        page,
        limit,
        total: count,
        has_more: offset + limit < count,
      },
    });
  } catch (err) {
    console.error("[getMyWorkflowRequests] error:", err);
    res.status(500).json({
      success: false,
      message: "Unable to fetch your requests.",
    });
  }
};

// --- UPDATE WORKFLOW STATUS FOR A CONVERSATION ---
export const updateActionStatus = async (req, res) => {
  const { conversationId } = req.params;
  const { status, comment } = req.body;
  const user_id = req.user.id;

  const isDev = process.env.NODE_ENV === 'development';
  const validStatuses = ['WILL_DO', 'DONE', 'REJECTED', 'MORE_INFO'];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Status must be one of: ${validStatuses.join(', ')}`,
    });
  }

  const requiresComment = status === 'REJECTED' || status === 'MORE_INFO';
  if (requiresComment && (!comment || !comment.trim())) {
    return res.status(400).json({
      success: false,
      message: 'A comment is required when rejecting or requesting more info.',
    });
  }

  try {
    const { data: conversation, error: convError } = await supabaseAdmin
      .from('conversations')
      .select('id, category, created_by, workflow_status')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found.',
      });
    }

    if (conversation.category !== 'action_required') {
      return res.status(400).json({
        success: false,
        message: 'This conversation does not have an action workflow.',
      });
    }

    const { data: participant, error: participantError } = await supabaseAdmin
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', conversationId)
      .eq('user_id', user_id)
      .single();

    if (participantError || !participant) {
      return res.status(403).json({
        success: false,
        message: 'You are not part of this conversation.',
      });
    }

    if (user_id === conversation.created_by) {
      return res.status(403).json({
        success: false,
        message: 'You cannot act on a request you created.',
      });
    }

    const currentStatus = conversation.workflow_status;
    const allowedNext = ACTION_TRANSITIONS[currentStatus] || [];

    if (!allowedNext.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition from ${currentStatus} to ${status}.`,
      });
    }

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

    if (isDev) {
      console.log('[updateActionStatus]', conversationId, currentStatus, '->', status);
    }

    if (updateError) {
      throw new Error('Failed to update action status');
    }

    res.status(200).json({
      success: true,
      message: `Action status updated to ${status}.`,
      data: updated,
    });
  } catch (err) {
    console.error('[updateActionStatus] error:', err);
    res.status(500).json({
      success: false,
      message: 'Unable to update action status.',
    });
  }
};

// --- UPDATE APPROVAL WORKFLOW STATUS ---
export const updateApprovalStatus = async (req, res) => {
  const { conversationId } = req.params;
  const { status, comment } = req.body;
  const user_id = req.user.id;

  const isDev = process.env.NODE_ENV === 'development';
  const validStatuses = ['APPROVED', 'REJECTED', 'MORE_INFO'];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Status must be one of: ${validStatuses.join(', ')}`,
    });
  }

  const requiresComment = status === 'REJECTED' || status === 'MORE_INFO';
  if (requiresComment && (!comment || !comment.trim())) {
    return res.status(400).json({
      success: false,
      message: 'A comment is required when rejecting or requesting more info.',
    });
  }

  try {
    const { data: conversation, error: convError } = await supabaseAdmin
      .from('conversations')
      .select('id, category, created_by, workflow_status')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found.',
      });
    }

    if (conversation.category !== 'approval_required') {
      return res.status(400).json({
        success: false,
        message: 'This conversation does not have an approval workflow.',
      });
    }

    const { data: participant, error: participantError } = await supabaseAdmin
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', conversationId)
      .eq('user_id', user_id)
      .single();

    if (participantError || !participant) {
      return res.status(403).json({
        success: false,
        message: 'You are not part of this conversation.',
      });
    }

    if (user_id === conversation.created_by) {
      return res.status(403).json({
        success: false,
        message: 'You cannot approve or reject your own request.',
      });
    }

    const currentStatus = conversation.workflow_status;
    const allowedNext = APPROVAL_TRANSITIONS[currentStatus] || [];

    if (!allowedNext.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition from ${currentStatus} to ${status}.`,
      });
    }

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

    if (isDev) {
      console.log('[updateApprovalStatus]', conversationId, currentStatus, '->', status);
    }

    if (updateError) {
      throw new Error('Failed to update approval status');
    }

    res.status(200).json({
      success: true,
      message: `Approval status updated to ${status}.`,
      data: updated,
    });
  } catch (err) {
    console.error('[updateApprovalStatus] error:', err);
    res.status(500).json({
      success: false,
      message: 'Unable to update approval status.',
    });
  }
};