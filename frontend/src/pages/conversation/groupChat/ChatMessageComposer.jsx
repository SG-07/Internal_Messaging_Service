// src/pages/conversation/chat/ChatMessageComposer.jsx
import { useEffect, useRef, useState } from "react";

function ChatMessageComposer({
  onSend,
  sending = false,
  disabled = false,
  placeholder = "Write a message...",
}) {
  const [message, setMessage] = useState("");

  const textareaRef = useRef(null);

  /*
   * ----------------------------------------
   * Focus textarea
   * ----------------------------------------
   */

  useEffect(() => {
    if (!disabled) {
      textareaRef.current?.focus();
    }
  }, [disabled]);

  /*
   * ----------------------------------------
   * Send
   * ----------------------------------------
   */

  async function handleSubmit(event) {
    event?.preventDefault();

    const trimmedMessage = message.trim();

    if (
      !trimmedMessage ||
      sending ||
      disabled
    ) {
      return;
    }

    try {
      await onSend(trimmedMessage);

      setMessage("");

      /*
       * Restore focus after sending.
       */

      requestAnimationFrame(() => {
        textareaRef.current?.focus();
      });
    } catch {
      /*
       * The parent logic already handles/logs
       * the error.
       *
       * Keep the typed message so the user
       * can retry.
       */
    }
  }

  /*
   * ----------------------------------------
   * Keyboard handling
   * ----------------------------------------
   *
   * Enter      → Send
   * Shift+Enter → New line
   * ----------------------------------------
   */

  function handleKeyDown(event) {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      handleSubmit(event);
    }
  }

  /*
   * ----------------------------------------
   * Input
   * ----------------------------------------
   */

  function handleChange(event) {
    setMessage(event.target.value);

    /*
     * Automatically grow the textarea.
     */

    const textarea =
      event.target;

    textarea.style.height = "auto";

    textarea.style.height = `${Math.min(
      textarea.scrollHeight,
      160
    )}px`;
  }

  const canSend =
    message.trim().length > 0 &&
    !sending &&
    !disabled;

  return (
    <div className="shrink-0 border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-4xl"
      >
        <div
          className={[
            "flex items-end gap-2 rounded-xl border bg-white px-3 py-2 shadow-sm transition",
            disabled
              ? "border-gray-200 bg-gray-50"
              : "border-gray-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100",
          ].join(" ")}
        >
          {/* --------------------------------
              Textarea
          -------------------------------- */}

          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={disabled || sending}
            placeholder={placeholder}
            rows={1}
            maxLength={10000}
            className="max-h-40 min-h-[40px] flex-1 resize-none overflow-y-auto bg-transparent px-1 py-2 text-sm leading-6 text-gray-900 outline-none placeholder:text-gray-400 disabled:cursor-not-allowed disabled:text-gray-400"
          />

          {/* --------------------------------
              Send
          -------------------------------- */}

          <button
            type="submit"
            disabled={!canSend}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
            aria-label={
              sending
                ? "Sending message"
                : "Send message"
            }
            title={
              sending
                ? "Sending..."
                : "Send message"
            }
          >
            {sending ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-4 w-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M22 2L11 13"
                />

                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M22 2l-7 20-4-9-9-4 20-7z"
                />
              </svg>
            )}
          </button>
        </div>

        {/* --------------------------------
            Helper text
        -------------------------------- */}

        <div className="mt-1.5 flex items-center justify-between px-1">
          <p className="text-xs text-gray-400">
            Press Enter to send · Shift+Enter for a new line
          </p>

          {message.length > 0 && (
            <p className="text-xs text-gray-400">
              {message.length}/10000
            </p>
          )}
        </div>
      </form>
    </div>
  );
}

export default ChatMessageComposer;