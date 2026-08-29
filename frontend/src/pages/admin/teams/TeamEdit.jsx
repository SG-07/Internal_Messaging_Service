// frontend/src/pages/admin/teams/TeamEdit.jsx

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

import {
  getAdminTeam,
  updateAdminTeam,
  removeTeamMember,
  // toggleAdminTeam,
} from "../../../api/admin";

import DashboardLayout from "../../dashboard/DashboardLayout";
import AddTeamMemberModal from "./AddTeamMemberModal";

function TeamEdit() {
  const { teamId } = useParams();
  const navigate = useNavigate();

  const [team, setTeam] = useState(null);

  const [addMemberOpen, setAddMemberOpen] =
    useState(false);

  const [managerId, setManagerId] = useState("");

  const [loading, setLoading] = useState(true);
  const [savingManager, setSavingManager] =
    useState(false);

  const [memberActionLoading, setMemberActionLoading] =
    useState(false);

  const [pauseLoading, setPauseLoading] =
    useState(false);

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

        setManagerId(
          responseTeam.manager_id ||
            responseTeam.manager?.id ||
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
  // UPDATE MANAGER
  // ============================================================

  async function handleManagerChange(event) {
    const newManagerId =
      event.target.value;

    setManagerId(newManagerId);

    if (!teamId || savingManager) {
      return;
    }

    const previousManagerId =
      team?.manager_id ||
      team?.manager?.id ||
      "";

    if (newManagerId === previousManagerId) {
      return;
    }

    try {
      setSavingManager(true);
      setError("");
      setSuccess("");

      const payload = {
        manager_id: newManagerId || null,
      };

      if (import.meta.env.DEV) {
        console.group(
          "[TeamEdit] Update Manager"
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

      const response =
        await updateAdminTeam(
          teamId,
          payload
        );

      if (import.meta.env.DEV) {
        console.group(
          "[TeamEdit] Update Manager Response"
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
       * Prefer the updated team returned by the API.
       */
      const updatedTeam =
        response?.data?.data ||
        response?.data?.team ||
        response?.team ||
        response?.data ||
        null;

      if (
        updatedTeam &&
        typeof updatedTeam === "object"
      ) {
        setTeam(updatedTeam);

        setManagerId(
          updatedTeam.manager_id ||
            updatedTeam.manager?.id ||
            ""
        );
      } else {
        setTeam(
          (currentTeam) => ({
            ...(currentTeam || {}),
            manager_id:
              newManagerId || null,
          })
        );
      }

      setSuccess(
        "Team manager updated successfully."
      );

    } catch (err) {
      /*
       * Restore previous manager if API fails.
       */
      setManagerId(previousManagerId);

      if (import.meta.env.DEV) {
        console.group(
          "[TeamEdit] Update Manager Error"
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
          "Unable to update team manager. Please try again."
      );
    } finally {
      setSavingManager(false);
    }
  }

  // ============================================================
  // MEMBER ADDED
  // ============================================================

  function handleMemberAdded(
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

        const updatedMembers = [
          ...currentMembers,
          newMember,
        ];

        return {
          ...currentTeam,
          members: updatedMembers,
          total_members:
            updatedMembers.length,
        };
      }
    );

    setSuccess(
      `${
        user?.full_name ||
        user?.username ||
        user?.email ||
        "User"
      } was added to the team.`
    );

    setAddMemberOpen(false);
  }

  // ============================================================
  // REMOVE MEMBER
  // ============================================================

  async function handleRemoveMember(member) {
    const memberId =
      member?.id ||
      member?.user_id;

    if (
      !teamId ||
      !memberId ||
      memberActionLoading
    ) {
      return;
    }

    /*
     * Prevent removing the current manager through
     * the normal member removal action.
     */
    const currentManagerId =
      team?.manager_id ||
      team?.manager?.id;

    if (
      currentManagerId &&
      String(currentManagerId) ===
        String(memberId)
    ) {
      setError(
        "The team manager cannot be removed. Change the manager first."
      );

      setSuccess("");

      return;
    }

    const memberName =
      member?.full_name ||
      member?.username ||
      member?.email ||
      "this member";

    const confirmed =
      window.confirm(
        `Are you sure you want to remove ${memberName} from this team?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setMemberActionLoading(true);
      setError("");
      setSuccess("");

      const payload = {
        teamId,
        userId: memberId,
      };

      if (import.meta.env.DEV) {
        console.group(
          "[TeamEdit] Remove Team Member"
        );

        console.log(
          "Request payload:",
          payload
        );

        console.groupEnd();
      }

      const response =
        await removeTeamMember(
          teamId,
          memberId
        );

      if (import.meta.env.DEV) {
        console.group(
          "[TeamEdit] Remove Team Member Response"
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

          const updatedMembers =
            currentMembers.filter(
              (currentMember) =>
                String(
                  currentMember?.id ||
                    currentMember?.user_id
                ) !==
                String(memberId)
            );

          return {
            ...currentTeam,
            members: updatedMembers,
            total_members:
              updatedMembers.length,
          };
        }
      );

      setSuccess(
        `${memberName} was removed from the team.`
      );

    } catch (err) {
      if (import.meta.env.DEV) {
        console.group(
          "[TeamEdit] Remove Team Member Error"
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
          "Unable to remove team member. Please try again."
      );
    } finally {
      setMemberActionLoading(false);
    }
  }

  // ============================================================
  // PAUSE / RESUME TEAM
  // ============================================================

  async function handleToggleTeam() {
    if (
      !teamId ||
      !team ||
      pauseLoading
    ) {
      return;
    }

    const currentlyOpen =
      Boolean(team.is_open);

    const action =
      currentlyOpen
        ? "pause"
        : "resume";

    const confirmationMessage =
      currentlyOpen
        ? "Are you sure you want to pause this team? Team members will no longer be able to use the team while it is paused."
        : "Are you sure you want to resume this team?";

    const confirmed =
      window.confirm(
        confirmationMessage
      );

    if (!confirmed) {
      return;
    }

    try {
      setPauseLoading(true);
      setError("");
      setSuccess("");

      const payload = {
        is_open: !currentlyOpen,
      };

      if (import.meta.env.DEV) {
        console.group(
          "[TeamEdit] Toggle Team"
        );

        console.log(
          "Team ID:",
          teamId
        );

        console.log(
          "Action:",
          action
        );

        console.log(
          "Request payload:",
          payload
        );

        console.groupEnd();
      }

      // const response =
      //   await toggleAdminTeam(
      //     teamId,
      //     payload
      //   );

      if (import.meta.env.DEV) {
        console.group(
          "[TeamEdit] Toggle Team Response"
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

      const updatedTeam =
        response?.data?.data ||
        response?.data?.team ||
        response?.team ||
        response?.data ||
        null;

      if (
        updatedTeam &&
        typeof updatedTeam === "object"
      ) {
        setTeam(updatedTeam);

        setManagerId(
          updatedTeam.manager_id ||
            updatedTeam.manager?.id ||
            ""
        );
      } else {
        setTeam(
          (currentTeam) => ({
            ...(currentTeam || {}),
            is_open:
              !currentlyOpen,
          })
        );
      }

      setSuccess(
        currentlyOpen
          ? "Team paused successfully."
          : "Team resumed successfully."
      );

    } catch (err) {
      if (import.meta.env.DEV) {
        console.group(
          "[TeamEdit] Toggle Team Error"
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
          `Unable to ${action} the team. Please try again.`
      );
    } finally {
      setPauseLoading(false);
    }
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

  const department =
    team?.department ||
    "—";

  const status =
    team?.status ||
    team?.team_status ||
    "—";

  const isOpen =
    Boolean(team?.is_open);

  const manager =
    team?.manager || null;

  const managerName =
    manager?.full_name ||
    manager?.username ||
    manager?.email ||
    "No manager assigned";

  const members =
    Array.isArray(team?.members)
      ? team.members
      : [];

  const memberCount =
    team?.total_members ??
    members.length;

  const managerInitial =
    String(managerName)
      .charAt(0)
      .toUpperCase();

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

          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">

            <div>

              <div className="flex flex-wrap items-center gap-3">

                <h1 className="text-2xl font-semibold text-gray-900">
                  Manage Team
                </h1>

                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                    isOpen
                      ? "bg-green-50 text-green-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {isOpen
                    ? "Active"
                    : "Paused"}
                </span>

              </div>

              <p className="mt-1 text-sm text-gray-500">
                Manage the manager and members of{" "}
                <span className="font-medium text-gray-700">
                  {teamName}
                </span>
                .
              </p>

            </div>

            {/* Pause / Resume */}
            {/* <button
              type="button"
              onClick={handleToggleTeam}
              disabled={pauseLoading}
              className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                isOpen
                  ? "border border-orange-300 bg-white text-orange-700 hover:bg-orange-50"
                  : "bg-green-600 text-white hover:bg-green-700"
              }`}
            >
              {pauseLoading
                ? "Updating..."
                : isOpen
                  ? "Pause Team"
                  : "Resume Team"}
            </button> */}

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
            {/* TEAM INFORMATION */}
            {/* ================================================== */}

            <section className="overflow-hidden rounded-xl bg-white shadow">

              <div className="border-b px-6 py-5">

                <h2 className="text-lg font-semibold text-gray-900">
                  Team Information
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Basic team information.
                </p>

              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3">

                {/* Team */}
                <div className="border-b px-6 py-5 sm:border-b-0 sm:border-r">

                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Team
                  </p>

                  <p className="mt-2 text-sm font-semibold text-gray-900">
                    {teamName}
                  </p>

                </div>

                {/* Department */}
                <div className="border-b px-6 py-5 sm:border-b-0 sm:border-r">

                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Department
                  </p>

                  <p className="mt-2 text-sm font-semibold text-gray-900">
                    {department}
                  </p>

                </div>

                {/* Status */}
                <div className="px-6 py-5">

                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Status
                  </p>

                  <p className="mt-2 text-sm font-semibold capitalize text-gray-900">
                    {status}
                  </p>

                </div>

              </div>

            </section>

            {/* ================================================== */}
            {/* MANAGER */}
            {/* ================================================== */}

            <section className="overflow-hidden rounded-xl bg-white shadow">

              <div className="border-b px-6 py-5">

                <h2 className="text-lg font-semibold text-gray-900">
                  Team Manager
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Change the manager assigned to this team.
                </p>

              </div>

              <div className="px-6 py-6">

                <label
                  htmlFor="team-manager"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Manager
                </label>

                {manager ? (
                  <div className="mb-4 flex items-center gap-3">

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-700">
                      {managerInitial}
                    </div>

                    <div className="min-w-0">

                      <p className="truncate text-sm font-semibold text-gray-900">
                        {managerName}
                      </p>

                      {manager.email && (
                        <p className="mt-0.5 truncate text-xs text-gray-500">
                          {manager.email}
                        </p>
                      )}

                    </div>

                  </div>
                ) : (
                  <p className="mb-4 text-sm text-gray-500">
                    No manager is currently assigned.
                  </p>
                )}

                {/*
                 * IMPORTANT:
                 * This requires the backend to provide a list of
                 * eligible managers. If your current API does not
                 * return manager options, replace this select with
                 * your existing manager-selection component/modal.
                 */}

                <input
                  id="team-manager"
                  type="text"
                  value={managerId}
                  onChange={(event) =>
                    setManagerId(
                      event.target.value
                    )
                  }
                  disabled={savingManager}
                  placeholder="Enter manager user ID"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                />

                <p className="mt-2 text-xs text-gray-500">
                  Enter the ID of the new manager and use Save Manager.
                </p>

                <div className="mt-4 flex justify-end">

                  <button
                    type="button"
                    onClick={() =>
                      handleManagerChange({
                        target: {
                          value: managerId,
                        },
                      })
                    }
                    disabled={
                      savingManager ||
                      managerId ===
                        (team?.manager_id ||
                          team?.manager?.id ||
                          "")
                    }
                    className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {savingManager
                      ? "Saving..."
                      : "Save Manager"}
                  </button>

                </div>

              </div>

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

                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setSuccess("");
                    setAddMemberOpen(true);
                  }}
                  disabled={!isOpen}
                  className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="text-base leading-none">
                    +
                  </span>

                  Add Member
                </button>

              </div>

              {/* Members List */}
              <div>

                {members.length > 0 ? (

                  <div className="divide-y">

                    {members.map(
                      (member) => {

                        const memberId =
                          member.id ||
                          member.user_id;

                        const memberName =
                          member.full_name ||
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

                        const isManagerMember =
                          String(
                            memberId
                          ) ===
                          String(
                            team?.manager_id ||
                              team?.manager?.id
                          );

                        return (
                          <div
                            key={memberId}
                            className="flex items-center justify-between px-6 py-4 transition hover:bg-gray-50"
                          >

                            <div className="flex min-w-0 items-center gap-3">

                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-600">
                                {memberInitial}
                              </div>

                              <div className="min-w-0">

                                <div className="flex items-center gap-2">

                                  <p className="truncate text-sm font-medium text-gray-900">
                                    {memberName}
                                  </p>

                                  {isManagerMember && (
                                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                                      Manager
                                    </span>
                                  )}

                                </div>

                                <p className="mt-0.5 truncate text-sm text-gray-500">
                                  {memberEmail}
                                </p>

                              </div>

                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveMember(
                                  member
                                )
                              }
                              disabled={
                                !isOpen ||
                                memberActionLoading ||
                                isManagerMember
                              }
                              title={
                                isManagerMember
                                  ? "Change the manager before removing this member."
                                  : "Remove member"
                              }
                              className="ml-4 shrink-0 rounded-md px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              Remove
                            </button>

                          </div>
                        );
                      }
                    )}

                  </div>

                ) : (

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
                      disabled={!isOpen}
                      className="mt-4 text-sm font-semibold text-blue-600 transition hover:text-blue-700 hover:underline disabled:cursor-not-allowed disabled:opacity-40"
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
          existingMembers={members}
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
