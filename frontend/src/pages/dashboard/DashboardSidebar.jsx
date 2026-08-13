function DashboardSidebar({ onCompose }) {
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
        <button
          type="button"
          className="w-full rounded-lg bg-blue-50 px-4 py-3 text-left text-sm font-semibold text-blue-700"
        >
          Inbox
        </button>

        <button
          type="button"
          className="w-full rounded-lg px-4 py-3 text-left text-sm text-gray-700 transition hover:bg-gray-100"
        >
          Sent
        </button>

        <button
          type="button"
          className="w-full rounded-lg px-4 py-3 text-left text-sm text-gray-700 transition hover:bg-gray-100"
        >
          All Mail
        </button>
      </nav>
    </aside>
  );
}

export default DashboardSidebar;