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
      <div className="flex items-center gap-4 px-6 py-4">
        {/* Back to Dashboard */}
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
          aria-label="Back to Dashboard"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M17 10a.75.75 0 01-.75.75H5.56l3.22 3.22a.75.75 0 11-1.06 1.06l-4.5-4.5a.75.75 0 010-1.06l4.5-4.5a.75.75 0 010-1.06l4.5-4.5a.75.75 0 111.06 1.06l-3.22 3.22h10.69A.75.75 0 0117 10z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {/* Conversation heading */}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-semibold text-gray-900">
            {subject || 'No subject'}
          </h1>

          <div className="mt-1 flex items-center gap-2">
            <span className="text-xs text-gray-500">
              Conversation
            </span>

            <span className="text-gray-300">•</span>

            <span className="text-xs font-medium text-blue-700">
              {formatCategory(category)}
            </span>
          </div>
        </div>

        {/* More options */}
        <button
          type="button"
          className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
          aria-label="More options"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>
      </div>
    </header>
  );
}

export default ConversationHeader;