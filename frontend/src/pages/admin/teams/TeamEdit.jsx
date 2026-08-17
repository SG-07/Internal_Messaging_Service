// frontend/src/pages/admin/teams/TeamEdit.jsx

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

import {
  getAdminTeam,
  updateAdminTeam,
} from "../../../api/admin";

import DashboardLayout from "../../dashboard/DashboardLayout";
import AddTeamMemberModal from "./AddTeamMemberModal";

function TeamEdit() {
  const { teamId } = useParams();
  const navigate = useNavigate();

  const [team, setTeam] = useState(null);
  const [addMemberOpen, setAddMemberOpen] =
    useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] =
    useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ============================================================
  // LOAD TEAM
  // ============================================================

  useEffect(() => {
    async function loadTeam() {
      if (!teamId) {
        setError("Team ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        setSuccess("");

        const response =
          await getAdminTeam(teamId);

        if (import.meta.env.DEV) {
          console.group(
            "[TeamEdit] Fetch Team Response"
          );

          console.log(
            "Team ID:",
            teamId
          );

          console.log(
            "Received response:",
            response
          );

          console.groupEnd();
        }

        /*
         * Support common API response structures.
         */
        const responseTeam =
          response?.data?.data ||
          response?.data?.team ||
          response?.team ||
          response?.data ||
          null;

        if (!responseTeam) {
          throw new Error(
            "Team information was not returned."
          );
        }

        setTeam(responseTeam);

        setName(
          responseTeam.name ||
            responseTeam.team_name ||
            ""
        );

        setDescription(
          responseTeam.description ||
            ""
        );
      } catch (err) {
        if (import.meta.env.DEV) {
          console.group(
            "[TeamEdit] Fetch Team Error"
          );

          console.error(
            "Error:",
            err
          );

          console.log(
            "Error message:",
            err.message
          );

          console.groupEnd();
        }

        setError(
          err.message ||
            "Unable to load team. Please try again."
        );
      } finally {
        setLoading(false);
      }
    }

    loadTeam();
  }, [teamId]);

  // ============================================================
  // UPDATE TEAM
  // ============================================================

  async function handleSubmit(event) {
    event.preventDefault();

    const trimmedName =
      name.trim();

    const trimmedDescription =
      description.trim();

    if (!trimmedName) {
      setError(
        "Team name is required."
      );

      setSuccess("");

      return;
    }

    if (!teamId || saving) {
      return;
    }

    const payload = {
      name: trimmedName,
      description: trimmedDescription,
    };

    if (import.meta.env.DEV) {
      console.group(
        "[TeamEdit] Update Team"
      );

      console.log(
        "Team ID:",
        teamId
      );

      console.log(
        "Request payload:",
        payload
      );

      console.groupEnd();
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response =
        await updateAdminTeam(
          teamId,
          payload
        );

      if (import.meta.env.DEV) {
        console.group(
          "[TeamEdit] Update Team Response"
        );

        console.log(
          "Team ID:",
          teamId
        );

        console.log(
          "Request payload:",
          payload
        );

        console.log(
          "Received response:",
          response
        );

        console.groupEnd();
      }

      /*
       * Update local team state.
       */
      setTeam(
        (currentTeam) => ({
          ...(currentTeam || {}),
          ...payload,
        })
      );

      setSuccess(
        "Team details updated successfully."
      );
    } catch (err) {
      if (import.meta.env.DEV) {
        console.group(
          "[TeamEdit] Update Team Error"
        );

        console.error(
          "Error:",
          err
        );

        console.log(
          "Error message:",
          err.message
        );

        console.groupEnd();
      }

      setError(
        err.message ||
          "Unable to update team. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  // ============================================================
  // MEMBER ADDED
  // ============================================================

  async function handleMemberAdded(
    response,
    user
  ) {
    const userId =
      user?.id ||
      user?.user_id;

    if (!userId) {
      return;
    }

    const newMember = {
      ...user,
      id: userId,
    };

    setTeam(
      (currentTeam) => {
        if (!currentTeam) {
          return currentTeam;
        }

        const currentMembers =
          Array.isArray(
            currentTeam.members
          )
            ? currentTeam.members
            : [];

        const alreadyExists =
          currentMembers.some(
            (member) =>
              String(
                member?.id ||
                  member?.user_id
              ) ===
              String(userId)
          );

        if (alreadyExists) {
          return currentTeam;
        }

        return {
          ...currentTeam,

          members: [
            ...currentMembers,
            newMember,
          ],

          member_count:
            currentMembers.length + 1,
        };
      }
    );

    setSuccess(
      `${
        user?.name ||
        user?.email ||
        "User"
      } was added to the team.`
    );

    /*
     * Close the modal after successful addition.
     */
    setAddMemberOpen(false);
  }

  // ============================================================
  // BACK
  // ============================================================

  function handleBack() {
    navigate("/admin/teams");
  }

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-100">

          <main className="mx-auto max-w-7xl px-6 py-6">

            <div className="rounded-xl bg-white px-6 py-16 text-center shadow">

              <p className="text-sm text-gray-500">
                Loading team...
              </p>

            </div>

          </main>

        </div>
      </DashboardLayout>
    );
  }

  // ============================================================
  // ERROR / TEAM NOT FOUND
  // ============================================================

  if (error && !team) {
    return (
      <DashboardLayout>

        <div className="min-h-screen bg-gray-100">

          <main className="mx-auto max-w-7xl px-6 py-6">

            <button
              type="button"
              onClick={handleBack}
              className="mb-4 text-sm font-medium text-gray-600 transition hover:text-gray-900 hover:underline"
            >
              ← Back to Teams
            </button>

            <section className="rounded-xl bg-white p-6 shadow">

              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">

                <p className="text-sm text-red-700">
                  {error}
                </p>

              </div>

            </section>

          </main>

        </div>

      </DashboardLayout>
    );
  }

  // ============================================================
  // TEAM DATA
  // ============================================================

  const teamName =
    team?.name ||
    team?.team_name ||
    "Team";

  const status =
    team?.status ||
    team?.team_status ||
    "—";

  const manager =
    team?.manager ||
    team?.manager_name ||
    team?.manager_username ||
    team?.manager_email ||
    "—";

  const members =
    Array.isArray(team?.members)
      ? team.members
      : [];

  const memberCount =
    members.length ||
    team?.member_count ||
    0;

  const managerInitial =
    manager !== "—"
      ? String(manager)
          .charAt(0)
          .toUpperCase()
      : "—";

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <DashboardLayout>

      <div className="min-h-screen bg-gray-100">

        <main className="mx-auto max-w-5xl px-6 py-6 pb-8">

          {/* ================================================== */}
          {/* BACK */}
          {/* ================================================== */}

          <button
            type="button"
            onClick={handleBack}
            className="mb-5 text-sm font-medium text-gray-600 transition hover:text-gray-900 hover:underline"
          >
            ← Back to Teams
          </button>

          {/* ================================================== */}
          {/* PAGE HEADER */}
          {/* ================================================== */}

          <div className="mb-6">

            <div className="flex flex-wrap items-center gap-3">

              <h1 className="text-2xl font-semibold text-gray-900">
                Manage Team
              </h1>

              <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold capitalize text-green-700">
                {status}
              </span>

            </div>

            <p className="mt-1 text-sm text-gray-500">
              Manage the details and members of{" "}
              <span className="font-medium text-gray-700">
                {teamName}
              </span>
              .
            </p>

          </div>

          {/* ================================================== */}
          {/* ERROR */}
          {/* ================================================== */}

          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3">

              <p className="text-sm text-red-700">
                {error}
              </p>

            </div>
          )}

          {/* ================================================== */}
          {/* SUCCESS */}
          {/* ================================================== */}

          {success && (
            <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3">

              <p className="text-sm text-green-700">
                {success}
              </p>

            </div>
          )}

          <div className="space-y-6">

            {/* ================================================== */}
            {/* TEAM DETAILS */}
            {/* ================================================== */}

            <section className="overflow-hidden rounded-xl bg-white shadow">

              {/* Header */}
              <div className="border-b px-6 py-5">

                <h2 className="text-lg font-semibold text-gray-900">
                  Team Details
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  View and update the team's basic information.
                </p>

              </div>

              {/* ================================================== */}
              {/* MANAGER / MEMBERS */}
              {/* ================================================== */}

              <div className="grid grid-cols-1 border-b sm:grid-cols-2">

                {/* Manager */}
                <div className="border-b px-6 py-5 sm:border-b-0 sm:border-r">

                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Manager
                  </p>

                  <div className="mt-3 flex items-center gap-3">

                    {/* Manager Avatar */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-700">
                      {managerInitial}
                    </div>

                    {/* Manager Details */}
                    <div className="min-w-0">

                      <p className="truncate text-sm font-semibold text-gray-900">
                        {manager}
                      </p>

                      <p className="mt-0.5 text-xs text-gray-500">
                        Team manager
                      </p>

                    </div>

                  </div>

                </div>

                {/* Members */}
                <div className="px-6 py-5">

                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Members
                  </p>

                  <div className="mt-3 flex items-center gap-3">

                    {/* Member Count */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-700">
                      {memberCount}
                    </div>

                    {/* Member Details */}
                    <div>

                      <p className="text-sm font-semibold text-gray-900">
                        {memberCount === 1
                          ? "1 member"
                          : `${memberCount} members`}
                      </p>

                      <p className="mt-0.5 text-xs text-gray-500">
                        Users assigned to this team
                      </p>

                    </div>

                  </div>

                </div>

              </div>

              {/* ================================================== */}
              {/* EDITABLE DETAILS */}
              {/* ================================================== */}

              <form onSubmit={handleSubmit}>

                <div className="space-y-5 px-6 py-6">

                  {/* Team Name */}
                  <div>

                    <label
                      htmlFor="team-name"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      Team name
                    </label>

                    <input
                      id="team-name"
                      type="text"
                      value={name}
                      onChange={(event) =>
                        setName(
                          event.target.value
                        )
                      }
                      disabled={saving}
                      placeholder="Enter team name"
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                    />

                  </div>

                  {/* Description */}
                  <div>

                    <label
                      htmlFor="team-description"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      Description
                    </label>

                    <textarea
                      id="team-description"
                      value={description}
                      onChange={(event) =>
                        setDescription(
                          event.target.value
                        )
                      }
                      disabled={saving}
                      rows={4}
                      placeholder="Describe the purpose of this team"
                      className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                    />

                  </div>

                </div>

                {/* Form Footer */}
                <div className="flex justify-end border-t bg-gray-50 px-6 py-4">

                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving
                      ? "Saving..."
                      : "Save Changes"}
                  </button>

                </div>

              </form>

            </section>

            {/* ================================================== */}
            {/* TEAM MEMBERS */}
            {/* ================================================== */}

            <section className="overflow-hidden rounded-xl bg-white shadow">

              {/* Members Header */}
              <div className="flex items-center justify-between border-b px-6 py-5">

                <div>

                  <div className="flex items-center gap-2">

                    <h2 className="text-lg font-semibold text-gray-900">
                      Team Members
                    </h2>

                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                      {memberCount}
                    </span>

                  </div>

                  <p className="mt-1 text-sm text-gray-500">
                    Manage the users assigned to this team.
                  </p>

                </div>

                {/* Add Member */}
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setSuccess("");
                    setAddMemberOpen(true);
                  }}
                  className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <span className="text-base leading-none">
                    +
                  </span>

                  Add Member
                </button>

              </div>

              {/* ================================================== */}
              {/* MEMBERS LIST */}
              {/* ================================================== */}

              <div>

                {Array.isArray(members) &&
                members.length > 0 ? (

                  <div className="divide-y">

                    {members.map(
                      (member) => {

                        const memberId =
                          member.id ||
                          member.user_id;

                        const memberName =
                          member.name ||
                          member.username ||
                          "Unknown User";

                        const memberEmail =
                          member.email ||
                          "—";

                        const memberInitial =
                          String(
                            memberName
                          )
                            .charAt(0)
                            .toUpperCase();

                        return (
                          <div
                            key={memberId}
                            className="flex items-center justify-between px-6 py-4 transition hover:bg-gray-50"
                          >

                            {/* User */}
                            <div className="flex min-w-0 items-center gap-3">

                              {/* Avatar */}
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-600">
                                {memberInitial}
                              </div>

                              {/* User Information */}
                              <div className="min-w-0">

                                <p className="truncate text-sm font-medium text-gray-900">
                                  {memberName}
                                </p>

                                <p className="mt-0.5 truncate text-sm text-gray-500">
                                  {memberEmail}
                                </p>

                              </div>

                            </div>

                            {/* Remove */}
                            <button
                              type="button"
                              className="ml-4 shrink-0 rounded-md px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50 hover:text-red-700"
                            >
                              Remove
                            </button>

                          </div>
                        );
                      }
                    )}

                  </div>

                ) : (

                  /* ================================================== */
                  /* EMPTY STATE */
                  /* ================================================== */

                  <div className="px-6 py-12 text-center">

                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                      <span className="text-lg text-gray-400">
                        👥
                      </span>
                    </div>

                    <h3 className="mt-4 text-sm font-semibold text-gray-900">
                      No members yet
                    </h3>

                    <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500">
                      Add users to this team using the Add Member button above.
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        setError("");
                        setSuccess("");
                        setAddMemberOpen(true);
                      }}
                      className="mt-4 text-sm font-semibold text-blue-600 transition hover:text-blue-700 hover:underline"
                    >
                      Add the first member
                    </button>

                  </div>

                )}

              </div>

            </section>

          </div>

        </main>

        {/* ================================================== */}
        {/* ADD MEMBER MODAL */}
        {/* ================================================== */}

        <AddTeamMemberModal
          open={addMemberOpen}
          teamId={teamId}
          existingMembers={
            Array.isArray(members)
              ? members
              : []
          }
          onClose={() =>
            setAddMemberOpen(false)
          }
          onAdded={handleMemberAdded}
        />

      </div>

    </DashboardLayout>
  );
}

export default TeamEdit;