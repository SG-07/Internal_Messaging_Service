// frontend/src/pages/dashboard/ConversationListItem.jsx

function ConversationListItem({
  conversation,
  onClick,
  searchUser,
  isSearchResult,
}) {
  const {
    id,
    subject,
    category,
    is_sender,
    other_user_name,
    messages,
    type,
  } = conversation;

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

  /*
   * Normal inbox:
   *
   * is_sender
   * other_user_name
   *
   * Search response:
   *
   * messages[].sender_name
   * other_user
   */
  let senderName = 'Unknown user';

  if (isSearchResult) {
    const lastMessage =
      messages?.length > 0
        ? messages[messages.length - 1]
        : null;

    senderName =
      lastMessage?.sender_name ||
      searchUser?.full_name ||
      searchUser?.username ||
      searchUser?.email ||
      'Unknown user';
  } else {
    senderName = is_sender
      ? 'You'
      : other_user_name || 'Unknown user';
  }

  /*
   * Show the latest message from search results.
   */
  const lastMessage =
    messages?.length > 0
      ? messages[messages.length - 1]
      : null;

  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      className="block w-full px-6 py-4 text-left transition hover:bg-gray-50"
    >
      <div className="flex items-center justify-between gap-4">

        <div className="min-w-0 flex-1">

          {/* Sender + Category */}
          <div className="flex items-center gap-2">

            <span className="shrink-0 text-sm font-medium text-gray-700">
              {senderName}
            </span>

            <span className="text-gray-300">
              •
            </span>

            <span className="text-xs text-blue-500">
              {formatCategory(type)}
            </span>

            <span className="text-gray-300">
              •
            </span>

            <span className="text-xs text-gray-500">
              {formatCategory(category)}
            </span>

          </div>

          {/* Subject */}
          <h3 className="mt-1 truncate font-semibold text-gray-900">
            {subject || 'No subject'}
          </h3>

          {/* Latest message for search result */}
          {isSearchResult &&
            lastMessage?.content && (
              <p className="mt-1 truncate text-sm text-gray-500">
                {lastMessage.content}
              </p>
            )}

        </div>
      </div>
    </button>
  );
}

export default ConversationListItem;