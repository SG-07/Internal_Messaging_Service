import { useState } from 'react';

function AdminUsers() {
  const [department, setDepartment] = useState('');

  // API integration will be added later.
  const [users] = useState([]);

  function handleFilter(event) {
    setDepartment(event.target.value);
  }

  function handleClearFilter() {
    setDepartment('');
  }

  return (
    <div className="min-h-screen bg-gray-100">

      <main className="mx-auto max-w-7xl px-6 py-6 pb-8">

        <section className="rounded-xl bg-white shadow">

          {/* Header */}
          <div className="border-b px-6 py-5">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Users
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Manage users, roles, managers, and account status.
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="border-b bg-gray-50 px-6 py-4">

            <div className="flex flex-wrap items-end gap-4">

              <div className="w-full max-w-xs">
                <label
                  htmlFor="department"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Department
                </label>

                <input
                  id="department"
                  type="text"
                  value={department}
                  onChange={handleFilter}
                  placeholder="e.g. Engineering"
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {department && (
                <button
                  type="button"
                  onClick={handleClearFilter}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                >
                  Clear
                </button>
              )}

            </div>

          </div>

          {/* Users table */}
          <div className="overflow-x-auto">

            <table className="w-full min-w-[900px]">

              <thead>
                <tr className="border-b bg-white text-left">

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    User
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Email
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Role
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Department
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Manager
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Status
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Actions
                  </th>

                </tr>
              </thead>

              <tbody>

                {users.length === 0 && (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-6 py-16 text-center"
                    >
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          No users to display
                        </h3>

                        <p className="mt-2 text-sm text-gray-500">
                          Users returned by the admin API will appear here.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}

                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b last:border-b-0 hover:bg-gray-50"
                  >

                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {user.full_name || user.username}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          @{user.username}
                        </p>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-700">
                      {user.email}
                    </td>

                    <td className="px-6 py-4">
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                        {user.role}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-700">
                      {user.department || '—'}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-700">
                      {user.manager || '—'}
                    </td>

                    <td className="px-6 py-4">
                      <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                        Active
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <button
                        type="button"
                        className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        Manage
                      </button>
                    </td>

                  </tr>
                ))}

              </tbody>

            </table>

          </div>

        </section>

      </main>

    </div>
  );
}

export default AdminUsers;