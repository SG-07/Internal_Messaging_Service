// frontend/src/pages/dashboard/dashboard.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

import { getConversations } from '../../api/conversations';

import DashboardHeader from './DashboardHeader';
import DashboardSidebar from './DashboardSidebar';
import ConversationList from './ConversationList';

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

        if (import.meta.env.DEV) {
          console.log('[Dashboard] Fetching conversations...');
        }

        const data = await getConversations();

        if (import.meta.env.DEV) {
          console.log('[Dashboard] Conversations received:', data);
        }

        setConversations(data || []);
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error(
            '[Dashboard] Failed to load conversations:',
            err
          );
        }

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
    if (import.meta.env.DEV) {
      console.log(
        '[Dashboard] Opening conversation:',
        conversationId
      );
    }

    navigate(`/conversation/${conversationId}`);
  }

  function openCompose() {
    navigate('/compose');
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <DashboardHeader />

      <main className="mx-auto flex max-w-7xl gap-6 px-6 py-6 pb-8">
        <DashboardSidebar onCompose={openCompose} />

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