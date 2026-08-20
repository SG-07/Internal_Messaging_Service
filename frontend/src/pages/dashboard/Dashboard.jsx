// frontend/src/pages/dashboard/Dashboard.jsx

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
   * Load Dashboard conversations.
   *
   * This only runs when:
   * 1. Dashboard initially loads
   * 2. Search results are passed through navigation state
   *
   * WebSocket updates do NOT call this API again.
   */
  useEffect(() => {
    async function loadDashboard() {
      /*
       * Search mode.
       */
      if (searchResult) {
        console.log(
          '[Dashboard] Showing search results:',
          searchResult
        );

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
       * Normal inbox mode.
       */
      try {
        setLoading(true);
        setError('');

        console.log(
          '[Dashboard] Fetching normal conversations...'
        );

        const data = await getConversations();

        console.log(
          '[Dashboard] Conversations received:',
          data
        );

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
   * Handle real-time WebSocket events.
   */
  useEffect(() => {
    if (!lastMessage) {
      return;
    }

    /*
     * Do not modify search results with live inbox events.
     */
    if (searchResult) {
      console.log(
        '[Dashboard] Search mode active. Ignoring WebSocket update.'
      );

      return;
    }

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

    /*
     * --------------------------------------------------
     * NEW MESSAGE
     * --------------------------------------------------
     *
     * We receive the latest message here.
     *
     * We don't have enough conversation information to
     * create a complete Dashboard conversation object.
     *
     * The next `conversation_updated` event will provide
     * the conversation metadata.
     *
     * Therefore we only log this event for now.
     */
    if (lastMessage.type === 'new_message') {
      console.group(
        '[Dashboard] New message received'
      );

      console.log(
        '[Dashboard] Message:',
        lastMessage.message
      );

      console.log(
        '[Dashboard] Message content:',
        lastMessage.message?.content
      );

      console.log(
        '[Dashboard] Sender ID:',
        lastMessage.message?.sender_id
      );

      console.log(
        '[Dashboard] Created at:',
        lastMessage.message?.created_at
      );

      console.log(
        '[Dashboard] Conversation ID:',
        lastMessage.conversationId
      );

      console.groupEnd();

      return;
    }

    /*
     * --------------------------------------------------
     * CONVERSATION UPDATED
     * --------------------------------------------------
     *
     * Example payload:
     *
     * {
     *   type: "conversation_updated",
     *   conversationId: "...",
     *   conversation: {
     *     id: "...",
     *     subject: "...",
     *     category: "...",
     *     created_by: "...",
     *     updated_at: "...",
     *     conversation_type: "direct"
     *   }
     * }
     *
     * We use this to update the Dashboard state locally.
     */
    if (
      lastMessage.type === 'conversation_updated' &&
      lastMessage.conversation
    ) {
      const conversationId =
        lastMessage.conversationId;

      const updatedConversation =
        lastMessage.conversation;

      console.group(
        '[Dashboard] Updating conversation locally'
      );

      console.log(
        '[Dashboard] Incoming conversation:',
        updatedConversation
      );

      console.log(
        '[Dashboard] Conversation ID:',
        conversationId
      );

      console.log(
        '[Dashboard] Subject:',
        updatedConversation.subject
      );

      console.log(
        '[Dashboard] Category:',
        updatedConversation.category
      );

      console.log(
        '[Dashboard] Updated at:',
        updatedConversation.updated_at
      );

      console.groupEnd();

      setConversations((previousConversations) => {
        /*
         * Check whether this conversation already exists
         * in the Dashboard list.
         */
        const existingConversation =
          previousConversations.find(
            (conversation) =>
              conversation.id === conversationId
          );

        /*
         * Remove the conversation from its old position.
         *
         * If this is a new conversation, nothing will
         * be removed.
         */
        const remainingConversations =
          previousConversations.filter(
            (conversation) =>
              conversation.id !== conversationId
          );

        /*
         * Merge existing Dashboard-specific fields with
         * the new WebSocket conversation data.
         *
         * Existing object contains fields such as:
         *
         * - created_by_name
         * - created_by_email
         * - other_user_name
         * - other_user_email
         * - is_sender
         *
         * The WebSocket event does not currently provide
         * these fields.
         */
        const mergedConversation = {
          ...existingConversation,
          ...updatedConversation,

          /*
           * Dashboard uses `type`.
           * WebSocket payload uses `conversation_type`.
           */
          type:
            updatedConversation.conversation_type ||
            existingConversation?.type,

          id: conversationId,
        };

        console.group(
          '[Dashboard] Conversation state update'
        );

        console.log(
          '[Dashboard] Existing conversation:',
          existingConversation
        );

        console.log(
          '[Dashboard] Merged conversation:',
          mergedConversation
        );

        console.log(
          '[Dashboard] Was already in Dashboard:',
          Boolean(existingConversation)
        );

        console.groupEnd();

        /*
         * Put the updated conversation at the top.
         */
        const nextConversations = [
          mergedConversation,
          ...remainingConversations,
        ];

        /*
         * Keep only the latest 15 conversations,
         * matching the current Dashboard API behavior.
         */
        return nextConversations.slice(0, 15);
      });

      return;
    }

    /*
     * Unknown WebSocket event.
     */
    console.log(
      '[Dashboard] No handler for WebSocket event type:',
      lastMessage.type
    );
  }, [lastMessage, searchResult]);

  function openConversation(conversationId) {
    console.log(
      '[Dashboard] Opening conversation:',
      conversationId
    );

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

          {/* Section Header */}
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

          {/* Loading */}
          {loading && (
            <div className="flex flex-1 items-center justify-center px-6 py-12">
              <p className="text-sm text-gray-500">
                Loading conversations...
              </p>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="flex flex-1 items-center justify-center px-6 py-12">
              <div className="text-center">
                <p className="text-sm text-red-600">
                  {error}
                </p>
              </div>
            </div>
          )}

          {/* Empty Search Result */}
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

          {/* Empty Inbox */}
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

          {/* Conversations */}
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