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
    category,
  } = conversation || {};

  const creator = participants.find(
    (participant) =>
      participant.id === created_by
  );

  const creatorName =
    creator?.full_name ||
    creator?.username ||
    'Unknown';

  const creatorEmail = creator?.email || '';

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
      <section className="border-b border-gray-200 bg-gray-50 px-6 py-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

          {/* Created By */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Created By
            </p>

            <p className="mt-2 text-sm font-semibold text-gray-900">
              {creatorName}
            </p>

            {creatorEmail && (
              <p className="mt-1 break-all text-xs text-gray-500">
                {creatorEmail}
              </p>
            )}
          </div>

          {/* Conversation Type */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Conversation Type
            </p>

            <div className="mt-2 flex items-center gap-2">
              <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
                {purpose.label}
              </span>

              <button
                type="button"
                onClick={() => setShowPurpose(true)}
                className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-300 bg-white text-xs font-bold text-gray-500 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600"
                aria-label={`Information about ${purpose.label}`}
                title={`About ${purpose.label}`}
              >
                i
              </button>
            </div>
          </div>

          {/* Created */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Created
            </p>

            <p className="mt-2 text-sm font-medium text-gray-900">
              {formatDate(created_at)}
            </p>
          </div>

        </div>
      </section>

      {/* Purpose Modal */}
      {showPurpose && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 px-4 backdrop-blur-sm"
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
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">

            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Conversation Type
                </p>

                <h2
                  id="purpose-modal-title"
                  className="mt-1 text-xl font-semibold text-gray-900"
                >
                  {purpose.label}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setShowPurpose(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-xl leading-none text-gray-400 transition hover:bg-gray-100 hover:text-gray-900"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="px-6 py-5">
              <p className="text-sm leading-6 text-gray-600">
                {purpose.description}
              </p>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end border-t border-gray-200 bg-gray-50 px-6 py-4">
              <button
                type="button"
                onClick={() => setShowPurpose(false)}
                className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
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