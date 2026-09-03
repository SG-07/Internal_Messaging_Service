// backend/src/controllers/ai.js
import supabaseAdmin from '../config/supabaseClient.js';
import {
  summarizeConversation as generateSummary,
  flagImportance,
  generateDigest as generateDigestText,
  draftReply,
  composeMessage,
  VALID_TONES,
  PromptInjectionError,
} from '../services/aiService.js';

const isDev = process.env.NODE_ENV === 'development';

// --- SUMMARIZE A CONVERSATION THREAD (cached, regenerated only if new messages arrived) ---
export const summarizeConversation = async (req, res) => {
  const { conversationId } = req.params;
  const user_id = req.user.id;

  try {
    // Verify the requester is actually a participant — same source of
    // truth every other conversation endpoint checks.
    const { data: participant, error: participantError } = await supabaseAdmin
      .from('conversation_participants')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('user_id', user_id)
      .single();

    if (participantError || !participant) {
      return res.status(403).json({
        success: false,
        message: 'You are not part of this conversation.',
      });
    }

    const { data: conversation, error: convError } = await supabaseAdmin
      .from('conversations')
      .select('id, subject, ai_summary, ai_summary_updated_at, ai_summary_message_count')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found.',
      });
    }

    const { count: currentMessageCount, error: countError } = await supabaseAdmin
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('conversation_id', conversationId);

    if (countError) {
      throw new Error('Failed to count messages');
    }

    // Cache hit — nothing new since the last summary was generated.
    if (
      conversation.ai_summary &&
      conversation.ai_summary_message_count === currentMessageCount
    ) {
      if (isDev) {
        console.log('[summarizeConversation] Cache hit for conversation:', conversationId);
      }

      return res.status(200).json({
        success: true,
        data: {
          ...conversation.ai_summary,
          cached: true,
          updated_at: conversation.ai_summary_updated_at,
        },
      });
    }

    const { data: messages, error: messagesError } = await supabaseAdmin
      .from('messages')
      .select('id, content, sender_id, created_at, profiles:sender_id(full_name, username)')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      throw new Error('Failed to fetch messages');
    }

    const formattedMessages = (messages || []).map((m) => ({
      content: m.content,
      sender_name: m.profiles?.full_name || m.profiles?.username || 'Unknown',
    }));

    const result = await generateSummary(formattedMessages, { subject: conversation.subject });

    const { error: updateError } = await supabaseAdmin
      .from('conversations')
      .update({
        ai_summary: result,
        ai_summary_updated_at: new Date().toISOString(),
        ai_summary_message_count: currentMessageCount,
      })
      .eq('id', conversationId);

    if (updateError && isDev) {
      console.log('[summarizeConversation] Failed to cache summary:', updateError.message);
    }

    if (isDev) {
      console.log('[summarizeConversation] Generated fresh summary for conversation:', conversationId);
    }

    res.status(200).json({
      success: true,
      data: {
        ...result,
        cached: false,
        updated_at: new Date().toISOString(),
      },
    });
  } catch (err) {
    if (err instanceof PromptInjectionError) {
      return res.status(400).json({
        success: false,
        message: err.message,
        details: err.details,
      });
    }

    console.error('[summarizeConversation] error:', err);
    res.status(500).json({
      success: false,
      message: 'Unable to generate summary. Please try again.',
    });
  }
};

// --- FLAG IMPORTANCE OF AN ACTION/APPROVAL CONVERSATION (cached) ---
export const flagConversationImportance = async (req, res) => {
  const { conversationId } = req.params;
  const user_id = req.user.id;

  try {
    // Verify participant
    const { data: participant, error: participantError } = await supabaseAdmin
      .from('conversation_participants')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('user_id', user_id)
      .single();

    if (participantError || !participant) {
      return res.status(403).json({
        success: false,
        message: 'You are not part of this conversation.',
      });
    }

    const { data: conversation, error: convError } = await supabaseAdmin
      .from('conversations')
      .select(
        'id, subject, category, ai_important, ai_important_reason, ai_important_updated_at, ai_important_message_count'
      )
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found.',
      });
    }

    // Only meaningful for action/approval conversations — everything else
    // has no workflow to be "important" about.
    if (!['action_required', 'approval_required'].includes(conversation.category)) {
      return res.status(400).json({
        success: false,
        message: 'Importance flagging only applies to action or approval conversations.',
      });
    }

    const { count: currentMessageCount, error: countError } = await supabaseAdmin
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('conversation_id', conversationId);

    if (countError) {
      throw new Error('Failed to count messages');
    }

    // Cache hit
    if (
      conversation.ai_important !== null &&
      conversation.ai_important_message_count === currentMessageCount
    ) {
      if (isDev) {
        console.log('[flagConversationImportance] Cache hit for conversation:', conversationId);
      }

      return res.status(200).json({
        success: true,
        data: {
          important: conversation.ai_important,
          reason: conversation.ai_important_reason,
          cached: true,
          updated_at: conversation.ai_important_updated_at,
        },
      });
    }

    const { data: messages, error: messagesError } = await supabaseAdmin
      .from('messages')
      .select('id, content, sender_id, profiles:sender_id(full_name, username)')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      throw new Error('Failed to fetch messages');
    }

    const formattedMessages = (messages || []).map((m) => ({
      content: m.content,
      sender_name: m.profiles?.full_name || m.profiles?.username || 'Unknown',
    }));

    const { important, reason } = await flagImportance(formattedMessages, {
      subject: conversation.subject,
      category: conversation.category,
    });

    const { error: updateError } = await supabaseAdmin
      .from('conversations')
      .update({
        ai_important: important,
        ai_important_reason: reason,
        ai_important_updated_at: new Date().toISOString(),
        ai_important_message_count: currentMessageCount,
      })
      .eq('id', conversationId);

    if (updateError && isDev) {
      console.log('[flagConversationImportance] Failed to cache result:', updateError.message);
    }

    if (isDev) {
      console.log('[flagConversationImportance] Generated fresh result for conversation:', conversationId, 'important:', important);
    }

    res.status(200).json({
      success: true,
      data: {
        important,
        reason,
        cached: false,
        updated_at: new Date().toISOString(),
      },
    });
  } catch (err) {
    if (err instanceof PromptInjectionError) {
      return res.status(400).json({
        success: false,
        message: err.message,
        details: err.details,
      });
    }

    console.error('[flagConversationImportance] error:', err);
    res.status(500).json({
      success: false,
      message: 'Unable to determine importance. Please try again.',
    });
  }
};

// --- DIGEST: LAST 24H ACROSS ALL OF THE USER'S CONVERSATIONS (cached) ---
const DIGEST_WINDOW_MS = 24 * 60 * 60 * 1000;
const DIGEST_MAX_CONVERSATIONS = 20;
const DIGEST_MAX_MESSAGES_PER_CONVERSATION = 15;

export const getDigest = async (req, res) => {
  const user_id = req.user.id;

  try {
    // Every conversation this user is currently a participant in.
    const { data: participantRows, error: participantError } = await supabaseAdmin
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', user_id)
      .is('hidden_at', null);

    if (participantError) {
      throw new Error('Failed to fetch conversations');
    }

    const conversationIds = (participantRows || []).map((p) => p.conversation_id);

    if (conversationIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          digest: 'No new messages in the last 24 hours.',
          cached: false,
          generated_at: new Date().toISOString(),
        },
      });
    }

    const since = new Date(Date.now() - DIGEST_WINDOW_MS).toISOString();

    const { data: messages, error: messagesError } = await supabaseAdmin
      .from('messages')
      .select(
        `
        id, content, conversation_id, sender_id, created_at,
        profiles:sender_id(full_name, username),
        conversations(subject, category, conversation_type)
      `
      )
      .in('conversation_id', conversationIds)
      .gte('created_at', since)
      .order('created_at', { ascending: true });

    if (messagesError) {
      throw new Error('Failed to fetch messages');
    }

    if (!messages || messages.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          digest: 'No new messages in the last 24 hours.',
          cached: false,
          generated_at: new Date().toISOString(),
        },
      });
    }

    // The most recent message timestamp across everything fetched — the
    // staleness signal for the cache below.
    const latestMessageAt = messages[messages.length - 1].created_at;

    const { data: cachedDigest } = await supabaseAdmin
      .from('user_digests')
      .select('digest_content, generated_at, last_message_at')
      .eq('user_id', user_id)
      .maybeSingle();

    if (cachedDigest && cachedDigest.last_message_at === latestMessageAt) {
      if (isDev) {
        console.log('[getDigest] Cache hit for user:', user_id);
      }

      return res.status(200).json({
        success: true,
        data: {
          digest: cachedDigest.digest_content,
          cached: true,
          generated_at: cachedDigest.generated_at,
        },
      });
    }

    // Group messages by conversation, capped to keep the prompt a
    // reasonable size for someone with a lot of daily traffic.
    const groupsMap = new Map();

    for (const m of messages) {
      if (!groupsMap.has(m.conversation_id)) {
        groupsMap.set(m.conversation_id, {
          subject: m.conversations?.subject,
          category: m.conversations?.category,
          type: m.conversations?.conversation_type,
          messages: [],
        });
      }

      const group = groupsMap.get(m.conversation_id);

      if (group.messages.length < DIGEST_MAX_MESSAGES_PER_CONVERSATION) {
        group.messages.push({
          content: m.content,
          sender_name: m.profiles?.full_name || m.profiles?.username || 'Unknown',
        });
      }
    }

    const conversationGroups = Array.from(groupsMap.values()).slice(0, DIGEST_MAX_CONVERSATIONS);

    const digestText = await generateDigestText(conversationGroups);

    const { error: upsertError } = await supabaseAdmin.from('user_digests').upsert(
      {
        user_id,
        digest_content: digestText,
        generated_at: new Date().toISOString(),
        last_message_at: latestMessageAt,
      },
      { onConflict: 'user_id' }
    );

    if (upsertError && isDev) {
      console.log('[getDigest] Failed to cache digest:', upsertError.message);
    }

    if (isDev) {
      console.log('[getDigest] Generated fresh digest for user:', user_id, 'conversations:', conversationGroups.length);
    }

    res.status(200).json({
      success: true,
      data: {
        digest: digestText,
        cached: false,
        generated_at: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('[getDigest] error:', err);
    res.status(500).json({
      success: false,
      message: 'Unable to generate digest. Please try again.',
    });
  }
};

// --- DRAFT A REPLY FOR THE CURRENT USER (no caching, always fresh) ---
export const draftConversationReply = async (req, res) => {
  const { conversationId } = req.params;
  const user_id = req.user.id;

  try {
    const { data: participant, error: participantError } = await supabaseAdmin
      .from('conversation_participants')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('user_id', user_id)
      .single();

    if (participantError || !participant) {
      return res.status(403).json({
        success: false,
        message: 'You are not part of this conversation.',
      });
    }

    const { data: conversation, error: convError } = await supabaseAdmin
      .from('conversations')
      .select('id, subject')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found.',
      });
    }

    const { data: currentUserProfile } = await supabaseAdmin
      .from('profiles')
      .select('full_name, username')
      .eq('id', user_id)
      .single();

    const { data: messages, error: messagesError } = await supabaseAdmin
      .from('messages')
      .select('id, content, sender_id, profiles:sender_id(full_name, username)')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      throw new Error('Failed to fetch messages');
    }

    if (!messages || messages.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No messages to draft a reply from yet.',
      });
    }

    const formattedMessages = messages.map((m) => ({
      content: m.content,
      sender_name: m.profiles?.full_name || m.profiles?.username || 'Unknown',
    }));

    const draft = await draftReply(formattedMessages, {
      subject: conversation.subject,
      currentUserName: currentUserProfile?.full_name || currentUserProfile?.username,
    });

    res.status(200).json({
      success: true,
      data: { draft },
    });
  } catch (err) {
    if (err instanceof PromptInjectionError) {
      return res.status(400).json({
        success: false,
        message: err.message,
        details: err.details,
      });
    }

    console.error('[draftConversationReply] error:', err);
    res.status(500).json({
      success: false,
      message: 'Unable to draft a reply. Please try again.',
    });
  }
};

// --- COMPOSE / REWRITE THE FIRST MESSAGE OF A NEW CONVERSATION (no caching, always fresh) ---
export const composeFirstMessage = async (req, res) => {
  const { draft, tone, subject, category, recipientId } = req.body;

  if (!draft || typeof draft !== 'string' || !draft.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Draft text is required.',
    });
  }

  if (!VALID_TONES.includes(tone)) {
    return res.status(400).json({
      success: false,
      message: `tone must be one of: ${VALID_TONES.join(', ')}`,
    });
  }

  try {
    let recipientName = null;

    if (recipientId) {
      const { data: recipientProfile } = await supabaseAdmin
        .from('profiles')
        .select('full_name, username')
        .eq('id', recipientId)
        .single();

      recipientName = recipientProfile?.full_name || recipientProfile?.username || null;
    }

    const message = await composeMessage(draft, { tone, subject, category, recipientName });

    res.status(200).json({
      success: true,
      data: { message },
    });
  } catch (err) {
    if (err instanceof PromptInjectionError) {
      return res.status(400).json({
        success: false,
        message: err.message,
        details: err.details,
      });
    }

    console.error('[composeFirstMessage] error:', err);
    res.status(500).json({
      success: false,
      message: 'Unable to compose message. Please try again.',
    });
  }
};

