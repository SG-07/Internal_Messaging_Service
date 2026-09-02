// src/pages/conversation/Conversation.jsx

function ConversationSummary({
  summary,
  loading = false,
  error = "",
  updatedLabel = "",
  onGenerate,
}) {
  return (
    <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 sm:px-6">
      <div className="mx-auto max-w-4xl">
        {/* ============================================================
         * HEADER
         * ============================================================ */}

        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            {/* AI icon */}

            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-4 w-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z"
                />

                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 16l.7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16z"
                />
              </svg>
            </div>

            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-gray-900">
                AI Summary
              </h2>

              {updatedLabel && (
                <p className="text-[11px] text-gray-500">
                  Updated {updatedLabel}
                </p>
              )}
            </div>
          </div>

          {/* Generate / regenerate */}

          <button
            type="button"
            onClick={onGenerate}
            disabled={loading}
            className="shrink-0 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Summarizing..."
              : summary
                ? "Regenerate"
                : "Summarize"}
          </button>
        </div>

        {/* ============================================================
         * LOADING
         * ============================================================ */}

        {loading && (
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-300 border-t-purple-600" />

            <span>
              Analyzing the conversation...
            </span>
          </div>
        )}

        {/* ============================================================
         * ERROR
         * ============================================================ */}

        {error && !loading && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
            <p className="text-xs leading-5 text-red-700">
              {error}
            </p>
          </div>
        )}

        {/* ============================================================
         * SUMMARY
         * ============================================================ */}

        {summary && !loading && (
          <div className="mt-3 rounded-lg border border-gray-200 bg-white px-4 py-3">
            <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
              {summary}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ConversationSummary;
