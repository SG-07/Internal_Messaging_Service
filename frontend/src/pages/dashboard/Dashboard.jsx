import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';

import { getConversations } from '../../api/conversations';
import { useWebSocket } from '../../websocket/WebSocketProvider';

import DashboardSidebar from './DashboardSidebar';
import ConversationList from './ConversationList';

function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const { lastMessage } = useWebSocket();

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const searchResult =
    location.state?.searchResult || null;

  const searchQuery =
    location.state?.searchQuery || '';

  /*
   * --------------------------------------------------
   * Load Dashboard conversations
   * --------------------------------------------------
   */
  useEffect(() => {
    async function loadDashboard() {
      /*
       * Search mode
       */
      if (searchResult) {
        if (import.meta.env.DEV) {
          console.log(
            '[Dashboard] Showing search results:',
            searchResult
          );
        }

        setLoading(false);
        setError('');

        setConversations(
          Array.isArray(searchResult.data)
            ? searchResult.data
            : []
        );

        return;
      }

      /*
       * Normal inbox mode
       */
      try {
        setLoading(true);
        setError('');

        if (import.meta.env.DEV) {
          console.log(
            '[Dashboard] Fetching normal conversations...'
          );
        }

        const data = await getConversations();

        if (import.meta.env.DEV) {
          console.log(
            '[Dashboard] Conversations received:',
            data
          );
        }

        setConversations(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (err) {
        console.error(
          '[Dashboard] Failed to load conversations:',
          err
        );

        setError(
          err.message ||
            'Unable to load conversations. Please try again.'
        );

        setConversations([]);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [searchResult]);

  /*
   * --------------------------------------------------
   * Handle real-time WebSocket events
   * --------------------------------------------------
   */
  useEffect(() => {
    if (!lastMessage) {
      return;
    }

    /*
     * Do not modify search results.
     */
    if (searchResult) {
      if (import.meta.env.DEV) {
        console.log(
          '[Dashboard] Search mode active. Ignoring WebSocket update.'
        );
      }

      return;
    }

    if (import.meta.env.DEV) {
      console.group(
        '[Dashboard] WebSocket event received'
      );

      console.log(
        '[Dashboard] Full payload:',
        lastMessage
      );

      console.log(
        '[Dashboard] Event type:',
        lastMessage.type
      );

      console.log(
        '[Dashboard] Conversation ID:',
        lastMessage.conversationId
      );

      console.groupEnd();
    }

    /*
     * --------------------------------------------------
     * NEW MESSAGE
     * --------------------------------------------------
     *
     * Backend now sends:
     *
     * {
     *   type: "new_message",
     *   conversationId: "...",
     *   conversation: {...},
     *   message: {...}
     * }
     *
     * Therefore we can immediately create or update
     * the Dashboard conversation.
     */
    if (
      lastMessage.type === 'new_message' &&
      lastMessage.conversation
    ) {
      const incomingConversation =
        lastMessage.conversation;

      const incomingMessage =
        lastMessage.message || null;

      const conversationId =
        lastMessage.conversationId ||
        incomingConversation.id ||
        incomingMessage?.conversation_id;

      if (!conversationId) {
        console.warn(
          '[Dashboard] new_message received without conversation ID:',
          lastMessage
        );

        return;
      }

      setConversations((previousConversations) => {
        const existingConversation =
          previousConversations.find(
            (conversation) =>
              String(conversation.id) ===
              String(conversationId)
          );

        const remainingConversations =
          previousConversations.filter(
            (conversation) =>
              String(conversation.id) !==
              String(conversationId)
          );

        const mergedConversation = {
          ...existingConversation,
          ...incomingConversation,

          id: conversationId,

          type:
            incomingConversation.type ||
            incomingConversation.conversation_type ||
            existingConversation?.type ||
            'direct',

          latest_message:
            incomingMessage ||
            existingConversation?.latest_message ||
            null,

          updated_at:
            incomingMessage?.created_at ||
            incomingConversation.updated_at ||
            existingConversation?.updated_at,
        };

        if (import.meta.env.DEV) {
          console.log(
            '[Dashboard] Adding/updating conversation from new_message:',
            mergedConversation
          );
        }

        return [
          mergedConversation,
          ...remainingConversations,
        ].slice(0, 15);
      });

      return;
    }

    /*
     * --------------------------------------------------
     * CONVERSATION UPDATED
     * --------------------------------------------------
     */
    if (
      lastMessage.type === 'conversation_updated' &&
      lastMessage.conversation
    ) {
      const incomingConversation =
        lastMessage.conversation;

      const conversationId =
        lastMessage.conversationId ||
        incomingConversation.id;

      if (!conversationId) {
        console.warn(
          '[Dashboard] conversation_updated received without ID:',
          lastMessage
        );

        return;
      }

      setConversations((previousConversations) => {
        const existingConversation =
          previousConversations.find(
            (conversation) =>
              String(conversation.id) ===
              String(conversationId)
          );

        const remainingConversations =
          previousConversations.filter(
            (conversation) =>
              String(conversation.id) !==
              String(conversationId)
          );

        const mergedConversation = {
          ...existingConversation,
          ...incomingConversation,

          id: conversationId,

          type:
            incomingConversation.type ||
            incomingConversation.conversation_type ||
            existingConversation?.type ||
            'direct',

          latest_message:
            incomingConversation.latest_message ||
            existingConversation?.latest_message ||
            null,
        };

        return [
          mergedConversation,
          ...remainingConversations,
        ].slice(0, 15);
      });

      return;
    }

    if (import.meta.env.DEV) {
      console.log(
        '[Dashboard] No handler for event:',
        lastMessage.type
      );
    }
  }, [lastMessage, searchResult]);

  /*
   * --------------------------------------------------
   * Navigation
   * --------------------------------------------------
   */
  function openConversation(conversationId) {
    navigate(`/conversation/${conversationId}`);
  }

  function openCompose() {
    navigate('/compose');
  }

  const isSearchMode =
    Boolean(searchResult);

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="mx-auto flex max-w-7xl gap-6 px-6 py-6 pb-8">
        <DashboardSidebar
          onCompose={openCompose}
        />

        <section className="flex min-h-[calc(100vh-130px)] min-w-0 flex-1 flex-col rounded-xl bg-white shadow">
          <div className="shrink-0 border-b px-6 py-5">
            {isSearchMode ? (
              <>
                <h2 className="text-xl font-semibold text-gray-900">
                  Search Results
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Conversations with{' '}
                  <span className="font-medium text-gray-700">
                    {searchQuery}
                  </span>
                </p>
              </>
            ) : (
              <>
                <h2 className="text-xl font-semibold text-gray-900">
                  Inbox
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Your recent conversations
                </p>
              </>
            )}
          </div>

          {loading && (
            <div className="flex flex-1 items-center justify-center px-6 py-12">
              <p className="text-sm text-gray-500">
                Loading conversations...
              </p>
            </div>
          )}

          {!loading && error && (
            <div className="flex flex-1 items-center justify-center px-6 py-12">
              <p className="text-sm text-red-600">
                {error}
              </p>
            </div>
          )}

          {!loading &&
            !error &&
            isSearchMode &&
            conversations.length === 0 && (
              <div className="flex flex-1 items-center justify-center px-6 py-16">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900">
                    No conversations found
                  </h3>

                  <p className="mt-2 text-sm text-gray-500">
                    No conversations were found for{' '}
                    <span className="font-medium">
                      {searchQuery}
                    </span>.
                  </p>
                </div>
              </div>
            )}

          {!loading &&
            !error &&
            !isSearchMode &&
            conversations.length === 0 && (
              <div className="flex flex-1 items-center justify-center px-6 py-16">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900">
                    No conversations yet
                  </h3>

                  <p className="mt-2 text-sm text-gray-500">
                    You don't have any conversations yet.
                  </p>

                  <button
                    type="button"
                    onClick={openCompose}
                    className="mt-6 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    Compose Your First Message
                  </button>
                </div>
              </div>
            )}

          {!loading &&
            !error &&
            conversations.length > 0 && (
              <ConversationList
                conversations={conversations}
                onConversationClick={openConversation}
              />
            )}
        </section>
      </main>
    </div>
  );
}

export default Dashboard;