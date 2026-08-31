// src/pages/conversation/groupChat/ChatLogic.js

import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

import { useAuth } from "../../../context/AuthContext";
import {
  getConversation,
  sendMessage,
} from "../../../api/conversations";

import { getGroupConversation } from "../../../api/groups";

import { useWebSocket } from "../../../websocket/WebSocketProvider";

export function useChatLogic() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { lastMessage } = useWebSocket();

  /*
   * ============================================================
   * Group
   * ============================================================
   */

  const [group, setGroup] = useState(null);

  /*
   * ============================================================
   * Conversation
   * ============================================================
   */

  const [conversation, setConversation] = useState(null);

  /*
   * ============================================================
   * Messages
   * ============================================================
   */

  const [messages, setMessages] = useState([]);

  /*
   * ============================================================
   * Members
   * ============================================================
   */

  const [members, setMembers] = useState([]);

  /*
   * ============================================================
   * Loading / Error
   * ============================================================
   */

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  /*
   * ============================================================
   * Load group conversation
   * ============================================================
   */

  const loadConversation = useCallback(async () => {
    if (!groupId) {
      setError("Invalid group.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      if (import.meta.env.DEV) {
        console.group("[Group Chat] Load Conversation");
        console.log("Group ID:", groupId);
        console.groupEnd();
      }

      /*
       * --------------------------------------------------------
       * Step 1
       *
       * Get existing group conversation or create it.
       * --------------------------------------------------------
       */

      const groupConversationResponse =
        await getGroupConversation(groupId);

      if (import.meta.env.DEV) {
        console.group(
          "[Group Chat] Create/Get Conversation Response"
        );

        console.log(
          "Response:",
          groupConversationResponse
        );

        console.groupEnd();
      }

      const conversationData =
        groupConversationResponse?.data;

      if (!conversationData?.id) {
        throw new Error(
          "Unable to create or retrieve the group conversation."
        );
      }

      /*
       * --------------------------------------------------------
       * Step 2
       *
       * Store group information.
       *
       * IMPORTANT:
       *
       * The backend now returns:
       *
       * manager_id
       *
       * directly from the group conversation endpoint.
       * --------------------------------------------------------
       */

      setGroup({
        id:
          conversationData.group_id ||
          groupId,

        name:
          conversationData.group_name ||
          conversationData.subject ||
          "Group",

        manager_id:
          conversationData.manager_id ||
          null,
      });

      /*
       * Store initial conversation.
       */

      setConversation(conversationData);

      /*
       * Store participants returned by
       * group conversation endpoint.
       */

      setMembers(
        Array.isArray(
          conversationData.participants
        )
          ? conversationData.participants
          : []
      );

      /*
       * --------------------------------------------------------
       * Step 3
       *
       * Get complete conversation.
       * --------------------------------------------------------
       */

      const conversationResponse =
        await getConversation(
          conversationData.id
        );

      if (import.meta.env.DEV) {
        console.group(
          "[Group Chat] Conversation Details"
        );

        console.log(
          "Response:",
          conversationResponse
        );

        console.groupEnd();
      }

      /*
       * getConversation() already returns response.data.
       */

      const details = conversationResponse;

      if (!details?.id) {
        throw new Error(
          "Unable to load the group conversation."
        );
      }

      setConversation(details);

      /*
       * --------------------------------------------------------
       * Messages
       * --------------------------------------------------------
       */

      setMessages(
        Array.isArray(details.messages)
          ? details.messages
          : []
      );

      /*
       * --------------------------------------------------------
       * Participants
       * --------------------------------------------------------
       */

      setMembers(
        Array.isArray(details.participants)
          ? details.participants
          : Array.isArray(
                conversationData.participants
              )
            ? conversationData.participants
            : []
      );

      /*
       * --------------------------------------------------------
       * Group information
       *
       * manager_id comes from the group conversation response.
       * getConversation() may not contain it, so preserve the
       * value from conversationData.
       * --------------------------------------------------------
       */

      const resolvedGroupId =
        details.group_id ||
        conversationData.group_id ||
        groupId;

      const resolvedGroupName =
        details.group_name ||
        conversationData.group_name ||
        details.subject ||
        conversationData.subject ||
        "Group";

      const resolvedManagerId =
        conversationData.manager_id ||
        details.manager_id ||
        null;

      setGroup({
        id: resolvedGroupId,
        name: resolvedGroupName,
        manager_id: resolvedManagerId,
      });

      if (import.meta.env.DEV) {
        console.group(
          "[Group Chat] Loaded Successfully"
        );

        console.log("Group:", {
          id: resolvedGroupId,
          name: resolvedGroupName,
          manager_id: resolvedManagerId,
        });

        console.log(
          "Conversation ID:",
          details.id
        );

        console.log(
          "Messages:",
          details.messages || []
        );

        console.log(
          "Members:",
          details.participants || []
        );

        console.groupEnd();
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.group(
          "[Group Chat] Load Error"
        );

        console.error("Error:", err);
        console.log("Status:", err?.status);
        console.log("Message:", err?.message);

        console.groupEnd();
      }

      setError(
        err?.message ||
          "Unable to load the group conversation."
      );

      setGroup(null);
      setConversation(null);
      setMessages([]);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  /*
   * ============================================================
   * Initial load
   * ============================================================
   */

  useEffect(() => {
    loadConversation();
  }, [loadConversation]);

  /*
   * ============================================================
   * LIVE WEBSOCKET MESSAGE
   * ============================================================
   *
   * WebSocketProvider gives us:
   *
   * lastMessage
   *
   * Example:
   *
   * {
   *   type: "new_message",
   *   conversationId: "...",
   *   conversation: {...},
   *   message: {
   *     id: "...",
   *     conversation_id: "...",
   *     content: "Hi team",
   *     sender_id: "...",
   *     sender_name: "Neha Sharma",
   *     created_at: "..."
   *   }
   * }
   *
   * We only add the message when it belongs to the
   * conversation currently open on this page.
   * ============================================================
   */

  useEffect(() => {
    if (!lastMessage) {
      return;
    }

    if (
      lastMessage.type !== "new_message"
    ) {
      return;
    }

    if (!conversation?.id) {
      return;
    }

    /*
     * Make sure this WebSocket event belongs to
     * the currently open conversation.
     */

    if (
      lastMessage.conversationId !==
      conversation.id
    ) {
      return;
    }

    const incomingMessage =
      lastMessage.message;

    if (!incomingMessage?.id) {
      if (import.meta.env.DEV) {
        console.warn(
          "[Group Chat] WebSocket message has no message ID.",
          lastMessage
        );
      }

      return;
    }

    /*
     * Additional safety check.
     */

    if (
      incomingMessage.conversation_id &&
      incomingMessage.conversation_id !==
        conversation.id
    ) {
      return;
    }

    /*
     * Convert WebSocket message to the same
     * structure used by ChatMessageList.
     */

    const normalizedMessage = {
      id: incomingMessage.id,

      conversation_id:
        incomingMessage.conversation_id ||
        conversation.id,

      content:
        incomingMessage.content || "",

      created_at:
        incomingMessage.created_at ||
        new Date().toISOString(),

      updated_at:
        incomingMessage.updated_at ||
        incomingMessage.created_at ||
        new Date().toISOString(),

      sender_id:
        incomingMessage.sender_id,

      sender_name:
        incomingMessage.sender_name ||
        "Unknown User",

      sender_email:
        incomingMessage.sender_email ||
        null,
    };

    /*
     * --------------------------------------------------------
     * Prevent duplicates.
     *
     * This is important because a message may already have
     * been added locally after sending and then arrive again
     * through WebSocket.
     * --------------------------------------------------------
     */

    setMessages((previousMessages) => {
      const alreadyExists =
        previousMessages.some(
          (message) =>
            message.id ===
            normalizedMessage.id
        );

      if (alreadyExists) {
        if (import.meta.env.DEV) {
          console.log(
            "[Group Chat] Duplicate WebSocket message ignored:",
            normalizedMessage.id
          );
        }

        return previousMessages;
      }

      if (import.meta.env.DEV) {
        console.group(
          "[Group Chat] LIVE MESSAGE"
        );

        console.log(
          "Conversation ID:",
          conversation.id
        );

        console.log(
          "Message:",
          normalizedMessage
        );

        console.groupEnd();
      }

      return [
        ...previousMessages,
        normalizedMessage,
      ];
    });

    /*
     * Keep conversation metadata synchronized
     * with the WebSocket event.
     */

    if (lastMessage.conversation) {
      setConversation((previousConversation) => {
        if (!previousConversation) {
          return previousConversation;
        }

        return {
          ...previousConversation,
          ...lastMessage.conversation,
        };
      });
    }
  }, [
    lastMessage,
    conversation?.id,
  ]);

  /*
   * ============================================================
   * Send message
   * ============================================================
   */

  const handleSendMessage = useCallback(
    async (content) => {
      const trimmedContent =
        content?.trim();

      if (!trimmedContent) {
        console.warn(
          "[Group Chat] Empty message. Not sending."
        );

        return;
      }

      if (!conversation?.id) {
        console.error(
          "[Group Chat] Conversation is not available.",
          {
            conversation,
          }
        );

        setError(
          "Conversation is not available."
        );

        return;
      }

      if (sending) {
        console.warn(
          "[Group Chat] Message already being sent."
        );

        return;
      }

      const payload = {
        body: trimmedContent,
      };

      const apiInfo = {
        method: "POST",
        conversationId:
          conversation.id,
        payload,
      };

      if (import.meta.env.DEV) {
        console.group(
          "%c[Group Chat] SEND MESSAGE REQUEST",
          "color: #2563eb; font-weight: bold;"
        );

        console.log(
          "API function:",
          "sendMessage(conversationId, body)"
        );

        console.log(
          "Conversation ID:",
          conversation.id
        );

        console.log(
          "Payload:",
          payload
        );

        console.log(
          "Expected API:",
          `/api/conversations/${conversation.id}/messages`
        );

        console.log(
          "Request details:",
          apiInfo
        );

        console.groupEnd();
      }

      try {
        setSending(true);
        setError("");

        const response =
          await sendMessage(
            conversation.id,
            trimmedContent
          );

        if (import.meta.env.DEV) {
          console.group(
            "%c[Group Chat] SEND MESSAGE RESPONSE",
            "color: #16a34a; font-weight: bold;"
          );

          console.log(
            "Response:",
            response
          );

          console.log(
            "Response data:",
            response?.data
          );

          console.log(
            "Message ID:",
            response?.data?.message_id
          );

          console.log(
            "Conversation ID:",
            response?.data?.conversation_id
          );

          console.log(
            "Sender ID:",
            response?.data?.sender_id
          );

          console.log(
            "Content:",
            response?.data?.content
          );

          console.log(
            "Sent At:",
            response?.data?.sent_at
          );

          console.groupEnd();
        }

        /*
         * ------------------------------------------------------
         * IMPORTANT
         *
         * Do NOT immediately append the message here.
         *
         * The backend sends the message through WebSocket.
         *
         * WebSocket → lastMessage → this effect → setMessages
         *
         * This prevents duplicate messages.
         * ------------------------------------------------------
         */

        return response;
      } catch (err) {
        if (import.meta.env.DEV) {
          console.group(
            "%c[Group Chat] SEND MESSAGE ERROR",
            "color: #dc2626; font-weight: bold;"
          );

          console.error(
            "Error:",
            err
          );

          console.error(
            "Status:",
            err?.status
          );

          console.error(
            "Message:",
            err?.message
          );

          console.error(
            "Response:",
            err?.response
          );

          console.error(
            "Response data:",
            err?.response?.data
          );

          console.error(
            "Request payload:",
            payload
          );

          console.error(
            "Conversation ID:",
            conversation.id
          );

          console.groupEnd();
        }

        setError(
          err?.message ||
            "Unable to send message."
        );

        throw err;
      } finally {
        setSending(false);
      }
    },
    [
      conversation?.id,
      sending,
    ]
  );

  /*
   * ============================================================
   * Retry
   * ============================================================
   */

  const handleRetry =
    useCallback(async () => {
      await loadConversation();
    }, [loadConversation]);

  /*
   * ============================================================
   * Back
   * ============================================================
   */

  const handleBack =
    useCallback(() => {
      navigate("/groups");
    }, [navigate]);

  /*
   * ============================================================
   * Return
   * ============================================================
   */

  return {
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

    reload: loadConversation,
  };
}