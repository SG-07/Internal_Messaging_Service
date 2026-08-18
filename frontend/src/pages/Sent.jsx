// frontend/src/pages/Sent.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

import { getSentConversations } from '../api/conversations';

import DashboardLayout from './dashboard/DashboardLayout';

function Sent() {
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [pagination, setPagination] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [page, setPage] = useState(1);

  useEffect(() => {
    async function loadSentConversations() {
      try {
        setLoading(true);
        setError('');

        console.log(
          '[Sent] Fetching sent conversations:',
          page
        );

        const response = await getSentConversations(page);

        console.log(
          '[Sent] Sent conversations response:',
          response
        );

        if (!response?.success) {
          throw new Error(
            response?.message ||
              'Unable to load sent conversations.'
          );
        }

        setConversations(
          Array.isArray(response.data)
            ? response.data
            : []
        );

        setPagination(
          response.pagination || null
        );
      } catch (err) {
        console.error(
          '[Sent] Failed to load sent conversations:',
          err
        );

        setError(
          err.message ||
            'Unable to load sent conversations. Please try again.'
        );

        setConversations([]);
        setPagination(null);
      } finally {
        setLoading(false);
      }
    }

    loadSentConversations();
  }, [page]);

  function openConversation(conversationId) {
    console.log(
      '[Sent] Opening conversation:',
      conversationId
    );

    navigate(`/conversation/${conversationId}`);
  }

  function formatCategory(value) {
    if (!value) {
      return 'General';
    }

    return value
      .toLowerCase()
      .split('_')
      .map(
        (word) =>
          word.charAt(0).toUpperCase() +
          word.slice(1)
      )
      .join(' ');
  }

  function formatDate(value) {
    if (!value) {
      return '';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return date.toLocaleString();
  }

  return (
    <DashboardLayout>
      <section className="flex min-h-[calc(100vh-130px)] flex-col rounded-xl bg-white shadow">

        {/* Header */}
        <div className="shrink-0 border-b px-6 py-5">
          <h1 className="text-xl font-semibold text-gray-900">
            Sent
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Conversations you have sent
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-1 items-center justify-center px-6 py-12">
            <p className="text-sm text-gray-500">
              Loading sent conversations...
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

              <button
                type="button"
                onClick={() => setPage(1)}
                className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Empty */}
        {!loading &&
          !error &&
          conversations.length === 0 && (
            <div className="flex flex-1 items-center justify-center px-6 py-16">
              <div className="text-center">
                <h2 className="text-lg font-semibold text-gray-900">
                  No sent conversations
                </h2>

                <p className="mt-2 text-sm text-gray-500">
                  You haven't sent any conversations yet.
                </p>

                <button
                  type="button"
                  onClick={() => navigate('/compose')}
                  className="mt-6 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Compose a Message
                </button>
              </div>
            </div>
          )}

        {/* Sent conversations */}
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
                  <div className="flex items-start justify-between gap-6">

                    {/* Main content */}
                    <div className="min-w-0 flex-1">

                      {/* Recipient */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-800">
                          To:{' '}
                          {conversation.recipient_name ||
                            'Unknown user'}
                        </span>

                        {conversation.recipient_email && (
                          <span className="truncate text-xs text-gray-500">
                            (
                            {conversation.recipient_email}
                            )
                          </span>
                        )}
                      </div>

                      {/* Subject */}
                      <h2 className="mt-1 truncate font-semibold text-gray-900">
                        {conversation.subject ||
                          'No subject'}
                      </h2>

                      {/* Category */}
                      <p className="mt-1 text-xs text-gray-500">
                        {formatCategory(
                          conversation.category
                        )}
                      </p>
                    </div>

                    {/* Date */}
                    <div className="shrink-0 text-right">
                      <p className="text-xs text-gray-500">
                        {formatDate(
                          conversation.updated_at ||
                            conversation.created_at
                        )}
                      </p>
                    </div>

                  </div>
                </button>
              ))}
            </div>
          )}

        {/* Pagination */}
        {!loading &&
          !error &&
          pagination &&
          pagination.total > 0 && (
            <div className="flex shrink-0 items-center justify-between border-t px-6 py-4">

              <p className="text-sm text-gray-500">
                Page {pagination.page}
              </p>

              <div className="flex items-center gap-2">

                {/* Previous */}
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() =>
                    setPage((value) =>
                      Math.max(1, value - 1)
                    )
                  }
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                {/* Next */}
                <button
                  type="button"
                  disabled={!pagination.has_more}
                  onClick={() =>
                    setPage((value) => value + 1)
                  }
                  className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                >
                  Next
                </button>

              </div>
            </div>
          )}

      </section>
    </DashboardLayout>
  );
}

export default Sent;