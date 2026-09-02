// frontend/src/pages/conversation/useConversationAI.js

import { useCallback, useEffect, useState } from "react";

import {
  generateConversationSummary,
} from "../../api/ai";

function formatUpdatedTime(updatedAt) {
  if (!updatedAt) {
    return "";
  }

  const updatedDate = new Date(updatedAt);

  if (Number.isNaN(updatedDate.getTime())) {
    return "";
  }

  const diffMs = Date.now() - updatedDate.getTime();
  const diffSeconds = Math.max(
    0,
    Math.floor(diffMs / 1000),
  );

  if (diffSeconds < 60) {
    return "just now";
  }

  const diffMinutes = Math.floor(
    diffSeconds / 60,
  );

  if (diffMinutes < 60) {
    return `${diffMinutes} minute${
      diffMinutes === 1 ? "" : "s"
    } ago`;
  }

  const diffHours = Math.floor(
    diffMinutes / 60,
  );

  if (diffHours < 24) {
    return `${diffHours} hour${
      diffHours === 1 ? "" : "s"
    } ago`;
  }

  const diffDays = Math.floor(
    diffHours / 24,
  );

  return `${diffDays} day${
    diffDays === 1 ? "" : "s"
  } ago`;
}

export function useConversationAI(conversationId) {
  const [summary, setSummary] = useState("");

  const [summaryLoading, setSummaryLoading] =
    useState(false);

  const [summaryError, setSummaryError] =
    useState("");

  const [summaryUpdatedAt, setSummaryUpdatedAt] =
    useState(null);

  // --------------------------------------------------
  // Reset AI state when conversation changes
  // --------------------------------------------------

  useEffect(() => {
    setSummary("");
    setSummaryError("");
    setSummaryUpdatedAt(null);
    setSummaryLoading(false);
  }, [conversationId]);

  // --------------------------------------------------
  // Generate conversation summary
  // --------------------------------------------------

  const handleGenerateSummary =
    useCallback(async () => {
      if (!conversationId) {
        if (import.meta.env.DEV) {
          console.warn(
            "[Conversation AI] Cannot generate summary: missing conversation ID.",
          );
        }

        setSummaryError(
          "Conversation ID is required.",
        );

        return null;
      }

      if (import.meta.env.DEV) {
        console.group(
          "[Conversation AI] SUMMARY",
        );

        console.log(
          "Conversation ID:",
          conversationId,
        );

        console.log(
          "Generating conversation summary...",
        );

        console.groupEnd();
      }

      try {
        setSummaryLoading(true);
        setSummaryError("");

        const response =
          await generateConversationSummary(
            conversationId,
          );

        /*
         * Expected backend response:
         *
         * {
         *   success: true,
         *   data: {
         *     summary: "...",
         *     cached: false,
         *     updated_at: "..."
         *   }
         * }
         */

        const data =
          response?.data || response;

        const generatedSummary =
          data?.summary || "";

        const updatedAt =
          data?.updated_at || null;

        if (!generatedSummary) {
          throw new Error(
            "AI returned an empty conversation summary.",
          );
        }

        setSummary(generatedSummary);
        setSummaryUpdatedAt(updatedAt);

        if (import.meta.env.DEV) {
          console.group(
            "[Conversation AI] SUMMARY ← Success",
          );

          console.log(
            "Conversation ID:",
            conversationId,
          );

          console.log(
            "Summary:",
            generatedSummary,
          );

          console.log(
            "Updated at:",
            updatedAt,
          );

          console.log(
            "Cached:",
            data?.cached,
          );

          console.groupEnd();
        }

        return data;
      } catch (error) {
        if (import.meta.env.DEV) {
          console.group(
            "[Conversation AI] SUMMARY ← Error",
          );

          console.error(
            "Conversation ID:",
            conversationId,
          );

          console.error(
            "Status:",
            error?.status,
          );

          console.error(
            "Message:",
            error?.message,
          );

          console.error(
            "Data:",
            error?.data,
          );

          console.groupEnd();
        }

        /*
         * Keep AI errors isolated from the core
         * conversation UI.
         */
        setSummaryError(
          error?.message ||
            "Unable to generate conversation summary.",
        );

        return null;
      } finally {
        setSummaryLoading(false);
      }
    }, [conversationId]);

  // --------------------------------------------------
  // Human-readable updated time
  // --------------------------------------------------

  const summaryUpdatedLabel =
    formatUpdatedTime(summaryUpdatedAt);

  // --------------------------------------------------
  // Return
  // --------------------------------------------------

  return {
    summary,

    summaryLoading,

    summaryError,

    summaryUpdatedAt,

    summaryUpdatedLabel,

    handleGenerateSummary,
  };
}