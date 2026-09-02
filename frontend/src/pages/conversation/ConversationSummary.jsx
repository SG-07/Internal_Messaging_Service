// src/pages/conversation/ConversationSummary.jsx

function ConversationSummary({
  summary,
  loading = false,
  error = "",
  updatedLabel = "",
  onGenerate,
}) {
  /*
   * ------------------------------------------------------------
   * Normalize AI response
   * ------------------------------------------------------------
   *
   * Backend now returns:
   *
   * {
   *   summary: {
   *     summary: "...",
   *     action: {
   *       description: "...",
   *       deadline: "..."
   *     },
   *     urgency: {
   *       level: "...",
   *       reason: "..."
   *     },
   *     key_details: [...]
   *   }
   * }
   *
   * Keep this component defensive so older cached
   * string summaries do not break the UI.
   */

  const summaryData =
    typeof summary === "object" && summary !== null
      ? summary
      : {
          summary:
            typeof summary === "string"
              ? summary
              : "",
          action: null,
          urgency: null,
          key_details: [],
        };

  const summaryText =
    typeof summaryData.summary === "string"
      ? summaryData.summary
      : "";

  const action =
    summaryData.action &&
    typeof summaryData.action === "object"
      ? summaryData.action
      : null;

  const urgency =
    summaryData.urgency &&
    typeof summaryData.urgency === "object"
      ? summaryData.urgency
      : null;

  const keyDetails = Array.isArray(
    summaryData.key_details
  )
    ? summaryData.key_details
    : [];

  const hasSummary =
    Boolean(summaryText.trim());

  const hasAction =
    Boolean(action?.description);

  const hasDeadline =
    Boolean(action?.deadline);

  const hasUrgency =
    Boolean(urgency?.level) ||
    Boolean(urgency?.reason);

  const hasKeyDetails =
    keyDetails.length > 0;

  const hasAIContent =
    hasSummary ||
    hasAction ||
    hasDeadline ||
    hasUrgency ||
    hasKeyDetails;

  /*
   * ------------------------------------------------------------
   * Urgency label
   * ------------------------------------------------------------
   */

  function formatUrgencyLevel(level) {
    if (!level) return "";

    return String(level)
      .charAt(0)
      .toUpperCase() +
      String(level).slice(1).toLowerCase();
  }

  function getUrgencyClasses(level) {
    switch (String(level).toLowerCase()) {
      case "high":
        return {
          container:
            "border-red-200 bg-red-50",
          label:
            "text-red-700",
          icon:
            "text-red-600",
        };

      case "medium":
        return {
          container:
            "border-amber-200 bg-amber-50",
          label:
            "text-amber-700",
          icon:
            "text-amber-600",
        };

      case "low":
        return {
          container:
            "border-green-200 bg-green-50",
          label:
            "text-green-700",
          icon:
            "text-green-600",
        };

      default:
        return {
          container:
            "border-gray-200 bg-gray-50",
          label:
            "text-gray-700",
          icon:
            "text-gray-600",
        };
    }
  }

  const urgencyClasses =
    getUrgencyClasses(urgency?.level);

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
              : hasAIContent
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
         * AI CONTENT
         * ============================================================ */}

        {hasAIContent && !loading && (
          <div className="mt-3 space-y-3">
            {/* ========================================================
             * SUMMARY
             * ======================================================== */}

            {hasSummary && (
              <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Summary
                </p>

                <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                  {summaryText}
                </p>
              </div>
            )}

            {/* ========================================================
             * ACTION
             * ======================================================== */}

            {hasAction && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-600">
                  Required Action
                </p>

                <p className="mt-1 text-sm leading-6 text-blue-900">
                  {action.description}
                </p>

                {hasDeadline && (
                  <div className="mt-2 flex items-start gap-2">
                    <span className="mt-0.5 text-blue-600">
                      ⏰
                    </span>

                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-600">
                        Deadline
                      </p>

                      <p className="text-sm text-blue-900">
                        {action.deadline}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ========================================================
             * URGENCY
             * ======================================================== */}

            {hasUrgency && (
              <div
                className={`rounded-lg border px-4 py-3 ${urgencyClasses.container}`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm ${urgencyClasses.icon}`}
                  >
                    ⚠
                  </span>

                  <p
                    className={`text-[11px] font-semibold uppercase tracking-wide ${urgencyClasses.label}`}
                  >
                    Urgency
                  </p>

                  {urgency.level && (
                    <span
                      className={`rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-semibold ${urgencyClasses.label}`}
                    >
                      {formatUrgencyLevel(
                        urgency.level
                      )}
                    </span>
                  )}
                </div>

                {urgency.reason && (
                  <p
                    className={`mt-1 text-sm leading-6 ${urgencyClasses.label}`}
                  >
                    {urgency.reason}
                  </p>
                )}
              </div>
            )}

            {/* ========================================================
             * KEY DETAILS
             * ======================================================== */}

            {hasKeyDetails && (
              <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Key Details
                </p>

                <ul className="mt-2 space-y-1.5">
                  {keyDetails.map(
                    (detail, index) => (
                      <li
                        key={`${index}-${detail}`}
                        className="flex items-start gap-2 text-sm leading-6 text-gray-700"
                      >
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />

                        <span>
                          {detail}
                        </span>
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ConversationSummary;