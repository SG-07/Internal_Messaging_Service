// frontend/src/pages/conversation/MessageThread.jsx

import MessageItem from './MessageItem';

function MessageThread({
  messages,
  currentUserId,
  onMarkAsRead,
}) {
  if (!messages || messages.length === 0) {
    return (
      <section className="px-6 py-8">
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center">
          <p className="text-sm text-gray-500">
            No messages in this conversation.
          </p>
        </div>
      </section>
    );
  }

  const sortedMessages = [...messages].sort(
    (a, b) =>
      new Date(a.created_at).getTime() -
      new Date(b.created_at).getTime()
  );

  return (
    <section className="px-6 py-6">
      {/* Thread heading */}
      <div className="mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Conversation
        </h2>

        <p className="mt-1 text-xs text-gray-400">
          {sortedMessages.length}{' '}
          {sortedMessages.length === 1
            ? 'message'
            : 'messages'}
        </p>
      </div>

      {/* Messages */}
      <div className="space-y-4">
        {sortedMessages.map((message, index) => (
          <MessageItem
            key={message.id}
            message={message}
            currentUserId={currentUserId}
            isOriginal={index === 0}
            onMarkAsRead={onMarkAsRead}
          />
        ))}
      </div>
    </section>
  );
}

export default MessageThread;