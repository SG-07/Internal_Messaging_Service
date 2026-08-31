// src/pages/conversation/chat/ChatMenu.jsx

import { useEffect, useRef } from "react";

function ChatMenu({
  open = false,
  onClose,
  onMembers,
  onGroupDetails,
  onReport,
  isManager = false,
}) {
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleClickOutside(event) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        onClose?.();
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside,
      );
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        onClose?.();
      }
    }

    document.addEventListener(
      "keydown",
      handleEscape,
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape,
      );
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  function handleMembers() {
    onClose?.();
    onMembers?.();
  }

  function handleGroupDetails() {
    onClose?.();
    onGroupDetails?.();
  }

  function handleReport() {
    onClose?.();
    onReport?.();
  }

  return (
    <div
      ref={menuRef}
      className="absolute right-4 top-14 z-40 w-56 rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg"
    >
      {/* View Members */}

      <button
        type="button"
        onClick={handleMembers}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-gray-700 transition hover:bg-gray-50"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-5 w-5 shrink-0 text-gray-500"
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

        <span>View Members</span>
      </button>

      {/* Group Details — Manager only */}

      {isManager && (
        <>
          <div className="my-1 border-t border-gray-100" />

          <button
            type="button"
            onClick={handleGroupDetails}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-gray-700 transition hover:bg-gray-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-5 w-5 shrink-0 text-gray-500"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-5"
              />

              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 3.5a2.121 2.121 0 013 3L12 14l-4 1 1-4 7.5-7.5z"
              />
            </svg>

            <span>Group Details</span>
          </button>
        </>
      )}

      {/* Divider */}

      <div className="my-1 border-t border-gray-100" />

      {/* Report */}

      <button
        type="button"
        onClick={handleReport}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-red-600 transition hover:bg-red-50"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-5 w-5 shrink-0"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 21V5"
          />

          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 5c5-4 10 4 16 0v10c-6 4-11-4-16 0"
          />
        </svg>

        <span>Report Conversation</span>
      </button>
    </div>
  );
}

export default ChatMenu;