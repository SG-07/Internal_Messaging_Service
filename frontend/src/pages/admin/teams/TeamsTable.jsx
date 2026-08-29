// frontend/src/pages/admin/teams/TeamsTable.jsx

import TeamStatusBadge from "./TeamStatusBadge";
import TeamActions from "./TeamActions";

function TeamsTable({
  teams,
  loading,
  actionLoading,
  onReview,
  onEdit,
  onDelete,
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px]">
        <thead>
          <tr className="border-b bg-white text-left">
            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Team
            </th>

            {/* <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Description
            </th> */}

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
          {/* Loading */}
          {loading && (
            <tr>
              <td colSpan={6} className="px-6 py-16 text-center">
                <p className="text-sm text-gray-500">Loading teams...</p>
              </td>
            </tr>
          )}

          {/* Empty */}
          {!loading && teams.length === 0 && (
            <tr>
              <td colSpan={6} className="px-6 py-16 text-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  No teams found
                </h3>

                <p className="mt-2 text-sm text-gray-500">
                  There are no teams to display.
                </p>
              </td>
            </tr>
          )}

          {/* Teams */}
          {!loading &&
            teams.map((team) => {
              const teamId = team.id || team.team_id;

              const teamName = team.name || team.team_name || "—";

              const description = team.description || "—";

              const manager =
                team.manager?.full_name ||
                team.manager?.username ||
                team.manager_name ||
                team.manager_username ||
                "—";

              const members = team.members || team.member_count || 0;

              const status = team.status || team.team_status || "—";

              return (
                <tr
                  key={teamId}
                  className="border-b last:border-b-0 hover:bg-gray-50"
                >
                  {/* Team */}
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{teamName}</p>
                  </td>

                  {/* Description */}
                  {/* <td className="max-w-sm px-6 py-4 text-sm text-gray-700">
                    <p className="truncate">{description}</p>
                  </td> */}

                  {/* Manager */}
                  <td className="px-6 py-4 text-sm text-gray-700">{manager}</td>

                  {/* Members */}
                  <td className="px-6 py-4 text-sm text-gray-700">{members}</td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <TeamStatusBadge status={status} />
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <TeamActions
                      teamId={teamId}
                      status={status}
                      loading={actionLoading}
                      onReview={onReview}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
}

export default TeamsTable;
