// src/pages/conversation/chat/ChatHeader.jsx
import ConversationSummary from "../ConversationSummary";

function ChatHeader({
  entity,
  entityType = "group",
  members = [],
  onBack,
  onMembersClick,
  onMenuClick,

  summary,
  summaryLoading,
  summaryError,
  summaryUpdatedLabel,
  onGenerateSummary,
}) {
  const isTeam = entityType === "team";

  const entityName = entity?.name || (isTeam ? "Team" : "Group");

  const entityLabel = isTeam ? "Team" : "Group";

  const memberCount = members.length;

  return (
    <>
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6">
        {/* ============================================================
         * LEFT
         * ============================================================ */}

        <div className="flex min-w-0 items-center gap-3">
          {/* Back button */}

          <button
            type="button"
            onClick={onBack}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
            aria-label={`Back to ${isTeam ? "teams" : "groups"}`}
            title={`Back to ${isTeam ? "teams" : "groups"}`}
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

          {/* ============================================================
           * ENTITY ICON
           * ============================================================ */}

          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
              isTeam
                ? "bg-purple-50 text-purple-600"
                : "bg-blue-50 text-blue-600"
            }`}
            aria-hidden="true"
          >
            {isTeam ? (
              /* Team icon */

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
                  d="M3 21h18"
                />

                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 21V7l7-4 7 4v14"
                />

                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 21v-6h6v6"
                />

                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 9h.01M15 9h.01M9 12h.01M15 12h.01"
                />
              </svg>
            ) : (
              /* Group icon */

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

                <circle cx="9" cy="7" r="4" />

                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
                />
              </svg>
            )}
          </div>

          {/* ============================================================
           * ENTITY INFORMATION
           * ============================================================ */}

          <div className="min-w-0">
            {/* Entity name */}

            <div className="flex min-w-0 items-center gap-2">
              <h1 className="truncate text-sm font-semibold text-gray-900 sm:text-base">
                {entityName}
              </h1>

              {/* Entity badge */}

              <span
                className={`hidden shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide sm:inline-flex ${
                  isTeam
                    ? "bg-purple-50 text-purple-700"
                    : "bg-blue-50 text-blue-700"
                }`}
              >
                {entityLabel}
              </span>
            </div>

            {/* Members */}

            <button
              type="button"
              onClick={onMembersClick}
              className="mt-0.5 flex items-center gap-1 text-xs text-gray-500 transition hover:text-blue-600 focus:outline-none"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-3.5 w-3.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"
                />

                <circle cx="9" cy="7" r="4" />

                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
                />
              </svg>

              <span>
                {memberCount} {memberCount === 1 ? "member" : "members"}
              </span>
            </button>
          </div>
        </div>

        {/* ============================================================
         * RIGHT
         * ============================================================ */}

        <div className="flex shrink-0 items-center gap-1">
          {/* Conversation menu */}

          <button
            type="button"
            onClick={onMenuClick}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
            aria-label={`${entityLabel} conversation menu`}
            title={`${entityLabel} conversation menu`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-5 w-5"
            >
              <circle cx="5" cy="12" r="1.5" />

              <circle cx="12" cy="12" r="1.5" />

              <circle cx="19" cy="12" r="1.5" />
            </svg>
          </button>
        </div>
      </header>

      <ConversationSummary
        summary={summary}
        loading={summaryLoading}
        error={summaryError}
        updatedLabel={summaryUpdatedLabel}
        onGenerate={onGenerateSummary}
      />
    </>
  );
}

export default ChatHeader;
