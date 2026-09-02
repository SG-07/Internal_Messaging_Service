// src/pages/conversation/groupChat/ChatPage.jsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import { useAuth } from "../../../context/AuthContext";

import DashboardLayout from "../../dashboard/DashboardLayout";

import { useConversationAI } from "../useConversationAI";
import { useChatLogic } from "./ChatLogic";

import ChatHeader from "./ChatHeader";
import ChatMessageList from "./ChatMessageList";
import ChatMessageComposer from "./ChatMessageComposer";
import ChatMembersPanel from "./ChatMembersPanel";
import ChatMenu from "./ChatMenu";

function ChatPage() {
  const navigate = useNavigate();

  const { user } = useAuth();

  const {
    entity,
    entityType,
    conversation,
    messages,
    members,

    loading,
    sending,
    error,

    handleSendMessage,
    handleRetry,
    handleBack,
  } = useChatLogic();

  /*
   * ============================================================
   * AI
   * ============================================================
   *
   * The same hook is used by:
   *
   * - Direct conversations
   * - Group conversations
   * - Team conversations
   *
   * The conversation ID is the only thing AI needs.
   */

  const {
    summary,
    summaryLoading,
    summaryError,
    summaryUpdatedLabel,
    handleGenerateSummary,
  } = useConversationAI(conversation?.id);

  /*
   * ============================================================
   * ENTITY / MANAGER
   * ============================================================
   */

  const entityId = entity?.id;

  const isTeamChat = entityType === "team";

  /*
   * Both Groups and Teams use manager_id.
   *
   * Depending on the backend response, manager_id may be
   * directly on the entity or inside entity.manager.
   */

  const managerId = entity?.manager_id || entity?.manager?.id || null;

  const isManager =
    Boolean(user?.id) &&
    Boolean(managerId) &&
    String(user.id) === String(managerId);

  /*
   * ============================================================
   * UI STATE
   * ============================================================
   */

  const [membersOpen, setMembersOpen] = useState(false);

  const [menuOpen, setMenuOpen] = useState(false);

  const [reportOpen, setReportOpen] = useState(false);

  /*
   * ============================================================
   * DEBUG
   * ============================================================
   */

  useEffect(() => {
    if (!import.meta.env.DEV) {
      return;
    }

    console.group(`[${isTeamChat ? "Team" : "Group"} Chat] Menu Permission`);

    console.log("Entity Type:", entityType);

    console.log("Entity ID:", entityId);

    console.log("Team ID:", isTeamChat ? entityId : undefined);

    console.log("Group ID:", !isTeamChat ? entityId : undefined);

    console.log("Entity Name:", entity?.name);

    console.log("Manager ID:", managerId);

    console.log("Current User ID:", user?.id);

    console.log("Is Manager:", isManager);

    console.log("Conversation ID:", conversation?.id);

    console.groupEnd();
  }, [
    user?.id,
    entity?.id,
    entity?.name,
    entity?.manager_id,
    entity?.manager?.id,
    conversation?.id,
    entityType,
    entityId,
    isTeamChat,
    managerId,
    isManager,
  ]);

  /*
   * ============================================================
   * AI DEBUG
   * ============================================================
   */

  useEffect(() => {
    if (!import.meta.env.DEV) {
      return;
    }

    console.group("[Group/Team Chat] AI Summary State");

    console.log("Conversation ID:", conversation?.id);

    console.log("Summary:", summary);

    console.log("Summary Loading:", summaryLoading);

    console.log("Summary Error:", summaryError);

    console.log("Summary Updated At:", summaryUpdatedAt);

    console.log("Summary Updated Label:", summaryUpdatedLabel);

    console.groupEnd();
  }, [
    conversation?.id,
    summary,
    summaryLoading,
    summaryError,
    summaryUpdatedAt,
    summaryUpdatedLabel,
  ]);

  /*
   * ============================================================
   * LOADING
   * ============================================================
   */

  if (loading) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />

          <p className="mt-3 text-sm text-gray-500">Loading conversation...</p>
        </div>
      </div>
    );
  }

  /*
   * ============================================================
   * ERROR
   * ============================================================
   */

  if (error && !conversation) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center bg-gray-50 px-6">
        <div className="w-full max-w-md rounded-xl border border-red-200 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
            !
          </div>

          <h1 className="mt-4 text-lg font-semibold text-gray-900">
            Unable to load conversation
          </h1>

          <p className="mt-2 text-sm leading-6 text-gray-500">{error}</p>

          <div className="mt-5 flex justify-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Back
            </button>

            <button
              type="button"
              onClick={handleRetry}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  /*
   * ============================================================
   * PAGE
   * ============================================================
   */

  return (
    <DashboardLayout>
      <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-gray-50">
        {/* ======================================================
         * HEADER
         * ====================================================== */}

        <ChatHeader
          entity={entity}
          entityType={entityType}
          members={members}
          onBack={handleBack}
          onMembersClick={() => setMembersOpen(true)}
          onMenuClick={() => setMenuOpen((previous) => !previous)}
          summary={summary}
          summaryLoading={summaryLoading}
          summaryError={summaryError}
          summaryUpdatedLabel={summaryUpdatedLabel}
          onGenerateSummary={handleGenerateSummary}
        />

        {/* ======================================================
         * ERROR BANNER
         * ====================================================== */}

        {error && (
          <div className="shrink-0 border-b border-red-200 bg-red-50 px-4 py-2.5 sm:px-6">
            <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
              <p className="text-sm text-red-700">{error}</p>

              <button
                type="button"
                onClick={handleRetry}
                className="shrink-0 text-sm font-medium text-red-700 underline underline-offset-2 hover:text-red-900"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* ======================================================
         * MESSAGES
         * ====================================================== */}

        <ChatMessageList messages={messages} currentUserId={user?.id} />

        {/* ======================================================
         * COMPOSER
         * ====================================================== */}

        <ChatMessageComposer
          onSend={handleSendMessage}
          sending={sending}
          disabled={!conversation?.id}
        />

        {/* ======================================================
         * MEMBERS PANEL
         * ====================================================== */}

        <ChatMembersPanel
          members={members}
          open={membersOpen}
          onClose={() => setMembersOpen(false)}
        />

        {/* ======================================================
         * MENU
         * ====================================================== */}

        <ChatMenu
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          onMembers={() => {
            setMenuOpen(false);
            setMembersOpen(true);
          }}
          onGroupDetails={() => {
            setMenuOpen(false);

            if (!entity?.id) {
              return;
            }

            navigate(
              entityType === "team"
                ? `/teams/${entity.id}`
                : `/groups/${entity.id}`,
            );
          }}
          onReport={() => {
            setMenuOpen(false);
            setReportOpen(true);
          }}
          isManager={isManager}
        />

        {/* ======================================================
         * REPORT PLACEHOLDER
         * ====================================================== */}

        {reportOpen && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
              <h2 className="text-lg font-semibold text-gray-900">
                Report Conversation
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                The report modal will be connected to the existing report
                functionality.
              </p>

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={() => setReportOpen(false)}
                  className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default ChatPage;
