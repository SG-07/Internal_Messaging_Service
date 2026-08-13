function ConversationListItem({ conversation, onClick }) {
  const {
    id,
    subject,
    category,
    is_sender,
    other_user_name,
  } = conversation;

  function formatCategory(value) {
    if (!value) {
      return 'General';
    }

    return value
      .toLowerCase()
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  const senderName = is_sender ? 'You' : other_user_name || 'Unknown user';

  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      className="block w-full px-6 py-4 text-left transition hover:bg-gray-50"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="shrink-0 text-sm font-medium text-gray-700">
              {senderName}
            </span>

            <span className="text-gray-300">•</span>

            <span className="text-xs text-gray-500">
              {formatCategory(category)}
            </span>
          </div>

          <h3 className="mt-1 truncate font-semibold text-gray-900">
            {subject || 'No subject'}
          </h3>
        </div>
      </div>
    </button>
  );
}

export default ConversationListItem;