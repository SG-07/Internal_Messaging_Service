// frontend/src/pages/dashboard/Dashboard.jsx

function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="border-b bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            Internal Messaging Service
          </h1>

          <div className="text-sm text-gray-600">
            Welcome, User
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            Dashboard
          </h2>

          <p className="mt-2 text-gray-600">
            Welcome to your messaging dashboard.
          </p>
        </div>

        {/* Dummy Dashboard Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-white p-6 shadow">
            <p className="text-sm text-gray-500">
              Conversations
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              0
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow">
            <p className="text-sm text-gray-500">
              Unread Messages
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              0
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow">
            <p className="text-sm text-gray-500">
              Active Users
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              0
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow">
            <p className="text-sm text-gray-500">
              Notifications
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              0
            </p>
          </div>
        </div>

        {/* Dummy Sections */}
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="rounded-xl bg-white p-6 shadow">
            <h3 className="text-lg font-semibold text-gray-900">
              Recent Conversations
            </h3>

            <div className="mt-6 rounded-lg border border-dashed border-gray-300 p-8 text-center">
              <p className="text-sm text-gray-500">
                No conversations yet.
              </p>
            </div>
          </section>

          <section className="rounded-xl bg-white p-6 shadow">
            <h3 className="text-lg font-semibold text-gray-900">
              Recent Messages
            </h3>

            <div className="mt-6 rounded-lg border border-dashed border-gray-300 p-8 text-center">
              <p className="text-sm text-gray-500">
                No messages yet.
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
