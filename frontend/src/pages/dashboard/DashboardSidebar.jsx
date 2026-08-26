// frontend/src/pages/dashboard/DashboardSidebar.jsx

import { useLocation, useNavigate } from "react-router";

import { useAuth } from "../../context/AuthContext";

function DashboardSidebar({ onCompose }) {
  const navigate = useNavigate();
  const location = useLocation();

  const { user } = useAuth();

  const isAdmin = user?.role === "admin";

  const isInbox = location.pathname === "/dashboard";

  const isSent = location.pathname === "/dashboard/sent";

  const isPendingWorkflows =
    location.pathname === "/dashboard/workflows/pending";

  const isMyWorkflowRequests =
    location.pathname === "/dashboard/workflows/mine";

  const isCreateGroup = location.pathname === "/groups/create";

  const isGroups = location.pathname === "/groups";

  const isMyGroups = location.pathname === "/my-groups";

  const isAdminUsers = location.pathname === "/admin/users";

  const isAdminTeams = location.pathname === "/admin/teams";

  function getNavClass(active) {
    return `w-full rounded-lg px-4 py-3 text-left text-sm transition ${
      active
        ? "bg-blue-50 font-semibold text-blue-700"
        : "text-gray-700 hover:bg-gray-100"
    }`;
  }

  return (
    <aside className="flex min-h-[calc(100vh-130px)] w-56 shrink-0 flex-col rounded-xl bg-white p-4 shadow">
      {/* Compose */}
      <button
        type="button"
        onClick={onCompose}
        className="mb-6 w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
      >
        + Compose
      </button>

      {/* Main Navigation */}
      <nav className="space-y-1">
        {/* Inbox */}
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className={getNavClass(isInbox)}
        >
          Inbox
        </button>

        {/* Sent */}
        <button
          type="button"
          onClick={() => navigate("/dashboard/sent")}
          className={getNavClass(isSent)}
        >
          Sent
        </button>
      </nav>

      {/* Workflow Navigation */}
      <div className="mt-8">
        <p className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Workflows
        </p>

        <nav className="space-y-1">
          {/* Pending Workflows */}
          <button
            type="button"
            onClick={() => navigate("/dashboard/workflows/pending")}
            className={getNavClass(isPendingWorkflows)}
          >
            Pending Workflows
          </button>

          {/* My Workflow Requests */}
          <button
            type="button"
            onClick={() => navigate("/dashboard/workflows/mine")}
            className={getNavClass(isMyWorkflowRequests)}
          >
            My Workflow Requests
          </button>
        </nav>
      </div>

      {/* Group Navigation */}
      <div className="mt-8">
        <p className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Groups
        </p>

        <nav className="space-y-1">
          {/* Create Group */}
          <button
            type="button"
            onClick={() => navigate("/groups/create")}
            className={getNavClass(isCreateGroup)}
          >
            + Create Group
          </button>

          {/* All Groups */}
          <button
            type="button"
            onClick={() => navigate("/groups")}
            className={getNavClass(isGroups)}
          >
            All Groups
          </button>

          {/* My Groups */}
          <button
            type="button"
            onClick={() => navigate("/my-groups")}
            className={getNavClass(isMyGroups)}
          >
            My Groups
          </button>
        </nav>
      </div>

      {/* Admin Navigation */}
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

            {/* Teams */}
            <button
              type="button"
              onClick={() => navigate("/admin/teams")}
              className={getNavClass(isAdminTeams)}
            >
              Teams
            </button>
          </nav>
        </div>
      )}
    </aside>
  );
}

export default DashboardSidebar;
