// src/pages/teams/MyTeams.jsx
import DashboardLayout from "../dashboard/DashboardLayout";

import { useMyTeamsLogic } from "./MyTeamsLogic";

function MyTeams() {
  const {
    isManager,

    teams,
    pendingRequests,

    loading,
    error,

    showCreateTeam,
    teamName,
    creatingTeam,
    createError,
    createSuccess,

    setTeamName,

    handleOpenTeam,
    handleBack,
    handleRetry,

    handleOpenCreateTeam,
    handleCloseCreateTeam,
    handleCreateTeam,
  } = useMyTeamsLogic();

  /*
   * ============================================================
   * LOADING
   * ============================================================
   */

  if (loading) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="rounded-xl bg-white p-12 text-center shadow">
            <div className="mx-auto flex h-10 w-10 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
            </div>

            <p className="mt-4 text-sm text-gray-500">Loading your teams...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  /*
   * ============================================================
   * ERROR
   * ============================================================
   */

  if (error) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={handleBack}
            className="mb-6 text-sm font-medium text-gray-600 transition hover:text-gray-900"
          >
            ← Dashboard
          </button>

          <div className="rounded-xl border border-red-200 bg-red-50 p-6">
            <h2 className="text-lg font-semibold text-red-800">
              Unable to load your teams
            </h2>

            <p className="mt-2 text-sm text-red-700">{error}</p>

            <button
              type="button"
              onClick={handleRetry}
              className="mt-5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* ================================================== */}
        {/* HEADER */}
        {/* ================================================== */}

        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Teams
          </p>

          <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Teams</h1>

              <p className="mt-1 text-sm text-gray-500">
                Teams you are currently a member of.
              </p>
            </div>

            {isManager && (
              <button
                type="button"
                onClick={handleOpenCreateTeam}
                className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                + Create Team
              </button>
            )}
          </div>
        </div>

        {/* ================================================== */}
        {/* ACTIVE TEAMS */}
        {/* ================================================== */}

        <section>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Active Teams
            </h2>

            <div className="mt-2 h-px bg-gray-200" />
          </div>

          {teams.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-2xl">
                👥
              </div>

              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                No active teams
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
                You are not currently a member of any active teams.
              </p>

              {isManager && (
                <button
                  type="button"
                  onClick={handleOpenCreateTeam}
                  className="mt-5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Create a Team
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {teams.map((team) => (
                <TeamCard
                  key={team.id}
                  team={team}
                  onClick={() => handleOpenTeam(team)}
                />
              ))}
            </div>
          )}
        </section>

        {/* ================================================== */}
        {/* PENDING TEAM REQUESTS */}
        {/* ================================================== */}

        {isManager && (
          <section className="mt-10">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Pending Team Requests
              </h2>

              <div className="mt-2 h-px bg-gray-200" />
            </div>

            {pendingRequests.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white px-6 py-8 shadow-sm">
                <p className="text-sm text-gray-500">
                  You have no pending team requests.
                </p>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {pendingRequests.map((team) => (
                  <PendingTeamCard key={team.id} team={team} />
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {/* ==================================================== */}
      {/* CREATE TEAM MODAL */}
      {/* ==================================================== */}

      {showCreateTeam && (
        <CreateTeamModal
          teamName={teamName}
          creatingTeam={creatingTeam}
          createError={createError}
          createSuccess={createSuccess}
          setTeamName={setTeamName}
          onClose={handleCloseCreateTeam}
          onSubmit={handleCreateTeam}
        />
      )}
    </DashboardLayout>
  );
}

/*
 * ============================================================
 * ACTIVE TEAM CARD
 * ============================================================
 */

function TeamCard({ team, onClick }) {
  const manager = team?.manager;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full rounded-xl border border-gray-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      <div className="p-5">
        {/* Team name / status */}

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold text-gray-900 group-hover:text-blue-600">
              {team?.name || "Unnamed Team"}
            </h3>

            <p className="mt-1 truncate text-sm text-gray-500">
              {team?.department || "No department"}
            </p>
          </div>

          <span className="shrink-0 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
            Active
          </span>
        </div>

        {/* Manager */}

        <div className="mt-5 border-t border-gray-100 pt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Manager
          </p>

          {manager ? (
            <div className="mt-2 flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-700">
                {getInitials(manager.full_name || manager.username)}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-900">
                  {manager.full_name || manager.username || "Unknown User"}
                </p>

                {manager.username && (
                  <p className="truncate text-xs text-gray-500">
                    @{manager.username}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="mt-2 text-sm text-gray-500">No manager assigned</p>
          )}
        </div>

        {/* Members */}

        <div className="mt-5 grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Members
            </p>

            <p className="mt-1 text-sm font-medium text-gray-700">
              {team?.total_members ?? 0}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Status
            </p>

            <p className="mt-1 text-sm font-medium capitalize text-gray-700">
              {team?.status || "Active"}
            </p>
          </div>
        </div>

        {/* Footer */}

        <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
          <span className="text-xs text-gray-500">
            {formatDateTime(team?.created_at)}
          </span>

          <span className="text-sm font-medium text-blue-600">Open Team →</span>
        </div>
      </div>
    </button>
  );
}

/*
 * ============================================================
 * PENDING TEAM CARD
 * ============================================================
 */

function PendingTeamCard({ team }) {
  return (
    <div className="rounded-xl border border-amber-200 bg-white shadow-sm">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold text-gray-900">
              {team?.name || "Unnamed Team"}
            </h3>

            <p className="mt-1 text-sm text-gray-500">Team creation request</p>
          </div>

          <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
            Pending
          </span>
        </div>

        <div className="mt-5 border-t border-gray-100 pt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Status
          </p>

          <p className="mt-1 text-sm font-medium text-amber-700">
            Pending Admin Approval
          </p>
        </div>

        <div className="mt-5 border-t border-gray-100 pt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Requested
          </p>

          <p className="mt-1 text-sm text-gray-700">
            {formatDateTime(team?.created_at)}
          </p>
        </div>

        <div className="mt-5 border-t border-gray-100 pt-4">
          <p className="text-sm text-gray-500">
            This team will become available after an administrator approves the
            request.
          </p>
        </div>
      </div>
    </div>
  );
}

/*
 * ============================================================
 * CREATE TEAM MODAL
 * ============================================================
 */

function CreateTeamModal({
  teamName,
  creatingTeam,
  createError,
  createSuccess,
  setTeamName,
  onClose,
  onSubmit,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        {/* Header */}

        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Create Team</h2>

            <p className="mt-1 text-sm text-gray-500">
              Your request will be sent to an administrator for approval.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={creatingTeam}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Form */}

        <form onSubmit={onSubmit}>
          <div className="px-6 py-5">
            <label
              htmlFor="team-name"
              className="block text-sm font-medium text-gray-700"
            >
              Team Name
            </label>

            <input
              id="team-name"
              type="text"
              value={teamName}
              onChange={(event) => setTeamName(event.target.value)}
              placeholder="Enter team name"
              disabled={creatingTeam}
              autoFocus
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
            />

            {createError && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                {createError}
              </div>
            )}

            {createSuccess && (
              <div className="mt-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 text-sm text-green-700">
                {createSuccess}
              </div>
            )}
          </div>

          {/* Footer */}

          <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={creatingTeam}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={creatingTeam || !teamName.trim()}
              className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {creatingTeam ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/*
 * ============================================================
 * HELPERS
 * ============================================================
 */

function formatDateTime(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString();
}

function getInitials(value) {
  if (!value) {
    return "?";
  }

  return value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

export default MyTeams;
