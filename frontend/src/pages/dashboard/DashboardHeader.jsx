function DashboardHeader() {
  return (
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
  );
}

export default DashboardHeader;