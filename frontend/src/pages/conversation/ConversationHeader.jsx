// frontend/src/pages/conversation/ConversationHeader.jsx
import { useState } from "react";
import { useNavigate } from "react-router";

import ReportModal from "../../component/reporting/ReportModal";
import {
  REPORT_ENTITY_TYPES,
} from "../../component/reporting/reportConstants";

import ConversationSummary from "./ConversationSummary";

function ConversationHeader({
  subject,
  category,
  conversationId,

  summary,
  summaryLoading,
  summaryError,
  summaryUpdatedLabel,
  onGenerateSummary,
}) {
  const navigate = useNavigate();

  const [showReportModal, setShowReportModal] =
    useState(false);

  const [showMenu, setShowMenu] =
    useState(false);

  function formatCategory(value) {
    if (!value) {
      return "General";
    }

    return value
      .toLowerCase()
      .split("_")
      .map(
        (word) =>
          word.charAt(0).toUpperCase() +
          word.slice(1),
      )
      .join(" ");
  }

  function handleReport() {
    setShowMenu(false);
    setShowReportModal(true);
  }

  return (
    <>
      <header className="border-b bg-white">
        <div className="px-6 py-4">
          {/* ============================================================
           * BACK
           * ============================================================ */}

          <button
            type="button"
            onClick={() =>
              navigate("/dashboard")
            }
            className="mb-4 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:border-gray-400 hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
          >
            <span className="text-lg leading-none">
              ←
            </span>

            <span>
              Back to Dashboard
            </span>
          </button>

          {/* ============================================================
           * HEADING
           * ============================================================ */}

          <div className="flex items-start gap-4">
            <div className="min-w-0 flex-1">
              {/* Subject */}

              <div className="flex min-w-0 items-baseline gap-2">
                <span className="shrink-0 text-sm font-semibold text-gray-500">
                  Sub:
                </span>

                <h1 className="truncate text-xl font-semibold text-gray-900">
                  {subject || "No subject"}
                </h1>
              </div>

              {/* Category */}

              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  Conversation
                </span>

                <span className="text-gray-300">
                  •
                </span>

                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                  {formatCategory(category)}
                </span>
              </div>
            </div>

            {/* ============================================================
             * MENU
             * ============================================================ */}

            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() =>
                  setShowMenu(
                    (previous) => !previous,
                  )
                }
                className="rounded-lg px-3 py-2 text-xl font-bold leading-none text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                aria-label="More options"
                title="More options"
                aria-expanded={showMenu}
              >
                ⋮
              </button>

              {showMenu && (
                <div className="absolute right-0 z-50 mt-2 w-40 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                  <button
                    type="button"
                    onClick={handleReport}
                    className="flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 transition hover:bg-red-50 hover:text-red-700"
                  >
                    Report
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ================================================================
       * AI SUMMARY
       * ================================================================ */}

      <ConversationSummary
        summary={summary}
        loading={summaryLoading}
        error={summaryError}
        updatedLabel={summaryUpdatedLabel}
        onGenerate={onGenerateSummary}
      />

      {/* ================================================================
       * REPORT MODAL
       * ================================================================ */}

      <ReportModal
        isOpen={showReportModal}
        onClose={() =>
          setShowReportModal(false)
        }
        entityType={
          REPORT_ENTITY_TYPES.CONVERSATION
        }
        entityId={conversationId}
        entityName="conversation"
      />
    </>
  );
}

export default ConversationHeader;