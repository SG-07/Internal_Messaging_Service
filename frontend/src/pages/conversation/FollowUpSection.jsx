// frontend/src/pages/conversation/FollowUpSection.jsx
function FollowUpSection({ followUpAfter, status }) {
  if (
    followUpAfter === null ||
    followUpAfter === undefined ||
    followUpAfter <= 0
  ) {
    return null;
  }

  function formatDuration(hours) {
    if (hours < 24) {
      return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
    }

    const days = hours / 24;

    if (Number.isInteger(days)) {
      return `${days} ${days === 1 ? 'day' : 'days'}`;
    }

    return `${hours} hours`;
  }

  return (
    <section className="mx-6 mb-6 rounded-xl border border-gray-200 bg-gray-50 p-5">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-gray-600 shadow-sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11a.75.75 0 00-1.5 0v3.25c0 .199.079.39.22.53l2 2a.75.75 0 101.06-1.06l-1.78-1.78V7z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Follow-up
          </p>

          <p className="mt-1 text-sm font-medium text-gray-900">
            Reminder: After {formatDuration(followUpAfter)}
          </p>

          <p className="mt-1 text-sm text-gray-600">
            Status:{' '}
            <span className="font-medium text-gray-700">
              {status || 'Waiting for response'}
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}

export default FollowUpSection;