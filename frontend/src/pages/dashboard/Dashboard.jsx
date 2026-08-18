// frontend/src/pages/dashboard/dashboard.jsx

import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';

import { getConversations } from '../../api/conversations';

import DashboardSidebar from './DashboardSidebar';
import ConversationList from './ConversationList';

function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const searchResult = location.state?.searchResult || null;
  const searchQuery = location.state?.searchQuery || '';

  useEffect(() => {
    async function loadDashboard() {
      /*
       * If Dashboard was opened with a search result,
       * show the search result instead of loading inbox.
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
       * No search result means normal inbox.
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

  const isSearchMode = Boolean(searchResult);

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