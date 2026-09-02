// frontend/src/pages/conversation/ReplyBox.jsx
import { useEffect, useState } from "react";

function ReplyBox({
  onSendReply,
  onGenerateDraft,
  disabled = false,
  draftLoading = false,
  draftError = "",
  draft = "",
}) {
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  // --------------------------------------------------
  // Apply generated AI draft to textarea
  // --------------------------------------------------

  useEffect(() => {
    if (draft) {
      setBody(draft);
      setError("");
    }
  }, [draft]);

  // --------------------------------------------------
  // Send reply
  // --------------------------------------------------

  async function handleSubmit(event) {
    event.preventDefault();

    const trimmedBody = body.trim();

    if (!trimmedBody || sending || disabled) {
      return;
    }

    try {
      setSending(true);
      setError("");

      await onSendReply(trimmedBody);

      setBody("");
    } catch (err) {
      setError(
        err?.message ||
          "Unable to send your reply. Please try again.",
      );
    } finally {
      setSending(false);
    }
  }

  // --------------------------------------------------
  // Generate AI draft
  // --------------------------------------------------

  async function handleGenerateDraft() {
    if (
      draftLoading ||
      sending ||
      disabled ||
      typeof onGenerateDraft !== "function"
    ) {
      return;
    }

    try {
      setError("");

      await onGenerateDraft();
    } catch (err) {
      setError(
        err?.message ||
          "Unable to generate a draft reply. Please try again.",
      );
    }
  }

  return (
    <section className="border-t bg-white px-6 py-5">
      <form onSubmit={handleSubmit}>
        {/* --------------------------------------------------
            Header
        -------------------------------------------------- */}

        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-gray-900">
            Reply
          </h2>

          <button
            type="button"
            onClick={handleGenerateDraft}
            disabled={
              draftLoading ||
              sending ||
              disabled
            }
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {draftLoading
              ? "Generating..."
              : "Draft with AI"}
          </button>
        </div>

        {/* --------------------------------------------------
            Textarea
        -------------------------------------------------- */}

        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Write your reply..."
          rows={5}
          disabled={sending || disabled}
          className="w-full resize-y rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
        />

        {/* --------------------------------------------------
            Footer
        -------------------------------------------------- */}

        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-h-5">
            {error && (
              <p className="text-sm text-red-600">
                {error}
              </p>
            )}

            {!error && draftError && (
              <p className="text-sm text-red-600">
                {draftError}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={
              sending ||
              disabled ||
              !body.trim()
            }
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending ? "Sending..." : "Send Reply"}
          </button>
        </div>
      </form>
    </section>
  );
}

export default ReplyBox;