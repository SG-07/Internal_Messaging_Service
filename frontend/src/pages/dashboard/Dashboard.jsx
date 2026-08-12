// frontend/src/pages/dashboard/Dashboard.jsx

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { getConversations } from '../../api/conversations';

function Dashboard() {
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadConversations() {
      try {
        setLoading(true);
        setError('');

        const data = await getConversations();

        setConversations(data || []);
      } catch (err) {
        setError(
          err.message ||
            'Unable to load conversations. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    }

    loadConversations();
  }, []);

  function openConversation(conversationId) {
    navigate(`/conversation/${conversationId}`);
  }

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Header */}
      <header className="border-b bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            Internal Messaging Service
          </h1>

          <div className="text-sm text-gray-600">
            Welcome, User
          </div>
        </div>
      </header>

      {/* Dashboard */}
      <main className="mx-auto flex max-w-7xl gap-6 px-6 py-6 pb-8">

        {/* Left Section */}
        <aside className="flex min-h-[calc(100vh-130px)] w-56 shrink-0 flex-col rounded-xl bg-white p-4 shadow">

          {/* Compose */}
          <button
            type="button"
            onClick={() => navigate('/compose')}
            className="mb-6 w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            + Compose
          </button>

          {/* Navigation */}
          <nav className="space-y-1">

            <button
              type="button"
              className="w-full rounded-lg bg-blue-50 px-4 py-3 text-left text-sm font-semibold text-blue-700"
            >
              Inbox
            </button>

            <button
              type="button"
              className="w-full rounded-lg px-4 py-3 text-left text-sm text-gray-700 transition hover:bg-gray-100"
            >
              Sent
            </button>

            <button
              type="button"
              className="w-full rounded-lg px-4 py-3 text-left text-sm text-gray-700 transition hover:bg-gray-100"
            >
              All Mail
            </button>

          </nav>
        </aside>

        {/* Right Section */}
        <section className="flex min-h-[calc(100vh-130px)] min-w-0 flex-1 flex-col rounded-xl bg-white shadow">

          {/* Section Header */}
          <div className="shrink-0 border-b px-6 py-5">
            <h2 className="text-xl font-semibold text-gray-900">
              Inbox
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Your recent conversations
            </p>
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
              <p className="text-sm text-red-600">
                {error}
              </p>
            </div>
          )}

          {/* Empty State */}
          {!loading &&
            !error &&
            conversations.length === 0 && (
              <div className="flex flex-1 items-center justify-center px-6 py-16">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900">
                    No mails yet
                  </h3>

                  <p className="mt-2 text-sm text-gray-500">
                    You don't have any conversations yet.
                  </p>

                  <button
                    type="button"
                    onClick={() => navigate('/compose')}
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
              <div className="flex-1 divide-y divide-gray-200 overflow-y-auto">
                {conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() =>
                      openConversation(conversation.id)
                    }
                    className="block w-full px-6 py-4 text-left transition hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between gap-4">

                      <div className="min-w-0">
                        <h3 className="truncate font-semibold text-gray-900">
                          {conversation.subject}
                        </h3>

                        <p className="mt-1 text-sm text-gray-500">
                          {conversation.type}
                        </p>
                      </div>

                      <span className="shrink-0 text-xs text-gray-500">
                        {conversation.status}
                      </span>

                    </div>
                  </button>
                ))}
              </div>
            )}

        </section>
      </main>
    </div>
  );
}

export default Dashboard;