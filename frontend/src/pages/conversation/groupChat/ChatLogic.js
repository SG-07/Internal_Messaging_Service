// src/pages/conversation/groupChat/ChatLogic.js

import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

import { useAuth } from "../../../context/AuthContext";

import { getConversation, sendMessage } from "../../../api/conversations";

import { getGroupConversation } from "../../../api/groups";
import { getTeamConversation } from "../../../api/teams";

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
   *
   * Supported routes:
   *
   * /groups/:groupId/chat
   * /teams/:teamId/chat
   *
   * We use the route parameter to determine whether this is
   * a group conversation or a team conversation.
   */

  const isTeamChat = Boolean(teamId);
  const entityId = teamId || groupId;

  const entityType = isTeamChat ? "team" : "group";

  /*
   * ============================================================
   * GROUP / TEAM
   * ============================================================
   *
   * We keep the existing "group" state so the existing
   * ChatPage and child components do not need to be renamed.
   *
   * For team chat, this object represents the team.
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
       *
       * IMPORTANT:
       *
       * Group:
       * GET /api/groups/:groupId/conversation
       *
       * Team:
       * GET /api/teams/:teamId/conversation
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

      /*
       * Your API functions return the backend response.
       *
       * Expected:
       *
       * {
       *   success: true,
       *   data: {
       *     id: "...",
       *     group_id/team_id: "...",
       *     ...
       *   }
       * }
       */

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
       *
       * For groups:
       *
       * group_id
       * group_name
       *
       * For teams:
       *
       * team_id
       * team_name
       *
       * We normalize both into the existing "group" state.
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

        /*
         * Useful if a child component wants to know whether
         * this is a team or group.
         */
        type: entityType,
      });

      /*
       * Store initial conversation.
       */

      setConversation(conversationData);

      /*
       * Store participants returned by the endpoint.
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
       *
       * The group/team endpoint gives us the conversation ID.
       *
       * Then:
       *
       * GET /api/conversations/:conversationId
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

      /*
       * getConversation() returns response.data according
       * to your existing API implementation.
       */

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

      /*
       * getConversation() may not return manager_id.
       *
       * Therefore conversationData.manager_id is preferred.
       */

      const resolvedManager =
        conversationData.manager_id || details.manager_id || null;

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

    /*
     * Some WebSocket implementations use conversationId.
     */

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

    /*
     * Additional conversation safety check.
     */

    if (
      incomingMessage.conversation_id &&
      incomingMessage.conversation_id !== conversation.id
    ) {
      return;
    }

    /*
     * Normalize incoming message.
     */

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

    /*
     * Prevent duplicate messages.
     */

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

    /*
     * Synchronize conversation metadata.
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

        /*
         * Do NOT append the message here.
         *
         * Backend WebSocket event will add it.
         */

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

    reload: loadConversation,
  };
}
