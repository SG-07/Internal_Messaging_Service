// frontend/src/pages/conversation/Conversation.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

import {
  getConversation,
  markMessageAsRead,
  sendMessage,
} from "../../api/conversations";

import DashboardLayout from "../dashboard/DashboardLayout";
import { useWebSocket } from "../../websocket/WebSocketProvider";
import { useAuth } from "../../context/AuthContext";

import ConversationHeader from "./ConversationHeader";
import ConversationInfo from "./ConversationInfo";
import MessageThread from "./MessageThread";
import ActionSection from "./ActionSection";
import ApprovalSection from "./ApprovalSection";
import FollowUpSection from "./FollowUpSection";
import ReplyBox from "./ReplyBox";
import { useConversationAI } from "./useConversationAI";

function Conversation() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { lastMessage } = useWebSocket();
  const { user } = useAuth();

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const {
    summary,
    summaryLoading,
    summaryError,
    summaryUpdatedLabel,
    handleGenerateSummary,
  } = useConversationAI(id);

  // --------------------------------------------------
  // Current logged-in user
  // --------------------------------------------------

  const currentUserId = user?.id || user?.user_id || user?.user?.id || null;

  // --------------------------------------------------
  // Load conversation
  // --------------------------------------------------

  useEffect(() => {
    async function loadConversation() {
      try {
        setLoading(true);
        setError("");

        if (import.meta.env.DEV) {
          console.log("[Conversation] Loading conversation:", id);
        }

        const response = await getConversation(id);

        if (import.meta.env.DEV) {
          console.log("[Conversation] Conversation response:", response);
        }

        const data = response?.conversation || response?.data || response;

        if (import.meta.env.DEV) {
          console.log("[Conversation] Parsed conversation:", data);

          console.log("[Conversation] Initial messages:", data?.messages);

          console.log("[Conversation] Initial workflow:", data?.workflow);

          console.log("[Conversation] Current user ID:", currentUserId);

          console.log("[Conversation] Created by:", data?.created_by);
        }

        /*
         * Store the current user ID locally in the conversation
         * object so the rest of the component has a stable
         * reference even when WebSocket data arrives later.
         */
        setConversation({
          ...data,
          current_user_id: currentUserId,
        });

        setMessages(Array.isArray(data?.messages) ? data.messages : []);
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error("[Conversation] Failed to load conversation:", err);
        }

        setError(
          err.message || "Unable to load conversation. Please try again.",
        );
      } finally {
        setLoading(false);
      }
    }

    if (id && currentUserId) {
      loadConversation();
    }
  }, [id, currentUserId]);

  // --------------------------------------------------
  // Update conversation from WebSocket
  // --------------------------------------------------

  function updateConversationFromWebSocket(incomingConversation) {
    if (!incomingConversation) {
      return;
    }

    setConversation((previousConversation) => {
      if (!previousConversation) {
        return previousConversation;
      }

      return {
        ...previousConversation,
        ...incomingConversation,

        /*
         * Never allow an incomplete WebSocket payload
         * to destroy data that was already loaded.
         */
        participants: Array.isArray(incomingConversation.participants)
          ? incomingConversation.participants
          : previousConversation.participants || [],

        current_user_id: previousConversation.current_user_id || currentUserId,

        /*
         * Preserve workflow when the WebSocket payload
         * doesn't contain one.
         */
        workflow:
          incomingConversation.workflow !== undefined
            ? incomingConversation.workflow
            : previousConversation.workflow,
      };
    });
  }

  // --------------------------------------------------
  // Real-time WebSocket events
  // --------------------------------------------------

  useEffect(() => {
    if (!lastMessage) {
      return;
    }

    const eventConversationId =
      lastMessage.conversationId ||
      lastMessage.conversation?.id ||
      lastMessage.message?.conversation_id;

    if (String(eventConversationId) !== String(id)) {
      return;
    }

    if (import.meta.env.DEV) {
      console.group("[Conversation] WebSocket event received");

      console.log("[Conversation] Full payload:", lastMessage);

      console.log("[Conversation] Event type:", lastMessage.type);

      console.log("[Conversation] Event conversation ID:", eventConversationId);

      console.log(
        "[Conversation] Incoming conversation:",
        lastMessage.conversation,
      );

      console.log(
        "[Conversation] Incoming workflow:",
        lastMessage.conversation?.workflow || lastMessage.workflow,
      );
    }

    // ----------------------------------------------
    // NEW MESSAGE
    // ----------------------------------------------

    if (lastMessage.type === "new_message") {
      const incomingMessage = lastMessage.message;

      if (incomingMessage) {
        setMessages((previousMessages) => {
          const alreadyExists = previousMessages.some(
            (message) => String(message.id) === String(incomingMessage.id),
          );

          if (alreadyExists) {
            if (import.meta.env.DEV) {
              console.log(
                "[Conversation] Duplicate message ignored:",
                incomingMessage.id,
              );
            }

            return previousMessages;
          }

          return [...previousMessages, incomingMessage];
        });
      }

      if (lastMessage.conversation) {
        updateConversationFromWebSocket(lastMessage.conversation);
      } else if (lastMessage.workflow) {
        setConversation((previousConversation) => {
          if (!previousConversation) {
            return previousConversation;
          }

          return {
            ...previousConversation,
            workflow: lastMessage.workflow,
          };
        });
      }

      if (import.meta.env.DEV) {
        console.groupEnd();
      }

      return;
    }

    // ----------------------------------------------
    // CONVERSATION UPDATED
    // ----------------------------------------------

    if (lastMessage.type === "conversation_updated") {
      if (lastMessage.conversation) {
        updateConversationFromWebSocket(lastMessage.conversation);
      } else if (lastMessage.workflow) {
        setConversation((previousConversation) => {
          if (!previousConversation) {
            return previousConversation;
          }

          return {
            ...previousConversation,
            workflow: lastMessage.workflow,
          };
        });
      }

      if (import.meta.env.DEV) {
        console.log(
          "[Conversation] Conversation/workflow updated from WebSocket.",
        );

        console.groupEnd();
      }

      return;
    }

    if (import.meta.env.DEV) {
      console.log("[Conversation] No handler for event:", lastMessage.type);

      console.groupEnd();
    }
  }, [lastMessage, id, currentUserId]);

  // --------------------------------------------------
  // Mark message as read
  // --------------------------------------------------

  async function handleMarkAsRead(messageId) {
    try {
      await markMessageAsRead(messageId);

      setMessages((previousMessages) =>
        previousMessages.map((message) => {
          if (String(message.id) !== String(messageId)) {
            return message;
          }

          return {
            ...message,
            is_read: true,
            read_at: new Date().toISOString(),
          };
        }),
      );
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error("[Conversation] Failed to mark message as read:", err);
      }
    }
  }

  // --------------------------------------------------
  // Send reply
  // --------------------------------------------------

  async function handleSendReply(content) {
    try {
      const response = await sendMessage(id, content);

      if (import.meta.env.DEV) {
        console.log("[Conversation] Reply response:", response);
      }

      const sentMessage = response?.data || response?.message;

      if (sentMessage) {
        const localMessage = {
          id: sentMessage.id || sentMessage.message_id,

          content: sentMessage.content || sentMessage.body || content,

          body: sentMessage.body || sentMessage.content || content,

          sender_id: sentMessage.sender_id,

          sender_name: sentMessage.sender_name,

          sender_email: sentMessage.sender_email,

          created_at: sentMessage.created_at || sentMessage.sent_at,

          updated_at: sentMessage.updated_at,

          is_read: sentMessage.is_read,

          is_edited: sentMessage.is_edited,
        };

        setMessages((previousMessages) => {
          const alreadyExists = previousMessages.some(
            (message) => String(message.id) === String(localMessage.id),
          );

          if (alreadyExists) {
            return previousMessages;
          }

          return [...previousMessages, localMessage];
        });
      }

      const returnedWorkflow =
        response?.workflow ||
        response?.data?.workflow ||
        response?.conversation?.workflow ||
        response?.data?.conversation?.workflow;

      if (returnedWorkflow) {
        setConversation((previousConversation) => {
          if (!previousConversation) {
            return previousConversation;
          }

          return {
            ...previousConversation,
            workflow: returnedWorkflow,
          };
        });
      }

      return response;
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error("[Conversation] Failed to send reply:", err);
      }

      throw err;
    }
  }

  // --------------------------------------------------
  // Update workflow status
  // --------------------------------------------------

  async function updateWorkflowStatus(type, status, comment = "") {
    const endpoint =
      type === "action"
        ? `/api/conversations/${id}/action`
        : `/api/conversations/${id}/approval`;

    const payload = {
      status,
      comment: comment || "",
    };

    if (import.meta.env.DEV) {
      console.log("[Conversation] Updating workflow:", {
        type,
        endpoint,
        method: "PATCH",
        payload,
      });
    }

    const response = await fetch(endpoint, {
      method: "PATCH",
      credentials: "include",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(payload),
    });

    let data = null;

    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      throw new Error(
        data?.message || data?.detail || "Unable to update workflow status.",
      );
    }

    return data;
  }

  // --------------------------------------------------
  // Extract workflow from PATCH response
  // --------------------------------------------------

  function getUpdatedWorkflow(response, fallbackWorkflow, status, comment) {
    const backendWorkflow =
      response?.workflow ||
      response?.data?.workflow ||
      response?.data?.conversation?.workflow ||
      response?.conversation?.workflow;

    if (backendWorkflow) {
      return backendWorkflow;
    }

    const isAction = fallbackWorkflow?.type === "action";

    const isFinal = isAction
      ? ["DONE", "REJECTED"].includes(status)
      : ["APPROVED", "REJECTED"].includes(status);

    return {
      ...fallbackWorkflow,

      status,

      workflow_comment: comment,

      is_final: isFinal,
    };
  }

  // --------------------------------------------------
  // Action status change
  // --------------------------------------------------

  async function handleActionStatusChange(status, comment = "") {
    if (!canRespond || workflowType !== "action") {
      return;
    }

    try {
      const response = await updateWorkflowStatus("action", status, comment);

      const updatedWorkflow = getUpdatedWorkflow(
        response,
        conversation.workflow,
        status,
        comment,
      );

      setConversation((previousConversation) => {
        if (!previousConversation) {
          return previousConversation;
        }

        return {
          ...previousConversation,

          workflow: updatedWorkflow,

          updated_at:
            response?.updated_at ||
            response?.data?.updated_at ||
            response?.conversation?.updated_at ||
            previousConversation.updated_at,
        };
      });

      return response;
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error("[Conversation] Failed to update action status:", err);
      }

      throw err;
    }
  }

  // --------------------------------------------------
  // Approval status change
  // --------------------------------------------------

  async function handleDecisionChange(status, comment = "") {
    if (!canRespond || workflowType !== "approval") {
      return;
    }

    try {
      const response = await updateWorkflowStatus("approval", status, comment);

      const updatedWorkflow = getUpdatedWorkflow(
        response,
        conversation.workflow,
        status,
        comment,
      );

      setConversation((previousConversation) => {
        if (!previousConversation) {
          return previousConversation;
        }

        return {
          ...previousConversation,

          workflow: updatedWorkflow,

          updated_at:
            response?.updated_at ||
            response?.data?.updated_at ||
            response?.conversation?.updated_at ||
            previousConversation.updated_at,
        };
      });

      return response;
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error("[Conversation] Failed to update approval status:", err);
      }

      throw err;
    }
  }

  // --------------------------------------------------
  // Loading
  // --------------------------------------------------

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <p className="text-sm text-gray-500">Loading conversation...</p>
      </div>
    );
  }

  // --------------------------------------------------
  // Error
  // --------------------------------------------------

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
        <div className="w-full max-w-lg rounded-xl bg-white p-8 text-center shadow">
          <h1 className="text-xl font-semibold text-gray-900">
            Unable to load conversation
          </h1>

          <p className="mt-3 text-sm text-red-600">{error}</p>

          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="mt-6 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // Conversation not found
  // --------------------------------------------------

  if (!conversation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <p className="text-sm text-gray-500">Conversation not found.</p>
      </div>
    );
  }

  // --------------------------------------------------
  // Conversation category
  // --------------------------------------------------

  const category = (
    conversation.category ||
    conversation.conversation_type ||
    ""
  ).toLowerCase();

  // --------------------------------------------------
  // Workflow
  // --------------------------------------------------

  const workflow = conversation.workflow || null;

  const workflowType = workflow?.type || null;

  const workflowStatus = workflow?.status || "PENDING";

  /*
   * IMPORTANT:
   *
   * Keep the current workflow comment visible.
   *
   * This comes from:
   *
   * workflow.workflow_comment
   */
  const workflowComment = workflow?.workflow_comment || "";

  // --------------------------------------------------
  // Determine sender / receiver
  // --------------------------------------------------

  const creatorId = conversation.created_by;

  const isCreator =
    currentUserId != null &&
    creatorId != null &&
    String(currentUserId) === String(creatorId);

  /*
   * For a direct conversation, the receiver is
   * the participant who is NOT the creator.
   *
   * We primarily determine this using the logged-in
   * user's ID and created_by.
   */
  const isReceiver =
    currentUserId != null &&
    creatorId != null &&
    String(currentUserId) !== String(creatorId);

  /*
   * Only the receiver can interact with the
   * workflow.
   *
   * Final workflows cannot be changed.
   */
  const canRespond = !!workflow && isReceiver && workflow.is_final !== true;

  if (import.meta.env.DEV) {
    console.log("[Conversation] Current workflow state:", {
      workflow,
      workflowType,
      workflowStatus,
      workflowComment,

      currentUserId,

      creatorId,

      isCreator,

      isReceiver,

      canRespond,

      isFinal: workflow?.is_final,
    });
  }

  // --------------------------------------------------
  // Render
  // --------------------------------------------------

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-100">
        <div className="mx-auto flex min-h-screen max-w-5xl flex-col bg-white shadow-sm">
          <ConversationHeader
            subject={conversation.subject}
            category={category}
            conversationId={id}
            summary={summary}
            summaryLoading={summaryLoading}
            summaryError={summaryError}
            summaryUpdatedLabel={summaryUpdatedLabel}
            onGenerateSummary={handleGenerateSummary}
          />

          <ConversationInfo conversation={conversation} />

          {/* ACTION REQUIRED */}

          {workflowType === "action" && (
            <ActionSection
              status={workflowStatus}
              workflowComment={workflowComment}
              canRespond={canRespond}
              onStatusChange={handleActionStatusChange}
            />
          )}

          {/* APPROVAL REQUIRED */}

          {workflowType === "approval" && (
            <ApprovalSection
              status={workflowStatus}
              workflowComment={workflowComment}
              canRespond={canRespond}
              onDecisionChange={handleDecisionChange}
            />
          )}

          <FollowUpSection
            followUpAfter={conversation.follow_up_after}
            status={conversation.follow_up_status || "Waiting for response"}
          />

          <main className="flex-1">
            <MessageThread
              messages={messages}
              currentUserId={currentUserId}
              onMarkAsRead={handleMarkAsRead}
            />
          </main>

          <ReplyBox onSendReply={handleSendReply} />
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Conversation;
