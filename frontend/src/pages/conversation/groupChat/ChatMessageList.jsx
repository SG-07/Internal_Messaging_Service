// src/pages/conversation/chat/ChatMessageList.jsx
import { useEffect, useRef } from "react";

function ChatMessageList({
  messages = [],
  currentUserId,
}) {
  const bottomRef = useRef(null);

  /*
   * ----------------------------------------
   * Scroll to latest message
   * ----------------------------------------
   */

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  /*
   * ----------------------------------------
   * Empty state
   * ----------------------------------------
   */

  if (messages.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center bg-gray-50 px-6">
        <div className="max-w-sm text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-2xl shadow-sm">
            💬
          </div>

          <h2 className="mt-4 text-lg font-semibold text-gray-900">
            No messages yet
          </h2>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            This is the beginning of the conversation.
            Send a message to get things started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-gray-50 px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-4xl space-y-5">
        {messages.map((message) => {
          const isOwnMessage =
            message.sender_id === currentUserId;

          return (
            <ChatMessage
              key={message.id}
              message={message}
              isOwnMessage={isOwnMessage}
            />
          );
        })}

        {/* Scroll target */}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}

/*
 * --------------------------------------------------
 * Individual message
 * --------------------------------------------------
 */

function ChatMessage({
  message,
  isOwnMessage,
}) {
  const senderName =
    message?.sender_name ||
    "Unknown User";

  const content =
    message?.content || "";

  return (
    <div className="flex gap-3">
      {/* Avatar */}

      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-gray-700 shadow-sm ring-1 ring-gray-200">
        {getInitials(senderName)}
      </div>

      {/* Message */}

      <div className="min-w-0 flex-1">
        {/* Header */}

        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-gray-900">
            {isOwnMessage
              ? "You"
              : senderName}
          </span>

          <span className="text-xs text-gray-400">
            {formatMessageTime(
              message?.created_at
            )}
          </span>
        </div>

        {/* Content */}

        <div className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-gray-700">
          {content}
        </div>
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

function formatMessageTime(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default ChatMessageList;