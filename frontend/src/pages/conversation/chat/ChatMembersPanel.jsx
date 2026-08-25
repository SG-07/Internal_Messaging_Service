// src/pages/conversation/chat/ChatMessageComposer.jsx
function ChatMembersPanel({
  members = [],
  open = false,
  onClose,
}) {
  if (!open) {
    return null;
  }

  return (
    <aside className="absolute inset-y-0 right-0 z-30 flex w-full max-w-sm flex-col border-l border-gray-200 bg-white shadow-xl sm:w-80">
      {/* ----------------------------------------
          Header
      ---------------------------------------- */}

      <div className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 px-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">
            Members
          </h2>

          <p className="mt-0.5 text-xs text-gray-500">
            {members.length}{" "}
            {members.length === 1
              ? "member"
              : "members"}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
          aria-label="Close members"
          title="Close"
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* ----------------------------------------
          Members
      ---------------------------------------- */}

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {members.length === 0 ? (
          <div className="flex h-full items-center justify-center px-6 text-center">
            <div>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-xl">
                👥
              </div>

              <p className="mt-3 text-sm font-medium text-gray-900">
                No members found
              </p>

              <p className="mt-1 text-xs leading-5 text-gray-500">
                There are no members available for
                this conversation.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {members.map((member) => (
              <MemberItem
                key={member.id}
                member={member}
              />
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}

/*
 * --------------------------------------------------
 * Member Item
 * --------------------------------------------------
 */

function MemberItem({ member }) {
  const name =
    member?.full_name ||
    member?.username ||
    "Unknown User";

  const username =
    member?.username;

  return (
    <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition hover:bg-gray-50">
      {/* Avatar */}

      <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-700">
        {getInitials(name)}

        {/* Online indicator.
         *
         * We don't have online presence data
         * from the current API, so this is NOT
         * rendered.
         */}
      </div>

      {/* Information */}

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900">
          {name}
        </p>

        {username && (
          <p className="truncate text-xs text-gray-500">
            @{username}
          </p>
        )}

        {!username && member?.email && (
          <p className="truncate text-xs text-gray-500">
            {member.email}
          </p>
        )}
      </div>
    </div>
  );
}

/*
 * --------------------------------------------------
 * Helpers
 * --------------------------------------------------
 */

function getInitials(value) {
  if (!value) {
    return "?";
  }

  return value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) =>
      word.charAt(0).toUpperCase()
    )
    .join("");
}

export default ChatMembersPanel;