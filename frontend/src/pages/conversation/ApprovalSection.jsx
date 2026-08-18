// frontend/src/pages/conversation/ApprovalSection.jsx

import { useState } from 'react';

const APPROVAL_STATUSES = {
  PENDING: {
    label: 'Pending',
    description: 'No approval decision has been made yet.',
  },
  APPROVED: {
    label: 'Approved',
    description: 'The request has been approved.',
  },
  REJECTED: {
    label: 'Rejected',
    description: 'The request has been rejected.',
  },
  MORE_INFO: {
    label: 'More Information',
    description:
      'More information has been requested before a decision can be made.',
  },
};

function ApprovalSection({
  status = 'PENDING',
  canRespond,
  onDecisionChange,
}) {
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  const [showCommentBox, setShowCommentBox] = useState(false);
  const [comment, setComment] = useState('');

  const currentStatus =
    APPROVAL_STATUSES[status] || APPROVAL_STATUSES.PENDING;

  async function handleDecisionChange(
    nextDecision,
    decisionComment = ''
  ) {
    if (
      !canRespond ||
      updating ||
      nextDecision === status
    ) {
      return;
    }

    try {
      setUpdating(true);
      setError('');

      await onDecisionChange(
        nextDecision,
        decisionComment
      );

      // Close comment box after successful update.
      setShowCommentBox(false);
      setComment('');
    } catch (err) {
      setError(
        err.message ||
          'Unable to update the approval status. Please try again.'
      );
    } finally {
      setUpdating(false);
    }
  }

  function handleMoreInfoClick() {
    if (!canRespond || updating) {
      return;
    }

    setError('');
    setShowCommentBox(true);
  }

  async function handleSubmitMoreInfo() {
    const trimmedComment = comment.trim();

    if (!trimmedComment) {
      setError(
        'Please specify what information is required.'
      );
      return;
    }

    await handleDecisionChange(
      'MORE_INFO',
      trimmedComment
    );
  }

  function handleCancelMoreInfo() {
    if (updating) {
      return;
    }

    setShowCommentBox(false);
    setComment('');
    setError('');
  }

  return (
    <section className="mx-6 mb-6 rounded-xl border border-purple-200 bg-purple-50 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-purple-700">
            Approval Required
          </p>

          <div className="mt-2 flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">
              Status:
            </span>

            <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-gray-900 shadow-sm">
              {currentStatus.label}
            </span>
          </div>

          <p className="mt-2 text-sm text-gray-600">
            {currentStatus.description}
          </p>
        </div>

        {canRespond && !showCommentBox && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={updating}
              onClick={() =>
                handleDecisionChange('APPROVED')
              }
              className="rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Approve
            </button>

            <button
              type="button"
              disabled={updating}
              onClick={() =>
                handleDecisionChange('REJECTED')
              }
              className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Reject
            </button>

            <button
              type="button"
              disabled={updating}
              onClick={handleMoreInfoClick}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              More Information
            </button>
          </div>
        )}
      </div>

      {/* More Information comment form */}

      {canRespond && showCommentBox && (
        <div className="mt-5 rounded-lg border border-purple-200 bg-white p-4">
          <label
            htmlFor="approval-more-info-comment"
            className="block text-sm font-medium text-gray-800"
          >
            What information is required?
          </label>

          <p className="mt-1 text-xs text-gray-500">
            Explain what the requester needs to provide before
            you can make an approval decision.
          </p>

          <textarea
            id="approval-more-info-comment"
            value={comment}
            onChange={(event) =>
              setComment(event.target.value)
            }
            disabled={updating}
            rows={4}
            placeholder="Example: Please attach the vendor quote and updated budget breakdown."
            className="mt-3 w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 disabled:cursor-not-allowed disabled:bg-gray-100"
          />

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={updating}
              onClick={handleSubmitMoreInfo}
              className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {updating
                ? 'Requesting...'
                : 'Request Information'}
            </button>

            <button
              type="button"
              disabled={updating}
              onClick={handleCancelMoreInfo}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {updating && (
        <p className="mt-3 text-xs text-gray-500">
          Updating approval status...
        </p>
      )}

      {error && (
        <p className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}
    </section>
  );
}

export default ApprovalSection;