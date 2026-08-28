// src/pages/conversation/chat/ChatPage.jsx
import { useState } from "react";

import { useAuth } from "../../../context/AuthContext";
import DashboardLayout from "../../dashboard/DashboardLayout";
import { useChatLogic } from "./ChatLogic";
import ChatHeader from "./ChatHeader";
import ChatMessageList from "./ChatMessageList";
import ChatMessageComposer from "./ChatMessageComposer";
import ChatMembersPanel from "./ChatMembersPanel";
import ChatMenu from "./ChatMenu";

function ChatPage() {
  const { user } = useAuth();

  const {
    group,
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
   * ----------------------------------------
   * UI state
   * ----------------------------------------
   */

  const [membersOpen, setMembersOpen] = useState(false);

  const [menuOpen, setMenuOpen] = useState(false);

  /*
   * ----------------------------------------
   * Report
   *
   * We will connect this to the existing
   * report API/modal after the basic page
   * is working.
   * ----------------------------------------
   */

  const [reportOpen, setReportOpen] = useState(false);

  /*
   * ----------------------------------------
   * Loading
   * ----------------------------------------
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
   * ----------------------------------------
   * Error
   * ----------------------------------------
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
   * ----------------------------------------
   * Page
   * ----------------------------------------
   */

  return (
    <DashboardLayout>
      <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-gray-50">
        {/* --------------------------------------
          Header
      -------------------------------------- */}

        <ChatHeader
          group={group}
          members={members}
          onBack={handleBack}
          onMembersClick={() => setMembersOpen(true)}
          onMenuClick={() => setMenuOpen((previous) => !previous)}
        />

        {/* --------------------------------------
          Error banner
      -------------------------------------- */}

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

        {/* --------------------------------------
          Messages
      -------------------------------------- */}

        <ChatMessageList messages={messages} currentUserId={user?.id} />

        {/* --------------------------------------
          Composer
      -------------------------------------- */}

        <ChatMessageComposer
          onSend={handleSendMessage}
          sending={sending}
          disabled={!conversation?.id}
        />

        {/* --------------------------------------
          Members panel
      -------------------------------------- */}

        <ChatMembersPanel
          members={members}
          open={membersOpen}
          onClose={() => setMembersOpen(false)}
        />

        {/* --------------------------------------
          Menu
      -------------------------------------- */}

        <ChatMenu
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          onMembers={() => setMembersOpen(true)}
          onReport={() => setReportOpen(true)}
        />

        {/* --------------------------------------
          Report placeholder
          --------------------------------------

          We will replace this with the existing
          ReportConversationModal once we wire
          the report API.
      -------------------------------------- */}

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
