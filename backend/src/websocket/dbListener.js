// backend/src/websocket/dbListener.js
import supabaseAdmin from '../config/supabaseClient.js';
import { broadcastToUsers } from './wsServer.js';

export function initDbListener() {
  supabaseAdmin
    .channel('db-changes')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload) => {
      const { conversation_id } = payload.new;
      const { data: participants } = await supabaseAdmin
        .from('conversation_participants')
        .select('user_id')
        .eq('conversation_id', conversation_id);

      broadcastToUsers(participants.map((p) => p.user_id), {
        type: 'new_message',
        conversationId: conversation_id,
        message: payload.new,
      });
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'conversations' }, async (payload) => {
      const { id } = payload.new;
      const { data: participants } = await supabaseAdmin
        .from('conversation_participants')
        .select('user_id')
        .eq('conversation_id', id);

      broadcastToUsers(participants.map((p) => p.user_id), {
        type: 'conversation_updated',
        conversationId: id,
        conversation: payload.new,
      });
    })
    .subscribe();
}