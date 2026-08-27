import { useEffect, useState } from "react";
import {
  useNavigate,
  useParams,
} from "react-router";

import {
  managerGetTeam,
  managerGetTeamMembers,
  managerRemoveTeamMember,
} from "../../api/manager";


function ManagerTeamDetails() {
  const navigate = useNavigate();
  const { teamId } = useParams();

  const [team, setTeam] =
    useState(null);

  const [members, setMembers] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [removingUserId, setRemovingUserId] =
    useState(null);


  useEffect(() => {
    loadTeamData();
  }, [teamId]);


  async function loadTeamData() {
    try {
      setLoading(true);
      setError("");

      const [
        teamResponse,
        membersResponse,
      ] = await Promise.all([
        managerGetTeam(teamId),
        managerGetTeamMembers(teamId),
      ]);

      setTeam(
        teamResponse?.data || null
      );

      setMembers(
        membersResponse?.data || []
      );
    } catch (err) {
      console.error(
        "Failed to load team:",
        err
      );

      setError(
        err.message ||
          "Failed to load team."
      );
    } finally {
      setLoading(false);
    }
  }


  async function handleRemoveMember(
    userId
  ) {
    const confirmed =
      window.confirm(
        "Are you sure you want to remove this member from the team?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setRemovingUserId(userId);

      await managerRemoveTeamMember(
        teamId,
        userId
      );

      setMembers((currentMembers) =>
        currentMembers.filter(
          (member) =>
            member.user_id !== userId &&
            member.id !== userId
        )
      );
    } catch (err) {
      console.error(
        "Failed to remove member:",
        err
      );

      alert(
        err.message ||
          "Failed to remove team member."
      );
    } finally {
      setRemovingUserId(null);
    }
  }


  if (loading) {
    return (
      <div className="p-6">
        Loading team...
      </div>
    );
  }


  if (error) {
    return (
      <div className="p-6">
        <button
          type="button"
          onClick={() =>
            navigate("/manager/teams")
          }
          className="mb-4 text-sm text-blue-600 hover:underline"
        >
          ← Back to Teams
        </button>

        <p className="text-red-600">
          {error}
        </p>
      </div>
    );
  }


  if (!team) {
    return (
      <div className="p-6">
        <p className="text-gray-500">
          Team not found.
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
          navigate("/manager/teams")
        }
        className="mb-6 text-sm text-blue-600 hover:underline"
      >
        ← Back to Teams
      </button>


      {/* Team Header */}
      <div className="mb-6 rounded-xl bg-white p-6 shadow">

        <div className="flex items-start justify-between">

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {team.name}
            </h1>

            <div className="mt-3 space-y-1 text-sm text-gray-500">
              <p>
                Department:{" "}
                {team.department || "—"}
              </p>

              <p>
                Status:{" "}
                {team.status || "—"}
              </p>

              <p>
                Access:{" "}
                {team.is_open
                  ? "Open"
                  : "Private"}
              </p>
            </div>
          </div>


          <button
            type="button"
            onClick={() =>
              navigate(
                `/manager/teams/${teamId}/add-member`
              )
            }
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Add Member
          </button>

        </div>
      </div>


      {/* Team Members */}
      <div className="rounded-xl bg-white shadow">

        <div className="border-b border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-900">
            Team Members
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            {members.length} member
            {members.length !== 1
              ? "s"
              : ""}
          </p>
        </div>


        {members.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No team members found.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">

            {members.map((member) => {
              const userId =
                member.user_id ||
                member.id;

              return (
                <div
                  key={userId}
                  className="flex items-center justify-between p-5"
                >

                  <div>
                    <h3 className="font-medium text-gray-900">
                      {member.full_name ||
                        member.username ||
                        "Unknown User"}
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                      {member.email}
                    </p>

                    {member.role && (
                      <p className="mt-1 text-xs capitalize text-gray-400">
                        {member.role}
                      </p>
                    )}
                  </div>


                  <button
                    type="button"
                    disabled={
                      removingUserId ===
                      userId
                    }
                    onClick={() =>
                      handleRemoveMember(
                        userId
                      )
                    }
                    className="rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {removingUserId === userId
                      ? "Removing..."
                      : "Remove"}
                  </button>

                </div>
              );
            })}

          </div>
        )}

      </div>

    </div>
  );
}


export default ManagerTeamDetails;