// frontend/src/pages/dashboard/DashboardSidebar.jsx
import { useLocation, useNavigate } from "react-router";

import { useAuth } from "../../context/AuthContext";

function DashboardSidebar({ onCompose }) {
  const navigate = useNavigate();
  const location = useLocation();

  const { user } = useAuth();

  const isAdmin = user?.role === "admin";
  const isManager = user?.role === "manager";

  // ============================================================
  // MAIN NAVIGATION
  // ============================================================

  const isInbox = location.pathname === "/dashboard";

  const isSent = location.pathname === "/dashboard/sent";

  // ============================================================
  // WORKFLOWS
  // ============================================================

  const isPendingWorkflows =
    location.pathname === "/dashboard/workflows/pending";

  const isMyWorkflowRequests =
    location.pathname === "/dashboard/workflows/mine";

  // ============================================================
  // GROUPS
  // ============================================================

  const isCreateGroup = location.pathname === "/groups/create";

  const isGroups = location.pathname === "/groups";

  const isMyGroups = location.pathname === "/my-groups";

  // ============================================================
  // TEAMS
  // ============================================================

  const isMyTeams = location.pathname === "/my-teams";

  // ============================================================
  // REPORTS
  // ============================================================

  const isMyReports = location.pathname === "/reports/my-reports";

  // ============================================================
  // MANAGER
  // ============================================================

  const isDepartmentUsers =
    location.pathname === "/manager/department/users";

  const isManagerReports =
    location.pathname === "/manager/reports";

  // ============================================================
  // ADMIN
  // ============================================================

  const isAdminUsers =
    location.pathname === "/admin/users";

  const isAdminUpdatePassword =
    location.pathname === "/admin/users/password";

  const isAdminTeams =
    location.pathname === "/admin/teams";

  const isAdminReports =
    location.pathname === "/admin/reports";

  // ============================================================
  // NAVIGATION CLASS
  // ============================================================

  function getNavClass(active) {
    return `w-full rounded-lg px-4 py-3 text-left text-sm transition ${
      active
        ? "bg-blue-50 font-semibold text-blue-700"
        : "text-gray-700 hover:bg-gray-100"
    }`;
  }

  return (
    <aside className="flex min-h-[calc(100vh-130px)] w-56 shrink-0 flex-col rounded-xl bg-white p-4 shadow">
      {/* ======================================================
          COMPOSE
      ====================================================== */}

      <button
        type="button"
        onClick={onCompose}
        className="mb-6 w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
      >
        + Compose
      </button>

      {/* ======================================================
          MAIN NAVIGATION
      ====================================================== */}

      <nav className="space-y-1">
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className={getNavClass(isInbox)}
        >
          Inbox
        </button>

        <button
          type="button"
          onClick={() => navigate("/dashboard/sent")}
          className={getNavClass(isSent)}
        >
          Sent
        </button>
      </nav>

      {/* ======================================================
          WORKFLOWS
      ====================================================== */}

      <div className="mt-8">
        <p className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Workflows
        </p>

        <nav className="space-y-1">
          <button
            type="button"
            onClick={() => navigate("/dashboard/workflows/pending")}
            className={getNavClass(isPendingWorkflows)}
          >
            Pending Workflows
          </button>

          <button
            type="button"
            onClick={() => navigate("/dashboard/workflows/mine")}
            className={getNavClass(isMyWorkflowRequests)}
          >
            My Workflow Requests
          </button>
        </nav>
      </div>

      {/* ======================================================
          GROUPS
      ====================================================== */}

      <div className="mt-8">
        <p className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Groups
        </p>

        <nav className="space-y-1">
          <button
            type="button"
            onClick={() => navigate("/groups/create")}
            className={getNavClass(isCreateGroup)}
          >
            + Create Group
          </button>

          <button
            type="button"
            onClick={() => navigate("/groups")}
            className={getNavClass(isGroups)}
          >
            All Groups
          </button>

          <button
            type="button"
            onClick={() => navigate("/my-groups")}
            className={getNavClass(isMyGroups)}
          >
            My Groups
          </button>
        </nav>
      </div>

      {/* ======================================================
          TEAMS
      ====================================================== */}

      <div className="mt-8">
        <p className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Teams
        </p>

        <nav className="space-y-1">
          <button
            type="button"
            onClick={() => navigate("/my-teams")}
            className={getNavClass(isMyTeams)}
          >
            My Teams
          </button>
        </nav>
      </div>

      {/* ======================================================
          REPORTS
      ====================================================== */}

      <div className="mt-8">
        <p className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Reports
        </p>

        <nav className="space-y-1">
          <button
            type="button"
            onClick={() => navigate("/reports/my-reports")}
            className={getNavClass(isMyReports)}
          >
            My Reports
          </button>
        </nav>
      </div>

      {/* ======================================================
          MANAGER NAVIGATION
      ====================================================== */}

      {isManager && (
        <div className="mt-8">
          <p className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Manager
          </p>

          <nav className="space-y-1">
            {/* Create Team */}

            {/* <button
              type="button"
              onClick={() => navigate("/manager/teams/create")}
              className={getNavClass(
                location.pathname === "/manager/teams/create",
              )}
            >
              + Create Team
            </button> */}

            {/* Department Users */}

            <button
              type="button"
              onClick={() => navigate("/manager/department/users")}
              className={getNavClass(isDepartmentUsers)}
            >
              Department Users
            </button>

            {/* Reports */}

            <button
              type="button"
              onClick={() => navigate("/manager/reports")}
              className={getNavClass(isManagerReports)}
            >
              Reports
            </button>
          </nav>
        </div>
      )}

      {/* ======================================================
          ADMIN NAVIGATION
      ====================================================== */}

      {isAdmin && (
        <div className="mt-8">
          <p className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Administration
          </p>

          <nav className="space-y-1">
            {/* Users */}

            <button
              type="button"
              onClick={() => navigate("/admin/users")}
              className={getNavClass(isAdminUsers)}
            >
              Users
            </button>

            {/* Update User Password */}

            <button
              type="button"
              onClick={() => navigate("/admin/users/password")}
              className={getNavClass(isAdminUpdatePassword)}
            >
              Update User Password
            </button>

            {/* Teams */}

            <button
              type="button"
              onClick={() => navigate("/admin/teams")}
              className={getNavClass(isAdminTeams)}
            >
              Teams
            </button>

            {/* Reports */}

            <button
              type="button"
              onClick={() => navigate("/admin/reports")}
              className={getNavClass(isAdminReports)}
            >
              Reports
            </button>
          </nav>
        </div>
      )}
    </aside>
  );
}

export default DashboardSidebar;