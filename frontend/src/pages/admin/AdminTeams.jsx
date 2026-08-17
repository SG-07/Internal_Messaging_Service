import { useState } from 'react';

function AdminTeams() {
  const [teams] = useState([]);

  return (
    <div className="min-h-screen bg-gray-100">

      <main className="mx-auto max-w-7xl px-6 py-6 pb-8">

        <section className="rounded-xl bg-white shadow">

          {/* Header */}
          <div className="flex items-center justify-between border-b px-6 py-5">

            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Teams
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Manage teams and team membership.
              </p>
            </div>

            <button
              type="button"
              className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              + Create Team
            </button>

          </div>

          {/* Teams */}
          <div className="overflow-x-auto">

            <table className="w-full min-w-[700px]">

              <thead>
                <tr className="border-b bg-white text-left">

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Team
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Manager
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Members
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

                {teams.length === 0 && (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-16 text-center"
                    >
                      <h3 className="text-lg font-semibold text-gray-900">
                        No teams to display
                      </h3>

                      <p className="mt-2 text-sm text-gray-500">
                        Teams returned by the admin API will appear here.
                      </p>
                    </td>
                  </tr>
                )}

                {teams.map((team) => (
                  <tr
                    key={team.id}
                    className="border-b last:border-b-0 hover:bg-gray-50"
                  >

                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">
                        {team.name}
                      </p>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-700">
                      {team.manager || '—'}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-700">
                      {team.member_count ?? 0}
                    </td>

                    <td className="px-6 py-4">
                      <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                        {team.status || 'Active'}
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

export default AdminTeams;