// src/pages/conversation/chat/ChatHeader.jsx
function ChatHeader({
  group,
  members = [],
  onBack,
  onMembersClick,
  onMenuClick,
}) {
  const groupName = group?.name || "Group";

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6">
      {/* ----------------------------------------
          Left
      ---------------------------------------- */}

      <div className="flex min-w-0 items-center gap-3">
        {/* Back */}

        <button
          type="button"
          onClick={onBack}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
          aria-label="Back to groups"
          title="Back to groups"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-5 w-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        {/* Group icon */}

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-5 w-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"
            />

            <circle
              cx="9"
              cy="7"
              r="4"
            />

            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
            />
          </svg>
        </div>

        {/* Group information */}

        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold text-gray-900 sm:text-base">
            {groupName}
          </h1>

          <button
            type="button"
            onClick={onMembersClick}
            className="mt-0.5 flex items-center gap-1 text-xs text-gray-500 transition hover:text-blue-600"
          >
            <span>
              {members.length}{" "}
              {members.length === 1
                ? "member"
                : "members"}
            </span>
          </button>
        </div>
      </div>

      {/* ----------------------------------------
          Right
      ---------------------------------------- */}

      <div className="flex shrink-0 items-center gap-1">
        {/* Members */}

        <button
          type="button"
          onClick={onMembersClick}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
          aria-label="View members"
          title="View members"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-5 w-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"
            />

            <circle
              cx="9"
              cy="7"
              r="4"
            />

            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
            />
          </svg>
        </button>

        {/* Menu */}

        <button
          type="button"
          onClick={onMenuClick}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
          aria-label="Conversation menu"
          title="Conversation menu"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-5 w-5"
          >
            <circle
              cx="5"
              cy="12"
              r="1.5"
            />

            <circle
              cx="12"
              cy="12"
              r="1.5"
            />

            <circle
              cx="19"
              cy="12"
              r="1.5"
            />
          </svg>
        </button>
      </div>
    </header>
  );
}

export default ChatHeader;