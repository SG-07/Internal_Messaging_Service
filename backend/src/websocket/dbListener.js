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
        console.log('[DbListener] Message inserted, conversation_id:', payload.new.conversation_id);
        
        const { conversation_id } = payload.new;
        const { data: participants, error } = await supabaseAdmin
          .from('conversation_participants')
          .select('user_id')
          .eq('conversation_id', conversation_id);

        if (error) {
          console.error('[DbListener] Error fetching participants:', error.message);
          return;
        }

        console.log('[DbListener] Participants found:', participants?.length || 0);

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
        console.log('[DbListener] Conversation updated, id:', payload.new.id);
        
        const { id } = payload.new;
        const { data: participants, error } = await supabaseAdmin
          .from('conversation_participants')
          .select('user_id')
          .eq('conversation_id', id);

        if (error) {
          console.error('[DbListener] Error fetching participants:', error.message);
          return;
        }

        console.log('[DbListener] Participants found:', participants?.length || 0);

        broadcastToUsers(participants?.map((p) => p.user_id) || [], {
          type: 'conversation_updated',
          conversationId: id,
          conversation: payload.new,
        });
      }
    )
    .subscribe((status, err) => {
      console.log('[DbListener] Subscription status:', status);
      if (err) console.error('[DbListener] Subscription error:', err);
    });
}