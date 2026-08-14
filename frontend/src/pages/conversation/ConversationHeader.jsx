// frontend/src/pages/conversation/ConversationHeader.jsx

import { useNavigate } from 'react-router';

function ConversationHeader({ subject, category }) {
  const navigate = useNavigate();

  function formatCategory(value) {
    if (!value) {
      return 'General';
    }

    return value
      .toLowerCase()
      .split('_')
      .map(
        (word) =>
          word.charAt(0).toUpperCase() + word.slice(1)
      )
      .join(' ');
  }

  return (
    <header className="border-b bg-white">
      <div className="px-6 py-4">

        {/* Back to Dashboard */}
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="mb-4 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:border-gray-400 hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M9.707 4.293a1 1 0 010 1.414L6.414 9H16a1 1 0 110 2H6.414l3.293 3.293a1 1 0 01-1.414 1.414l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>

          <span>Back to Dashboard</span>
        </button>

        {/* Conversation heading */}
        <div className="flex items-start gap-4">
          <div className="min-w-0 flex-1">

            {/* Subject */}
            <div className="flex min-w-0 items-baseline gap-2">
              <span className="shrink-0 text-sm font-semibold text-gray-500">
                Sub:
              </span>

              <h1 className="truncate text-xl font-semibold text-gray-900">
                {subject || 'No subject'}
              </h1>
            </div>

            {/* Conversation category */}
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-gray-500">
                Conversation
              </span>

              <span className="text-gray-300">
                •
              </span>

              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                {formatCategory(category)}
              </span>
            </div>
          </div>

          {/* More options */}
          <button
            type="button"
            className="shrink-0 rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
            aria-label="More options"
            title="More options"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}

export default ConversationHeader;