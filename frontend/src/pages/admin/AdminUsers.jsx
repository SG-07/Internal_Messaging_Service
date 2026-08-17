import { useEffect, useState } from 'react';

import { getAdminUsers } from '../../api/admin';

function AdminUsers() {
  const [department, setDepartment] = useState('');

  const [users, setUsers] = useState([]);

  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadUsers() {
      const payload = {
        page,
        limit,
        ...(department && {
          department: department.trim(),
        }),
      };

      if (import.meta.env.DEV) {
        console.group('[AdminUsers] Fetch Users');
        console.log('Request payload:', payload);
        console.groupEnd();
      }

      try {
        setLoading(true);
        setError('');

        const response = await getAdminUsers(payload);

        if (import.meta.env.DEV) {
          console.group('[AdminUsers] Fetch Users Response');
          console.log('Request payload:', payload);
          console.log('Received response:', response);
          console.groupEnd();
        }

        /*
         * Handle common response structures.
         *
         * Adjust this once the exact backend
         * response structure is confirmed.
         */

        const responseUsers =
          response?.users ||
          response?.data?.users ||
          response?.data ||
          [];

        setUsers(
          Array.isArray(responseUsers)
            ? responseUsers
            : []
        );

        const pages =
          response?.totalPages ||
          response?.data?.totalPages ||
          response?.pagination?.totalPages ||
          response?.data?.pagination?.totalPages ||
          1;

        setTotalPages(Number(pages) || 1);
      } catch (err) {
        if (import.meta.env.DEV) {
          console.group('[AdminUsers] Fetch Users Error');
          console.log('Request payload:', payload);
          console.error('Error:', err);
          console.log('Error message:', err.message);
          console.groupEnd();
        }

        setUsers([]);

        setError(
          err.message ||
            'Unable to load users. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    }

    loadUsers();
  }, [page, limit, department]);

  function handleFilter(event) {
    setDepartment(event.target.value);
    setPage(1);
  }

  function handleClearFilter() {
    setDepartment('');
    setPage(1);
  }

  function handlePreviousPage() {
    if (page > 1) {
      setPage((currentPage) => currentPage - 1);
    }
  }

  function handleNextPage() {
    if (page < totalPages) {
      setPage((currentPage) => currentPage + 1);
    }
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
                  disabled={loading}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                />
              </div>

              {department && (
                <button
                  type="button"
                  onClick={handleClearFilter}
                  disabled={loading}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Clear
                </button>
              )}

            </div>

          </div>

          {/* Error */}
          {error && (
            <div className="border-b px-6 py-4">
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-sm text-red-700">
                  {error}
                </p>
              </div>
            </div>
          )}

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

                {/* Loading */}
                {loading && (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-6 py-16 text-center"
                    >
                      <p className="text-sm text-gray-500">
                        Loading users...
                      </p>
                    </td>
                  </tr>
                )}

                {/* Empty */}
                {!loading && users.length === 0 && (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-6 py-16 text-center"
                    >
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          No users found
                        </h3>

                        <p className="mt-2 text-sm text-gray-500">
                          {department
                            ? `No users found in ${department}.`
                            : 'There are no users to display.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}

                {/* Users */}
                {!loading &&
                  users.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b last:border-b-0 hover:bg-gray-50"
                    >

                      {/* User */}
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {user.full_name ||
                              user.username ||
                              '—'}
                          </p>

                          {user.username && (
                            <p className="mt-1 text-xs text-gray-500">
                              @{user.username}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {user.email || '—'}
                      </td>

                      {/* Role */}
                      <td className="px-6 py-4">
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium capitalize text-gray-700">
                          {user.role || '—'}
                        </span>
                      </td>

                      {/* Department */}
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {user.department || '—'}
                      </td>

                      {/* Manager */}
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {user.manager ||
                          user.manager_username ||
                          '—'}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        {user.is_active === false ? (
                          <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
                            Inactive
                          </span>
                        ) : (
                          <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                            Active
                          </span>
                        )}
                      </td>

                      {/* Actions */}
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

          {/* Pagination */}
          {!loading && users.length > 0 && (
            <div className="flex items-center justify-between border-t px-6 py-4">

              <p className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </p>

              <div className="flex items-center gap-2">

                <button
                  type="button"
                  onClick={handlePreviousPage}
                  disabled={page <= 1}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>

                <button
                  type="button"
                  onClick={handleNextPage}
                  disabled={page >= totalPages}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>

              </div>

            </div>
          )}

        </section>

      </main>

    </div>
  );
}

export default AdminUsers;