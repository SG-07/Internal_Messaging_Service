// backend/src/websocket/dbListener.js
import supabaseAdmin from '../config/supabaseClient.js';
import { broadcastToUsers } from './wsServer.js';

function buildWorkflow(conv) {
  if (!conv.workflow_status && conv.category !== 'action_required' && conv.category !== 'approval_required') {
    return null;
  }

  const type =
    conv.category === 'action_required'
      ? 'action'
      : conv.category === 'approval_required'
      ? 'approval'
      : null;

  if (!type) {
    return null;
  }

  const status = conv.workflow_status || 'PENDING';

  const isFinal =
    type === 'action'
      ? ['DONE', 'REJECTED'].includes(status)
      : ['APPROVED', 'REJECTED'].includes(status);

  return {
    type,
    status,
    workflow_comment: conv.workflow_comment || null,
    is_final: isFinal,
    // can_respond is viewer-dependent (true only for the non-creator) and
    // this payload is broadcast identically to every participant, so it is
    // NOT computed here. The frontend derives it from
    // current_user_id !== created_by instead — see Conversation.jsx.
  };
}

/**
 * Fetches every participant in a conversation (with profile info) in one
 * query, then shapes the result differently depending on conversation
 * type:
 *   - 'direct': the old other_user_name/other_user_email fields, for the
 *     1:1 "who am I talking to" UI.
 *   - 'group' / 'team': a full participants array, since there's no single
 *     "other" person.
 *
 * Replaces the old pattern of `.neq('user_id', created_by).single()` to
 * find "the other participant" — that call throws whenever a conversation
 * has more than 2 participants, which silently broke every broadcast for
 * group/team conversations (the handler errored and returned before
 * reaching broadcastToUsers).
 */
async function getParticipantInfo(conversationId, conversationType, createdBy) {
  const { data: participantRows, error: participantsError } = await supabaseAdmin
    .from('conversation_participants')
    .select('user_id, profiles(id, username, full_name, email)')
    .eq('conversation_id', conversationId);

  if (participantsError) {
    return { error: participantsError };
  }

  const participantUserIds = (participantRows || []).map((p) => p.user_id);

  if (conversationType === 'direct') {
    const other = (participantRows || []).find((p) => p.user_id !== createdBy);

    return {
      error: null,
      participantUserIds,
      otherUserName: other?.profiles?.full_name || other?.profiles?.username || null,
      otherUserEmail: other?.profiles?.email || null,
      participants: null,
    };
  }

  return {
    error: null,
    participantUserIds,
    otherUserName: null,
    otherUserEmail: null,
    participants: (participantRows || []).map((p) => ({
      id: p.profiles?.id || p.user_id,
      username: p.profiles?.username || null,
      full_name: p.profiles?.full_name || null,
      email: p.profiles?.email || null,
    })),
  };
}

export function initDbListener() {
  console.log('[DbListener] ===== FINAL VERSION LOADED =====');
  console.log('[DbListener] Initializing database change listener...');

  supabaseAdmin
    .channel('db-changes')
    // ===== NEW CONVERSATION CREATED =====
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'conversations' },
      async (payload) => {
        const { id: conversation_id, created_by } = payload.new;

        console.log('[DbListener] New conversation created, id:', conversation_id);

        // Fetch full conversation with creator profile
        const { data: conversation, error: convError } = await supabaseAdmin
          .from('conversations')
          .select(
            `
            id,
            subject,
            conversation_type,
            category,
            created_by,
            created_at,
            updated_at,
            workflow_status,
            workflow_comment,
            creator:profiles!conversations_created_by_fkey(id, username, full_name, email)
          `
          )
          .eq('id', conversation_id)
          .single();

        if (convError || !conversation) {
          console.error('[DbListener] Error fetching new conversation:', convError?.message);
          return;
        }

        const participantInfo = await getParticipantInfo(conversation_id, conversation.conversation_type, created_by);

        if (participantInfo.error) {
          console.error('[DbListener] Error fetching participants:', participantInfo.error.message);
          return;
        }

        // Transform conversation
        const transformedConversation = {
          id: conversation.id,
          subject: conversation.subject,
          type: conversation.conversation_type,
          category: conversation.category,
          created_by: conversation.created_by,
          created_by_name: conversation.creator?.full_name || conversation.creator?.username || null,
          created_by_email: conversation.creator?.email || null,
          is_sender: false, // Will be computed by frontend based on their user ID
          other_user_name: participantInfo.otherUserName,
          other_user_email: participantInfo.otherUserEmail,
          participants: participantInfo.participants, // populated for group/team, null for direct
          created_at: conversation.created_at,
          updated_at: conversation.updated_at,
          workflow: buildWorkflow(conversation),
        };

        // Fetch the initial message (first message in the conversation)
        const { data: messages, error: messagesError } = await supabaseAdmin
          .from('messages')
          .select(
            `
            id,
            conversation_id,
            content,
            sender_id,
            created_at,
            updated_at,
            profiles:sender_id(id, username, full_name, email)
          `
          )
          .eq('conversation_id', conversation_id)
          .order('created_at', { ascending: true })
          .limit(1);

        if (messagesError || !messages || messages.length === 0) {
          console.error('[DbListener] Error fetching initial message:', messagesError?.message);
          return;
        }

        const message = messages[0];
        const transformedMessage = {
          id: message.id,
          conversation_id: message.conversation_id,
          content: message.content,
          sender_id: message.sender_id,
          sender_name: message.profiles?.full_name || message.profiles?.username || null,
          sender_email: message.profiles?.email || null,
          created_at: message.created_at,
          updated_at: message.updated_at,
        };

        console.log('[DbListener] Broadcasting new_conversation to', participantInfo.participantUserIds.length, 'users');
        broadcastToUsers(participantInfo.participantUserIds, {
          type: 'new_conversation',
          conversationId: conversation_id,
          conversation: transformedConversation,
          message: transformedMessage,
        });
      }
    )
    // ===== REPLY TO EXISTING CONVERSATION (NEW MESSAGE) =====
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages' },
      async (payload) => {
        const { conversation_id, sender_id } = payload.new;

        console.log('[DbListener] New message in conversation:', conversation_id);

        // Fetch full conversation using the EXACT SAME query as getConversations()
        // Note: Use .limit(1) instead of .single() because there are 2 participants per conversation
        const { data: conversationLinks, error: convError } = await supabaseAdmin
          .from('conversation_participants')
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
              workflow_status,
              workflow_comment,
              creator:profiles!conversations_created_by_fkey(id, username, full_name, email)
            )
          `
          )
          .eq('conversation_id', conversation_id)
          .limit(1);

        if (convError || !conversationLinks || conversationLinks.length === 0) {
          console.error('[DbListener] Error fetching conversation:', convError?.message);
          return;
        }

        const conversationLink = conversationLinks[0];
        const conv = conversationLink.conversations;

        const participantInfo = await getParticipantInfo(conversation_id, conv.conversation_type, conv.created_by);

        if (participantInfo.error) {
          console.error('[DbListener] Error fetching participants:', participantInfo.error.message);
          return;
        }

        // Fetch sender profile for message context
        const { data: senderProfile, error: senderError } = await supabaseAdmin
          .from('profiles')
          .select('id, username, full_name, email')
          .eq('id', sender_id)
          .single();

        if (senderError) {
          console.error('[DbListener] Error fetching sender profile:', senderError.message);
          return;
        }

        // Transform conversation using EXACT SAME logic as getConversations()
        const transformedConversation = {
          id: conv.id,
          subject: conv.subject,
          type: conv.conversation_type,
          category: conv.category,
          created_by: conv.created_by,
          created_by_name: conv.creator?.full_name || conv.creator?.username || null,
          created_by_email: conv.creator?.email || null,
          is_sender: false, // Will be computed by frontend based on their user ID
          other_user_name: participantInfo.otherUserName,
          other_user_email: participantInfo.otherUserEmail,
          participants: participantInfo.participants, // populated for group/team, null for direct
          created_at: conv.created_at,
          updated_at: conv.updated_at,
          workflow: buildWorkflow(conv),
        };

        // Transform message with sender info
        const transformedMessage = {
          id: payload.new.id,
          conversation_id: payload.new.conversation_id,
          content: payload.new.content,
          sender_id: payload.new.sender_id,
          sender_name: senderProfile?.full_name || senderProfile?.username || null,
          sender_email: senderProfile?.email || null,
          created_at: payload.new.created_at,
          updated_at: payload.new.updated_at,
        };

        console.log('[DbListener] Broadcasting new_message to', participantInfo.participantUserIds.length, 'users');
        broadcastToUsers(participantInfo.participantUserIds, {
          type: 'new_message',
          conversationId: conversation_id,
          conversation: transformedConversation,
          message: transformedMessage,
        });
      }
    )
    // ===== CONVERSATION UPDATED (SUBJECT, STATUS, WORKFLOW, ETC) =====
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'conversations' },
      async (payload) => {
        const { id } = payload.new;

        console.log('[DbListener] Conversation updated, id:', id);

        // Fetch full conversation using the EXACT SAME query as getConversations()
        // Note: Use .limit(1) instead of .single() because there are 2 participants per conversation
        const { data: conversationLinks, error: convError } = await supabaseAdmin
          .from('conversation_participants')
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
              workflow_status,
              workflow_comment,
              creator:profiles!conversations_created_by_fkey(id, username, full_name, email)
            )
          `
          )
          .eq('conversation_id', id)
          .limit(1);

        if (convError || !conversationLinks || conversationLinks.length === 0) {
          console.error('[DbListener] Error fetching conversation:', convError?.message);
          return;
        }

        const conversationLink = conversationLinks[0];
        const conv = conversationLink.conversations;

        const participantInfo = await getParticipantInfo(id, conv.conversation_type, conv.created_by);

        if (participantInfo.error) {
          console.error('[DbListener] Error fetching participants:', participantInfo.error.message);
          return;
        }

        // Transform conversation using EXACT SAME logic as getConversations()
        const transformedConversation = {
          id: conv.id,
          subject: conv.subject,
          type: conv.conversation_type,
          category: conv.category,
          created_by: conv.created_by,
          created_by_name: conv.creator?.full_name || conv.creator?.username || null,
          created_by_email: conv.creator?.email || null,
          is_sender: false, // Will be computed by frontend based on their user ID
          other_user_name: participantInfo.otherUserName,
          other_user_email: participantInfo.otherUserEmail,
          participants: participantInfo.participants, // populated for group/team, null for direct
          created_at: conv.created_at,
          updated_at: conv.updated_at,
          workflow: buildWorkflow(conv),
        };

        console.log('[DbListener] Broadcasting conversation_updated to', participantInfo.participantUserIds.length, 'users');
        broadcastToUsers(participantInfo.participantUserIds, {
          type: 'conversation_updated',
          conversationId: id,
          conversation: transformedConversation,
        });
      }
    )
    .subscribe((status, err) => {
      console.log('[DbListener] Subscription status:', status);
      if (err) console.error('[DbListener] Subscription error:', err);
    });
}