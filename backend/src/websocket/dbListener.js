// backend/src/websocket/dbListener.js
import supabaseAdmin from '../config/supabaseClient.js';
import { broadcastToUsers } from './wsServer.js';

export function initDbListener() {
  console.log('[DbListener] Initializing database change listener...');

  supabaseAdmin
    .channel('db-changes')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages' },
      async (payload) => {
        const { conversation_id } = payload.new;

        const { data: participants, error } = await supabaseAdmin
          .from('conversation_participants')
          .select('user_id')
          .eq('conversation_id', conversation_id);

        if (error) {
          console.error('[DbListener] Error fetching participants:', error.message);
          return;
        }

        broadcastToUsers(participants?.map((p) => p.user_id) || [], {
          type: 'new_message',
          conversationId: conversation_id,
          message: payload.new,
        });
      }
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'conversations' },
      async (payload) => {
        const { id } = payload.new;

        // Fetch full conversation with creator profile and all participants
        const { data: fullConversation, error: convError } = await supabaseAdmin
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
            conversation_participants(
              user_id,
              profiles(
                id,
                username,
                full_name,
                email
              )
            ),
            creator:profiles!conversations_created_by_fkey(
              id,
              username,
              full_name,
              email
            )
          `
          )
          .eq('id', id)
          .single();

        if (convError || !fullConversation) {
          console.error('[DbListener] Error fetching conversation:', convError?.message);
          return;
        }

        // Get participants list for broadcasting
        const { data: participants, error: participantsError } = await supabaseAdmin
          .from('conversation_participants')
          .select('user_id')
          .eq('conversation_id', id);

        if (participantsError) {
          console.error('[DbListener] Error fetching participants:', participantsError.message);
          return;
        }

        // Find the "other" participant (not the creator) to populate other_user_* fields
        // In a direct conversation, there are only 2 participants: creator and recipient
        const otherParticipant = fullConversation.conversation_participants.find(
          (p) => p.user_id !== fullConversation.created_by
        );

        // Transform conversation to match required shape
        const transformedConversation = {
          id: fullConversation.id,
          subject: fullConversation.subject,
          type: fullConversation.conversation_type,
          category: fullConversation.category,
          created_by: fullConversation.created_by,
          created_by_email: fullConversation.creator?.email || null,
          created_by_name: fullConversation.creator?.full_name || fullConversation.creator?.username || null,
          is_sender: false, // Will be set per-recipient on frontend
          other_user_email: otherParticipant?.profiles?.email || null,
          other_user_name: otherParticipant?.profiles?.full_name || otherParticipant?.profiles?.username || null,
          created_at: fullConversation.created_at,
          updated_at: fullConversation.updated_at,
        };

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