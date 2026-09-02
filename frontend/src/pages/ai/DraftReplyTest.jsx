// src/pages/ai/DraftReplyTest.jsx
import { useState } from "react";

import DashboardLayout from "../dashboard/DashboardLayout";
import { generateDraftReply } from "../../api/ai";

function DraftReplyTest() {
  const [conversationId, setConversationId] = useState(
    "9f9ac3eb-9727-4cad-b7f9-b503b15e97b4"
  );

  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState("");

  const handleGenerateDraft = async () => {
    if (!conversationId.trim()) {
      setError("Conversation ID is required.");
      return;
    }

    setLoading(true);
    setError("");
    setResponse(null);

    try {
      const result = await generateDraftReply(conversationId.trim());

      console.log("[Draft Reply] Response:", result);

      setResponse(result);
    } catch (err) {
      console.error("[Draft Reply] Error:", err);

      setError(
        err?.message ||
          err?.error ||
          "Failed to generate draft reply."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">
            Draft Reply Test
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Test the AI draft-reply endpoint using the authenticated frontend
            session.
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <label
            htmlFor="conversation-id"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Conversation ID
          </label>

          <input
            id="conversation-id"
            type="text"
            value={conversationId}
            onChange={(event) => setConversationId(event.target.value)}
            placeholder="Conversation UUID"
            disabled={loading}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />

          <button
            type="button"
            onClick={handleGenerateDraft}
            disabled={loading || !conversationId.trim()}
            className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Generating..." : "Generate Draft Reply"}
          </button>
        </div>

        {error && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <h2 className="text-sm font-semibold text-red-800">
              Error
            </h2>

            <pre className="mt-2 whitespace-pre-wrap text-sm text-red-700">
              {error}
            </pre>
          </div>
        )}

        {response !== null && (
          <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                API Response
              </h2>

              <span className="text-xs text-gray-500">
                Check browser console for the same payload
              </span>
            </div>

            <pre className="overflow-x-auto rounded-md bg-gray-900 p-4 text-sm text-white">
              {JSON.stringify(response, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default DraftReplyTest;