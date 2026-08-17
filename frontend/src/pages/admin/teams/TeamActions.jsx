// frontend/src/pages/admin/teams/TeamActions.jsx

import { useNavigate } from 'react-router';

function TeamActions({
  teamId,
  status,
  loading,
  onReview,
  onEdit,
  onDelete,
}) {
  const navigate = useNavigate();

  const normalizedStatus =
    String(status).toLowerCase();

  function handleEdit() {
    if (!teamId || loading) {
      return;
    }

    /*
     * Keep onEdit available for the parent if it needs
     * to perform any additional logic before navigation.
     */
    if (onEdit) {
      onEdit(teamId);
    }

    navigate(`/admin/teams/${teamId}/edit`);
  }

  /*
   * Pending teams:
   * Only review actions are shown.
   */
  if (normalizedStatus === 'pending') {
    return (
      <div className="flex items-center gap-2">

        {/* Approve */}
        <button
          type="button"
          disabled={loading}
          onClick={() =>
            onReview(teamId, 'approved')
          }
          className="rounded-md border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 transition hover:border-green-300 hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Approve
        </button>

        {/* Reject */}
        <button
          type="button"
          disabled={loading}
          onClick={() =>
            onReview(teamId, 'rejected')
          }
          className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Reject
        </button>

      </div>
    );
  }

  /*
   * Approved teams:
   * Management actions are shown.
   */
  if (normalizedStatus === 'approved') {
    return (
      <div className="flex items-center gap-2">

        {/* Edit */}
        <button
          type="button"
          disabled={loading}
          onClick={handleEdit}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Edit
        </button>

        {/* Delete */}
        <button
          type="button"
          disabled={loading}
          onClick={() => onDelete(teamId)}
          className="rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Delete
        </button>

      </div>
    );
  }

  /*
   * Rejected / unknown status:
   * Only delete is available.
   */
  return (
    <div className="flex items-center gap-2">

      <button
        type="button"
        disabled={loading}
        onClick={() => onDelete(teamId)}
        className="rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Delete
      </button>

    </div>
  );
}

export default TeamActions;