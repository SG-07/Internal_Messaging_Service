// frontend/src/pages/conversation/ConversationInfo.jsx

import { useState } from 'react';

const PURPOSES = {
  information: {
    label: 'Information',
    description:
      'This conversation is intended to share information. No specific action is expected from the recipient.',
  },
  discussion: {
    label: 'Discussion',
    description:
      'This conversation is intended for discussion, feedback, or an ongoing exchange of ideas.',
  },
  action_required: {
    label: 'Action Required',
    description:
      'The recipient is expected to perform a specific action.',
  },
  approval_required: {
    label: 'Approval Required',
    description:
      'The recipient is expected to approve, reject, or request more information.',
  },
};

function ConversationInfo({ conversation }) {
  const [showPurpose, setShowPurpose] = useState(false);

  const {
    created_by,
    participants = [],
    created_at,
    updated_at,
    category,
  } = conversation || {};

  /*
   * Find the participant who created the conversation.
   *
   * Backend provides:
   *
   * created_by: "user-id"
   *
   * participants: [
   *   {
   *     id: "user-id",
   *     full_name: "...",
   *     email: "...",
   *     username: "..."
   *   }
   * ]
   */
  const creator = participants.find(
    (participant) =>
      participant.id === created_by
  );

  /*
   * The other participant is the participant
   * who did not create the conversation.
   *
   * This currently assumes a direct conversation
   * with two participants.
   */
  const otherParticipant = participants.find(
    (participant) =>
      participant.id !== created_by
  );

  const creatorName =
    creator?.full_name ||
    creator?.username ||
    'Unknown';

  const creatorEmail =
    creator?.email || '';

  const otherParticipantName =
    otherParticipant?.full_name ||
    otherParticipant?.username ||
    'Unknown';

  const otherParticipantEmail =
    otherParticipant?.email || '';

  const purpose =
    PURPOSES[category] || {
      label: 'General',
      description:
        'This conversation does not have a specific purpose configured.',
    };

  function formatDate(value) {
    if (!value) {
      return '—';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '—';
    }

    return date.toLocaleString();
  }

  return (
    <>
      <section className="border-b bg-white px-6 py-5">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

          {/* Created By */}
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Created By
            </p>

            <p className="mt-1 text-sm font-medium text-gray-900">
              {creatorName}
            </p>

            {creatorEmail && (
              <p className="mt-0.5 break-all text-xs text-gray-500">
                {creatorEmail}
              </p>
            )}
          </div>

          {/* Recipient / Other Participant */}
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Recipient
            </p>

            <p className="mt-1 text-sm font-medium text-gray-900">
              {otherParticipantName}
            </p>

            {otherParticipantEmail && (
              <p className="mt-0.5 break-all text-xs text-gray-500">
                {otherParticipantEmail}
              </p>
            )}
          </div>

          {/* Created */}
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Created
            </p>

            <p className="mt-1 text-sm text-gray-900">
              {formatDate(created_at)}
            </p>
          </div>

          {/* Last Activity */}
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Last Activity
            </p>

            <p className="mt-1 text-sm text-gray-900">
              {formatDate(updated_at)}
            </p>
          </div>

          {/* Conversation Type */}
          <div className="sm:col-span-2">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Conversation Type
            </p>

            <div className="mt-1 flex items-center gap-2">
              <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
                {purpose.label}
              </span>

              <button
                type="button"
                onClick={() => setShowPurpose(true)}
                className="flex h-6 w-6 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                aria-label={`Information about ${purpose.label}`}
                title={`About ${purpose.label}`}
              >
                <span className="text-xs font-bold">
                  i
                </span>
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* Purpose Modal */}
      {showPurpose && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="purpose-modal-title"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setShowPurpose(false);
            }
          }}
        >
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">

            <div className="flex items-start justify-between gap-4">

              <div>
                <h2
                  id="purpose-modal-title"
                  className="text-lg font-semibold text-gray-900"
                >
                  {purpose.label}
                </h2>

                <p className="mt-3 text-sm leading-6 text-gray-600">
                  {purpose.description}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowPurpose(false)
                }
                className="rounded-lg p-1 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                aria-label="Close"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() =>
                  setShowPurpose(false)
                }
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}

export default ConversationInfo;