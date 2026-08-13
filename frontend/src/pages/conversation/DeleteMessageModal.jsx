// frontend/src/pages/conversation/DeleteMessageModal.jsx
import { useState } from 'react';

function DeleteMessageModal({
  message,
  onConfirm,
  onCancel,
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  if (!message) {
    return null;
  }

  async function handleConfirm() {
    if (deleting) {
      return;
    }

    try {
      setDeleting(true);
      setError('');

      await onConfirm(message);
    } catch (err) {
      setError(
        err.message ||
          'Unable to delete the message. Please try again.'
      );

      setDeleting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-message-title"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !deleting
        ) {
          onCancel();
        }
      }}
    >
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.721-1.36 3.486 0l6.58 11.71A1.75 1.75 0 0116.8 17.5H3.2a1.75 1.75 0 01-1.523-2.691l6.58-11.71zM10 7a.75.75 0 01.75.75v3.5a.75.75 0 11-1.5 0v-3.5A.75.75 0 0110 7zm0 6a1 1 0 100 2 1 1 0 000-2z"
                clipRule="evenodd"
              />
            </svg>
          </div>

          <div className="min-w-0">
            <h2
              id="delete-message-title"
              className="text-lg font-semibold text-gray-900"
            >
              Delete message?
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              This message will be removed from the conversation
              and marked as deleted. This action cannot be undone
              from the conversation view.
            </p>
          </div>
        </div>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={deleting}
            className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deleting ? 'Deleting...' : 'Delete Message'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteMessageModal;