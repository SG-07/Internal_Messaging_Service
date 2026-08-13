// frontend/src/pages/conversation/MessageItem.jsx

function MessageItem({
  message,
  currentUserId,
  isOriginal,
}) {
  const senderId = message?.sender_id;

  const isOwnMessage =
    Boolean(currentUserId) &&
    Boolean(senderId) &&
    senderId === currentUserId;

  const senderName =
    message?.sender_name || 'Unknown user';

  function formatDate(value) {
    if (!value) {
      return '—';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '—';
    }

    return date.toLocaleString();
  }

  return (
    <article
      className={[
        'rounded-xl border p-5',
        isOriginal
          ? 'border-blue-200 bg-blue-50/40'
          : 'border-gray-200 bg-white',
      ].join(' ')}
    >
      {/* Message Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-900">
              {isOwnMessage
                ? 'You'
                : senderName}
            </h3>

            {isOriginal && (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                Original
              </span>
            )}
          </div>
        </div>

        <time
          dateTime={
            message?.created_at || undefined
          }
          className="shrink-0 text-xs text-gray-500"
        >
          {formatDate(message?.created_at)}
        </time>
      </div>

      {/* Message Body */}
      <div className="mt-4">
        <p className="whitespace-pre-wrap break-words text-sm leading-6 text-gray-700">
          {message?.content || ''}
        </p>
      </div>

      {/* Message Footer */}
      <div className="mt-4 flex items-center gap-2">
        {message?.is_read === false && (
          <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
            Unread
          </span>
        )}

        {message?.is_edited && (
          <span className="text-xs italic text-gray-400">
            Edited
          </span>
        )}
      </div>
    </article>
  );
}

export default MessageItem;