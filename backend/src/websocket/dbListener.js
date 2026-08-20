// backend/src/websocket/dbListener.js
import supabaseAdmin from '../config/supabaseClient.js';
import { broadcastToUsers } from './wsServer.js';

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
            creator:profiles!conversations_created_by_fkey(id, username, full_name, email)
          `
          )
          .eq('id', conversation_id)
          .single();

        if (convError || !conversation) {
          console.error('[DbListener] Error fetching new conversation:', convError?.message);
          return;
        }

        // Get all participants for broadcasting
        const { data: participants, error: participantsError } = await supabaseAdmin
          .from('conversation_participants')
          .select('user_id')
          .eq('conversation_id', conversation_id);

        if (participantsError) {
          console.error('[DbListener] Error fetching participants:', participantsError.message);
          return;
        }

        // Find the OTHER participant (not the creator)
        const { data: otherParticipant, error: otherError } = await supabaseAdmin
          .from('conversation_participants')
          .select('profiles(id, username, full_name, email)')
          .eq('conversation_id', conversation_id)
          .neq('user_id', created_by)
          .single();

        if (otherError) {
          console.error('[DbListener] Error fetching other participant:', otherError.message);
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
          other_user_name:
            otherParticipant?.profiles?.full_name ||
            otherParticipant?.profiles?.username ||
            null,
          other_user_email: otherParticipant?.profiles?.email || null,
          created_at: conversation.created_at,
          updated_at: conversation.updated_at,
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
            is_read,
            read_at,
            is_edited,
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
          is_read: message.is_read || false,
          read_at: message.read_at || null,
          is_edited: message.is_edited || false,
        };

        console.log('[DbListener] Broadcasting new_conversation to', participants.length, 'users');
        broadcastToUsers(participants?.map((p) => p.user_id) || [], {
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

        // Find the OTHER participant (not the creator)
        const { data: otherParticipant, error: otherError } = await supabaseAdmin
          .from('conversation_participants')
          .select('profiles(id, username, full_name, email)')
          .eq('conversation_id', conversation_id)
          .neq('user_id', conv.created_by)
          .single();

        if (otherError) {
          console.error('[DbListener] Error fetching other participant:', otherError.message);
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

        // Get all participants for broadcasting
        const { data: participants, error: participantsError } = await supabaseAdmin
          .from('conversation_participants')
          .select('user_id')
          .eq('conversation_id', conversation_id);

        if (participantsError) {
          console.error('[DbListener] Error fetching participants:', participantsError.message);
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
          other_user_name:
            otherParticipant?.profiles?.full_name ||
            otherParticipant?.profiles?.username ||
            null,
          other_user_email: otherParticipant?.profiles?.email || null,
          created_at: conv.created_at,
          updated_at: conv.updated_at,
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
          is_read: payload.new.is_read || false,
          read_at: payload.new.read_at || null,
          is_edited: payload.new.is_edited || false,
        };

        console.log('[DbListener] Broadcasting new_message to', participants.length, 'users');
        broadcastToUsers(participants?.map((p) => p.user_id) || [], {
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

        // Find the OTHER participant (not the creator)
        const { data: otherParticipant, error: otherError } = await supabaseAdmin
          .from('conversation_participants')
          .select('profiles(id, username, full_name, email)')
          .eq('conversation_id', id)
          .neq('user_id', conv.created_by)
          .single();

        if (otherError) {
          console.error('[DbListener] Error fetching other participant:', otherError.message);
          return;
        }

        // Get all participants for broadcasting
        const { data: participants, error: participantsError } = await supabaseAdmin
          .from('conversation_participants')
          .select('user_id')
          .eq('conversation_id', id);

        if (participantsError) {
          console.error('[DbListener] Error fetching participants:', participantsError.message);
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
          other_user_name:
            otherParticipant?.profiles?.full_name ||
            otherParticipant?.profiles?.username ||
            null,
          other_user_email: otherParticipant?.profiles?.email || null,
          created_at: conv.created_at,
          updated_at: conv.updated_at,
        };

        console.log('[DbListener] Broadcasting conversation_updated to', participants.length, 'users');
        broadcastToUsers(participants?.map((p) => p.user_id) || [], {
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