// src/pages/conversation/chat/ChatLogic.js
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

import { useAuth } from "../../../context/AuthContext";
import { getConversation, sendMessage } from "../../../api/conversations";

import { getGroupConversation } from "../../../api/groups";

export function useChatLogic() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  /*
   * ----------------------------------------
   * Group
   * ----------------------------------------
   */

  const [group, setGroup] = useState(null);

  /*
   * ----------------------------------------
   * Conversation
   * ----------------------------------------
   */

  const [conversation, setConversation] = useState(null);

  /*
   * ----------------------------------------
   * Messages
   * ----------------------------------------
   */

  const [messages, setMessages] = useState([]);

  /*
   * ----------------------------------------
   * Members
   * ----------------------------------------
   */

  const [members, setMembers] = useState([]);

  /*
   * ----------------------------------------
   * Loading / Error
   * ----------------------------------------
   */

  const [loading, setLoading] = useState(true);

  const [sending, setSending] = useState(false);

  const [error, setError] = useState("");

  /*
   * ----------------------------------------
   * Load group conversation
   * ----------------------------------------
   *
   * The backend handles both cases:
   *
   * 1. Conversation doesn't exist
   *    → create it
   *
   * 2. Conversation already exists
   *    → return existing conversation
   *
   * This gives us the conversation ID.
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
       * ----------------------------------------
       * Step 1
       *
       * Get existing group conversation or
       * create it for the first time.
       * ----------------------------------------
       */

      const groupConversationResponse = await getGroupConversation(groupId);

      if (import.meta.env.DEV) {
        console.group("[Group Chat] Create/Get Conversation Response");

        console.log("Response:", groupConversationResponse);

        console.groupEnd();
      }

      const conversationData = groupConversationResponse?.data;

      if (!conversationData?.id) {
        throw new Error("Unable to create or retrieve the group conversation.");
      }

      /*
       * ----------------------------------------
       * Step 2
       *
       * Store basic information returned by
       * the group conversation endpoint.
       * ----------------------------------------
       */

      setGroup({
        id: conversationData.group_id || groupId,

        name: conversationData.group_name || "Group",
      });

      /*
       * Store the initial conversation object.
       */

      setConversation(conversationData);

      /*
       * Participants are already returned by
       * the group conversation endpoint.
       */

      setMembers(
        Array.isArray(conversationData.participants)
          ? conversationData.participants
          : [],
      );

      /*
       * ----------------------------------------
       * Step 3
       *
       * Get complete conversation.
       *
       * This gives us messages.
       * ----------------------------------------
       */

      const conversationResponse = await getConversation(conversationData.id);

      if (import.meta.env.DEV) {
        console.group("[Group Chat] Conversation Details");

        console.log("Response:", conversationResponse);

        console.groupEnd();
      }

      /*
       * IMPORTANT:
       *
       * Your existing getConversation()
       * already returns response.data.
       *
       * Therefore we do NOT use:
       *
       * response.data
       *
       * again here.
       */

      const details = conversationResponse;

      if (!details?.id) {
        throw new Error("Unable to load the group conversation.");
      }

      setConversation(details);

      /*
       * ----------------------------------------
       * Messages
       * ----------------------------------------
       */

      setMessages(Array.isArray(details.messages) ? details.messages : []);

      /*
       * ----------------------------------------
       * Participants
       * ----------------------------------------
       */

      setMembers(
        Array.isArray(details.participants)
          ? details.participants
          : Array.isArray(conversationData.participants)
            ? conversationData.participants
            : [],
      );

      /*
       * ----------------------------------------
       * Group information
       * ----------------------------------------
       */

      setGroup({
        id: details.group_id || conversationData.group_id || groupId,

        name: details.group_name || conversationData.group_name || "Group",
      });

      if (import.meta.env.DEV) {
        console.group("[Group Chat] Loaded Successfully");

        console.log("Group:", {
          id: details.group_id || conversationData.group_id || groupId,

          name: details.group_name || conversationData.group_name || "Group",
        });

        console.log("Conversation ID:", details.id);

        console.log("Messages:", details.messages || []);

        console.log("Members:", details.participants || []);

        console.groupEnd();
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.group("[Group Chat] Load Error");

        console.error("Error:", err);

        console.log("Status:", err?.status);

        console.log("Message:", err?.message);

        console.groupEnd();
      }

      setError(err?.message || "Unable to load the group conversation.");

      setGroup(null);
      setConversation(null);
      setMessages([]);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  /*
   * ----------------------------------------
   * Initial load
   * ----------------------------------------
   */

  useEffect(() => {
    loadConversation();
  }, [loadConversation]);

  /*
   * ----------------------------------------
   * Send message
   * ----------------------------------------
   */

  const handleSendMessage = useCallback(
    async (content) => {
      const trimmedContent = content?.trim();

      if (!trimmedContent) {
        console.warn("[Group Chat] Empty message. Not sending.");
        return;
      }

      if (!conversation?.id) {
        console.error("[Group Chat] Conversation is not available.", {
          conversation,
        });

        setError("Conversation is not available.");
        return;
      }

      if (sending) {
        console.warn("[Group Chat] Message already being sent.");
        return;
      }

      /*
       * ----------------------------------------
       * DEBUG: REQUEST INFORMATION
       * ----------------------------------------
       */

      const payload = {
        body: trimmedContent,
      };

      const apiInfo = {
        method: "POST",
        conversationId: conversation.id,
        payload,
      };

      if (import.meta.env.DEV) {
        console.group(
          "%c[Group Chat] SEND MESSAGE REQUEST",
          "color: #2563eb; font-weight: bold;",
        );

        console.log("API function:", "sendMessage(conversationId, body)");

        console.log("Conversation ID:", conversation.id);

        console.log("Payload:", payload);

        console.log(
          "Expected API:",
          `/api/conversations/${conversation.id}/messages`,
        );

        console.log("Request details:", apiInfo);

        console.groupEnd();
      }

      try {
        setSending(true);
        setError("");

        /*
         * ----------------------------------------
         * SEND REQUEST
         * ----------------------------------------
         */

        const response = await sendMessage(conversation.id, trimmedContent);

        /*
         * ----------------------------------------
         * DEBUG: RESPONSE
         * ----------------------------------------
         */

        if (import.meta.env.DEV) {
          console.group(
            "%c[Group Chat] SEND MESSAGE RESPONSE",
            "color: #16a34a; font-weight: bold;",
          );

          console.log("Response:", response);

          console.log("Response data:", response?.data);

          console.log("Message ID:", response?.data?.message_id);

          console.log("Conversation ID:", response?.data?.conversation_id);

          console.log("Sender ID:", response?.data?.sender_id);

          console.log("Content:", response?.data?.content);

          console.log("Sent At:", response?.data?.sent_at);

          console.groupEnd();
        }

        /*
         * ----------------------------------------
         * ADD MESSAGE TO UI
         * ----------------------------------------
         */

        const sentMessage = response?.data;

        if (sentMessage?.message_id) {
          const newMessage = {
            id: sentMessage.message_id,

            content: sentMessage.content || trimmedContent,

            created_at: sentMessage.sent_at || new Date().toISOString(),

            sender_id: sentMessage.sender_id || user?.id,

            sender_name:
              sentMessage.sender_name ||
              user?.full_name ||
              user?.username ||
              "You",
          };

          setMessages((previousMessages) => [...previousMessages, newMessage]);

          if (import.meta.env.DEV) {
            console.log("[Group Chat] Message added to UI:", newMessage);
          }
        } else {
          console.warn(
            "[Group Chat] Backend response does not contain message_id.",
            response,
          );
        }

        return response;
      } catch (err) {
        /*
         * ----------------------------------------
         * DEBUG: ERROR
         * ----------------------------------------
         */

        if (import.meta.env.DEV) {
          console.group(
            "%c[Group Chat] SEND MESSAGE ERROR",
            "color: #dc2626; font-weight: bold;",
          );

          console.error("Error:", err);

          console.error("Status:", err?.status);

          console.error("Message:", err?.message);

          console.error("Response:", err?.response);

          console.error("Response data:", err?.response?.data);

          console.error("Request payload:", payload);

          console.error("Conversation ID:", conversation.id);

          console.groupEnd();
        }

        setError(err?.message || "Unable to send message.");

        throw err;
      } finally {
        setSending(false);
      }
    },
    [conversation?.id, sending, user?.id, user?.full_name, user?.username],
  );

  /*
   * ----------------------------------------
   * Retry
   * ----------------------------------------
   */

  const handleRetry = useCallback(async () => {
    await loadConversation();
  }, [loadConversation]);

  /*
   * ----------------------------------------
   * Back to groups
   * ----------------------------------------
   */

  const handleBack = useCallback(() => {
    navigate("/groups");
  }, [navigate]);

  /*
   * ----------------------------------------
   * Return
   * ----------------------------------------
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
