// frontend/src/pages/conversation/ReplyBox.jsx
import { useState } from 'react';

function ReplyBox({ onSendReply, disabled = false }) {
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();

    const trimmedBody = body.trim();

    if (!trimmedBody || sending || disabled) {
      return;
    }

    try {
      setSending(true);
      setError('');

      await onSendReply(trimmedBody);

      setBody('');
    } catch (err) {
      setError(
        err.message ||
          'Unable to send your reply. Please try again.'
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="border-t bg-white px-6 py-5">
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-gray-900">
            Reply
          </h2>
        </div>

        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Write your reply..."
          rows={5}
          disabled={sending || disabled}
          className="w-full resize-y rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
        />

        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {error && (
              <p className="text-sm text-red-600">
                {error}
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
            {sending ? 'Sending...' : 'Send Reply'}
          </button>
        </div>
      </form>
    </section>
  );
}

export default ReplyBox;