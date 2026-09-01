// src/pages/teams/ManageTeamMembersModal.jsx

import { useEffect, useMemo, useState } from "react";

import {
  managerGetDepartmentUsers,
  managerGetTeamMembers,
} from "../../api/manager";

function ManageTeamMembersModal({ team, onClose }) {
  const [members, setMembers] = useState([]);
  const [departmentUsers, setDepartmentUsers] = useState([]);

  const [loadingMembers, setLoadingMembers] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const [membersError, setMembersError] = useState("");
  const [usersError, setUsersError] = useState("");

  const [search, setSearch] = useState("");

  /*
   * ============================================================
   * LOAD CURRENT TEAM MEMBERS
   * ============================================================
   */

  useEffect(() => {
    if (!team?.id) {
      return;
    }

    let cancelled = false;

    async function loadMembers() {
      try {
        setLoadingMembers(true);
        setMembersError("");

        const response = await managerGetTeamMembers(team.id);

        if (import.meta.env.DEV) {
          console.group("[Manage Team Members] Fetch Members");
          console.log("Team ID:", team.id);
          console.log("Response:", response);
          console.log("Members:", response?.data);
          console.groupEnd();
        }

        if (cancelled) {
          return;
        }

        const responseMembers = Array.isArray(response?.data)
          ? response.data
          : [];

        setMembers(responseMembers);
      } catch (err) {
        if (cancelled) {
          return;
        }

        if (import.meta.env.DEV) {
          console.group("[Manage Team Members] Members Error");
          console.error("Error:", err);
          console.log("Status:", err?.status);
          console.log("Message:", err?.message);
          console.groupEnd();
        }

        setMembersError(
          err?.message ||
            "Unable to load team members. Please try again.",
        );

        setMembers([]);
      } finally {
        if (!cancelled) {
          setLoadingMembers(false);
        }
      }
    }

    loadMembers();

    return () => {
      cancelled = true;
    };
  }, [team?.id]);

  /*
   * ============================================================
   * LOAD DEPARTMENT USERS
   * ============================================================
   */

  useEffect(() => {
    if (!team?.id) {
      return;
    }

    let cancelled = false;

    async function loadDepartmentUsers() {
      try {
        setLoadingUsers(true);
        setUsersError("");

        const response = await managerGetDepartmentUsers();

        if (import.meta.env.DEV) {
          console.group(
            "[Manage Team Members] Fetch Department Users",
          );
          console.log("Response:", response);
          console.log("Users:", response?.data);
          console.groupEnd();
        }

        if (cancelled) {
          return;
        }

        const responseUsers = Array.isArray(response?.data)
          ? response.data
          : [];

        setDepartmentUsers(responseUsers);
      } catch (err) {
        if (cancelled) {
          return;
        }

        if (import.meta.env.DEV) {
          console.group(
            "[Manage Team Members] Department Users Error",
          );
          console.error("Error:", err);
          console.log("Status:", err?.status);
          console.log("Message:", err?.message);
          console.groupEnd();
        }

        setUsersError(
          err?.message ||
            "Unable to load department users. Please try again.",
        );

        setDepartmentUsers([]);
      } finally {
        if (!cancelled) {
          setLoadingUsers(false);
        }
      }
    }

    loadDepartmentUsers();

    return () => {
      cancelled = true;
    };
  }, [team?.id]);

  /*
   * ============================================================
   * EXISTING MEMBER IDS
   * ============================================================
   */

  const memberIds = useMemo(() => {
    return new Set(
      members
        .map((member) => member?.id)
        .filter(Boolean),
    );
  }, [members]);

  /*
   * ============================================================
   * AVAILABLE USERS
   * ============================================================
   */

  const availableUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return departmentUsers
      .filter((user) => !memberIds.has(user?.id))
      .filter((user) => {
        if (!normalizedSearch) {
          return true;
        }

        const name = user?.full_name || "";
        const username = user?.username || "";
        const email = user?.email || "";

        return (
          name.toLowerCase().includes(normalizedSearch) ||
          username.toLowerCase().includes(normalizedSearch) ||
          email.toLowerCase().includes(normalizedSearch)
        );
      });
  }, [departmentUsers, memberIds, search]);

  /*
   * ============================================================
   * HELPERS
   * ============================================================
   */

  function getDisplayName(user) {
    return (
      user?.full_name ||
      user?.username ||
      user?.email ||
      "Unknown User"
    );
  }

  function getInitials(user) {
    const value =
      user?.full_name ||
      user?.username ||
      user?.email ||
      "";

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

  if (!team) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6"
      onMouseDown={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {/* ================================================== */}
        {/* HEADER */}
        {/* ================================================== */}

        <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-gray-900">
              Manage Team Members
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Manage members of{" "}
              <span className="font-medium text-gray-700">
                {team.name || "this team"}
              </span>
              .
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="ml-4 shrink-0 rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* ================================================== */}
        {/* CONTENT */}
        {/* ================================================== */}

        <div className="overflow-y-auto px-6 py-5">
          {/* Team summary */}

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {team.name || "Unnamed Team"}
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  {team.department || "No department"}
                </p>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Members</span>{" "}
                  <span className="font-semibold text-gray-900">
                    {members.length}
                  </span>
                </div>

                <div>
                  <span className="text-gray-500">Status</span>{" "}
                  <span className="font-semibold capitalize text-gray-900">
                    {team.status || "active"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ================================================== */}
          {/* CURRENT MEMBERS */}
          {/* ================================================== */}

          <section className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  Current Members
                </h3>

                <p className="mt-1 text-xs text-gray-500">
                  People who are currently part of this team.
                </p>
              </div>

              {!loadingMembers && (
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                  {members.length}
                </span>
              )}
            </div>

            {loadingMembers ? (
              <div className="rounded-lg border border-gray-200 bg-white px-4 py-8 text-center">
                <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />

                <p className="mt-3 text-sm text-gray-500">
                  Loading team members...
                </p>
              </div>
            ) : membersError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-4">
                <p className="text-sm text-red-700">
                  {membersError}
                </p>
              </div>
            ) : members.length === 0 ? (
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-6 text-center">
                <p className="text-sm text-gray-500">
                  No active members found.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between gap-4 px-4 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-700">
                        {getInitials(member)}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {getDisplayName(member)}
                        </p>

                        <div className="mt-0.5 flex flex-wrap gap-x-2 text-xs text-gray-500">
                          {member.username && (
                            <span>@{member.username}</span>
                          )}

                          {member.email && (
                            <span>{member.email}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <span className="shrink-0 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                      Member
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ================================================== */}
          {/* AVAILABLE USERS */}
          {/* ================================================== */}

          <section className="mt-8">
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-gray-900">
                Add Members
              </h3>

              <p className="mt-1 text-xs text-gray-500">
                Active users from your department who are not
                already members of this team.
              </p>
            </div>

            {/* Search */}

            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search by name, username, or email..."
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="mt-3">
              {loadingUsers ? (
                <div className="rounded-lg border border-gray-200 bg-white px-4 py-8 text-center">
                  <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />

                  <p className="mt-3 text-sm text-gray-500">
                    Loading department users...
                  </p>
                </div>
              ) : usersError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-4">
                  <p className="text-sm text-red-700">
                    {usersError}
                  </p>
                </div>
              ) : availableUsers.length === 0 ? (
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-6 text-center">
                  <p className="text-sm font-medium text-gray-700">
                    {search.trim()
                      ? "No matching users found."
                      : "No users available to add."}
                  </p>

                  {!search.trim() && (
                    <p className="mt-1 text-xs text-gray-500">
                      All active department users may already
                      be members of this team.
                    </p>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
                  {availableUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between gap-4 px-4 py-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-700">
                          {getInitials(user)}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-900">
                            {getDisplayName(user)}
                          </p>

                          <div className="mt-0.5 flex flex-wrap gap-x-2 text-xs text-gray-500">
                            {user.username && (
                              <span>@{user.username}</span>
                            )}

                            {user.email && (
                              <span>{user.email}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled
                        className="shrink-0 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-medium text-white opacity-50"
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* ================================================== */}
        {/* FOOTER */}
        {/* ================================================== */}

        <div className="flex justify-end border-t border-gray-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default ManageTeamMembersModal;
