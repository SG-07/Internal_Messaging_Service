// frontend/src/pages/conversation/Conversation.jsx

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

import {
  getConversation,
  markMessageAsRead,
  sendMessage,
} from "../../api/conversations";

import { useWebSocket } from "../../websocket/WebSocketProvider";

import ConversationHeader from "./ConversationHeader";
import ConversationInfo from "./ConversationInfo";
import MessageThread from "./MessageThread";
import ActionSection from "./ActionSection";
import ApprovalSection from "./ApprovalSection";
import FollowUpSection from "./FollowUpSection";
import ReplyBox from "./ReplyBox";

function Conversation() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { lastMessage } = useWebSocket();

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // --------------------------------------------------
  // Load conversation
  // --------------------------------------------------

  useEffect(() => {
    async function loadConversation() {
      try {
        setLoading(true);
        setError("");

        if (import.meta.env.DEV) {
          console.log(
            "[Conversation] Loading conversation:",
            id
          );
        }

        const response = await getConversation(id);

        if (import.meta.env.DEV) {
          console.log(
            "[Conversation] Conversation response:",
            response
          );
        }

        const data =
          response?.conversation ||
          response?.data ||
          response;

        if (import.meta.env.DEV) {
          console.log(
            "[Conversation] Parsed conversation:",
            data
          );

          console.log(
            "[Conversation] Initial messages:",
            data?.messages
          );
        }

        setConversation(data);
        setMessages(
          Array.isArray(data?.messages)
            ? data.messages
            : []
        );
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error(
            "[Conversation] Failed to load conversation:",
            err
          );
        }

        setError(
          err.message ||
            "Unable to load conversation. Please try again."
        );
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadConversation();
    }
  }, [id]);

  // --------------------------------------------------
  // Real-time WebSocket messages
  // --------------------------------------------------

  useEffect(() => {
    if (!lastMessage) {
      return;
    }

    if (import.meta.env.DEV) {
      console.group(
        "[Conversation] WebSocket event received"
      );

      console.log(
        "[Conversation] Full WebSocket payload:",
        lastMessage
      );

      console.log(
        "[Conversation] Current conversation ID:",
        id
      );

      console.log(
        "[Conversation] Event conversation ID:",
        lastMessage.conversationId
      );

      console.log(
        "[Conversation] Event type:",
        lastMessage.type
      );
    }

    // ----------------------------------------------
    // We only care about new messages here.
    // ----------------------------------------------

    if (lastMessage.type !== "new_message") {
      if (import.meta.env.DEV) {
        console.log(
          "[Conversation] Ignoring WebSocket event because it is not new_message."
        );

        console.groupEnd();
      }

      return;
    }

    // ----------------------------------------------
    // Ignore messages belonging to another
    // conversation.
    // ----------------------------------------------

    if (
      String(lastMessage.conversationId) !==
      String(id)
    ) {
      if (import.meta.env.DEV) {
        console.log(
          "[Conversation] Ignoring message because it belongs to another conversation."
        );

        console.groupEnd();
      }

      return;
    }

    const incomingMessage =
      lastMessage.message;

    if (!incomingMessage) {
      if (import.meta.env.DEV) {
        console.warn(
          "[Conversation] new_message event has no message payload."
        );

        console.groupEnd();
      }

      return;
    }

    if (import.meta.env.DEV) {
      console.log(
        "[Conversation] New message belongs to current conversation."
      );

      console.log(
        "[Conversation] Incoming message:",
        incomingMessage
      );

      console.log(
        "[Conversation] Message ID:",
        incomingMessage.id
      );

      console.log(
        "[Conversation] Message content:",
        incomingMessage.content
      );

      console.log(
        "[Conversation] Message sender:",
        incomingMessage.sender_id
      );
    }

    // ----------------------------------------------
    // Add message if it does not already exist.
    //
    // This is important because:
    //
    // 1. handleSendReply() adds the sent message
    //    from the API response.
    //
    // 2. Backend also broadcasts new_message.
    //
    // Therefore the same message may arrive twice.
    // ----------------------------------------------

    setMessages((previousMessages) => {
      const alreadyExists = previousMessages.some(
        (message) =>
          message.id === incomingMessage.id
      );

      if (alreadyExists) {
        if (import.meta.env.DEV) {
          console.log(
            "[Conversation] Message already exists. Skipping duplicate:",
            incomingMessage.id
          );
        }

        return previousMessages;
      }

      if (import.meta.env.DEV) {
        console.log(
          "[Conversation] Adding new WebSocket message to thread."
        );
      }

      return [
        ...previousMessages,
        incomingMessage,
      ];
    });

    if (import.meta.env.DEV) {
      console.groupEnd();
    }
  }, [lastMessage, id]);

  // --------------------------------------------------
  // Mark message as read
  // --------------------------------------------------

  async function handleMarkAsRead(messageId) {
    try {
      await markMessageAsRead(messageId);

      setMessages((previousMessages) =>
        previousMessages.map((message) => {
          if (message.id !== messageId) {
            return message;
          }

          return {
            ...message,
            is_read: true,
            read_at: new Date().toISOString(),
          };
        })
      );
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error(
          "[Conversation] Failed to mark message as read:",
          err
        );
      }
    }
  }

  // --------------------------------------------------
  // Send reply
  // --------------------------------------------------

  async function handleSendReply(content) {
    const payload = {
      body: content,
    };

    if (import.meta.env.DEV) {
      console.log(
        "[Conversation] Sending reply:",
        {
          endpoint: `/api/conversations/${id}/messages`,
          method: "POST",
          payload,
        }
      );
    }

    try {
      const response = await sendMessage(
        id,
        content
      );

      if (import.meta.env.DEV) {
        console.log(
          "[Conversation] Reply response:",
          response
        );
      }

      const sentMessage = response?.data;

      if (sentMessage) {
        const localMessage = {
          id: sentMessage.message_id,
          content: sentMessage.content,
          body: sentMessage.content,
          sender_id: sentMessage.sender_id,
          sender_name: sentMessage.sender_name,
          created_at: sentMessage.sent_at,
        };

        if (import.meta.env.DEV) {
          console.log(
            "[Conversation] Adding sent message locally:",
            localMessage
          );
        }

        setMessages((previousMessages) => {
          const alreadyExists =
            previousMessages.some(
              (message) =>
                message.id ===
                localMessage.id
            );

          if (alreadyExists) {
            if (import.meta.env.DEV) {
              console.log(
                "[Conversation] Sent message already exists. Skipping:",
                localMessage.id
              );
            }

            return previousMessages;
          }

          return [
            ...previousMessages,
            localMessage,
          ];
        });
      }

      return response;
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error(
          "[Conversation] Failed to send reply:",
          {
            error: err,
            endpoint: `/api/conversations/${id}/messages`,
            method: "POST",
            payload,
          }
        );
      }

      throw err;
    }
  }

  // --------------------------------------------------
  // Update workflow status
  // --------------------------------------------------

  async function updateWorkflowStatus(
    type,
    status,
    comment = ""
  ) {
    const endpoint =
      type === "action"
        ? `/api/conversations/${id}/action`
        : `/api/conversations/${id}/approval`;

    const payload = {
      status,
      comment: comment || "",
    };

    if (import.meta.env.DEV) {
      console.log(
        "[Conversation] Updating workflow:",
        {
          type,
          endpoint,
          method: "PATCH",
          payload,
        }
      );
    }

    const response = await fetch(
      endpoint,
      {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    let data = null;

    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (import.meta.env.DEV) {
      console.log(
        "[Conversation] Workflow update response:",
        data
      );
    }

    if (!response.ok) {
      throw new Error(
        data?.message ||
          "Unable to update workflow status."
      );
    }

    return data;
  }

  // --------------------------------------------------
  // Extract workflow from PATCH response
  // --------------------------------------------------

  function getUpdatedWorkflow(
    response,
    fallbackWorkflow,
    status
  ) {
    const backendWorkflow =
      response?.workflow ||
      response?.data?.workflow ||
      response?.data?.conversation?.workflow ||
      response?.conversation?.workflow;

    if (backendWorkflow) {
      return backendWorkflow;
    }

    const isAction =
      fallbackWorkflow?.type === "action";

    const isFinal = isAction
      ? status === "DONE" ||
        status === "REJECTED"
      : status === "APPROVED" ||
        status === "REJECTED";

    return {
      ...fallbackWorkflow,
      status,
      is_final: isFinal,
      can_respond: false,
    };
  }

  // --------------------------------------------------
  // Action status change
  // --------------------------------------------------

  async function handleActionStatusChange(
    status,
    comment = ""
  ) {
    if (
      !conversation?.workflow?.can_respond ||
      conversation?.workflow?.is_final ||
      conversation?.workflow?.type !== "action"
    ) {
      return;
    }

    try {
      const response =
        await updateWorkflowStatus(
          "action",
          status,
          comment
        );

      const updatedWorkflow =
        getUpdatedWorkflow(
          response,
          conversation.workflow,
          status
        );

      setConversation(
        (previousConversation) => {
          if (!previousConversation) {
            return previousConversation;
          }

          return {
            ...previousConversation,
            workflow: updatedWorkflow,
            updated_at:
              response?.updated_at ||
              response?.data?.updated_at ||
              previousConversation.updated_at,
          };
        }
      );

      return response;
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error(
          "[Conversation] Failed to update action status:",
          err
        );
      }

      throw err;
    }
  }

  // --------------------------------------------------
  // Approval status change
  // --------------------------------------------------

  async function handleDecisionChange(
    status,
    comment = ""
  ) {
    if (
      !conversation?.workflow?.can_respond ||
      conversation?.workflow?.is_final ||
      conversation?.workflow?.type !== "approval"
    ) {
      return;
    }

    try {
      const response =
        await updateWorkflowStatus(
          "approval",
          status,
          comment
        );

      const updatedWorkflow =
        getUpdatedWorkflow(
          response,
          conversation.workflow,
          status
        );

      setConversation(
        (previousConversation) => {
          if (!previousConversation) {
            return previousConversation;
          }

          return {
            ...previousConversation,
            workflow: updatedWorkflow,
            updated_at:
              response?.updated_at ||
              response?.data?.updated_at ||
              previousConversation.updated_at,
          };
        }
      );

      return response;
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error(
          "[Conversation] Failed to update approval status:",
          err
        );
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
        <p className="text-sm text-gray-500">
          Loading conversation...
        </p>
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

          <p className="mt-3 text-sm text-red-600">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              navigate("/dashboard")
            }
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
        <p className="text-sm text-gray-500">
          Conversation not found.
        </p>
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

  const workflow =
    conversation.workflow || null;

  const workflowType =
    workflow?.type || null;

  const workflowStatus =
    workflow?.status || "PENDING";

  const workflowComment =
    workflow?.workflow_comment || "";

  const canRespond =
    workflow?.can_respond === true &&
    workflow?.is_final !== true;

  if (import.meta.env.DEV) {
    console.log(
      "[Conversation] Workflow state:",
      {
        category,
        workflow,
        workflowType,
        workflowStatus,
        workflowComment,
        canRespond,
      }
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col bg-white shadow-sm">

        {/* Header */}

        <ConversationHeader
          subject={conversation.subject}
          category={category}
        />

        {/* Conversation information */}

        <ConversationInfo
          conversation={conversation}
        />

        {/* ACTION REQUIRED */}

        {workflowType === "action" && (
          <ActionSection
            status={workflowStatus}
            workflowComment={workflowComment}
            canRespond={canRespond}
            onStatusChange={
              handleActionStatusChange
            }
          />
        )}

        {/* APPROVAL REQUIRED */}

        {workflowType === "approval" && (
          <ApprovalSection
            status={workflowStatus}
            workflowComment={workflowComment}
            canRespond={canRespond}
            onDecisionChange={
              handleDecisionChange
            }
          />
        )}

        {/* Follow-up */}

        <FollowUpSection
          followUpAfter={
            conversation.follow_up_after
          }
          status={
            conversation.follow_up_status ||
            "Waiting for response"
          }
        />

        {/* Messages */}

        <main className="flex-1">
          <MessageThread
            messages={messages}
            currentUserId={
              conversation.current_user_id
            }
            onMarkAsRead={
              handleMarkAsRead
            }
          />
        </main>

        {/* Reply */}

        <ReplyBox
          onSendReply={handleSendReply}
        />
      </div>
    </div>
  );
}

export default Conversation;