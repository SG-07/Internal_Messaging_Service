// frontend/src/pages/conversation/ActionSection.jsx
import { useState } from 'react';

const ACTION_STATUSES = {
  PENDING: {
    label: 'Pending',
    description: 'No action has been taken yet.',
  },
  WILL_DO: {
    label: 'Will Do',
    description: 'The recipient has committed to completing the action.',
  },
  DONE: {
    label: 'Done',
    description: 'The requested action has been completed.',
  },
  REJECTED: {
    label: 'Rejected',
    description: 'The requested action has been rejected.',
  },
};

function ActionSection({
  status = 'PENDING',
  canRespond,
  onStatusChange,
}) {
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  const currentStatus =
    ACTION_STATUSES[status] || ACTION_STATUSES.PENDING;

  async function handleStatusChange(nextStatus) {
    if (!canRespond || updating || nextStatus === status) {
      return;
    }

    try {
      setUpdating(true);
      setError('');

      await onStatusChange(nextStatus);
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

        {canRespond && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={updating}
              onClick={() => handleStatusChange('WILL_DO')}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Will Do
            </button>

            <button
              type="button"
              disabled={updating}
              onClick={() => handleStatusChange('DONE')}
              className="rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Done
            </button>

            <button
              type="button"
              disabled={updating}
              onClick={() => handleStatusChange('REJECTED')}
              className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        )}
      </div>

      {updating && (
        <p className="mt-3 text-xs text-gray-500">
          Updating status...
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

export default ActionSection;