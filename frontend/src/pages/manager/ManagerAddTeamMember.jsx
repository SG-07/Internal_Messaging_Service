import { useEffect, useMemo, useState } from "react";
import {
  useNavigate,
  useParams,
} from "react-router";

import {
  managerGetTeam,
  managerGetTeamMembers,
  managerGetDepartmentUsers,
  managerAddTeamMember,
} from "../../api/manager";


function ManagerAddTeamMember() {
  const navigate = useNavigate();
  const { teamId } = useParams();

  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [users, setUsers] = useState([]);

  const [selectedUserId, setSelectedUserId] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [adding, setAdding] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    loadData();
  }, [teamId]);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [
        teamResponse,
        membersResponse,
        usersResponse,
      ] = await Promise.all([
        managerGetTeam(teamId),
        managerGetTeamMembers(teamId),
        managerGetDepartmentUsers(),
      ]);

      setTeam(
        teamResponse?.data || null
      );

      setMembers(
        membersResponse?.data || []
      );

      setUsers(
        usersResponse?.data || []
      );
    } catch (err) {
      console.error(
        "Failed to load add-member data:",
        err
      );

      setError(
        err.message ||
          "Failed to load users."
      );
    } finally {
      setLoading(false);
    }
  }


  /*
   * IDs of users already in the team.
   *
   * Your backend may return either:
   *   member.user_id
   * or
   *   member.id
   */
  const existingMemberIds = useMemo(() => {
    return new Set(
      members.map(
        (member) =>
          member.user_id || member.id
      )
    );
  }, [members]);


  /*
   * Only show department users who
   * are not already team members.
   */
  const availableUsers = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return users.filter((user) => {
      const userId =
        user.id || user.user_id;

      if (existingMemberIds.has(userId)) {
        return false;
      }

      if (!query) {
        return true;
      }

      const name =
        user.full_name || "";

      const username =
        user.username || "";

      const email =
        user.email || "";

      return (
        name.toLowerCase().includes(query) ||
        username.toLowerCase().includes(query) ||
        email.toLowerCase().includes(query)
      );
    });
  }, [
    users,
    members,
    existingMemberIds,
    search,
  ]);


  async function handleAddMember() {
    if (!selectedUserId) {
      return;
    }

    try {
      setAdding(true);
      setError("");

      await managerAddTeamMember(
        teamId,
        selectedUserId
      );

      navigate(
        `/manager/teams/${teamId}`
      );
    } catch (err) {
      console.error(
        "Failed to add team member:",
        err
      );

      setError(
        err.message ||
          "Failed to add team member."
      );
    } finally {
      setAdding(false);
    }
  }


  if (loading) {
    return (
      <div className="p-6">
        Loading users...
      </div>
    );
  }


  if (error && !team) {
    return (
      <div className="p-6">
        <button
          type="button"
          onClick={() =>
            navigate(
              `/manager/teams/${teamId}`
            )
          }
          className="mb-4 text-sm text-blue-600 hover:underline"
        >
          ← Back to Team
        </button>

        <p className="text-red-600">
          {error}
        </p>
      </div>
    );
  }


  return (
    <div className="p-6">

      {/* Back */}
      <button
        type="button"
        onClick={() =>
          navigate(
            `/manager/teams/${teamId}`
          )
        }
        className="mb-6 text-sm text-blue-600 hover:underline"
      >
        ← Back to Team
      </button>


      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Add Team Member
        </h1>

        {team && (
          <p className="mt-1 text-sm text-gray-500">
            Add a member to{" "}
            <span className="font-medium text-gray-700">
              {team.name}
            </span>
          </p>
        )}
      </div>


      {/* Form */}
      <div className="max-w-2xl rounded-xl bg-white p-6 shadow">

        {/* Search */}
        <div className="mb-5">
          <label
            htmlFor="user-search"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Search users
          </label>

          <input
            id="user-search"
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search by name, username or email"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>


        {/* User selection */}
        <div className="mb-6">
          <label
            htmlFor="team-user"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Select user
          </label>

          <select
            id="team-user"
            value={selectedUserId}
            onChange={(event) =>
              setSelectedUserId(
                event.target.value
              )
            }
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="">
              Select a user
            </option>

            {availableUsers.map((user) => {
              const userId =
                user.id || user.user_id;

              return (
                <option
                  key={userId}
                  value={userId}
                >
                  {user.full_name ||
                    user.username ||
                    "Unknown User"}
                  {user.email
                    ? ` — ${user.email}`
                    : ""}
                </option>
              );
            })}
          </select>
        </div>


        {/* No users */}
        {availableUsers.length === 0 && (
          <div className="mb-6 rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
            No eligible users found.
          </div>
        )}


        {/* Error */}
        {error && (
          <div className="mb-5 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}


        {/* Actions */}
        <div className="flex justify-end gap-3">

          <button
            type="button"
            onClick={() =>
              navigate(
                `/manager/teams/${teamId}`
              )
            }
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={
              !selectedUserId || adding
            }
            onClick={handleAddMember}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {adding
              ? "Adding..."
              : "Add Member"}
          </button>

        </div>

      </div>
    </div>
  );
}


export default ManagerAddTeamMember;