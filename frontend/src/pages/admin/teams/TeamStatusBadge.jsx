// frontend/src/pages/admin/teams/TeamStatusBadge.jsx

function TeamStatusBadge({ status }) {
  const normalizedStatus =
    String(status).toLowerCase();

  let className =
    'bg-gray-100 text-gray-700';

  if (normalizedStatus === 'approved') {
    className =
      'bg-green-50 text-green-700';
  }

  if (normalizedStatus === 'rejected') {
    className =
      'bg-red-50 text-red-700';
  }

  if (normalizedStatus === 'pending') {
    className =
      'bg-yellow-50 text-yellow-700';
  }

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${className}`}
    >
      {status}
    </span>
  );
}

export default TeamStatusBadge;