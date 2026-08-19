import { useState } from 'react';

const ACTION_STATUSES = {
  PENDING: {
    label: 'Pending',
    description: 'No action has been taken yet.',
  },

  WILL_DO: {
    label: 'Will Do',
    description:
      'The recipient has committed to completing the action.',
  },

  DONE: {
    label: 'Done',
    description:
      'The requested action has been completed.',
  },

  MORE_INFO: {
    label: 'More Information',
    description:
      'More information is required before the action can proceed.',
  },

  REJECTED: {
    label: 'Rejected',
    description:
      'The requested action has been rejected.',
  },
};

function ActionSection({
  status = 'PENDING',
  canRespond,
  onStatusChange,
}) {
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  const [selectedStatus, setSelectedStatus] =
    useState(null);

  const [comment, setComment] = useState('');

  const currentStatus =
    ACTION_STATUSES[status] ||
    ACTION_STATUSES.PENDING;

  const selectedStatusInfo =
    selectedStatus
      ? ACTION_STATUSES[selectedStatus]
      : null;

  const commentRequired =
    selectedStatus === 'REJECTED' ||
    selectedStatus === 'MORE_INFO';

  function openStatusForm(nextStatus) {
    if (
      !canRespond ||
      updating ||
      nextStatus === status
    ) {
      return;
    }

    setError('');
    setSelectedStatus(nextStatus);
    setComment('');
  }

  function cancelStatusChange() {
    if (updating) {
      return;
    }

    setSelectedStatus(null);
    setComment('');
    setError('');
  }

  async function handleStatusChange() {
    if (
      !canRespond ||
      updating ||
      !selectedStatus
    ) {
      return;
    }

    const trimmedComment = comment.trim();

    if (commentRequired && !trimmedComment) {
      setError(
        selectedStatus === 'MORE_INFO'
          ? 'Please specify what information is required.'
          : 'Please provide a reason for rejecting this action.'
      );

      return;
    }

    try {
      setUpdating(true);
      setError('');

      await onStatusChange(
        selectedStatus,
        trimmedComment
      );

      setSelectedStatus(null);
      setComment('');
    } catch (err) {
      setError(
        err.message ||
          'Unable to update the action status. Please try again.'
      );
    } finally {
      setUpdating(false);
    }
  }

  return (
    <section className="mx-6 mb-6 rounded-xl border border-amber-200 bg-amber-50 p-5">

      {/* Header + Current Status */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
            Action Required
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

        {/* Action Buttons */}

        {canRespond && !selectedStatus && (
          <div className="flex flex-wrap gap-2">

            <button
              type="button"
              disabled={updating}
              onClick={() =>
                openStatusForm('WILL_DO')
              }
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Will Do
            </button>

            <button
              type="button"
              disabled={updating}
              onClick={() =>
                openStatusForm('DONE')
              }
              className="rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Done
            </button>

            <button
              type="button"
              disabled={updating}
              onClick={() =>
                openStatusForm('MORE_INFO')
              }
              className="rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Need More Information
            </button>

            <button
              type="button"
              disabled={updating}
              onClick={() =>
                openStatusForm('REJECTED')
              }
              className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Reject
            </button>

          </div>
        )}
      </div>

      {/* Status Confirmation / Comment Form */}

      {selectedStatus && canRespond && (
        <div className="mt-5 rounded-xl border border-amber-200 bg-white p-4">

          <div>
            <p className="text-sm font-semibold text-gray-900">
              Change action status to{' '}
              <span className="text-amber-700">
                {selectedStatusInfo?.label}
              </span>
              ?
            </p>

            <p className="mt-1 text-xs text-gray-500">
              {selectedStatusInfo?.description}
            </p>
          </div>

          {/* Comment */}

          <div className="mt-4">
            <label
              htmlFor="action-comment"
              className="block text-sm font-medium text-gray-700"
            >
              {selectedStatus === 'MORE_INFO'
                ? 'Information Required'
                : selectedStatus === 'REJECTED'
                ? 'Reason for Rejection'
                : 'Comment'}

              {commentRequired
                ? ' *'
                : ' (optional)'}
            </label>

            <textarea
              id="action-comment"
              value={comment}
              onChange={(event) =>
                setComment(event.target.value)
              }
              disabled={updating}
              rows={4}
              placeholder={
                selectedStatus === 'MORE_INFO'
                  ? 'Specify what information is required before this action can proceed...'
                  : selectedStatus === 'REJECTED'
                  ? 'Please explain why this action is being rejected...'
                  : 'Add a comment about this action...'
              }
              className="mt-2 w-full resize-y rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 disabled:cursor-not-allowed disabled:bg-gray-100"
            />
          </div>

          {/* Form Actions */}

          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">

            <button
              type="button"
              disabled={updating}
              onClick={cancelStatusChange}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={
                updating ||
                (commentRequired &&
                  !comment.trim())
              }
              onClick={handleStatusChange}
              className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {updating
                ? 'Updating...'
                : `Confirm ${selectedStatusInfo?.label}`}
            </button>

          </div>
        </div>
      )}

      {/* Updating */}

      {updating && (
        <p className="mt-3 text-xs text-gray-500">
          Updating action status...
        </p>
      )}

      {/* Error */}

      {error && (
        <p className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}

    </section>
  );
}

export default ActionSection;