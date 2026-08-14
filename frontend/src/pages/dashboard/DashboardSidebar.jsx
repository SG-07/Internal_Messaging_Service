import { useLocation, useNavigate } from 'react-router';

function DashboardSidebar({ onCompose }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isInbox =
    location.pathname === '/dashboard';

  const isSent =
    location.pathname === '/dashboard/sent';

  const isAllMail =
    location.pathname === '/dashboard/all-mail';

  function getNavClass(active) {
    return `w-full rounded-lg px-4 py-3 text-left text-sm transition ${
      active
        ? 'bg-blue-50 font-semibold text-blue-700'
        : 'text-gray-700 hover:bg-gray-100'
    }`;
  }

  return (
    <aside className="flex min-h-[calc(100vh-130px)] w-56 shrink-0 flex-col rounded-xl bg-white p-4 shadow">

      {/* Compose */}
      <button
        type="button"
        onClick={onCompose}
        className="mb-6 w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
      >
        + Compose
      </button>

      {/* Navigation */}
      <nav className="space-y-1">

        {/* Inbox */}
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className={getNavClass(isInbox)}
        >
          Inbox
        </button>

        {/* Sent */}
        <button
          type="button"
          onClick={() => navigate('/dashboard/sent')}
          className={getNavClass(isSent)}
        >
          Sent
        </button>

        {/* All Mail */}
        <button
          type="button"
          onClick={() => navigate('/dashboard/all-mail')}
          className={getNavClass(isAllMail)}
        >
          All Mail
        </button>

      </nav>
    </aside>
  );
}

export default DashboardSidebar;