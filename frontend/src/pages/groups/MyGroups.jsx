// src/pages/groups/MyGroups.jsx
import DashboardLayout from "../dashboard/DashboardLayout";

import { useMyGroupsLogic } from "./MyGroupsLogic";

function MyGroups() {
  const {
    groups,

    loading,
    error,

    status,
    sortBy,

    total,
    hasMore,
    loadingMore,

    handleStatusChange,
    handleSortChange,

    handleLoadMore,
    handleRetry,

    handleOpenGroup,
    handleBack,
  } = useMyGroupsLogic();

  /*
   * ----------------------------------------
   * Loading
   * ----------------------------------------
   */

  if (loading) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="rounded-xl bg-white p-12 text-center shadow">
            <div className="mx-auto flex h-10 w-10 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
            </div>

            <p className="mt-4 text-sm text-gray-500">
              Loading your groups...
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  /*
   * ----------------------------------------
   * Error
   * ----------------------------------------
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
              Unable to load your groups
            </h2>

            <p className="mt-2 text-sm text-red-700">
              {error}
            </p>

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

  /*
   * ----------------------------------------
   * Page
   * ----------------------------------------
   */

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}

        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Groups
          </p>

          <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                My Groups
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Groups you are currently a member of.
              </p>
            </div>

            <div className="text-sm text-gray-500">
              {total} {total === 1 ? "group" : "groups"}
            </div>
          </div>
        </div>

        {/* Filters */}

        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            {/* Status */}

            <div className="w-full sm:max-w-xs">
              <label
                htmlFor="group-status"
                className="block text-sm font-medium text-gray-700"
              >
                Group Status
              </label>

              <select
                id="group-status"
                value={status}
                onChange={(event) =>
                  handleStatusChange(event.target.value)
                }
                className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">All Groups</option>
                <option value="open">Open Groups</option>
                <option value="closed">Closed Groups</option>
              </select>
            </div>

            {/* Sort */}

            <div className="w-full sm:max-w-xs">
              <label
                htmlFor="group-sort"
                className="block text-sm font-medium text-gray-700"
              >
                Sort By
              </label>

              <select
                id="group-sort"
                value={sortBy}
                onChange={(event) =>
                  handleSortChange(event.target.value)
                }
                className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="newest">
                  Newest First
                </option>

                <option value="oldest">
                  Oldest First
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* Empty state */}

        {groups.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-white px-6 py-14 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-2xl">
              👥
            </div>

            <h2 className="mt-4 text-lg font-semibold text-gray-900">
              No groups found
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
              {status
                ? `You don't currently belong to any ${
                    status === "open" ? "open" : "closed"
                  } groups.`
                : "You are not currently a member of any groups."}
            </p>
          </div>
        )}

        {/* Groups */}

        {groups.length > 0 && (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {groups.map((group) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  onClick={() => handleOpenGroup(group.id)}
                />
              ))}
            </div>

            {/* Load more */}

            {hasMore && (
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loadingMore
                    ? "Loading..."
                    : "Load More Groups"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

/*
 * --------------------------------------------------
 * Group Card
 * --------------------------------------------------
 */

function GroupCard({ group, onClick }) {
  const manager = group?.manager;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full rounded-xl border border-gray-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      <div className="p-5">
        {/* Top */}

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold text-gray-900 group-hover:text-blue-600">
              {group.name || "Unnamed Group"}
            </h2>

            <p className="mt-1 truncate text-sm text-gray-500">
              {group.department || "Cross-department"}
            </p>
          </div>

          <span
            className={
              group.is_open
                ? "shrink-0 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700"
                : "shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600"
            }
          >
            {group.is_open ? "Open" : "Closed"}
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
                {getInitials(
                  manager.full_name || manager.username,
                )}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-900">
                  {manager.full_name ||
                    manager.username ||
                    "Unknown User"}
                </p>

                {manager.username && (
                  <p className="truncate text-xs text-gray-500">
                    @{manager.username}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="mt-2 text-sm text-gray-500">
              No manager assigned
            </p>
          )}
        </div>

        {/* Dates */}

        <div className="mt-5 grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Joined
            </p>

            <p className="mt-1 text-sm text-gray-700">
              {formatDateTime(group.user_joined_at)}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Created
            </p>

            <p className="mt-1 text-sm text-gray-700">
              {formatDateTime(group.group_created_at)}
            </p>
          </div>
        </div>

        {/* Footer */}

        <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
          <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium capitalize text-green-700">
            {group.status || "approved"}
          </span>

          <span className="text-sm font-medium text-blue-600">
            View Group →
          </span>
        </div>
      </div>
    </button>
  );
}

/*
 * --------------------------------------------------
 * Helpers
 * --------------------------------------------------
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

export default MyGroups;