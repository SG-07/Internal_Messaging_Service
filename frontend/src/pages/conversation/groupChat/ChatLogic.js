// src/pages/conversation/groupChat/ChatLogic.js

import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

import { useAuth } from "../../../context/AuthContext";

import { getConversation, sendMessage } from "../../../api/conversations";

import { getGroupConversation } from "../../../api/groups";
import { getTeamConversation } from "../../../api/teams";

import { generateConversationSummary } from "../../../api/ai";

import { useWebSocket } from "../../../websocket/WebSocketProvider";

export function useChatLogic() {
  const { groupId, teamId } = useParams();

  const navigate = useNavigate();
  const { user } = useAuth();

  const { lastMessage } = useWebSocket();

  /*
   * ============================================================
   * ENTITY TYPE
   * ============================================================
   */

  const isTeamChat = Boolean(teamId);
  const entityId = teamId || groupId;

  const entityType = isTeamChat ? "team" : "group";

  /*
   * ============================================================
   * GROUP / TEAM
   * ============================================================
   *
   * Existing "group" state is intentionally retained for now.
   * It represents either a group or team depending on entityType.
   */

  const [group, setGroup] = useState(null);

  /*
   * ============================================================
   * CONVERSATION
   * ============================================================
   */

  const [conversation, setConversation] = useState(null);

  /*
   * ============================================================
   * MESSAGES
   * ============================================================
   */

  const [messages, setMessages] = useState([]);

  /*
   * ============================================================
   * MEMBERS
   * ============================================================
   */

  const [members, setMembers] = useState([]);

  /*
   * ============================================================
   * LOADING / ERROR
   * ============================================================
   */

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  /*
   * ============================================================
   * AI — CONVERSATION SUMMARY
   * ============================================================
   *
   * AI state is intentionally isolated from the normal
   * conversation loading/error state.
   *
   * An AI failure must never break the conversation.
   */

  const [summary, setSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState("");
  const [summaryUpdatedAt, setSummaryUpdatedAt] = useState(null);

  /*
   * ============================================================
   * LOAD CONVERSATION
   * ============================================================
   */

  const loadConversation = useCallback(async () => {
    /*
     * ----------------------------------------------------------
     * Validate route
     * ----------------------------------------------------------
     */

    if (!entityId) {
      setError(isTeamChat ? "Invalid team." : "Invalid group.");

      setLoading(false);

      return;
    }

    try {
      setLoading(true);
      setError("");

      if (import.meta.env.DEV) {
        console.group("[Chat] Load Conversation");

        console.log("Entity Type:", entityType);
        console.log("Entity ID:", entityId);
        console.log("Group ID:", groupId);
        console.log("Team ID:", teamId);

        console.groupEnd();
      }

      /*
       * ----------------------------------------------------------
       * Step 1
       *
       * Get the group/team conversation.
       * ----------------------------------------------------------
       */

      const conversationResponse = isTeamChat
        ? await getTeamConversation(entityId)
        : await getGroupConversation(entityId);

      if (import.meta.env.DEV) {
        console.group(
          `[${entityType === "team" ? "Team" : "Group"} Chat] Conversation Response`,
        );

        console.log("Response:", conversationResponse);

        console.groupEnd();
      }

      const conversationData = conversationResponse?.data;

      if (!conversationData?.id) {
        throw new Error(
          `Unable to create or retrieve the ${entityType} conversation.`,
        );
      }

      /*
       * ----------------------------------------------------------
       * Step 2
       *
       * Store initial entity information.
       * ----------------------------------------------------------
       */

      const resolvedEntityId = isTeamChat
        ? conversationData.team_id || entityId
        : conversationData.group_id || entityId;

      const resolvedEntityName = isTeamChat
        ? conversationData.team_name ||
          conversationData.name ||
          conversationData.subject ||
          "Team"
        : conversationData.group_name ||
          conversationData.name ||
          conversationData.subject ||
          "Group";

      const resolvedManagerId =
        conversationData.manager_id || conversationData.manager?.id || null;

      setGroup({
        id: resolvedEntityId,

        name: resolvedEntityName,

        manager_id: resolvedManagerId,

        type: entityType,
      });

      /*
       * Store initial conversation.
       */

      setConversation(conversationData);

      /*
       * Store participants.
       */

      setMembers(
        Array.isArray(conversationData.participants)
          ? conversationData.participants
          : [],
      );

      /*
       * ----------------------------------------------------------
       * Step 3
       *
       * Get complete conversation details.
       * ----------------------------------------------------------
       */

      const detailsResponse = await getConversation(conversationData.id);

      if (import.meta.env.DEV) {
        console.group(
          `[${entityType === "team" ? "Team" : "Group"} Chat] Conversation Details`,
        );

        console.log("Response:", detailsResponse);

        console.groupEnd();
      }

      const details = detailsResponse;

      if (!details?.id) {
        throw new Error(`Unable to load the ${entityType} conversation.`);
      }

      /*
       * Store complete conversation.
       */

      setConversation(details);

      /*
       * ----------------------------------------------------------
       * Messages
       * ----------------------------------------------------------
       */

      setMessages(Array.isArray(details.messages) ? details.messages : []);

      /*
       * ----------------------------------------------------------
       * Participants
       * ----------------------------------------------------------
       */

      setMembers(
        Array.isArray(details.participants)
          ? details.participants
          : Array.isArray(conversationData.participants)
            ? conversationData.participants
            : [],
      );

      /*
       * ----------------------------------------------------------
       * Resolve entity information
       * ----------------------------------------------------------
       */

      const resolvedId = isTeamChat
        ? details.team_id || conversationData.team_id || entityId
        : details.group_id || conversationData.group_id || entityId;

      const resolvedName = isTeamChat
        ? details.team_name ||
          conversationData.team_name ||
          details.name ||
          conversationData.name ||
          details.subject ||
          conversationData.subject ||
          "Team"
        : details.group_name ||
          conversationData.group_name ||
          details.name ||
          conversationData.name ||
          details.subject ||
          conversationData.subject ||
          "Group";

      const resolvedManager =
        conversationData.manager_id ||
        conversationData.manager?.id ||
        details.manager_id ||
        details.manager?.id ||
        null;

      setGroup({
        id: resolvedId,

        name: resolvedName,

        manager_id: resolvedManager,

        type: entityType,
      });

      if (import.meta.env.DEV) {
        console.group(
          `[${entityType === "team" ? "Team" : "Group"} Chat] Loaded Successfully`,
        );

        console.log("Entity Type:", entityType);

        console.log("Entity:", {
          id: resolvedId,
          name: resolvedName,
          manager_id: resolvedManager,
        });

        console.log("Conversation ID:", details.id);

        console.log("Messages:", details.messages || []);

        console.log("Members:", details.participants || []);

        console.groupEnd();
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.group(
          `[${entityType === "team" ? "Team" : "Group"} Chat] Load Error`,
        );

        console.error("Error:", err);
        console.log("Status:", err?.status);
        console.log("Message:", err?.message);

        console.groupEnd();
      }

      setError(
        err?.message || `Unable to load the ${entityType} conversation.`,
      );

      setGroup(null);
      setConversation(null);
      setMessages([]);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [entityId, entityType, groupId, teamId, isTeamChat]);

  /*
   * ============================================================
   * INITIAL LOAD
   * ============================================================
   */

  useEffect(() => {
    loadConversation();
  }, [loadConversation]);

  /*
   * ============================================================
   * RESET AI SUMMARY WHEN CONVERSATION CHANGES
   * ============================================================
   *
   * A summary belongs to one conversation.
   *
   * Therefore, when navigating from one conversation to another,
   * we must not display the previous conversation's summary.
   */

  useEffect(() => {
    setSummary("");
    setSummaryError("");
    setSummaryUpdatedAt(null);
    setSummaryLoading(false);
  }, [conversation?.id]);

  /*
   * ============================================================
   * AI — GENERATE CONVERSATION SUMMARY
   * ============================================================
   */

  const handleGenerateSummary = useCallback(async () => {
    /*
     * ----------------------------------------------------------
     * Validate conversation
     * ----------------------------------------------------------
     */

    if (!conversation?.id) {
      const message = "Conversation is not available.";

      if (import.meta.env.DEV) {
        console.warn("[AI SUMMARY] Cannot generate summary:", {
          conversationId: conversation?.id,
          message,
        });
      }

      setSummaryError(message);

      return;
    }

    /*
     * ----------------------------------------------------------
     * Prevent duplicate requests
     * ----------------------------------------------------------
     */

    if (summaryLoading) {
      if (import.meta.env.DEV) {
        console.warn("[AI SUMMARY] Request already in progress.");
      }

      return;
    }

    const conversationId = conversation.id;

    if (import.meta.env.DEV) {
      console.group("[AI SUMMARY] Generate Summary");

      console.log("Conversation ID:", conversationId);

      console.log("Entity Type:", entityType);

      console.log("Entity ID:", entityId);

      console.log(
        "Expected API:",
        `/api/ai/conversations/${conversationId}/summary`,
      );

      console.groupEnd();
    }

    try {
      setSummaryLoading(true);
      setSummaryError("");

      const response = await generateConversationSummary(conversationId);

      if (import.meta.env.DEV) {
        console.group("[AI SUMMARY] Success");

        console.log("Conversation ID:", conversationId);
        console.log("Response:", response);
        console.log("Summary:", response?.data?.summary);
        console.log("Cached:", response?.data?.cached);
        console.log("Updated At:", response?.data?.updated_at);

        console.groupEnd();
      }

      const summaryData = response?.data;

      if (!summaryData?.summary) {
        throw new Error("AI summary was not returned.");
      }

      setSummary(summaryData.summary);

      setSummaryUpdatedAt(summaryData.updated_at || null);

      return response;
    } catch (err) {
      if (import.meta.env.DEV) {
        console.group("[AI SUMMARY] Error");

        console.error("Error:", err);

        console.error("Conversation ID:", conversationId);

        console.error("Status:", err?.status);

        console.error("Message:", err?.message);

        console.error("Response Data:", err?.data);

        console.groupEnd();
      }

      /*
       * IMPORTANT:
       *
       * Do NOT use setError() here.
       *
       * AI errors are isolated from the main conversation.
       */

      setSummaryError(
        err?.message || "Unable to generate conversation summary.",
      );

      throw err;
    } finally {
      setSummaryLoading(false);
    }
  }, [
    conversation?.id,
    entityId,
    entityType,
    summaryLoading,
  ]);

  /*
   * ============================================================
   * LIVE WEBSOCKET MESSAGE
   * ============================================================
   */

  useEffect(() => {
    if (!lastMessage) {
      return;
    }

    if (lastMessage.type !== "new_message") {
      return;
    }

    if (!conversation?.id) {
      return;
    }

    if (lastMessage.conversationId !== conversation.id) {
      return;
    }

    const incomingMessage = lastMessage.message;

    if (!incomingMessage?.id) {
      if (import.meta.env.DEV) {
        console.warn(
          `[${entityType} Chat] WebSocket message has no message ID.`,
          lastMessage,
        );
      }

      return;
    }

    if (
      incomingMessage.conversation_id &&
      incomingMessage.conversation_id !== conversation.id
    ) {
      return;
    }

    const normalizedMessage = {
      id: incomingMessage.id,

      conversation_id: incomingMessage.conversation_id || conversation.id,

      content: incomingMessage.content || incomingMessage.body || "",

      created_at:
        incomingMessage.created_at ||
        incomingMessage.sent_at ||
        new Date().toISOString(),

      updated_at:
        incomingMessage.updated_at ||
        incomingMessage.created_at ||
        incomingMessage.sent_at ||
        new Date().toISOString(),

      sender_id: incomingMessage.sender_id,

      sender_name: incomingMessage.sender_name || "Unknown User",

      sender_email: incomingMessage.sender_email || null,
    };

    setMessages((previousMessages) => {
      const alreadyExists = previousMessages.some(
        (message) => message.id === normalizedMessage.id,
      );

      if (alreadyExists) {
        if (import.meta.env.DEV) {
          console.log(
            `[${entityType} Chat] Duplicate WebSocket message ignored:`,
            normalizedMessage.id,
          );
        }

        return previousMessages;
      }

      if (import.meta.env.DEV) {
        console.group(`[${entityType} Chat] LIVE MESSAGE`);

        console.log("Conversation ID:", conversation.id);

        console.log("Message:", normalizedMessage);

        console.groupEnd();
      }

      return [...previousMessages, normalizedMessage];
    });

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
  }, [lastMessage, conversation?.id, entityType]);

  /*
   * ============================================================
   * SEND MESSAGE
   * ============================================================
   */

  const handleSendMessage = useCallback(
    async (content) => {
      const trimmedContent = content?.trim();

      if (!trimmedContent) {
        console.warn(`[${entityType} Chat] Empty message. Not sending.`);

        return;
      }

      if (!conversation?.id) {
        console.error(`[${entityType} Chat] Conversation is not available.`, {
          conversation,
        });

        setError("Conversation is not available.");

        return;
      }

      if (sending) {
        console.warn(`[${entityType} Chat] Message already being sent.`);

        return;
      }

      const payload = {
        body: trimmedContent,
      };

      if (import.meta.env.DEV) {
        console.group(
          `%c[${entityType.toUpperCase()} CHAT] SEND MESSAGE REQUEST`,
          "color: #2563eb; font-weight: bold;",
        );

        console.log("Entity Type:", entityType);

        console.log("Entity ID:", entityId);

        console.log("Conversation ID:", conversation.id);

        console.log("Payload:", payload);

        console.log(
          "Expected API:",
          `/api/conversations/${conversation.id}/messages`,
        );

        console.groupEnd();
      }

      try {
        setSending(true);
        setError("");

        const response = await sendMessage(conversation.id, trimmedContent);

        if (import.meta.env.DEV) {
          console.group(
            `%c[${entityType.toUpperCase()} CHAT] SEND MESSAGE RESPONSE`,
            "color: #16a34a; font-weight: bold;",
          );

          console.log("Response:", response);

          console.log("Response data:", response?.data);

          console.groupEnd();
        }

        return response;
      } catch (err) {
        if (import.meta.env.DEV) {
          console.group(
            `%c[${entityType.toUpperCase()} CHAT] SEND MESSAGE ERROR`,
            "color: #dc2626; font-weight: bold;",
          );

          console.error("Error:", err);

          console.error("Status:", err?.status);

          console.error("Message:", err?.message);

          console.error("Response:", err?.response);

          console.error("Response data:", err?.response?.data);

          console.error("Conversation ID:", conversation.id);

          console.groupEnd();
        }

        setError(err?.message || "Unable to send message.");

        throw err;
      } finally {
        setSending(false);
      }
    },
    [conversation?.id, sending, entityType, entityId],
  );

  /*
   * ============================================================
   * RETRY
   * ============================================================
   */

  const handleRetry = useCallback(async () => {
    await loadConversation();
  }, [loadConversation]);

  /*
   * ============================================================
   * BACK
   * ============================================================
   */

  const handleBack = useCallback(() => {
    if (isTeamChat) {
      navigate("/teams");
    } else {
      navigate("/groups");
    }
  }, [navigate, isTeamChat]);

  /*
   * ============================================================
   * RETURN
   * ============================================================
   */

  return {
    /*
     * Existing entity representation.
     *
     * "group" currently represents either a group or team.
     */
    group,

    entityType,

    conversation,
    messages,
    members,

    loading,
    sending,
    error,

    /*
     * AI — Summary
     */
    summary,
    summaryLoading,
    summaryError,
    summaryUpdatedAt,
    handleGenerateSummary,

    /*
     * Chat actions
     */
    handleSendMessage,
    handleRetry,
    handleBack,

    reload: loadConversation,
  };
}