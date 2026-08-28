import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import DashboardLayout from "../dashboard/DashboardLayout";
import { getManagerTeams } from "../../api/manager";

function ManagerTeams() {
  const navigate = useNavigate();

  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadTeams() {
      try {
        setLoading(true);
        setError("");

        const response = await getManagerTeams();

        setTeams(response?.data || []);
      } catch (error) {
        console.error("[Manager Teams] Load Error", error);

        setError(error.message || "Failed to load teams.");
      } finally {
        setLoading(false);
      }
    }

    loadTeams();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <p className="text-sm text-gray-500">Loading teams...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-white p-6 shadow">
        <h2 className="text-lg font-semibold text-gray-900">
          Unable to load teams
        </h2>

        <p className="mt-2 text-sm text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ======================================================
          HEADER
      ====================================================== */}

        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Teams</h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage teams assigned to you.
          </p>
        </div>

        {/* ======================================================
          EMPTY STATE
      ====================================================== */}

        {teams.length === 0 && (
          <div className="rounded-xl bg-white p-8 text-center shadow">
            <h2 className="text-lg font-semibold text-gray-900">
              No teams found
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              You currently do not manage any teams.
            </p>
          </div>
        )}

        {/* ======================================================
          TEAMS LIST
      ====================================================== */}

        {teams.length > 0 && (
          <div className="overflow-hidden rounded-xl bg-white shadow">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-6 py-4">Team</th>

                    <th className="px-6 py-4">Department</th>

                    <th className="px-6 py-4">Status</th>

                    <th className="px-6 py-4">Availability</th>

                    <th className="px-6 py-4">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {teams.map((team) => (
                    <tr
                      key={team.id}
                      className="border-b last:border-b-0 hover:bg-gray-50"
                    >
                      {/* Team */}

                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">
                          {team.name}
                        </div>

                        {team.manager?.full_name && (
                          <div className="mt-1 text-xs text-gray-500">
                            Manager: {team.manager.full_name}
                          </div>
                        )}
                      </td>

                      {/* Department */}

                      <td className="px-6 py-4 text-gray-600">
                        {team.department || "-"}
                      </td>

                      {/* Status */}

                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            team.status === "approved"
                              ? "bg-green-50 text-green-700"
                              : "bg-yellow-50 text-yellow-700"
                          }`}
                        >
                          {team.status || "-"}
                        </span>
                      </td>

                      {/* Availability */}

                      <td className="px-6 py-4">
                        <span
                          className={`text-sm font-medium ${
                            team.is_open ? "text-green-600" : "text-gray-500"
                          }`}
                        >
                          {team.is_open ? "Open" : "Closed"}
                        </span>
                      </td>

                      {/* Action */}

                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => navigate(`/manager/teams/${team.id}`)}
                          className="rounded-lg px-3 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-50"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default ManagerTeams;
