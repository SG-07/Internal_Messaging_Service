// frontend/src/pages/admin/AdminUsers.jsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import { getAdminUsers } from "../../api/admin";
import DepartmentFilter, { NO_DEPARTMENT } from "./common/DepartmentFilter";
import DashboardLayout from "../dashboard/DashboardLayout";

function AdminUsers() {
  const navigate = useNavigate();

  const [departments, setDepartments] = useState([]);

  const [users, setUsers] = useState([]);

  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /*
   * --------------------------------------------------
   * Load users
   * --------------------------------------------------
   */
  useEffect(() => {
    async function loadUsers() {
      const payload = {
        page,
        limit,
        ...(departments.length > 0 && {
          department: departments,
        }),
      };

      if (import.meta.env.DEV) {
        console.group("[AdminUsers] Fetch Users");

        console.log("Selected departments:", departments);

        console.log("Request payload:", payload);

        console.groupEnd();
      }

      try {
        setLoading(true);
        setError("");

        const response = await getAdminUsers(payload);

        if (import.meta.env.DEV) {
          console.group("[AdminUsers] Fetch Users Response");

          console.log("Request payload:", payload);

          console.log("Received response:", response);

          console.groupEnd();
        }

        /*
         * --------------------------------------------------
         * Extract users
         * --------------------------------------------------
         */
        const responseUsers =
          response?.users || response?.data?.users || response?.data || [];

        setUsers(Array.isArray(responseUsers) ? responseUsers : []);

        /*
         * --------------------------------------------------
         * Extract pagination
         * --------------------------------------------------
         */
        const pages =
          response?.totalPages ||
          response?.data?.totalPages ||
          response?.pagination?.totalPages ||
          response?.data?.pagination?.totalPages ||
          1;

        setTotalPages(Number(pages) || 1);
      } catch (err) {
        if (import.meta.env.DEV) {
          console.group("[AdminUsers] Fetch Users Error");

          console.log("Request payload:", payload);

          console.error("Error:", err);

          console.log("Error message:", err?.message);

          console.groupEnd();
        }

        setUsers([]);

        setError(err?.message || "Unable to load users. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    loadUsers();
  }, [page, limit, departments]);

  /*
   * --------------------------------------------------
   * Department filter
   * --------------------------------------------------
   */
  function handleDepartmentsChange(value) {
    setDepartments(Array.isArray(value) ? value : []);

    /*
     * Whenever the filter changes,
     * return to the first page.
     */
    setPage(1);
  }

  /*
   * --------------------------------------------------
   * Open user details
   * --------------------------------------------------
   */
  function handleManageUser(userId) {
    console.log("[AdminUsers] handleManageUser CALLED");

    console.log("[AdminUsers] Received userId:", userId);

    if (!userId) {
      console.error("[AdminUsers] ERROR: No user ID received.");

      return;
    }

    const targetPath = `/admin/users/${userId}`;

    console.log("[AdminUsers] Target path:", targetPath);

    console.log("[AdminUsers] Calling navigate...");

    try {
      navigate(targetPath);

      console.log("[AdminUsers] navigate() CALLED successfully");
    } catch (error) {
      console.error("[AdminUsers] navigate() FAILED:", error);
    }
  }

  /*
   * --------------------------------------------------
   * Pagination
   * --------------------------------------------------
   */
  function handlePreviousPage() {
    if (page > 1) {
      setPage((currentPage) => currentPage - 1);
    }
  }

  function handleNextPage() {
    if (page < totalPages) {
      setPage((currentPage) => currentPage + 1);
    }
  }

  /*
   * --------------------------------------------------
   * Empty-state filter text
   * --------------------------------------------------
   */
  function getDepartmentFilterText() {
    if (departments.length === 0) {
      return "There are no users to display.";
    }

    const labels = departments.map((department) => {
      if (department === NO_DEPARTMENT) {
        return "No Department";
      }

      return department;
    });

    return `No users found in ${labels.join(", ")}.`;
  }

  return (
    <DashboardLayout>
      <section className="rounded-xl bg-white shadow">
        {/* Header */}
        <div className="border-b px-6 py-5">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Users</h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage users, roles, managers, and account status.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="border-b bg-gray-50 px-6 py-4">
          <div className="flex flex-wrap items-end gap-4">
            <DepartmentFilter
              value={departments}
              onChange={handleDepartmentsChange}
              disabled={loading}
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="border-b px-6 py-4">
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Users table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b bg-white text-left">
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  User
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Email
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Role
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Department
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Manager
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
                  <td colSpan="7" className="px-6 py-16 text-center">
                    <p className="text-sm text-gray-500">Loading users...</p>
                  </td>
                </tr>
              )}

              {/* Empty */}
              {!loading && users.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-16 text-center">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        No users found
                      </h3>

                      <p className="mt-2 text-sm text-gray-500">
                        {getDepartmentFilterText()}
                      </p>
                    </div>
                  </td>
                </tr>
              )}

              {/* Users */}
              {!loading &&
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b last:border-b-0 hover:bg-gray-50"
                  >
                    {/* User */}
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {user.full_name || user.username || "—"}
                        </p>

                        {user.username && (
                          <p className="mt-1 text-xs text-gray-500">
                            @{user.username}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {user.email || "—"}
                    </td>

                    {/* Role */}
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium capitalize text-gray-700">
                        {user.role || "—"}
                      </span>
                    </td>

                    {/* Department */}
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {user.department || "—"}
                    </td>

                    {/* Manager */}
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {user.manager || user.manager_username || "—"}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      {user.is_active === false ? (
                        <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
                          Inactive
                        </span>
                      ) : (
                        <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                          Active
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={(event) => {
                          console.log("[AdminUsers] MANAGE BUTTON CLICKED");

                          console.log("[AdminUsers] Click event:", event);

                          console.log("[AdminUsers] User:", user);

                          console.log("[AdminUsers] User ID:", user.id);

                          handleManageUser(user.id);
                        }}
                        disabled={!user.id}
                        className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && users.length > 0 && (
          <div className="flex items-center justify-between border-t px-6 py-4">
            <p className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </p>

            <div className="flex items-center gap-2">
              {/* Previous */}
              <button
                type="button"
                onClick={handlePreviousPage}
                disabled={page <= 1}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>

              {/* Next */}
              <button
                type="button"
                onClick={handleNextPage}
                disabled={page >= totalPages}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>
    </DashboardLayout>
  );
}

export default AdminUsers;
