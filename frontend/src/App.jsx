// frontend/src/App.jsx
import { Navigate, Route, Routes } from "react-router";

import Login from "./pages/auth/login";
import Signup from "./pages/auth/signup";

import Dashboard from "./pages/dashboard/Dashboard";
import Compose from "./pages/compose/Compose";
import Conversation from "./pages/conversation/Conversation";
import Sent from "./pages/Sent";

import Navbar from "./component/navbar/Navbar";
import ProtectedRoute from "./component/ProtectedRoute";
import PublicOnlyRoute from "./component/PublicOnlyRoute";

import AdminUsers from "./pages/admin/AdminUsers";
import AdminTeams from "./pages/admin/teams/AdminTeams";
import TeamEdit from "./pages/admin/teams/TeamEdit";
import UserDetails from "./pages/admin/UserDetails";

import ChangePassword from "./pages/auth/ChangePassword";

import { WebSocketProvider } from "./websocket/WebSocketProvider";

import PendingWorkflows from "./pages/workflows/PendingWorkflows";
import MyWorkflowRequests from "./pages/workflows/MyWorkflowRequests";

import MyReports from "./pages/reports/MyReports";

// ============================================================
// GROUPS
// ============================================================

// General groups
import CreateGroup from "./pages/groups/Group";
import AllGroups from "./pages/groups/AllGroups";
import GroupDetails from "./pages/groups/GroupDetails";

// User groups
import MyGroups from "./pages/groups/MyGroups";
import ChatPage from "./pages/conversation/groupChat/ChatPage";

// ============================================================
// MANAGER
// ============================================================

import ManagerTeams from "./pages/manager/ManagerTeams";
import ManagerTeamDetails from "./pages/manager/ManagerTeamDetails";
import ManagerAddTeamMember from "./pages/manager/ManagerAddTeamMember";
import ManagerDepartmentUsers from "./pages/manager/ManagerDepartmentUsers";
import ManagerDepartmentUserDetails from "./pages/manager/ManagerDepartmentUserDetails";

// ============================================================
// MANAGER REPORTING
// ============================================================
// These pages do not exist yet.
// Keep the imports commented until we build the manager
// reporting UI.

import ManagerReports from "./pages/manager/ManagerReports";
import ManagerReportedItems from "./pages/manager/ManagerReportedItems";
import ManagerReportedItemDetails from "./pages/manager/ManagerReportedItemDetails";

// Admin Reporting Pages
import AdminReports from "./pages/admin/AdminReports";
import AdminReportedItemDetails from "./pages/admin/AdminReportedItemDetails";
import AdminUpdateUserPassword from "./pages/admin/AdminUpdateUserPassword";

// Team Management Pages
import MyTeams from "./pages/teams/MyTeams";

function App() {
  return (
    <WebSocketProvider>
      <>
        <Navbar />

        <Routes>
          {/* ==================================================
              DEFAULT
          ================================================== */}

          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* ==================================================
              AUTHENTICATION
          ================================================== */}

          <Route
            path="/auth/login"
            element={
              <PublicOnlyRoute>
                <Login />
              </PublicOnlyRoute>
            }
          />

          <Route
            path="/auth/signup"
            element={
              <PublicOnlyRoute>
                <Signup />
              </PublicOnlyRoute>
            }
          />

          <Route
            path="/change-password"
            element={
              <ProtectedRoute>
                <ChangePassword />
              </ProtectedRoute>
            }
          />

          {/* ==================================================
              DASHBOARD
          ================================================== */}

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* ==================================================
              SENT
          ================================================== */}

          <Route
            path="/dashboard/sent"
            element={
              <ProtectedRoute>
                <Sent />
              </ProtectedRoute>
            }
          />

          {/* ==================================================
              WORKFLOWS
          ================================================== */}

          <Route
            path="/dashboard/workflows/pending"
            element={
              <ProtectedRoute>
                <PendingWorkflows />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/workflows/mine"
            element={
              <ProtectedRoute>
                <MyWorkflowRequests />
              </ProtectedRoute>
            }
          />

          {/* ==================================================
              COMPOSE
          ================================================== */}

          <Route
            path="/compose"
            element={
              <ProtectedRoute>
                <Compose />
              </ProtectedRoute>
            }
          />

          {/* ==================================================
              CONVERSATION
          ================================================== */}

          <Route
            path="/conversation/:id"
            element={
              <ProtectedRoute>
                <Conversation />
              </ProtectedRoute>
            }
          />

          {/* ==================================================
              GROUPS
          ================================================== */}

          {/* Create Group */}

          <Route
            path="/groups/create"
            element={
              <ProtectedRoute>
                <CreateGroup />
              </ProtectedRoute>
            }
          />

          {/* All Groups */}

          <Route
            path="/groups"
            element={
              <ProtectedRoute>
                <AllGroups />
              </ProtectedRoute>
            }
          />

          {/* My Groups */}

          <Route
            path="/my-groups"
            element={
              <ProtectedRoute>
                <MyGroups />
              </ProtectedRoute>
            }
          />

          {/* Group Details */}

          <Route
            path="/groups/:groupId"
            element={
              <ProtectedRoute>
                <GroupDetails />
              </ProtectedRoute>
            }
          />

          {/* Group Chat */}

          <Route
            path="/groups/:groupId/chat"
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            }
          />

          {/* ==================================================
              MANAGER
          ================================================== */}

          {/* --------------------------------------------------
              Manager Teams
          -------------------------------------------------- */}

          <Route
            path="/manager/teams"
            element={
              <ProtectedRoute>
                <ManagerTeams />
              </ProtectedRoute>
            }
          />

          {/* Manager Team Details */}

          <Route
            path="/manager/teams/:teamId"
            element={
              <ProtectedRoute>
                <ManagerTeamDetails />
              </ProtectedRoute>
            }
          />

          {/* Add Team Member */}

          <Route
            path="/manager/teams/:teamId/add-member"
            element={
              <ProtectedRoute>
                <ManagerAddTeamMember />
              </ProtectedRoute>
            }
          />

          {/* --------------------------------------------------
              Manager Department Users
          -------------------------------------------------- */}

          <Route
            path="/manager/department/users"
            element={
              <ProtectedRoute>
                <ManagerDepartmentUsers />
              </ProtectedRoute>
            }
          />

          {/* Department User Details */}

          <Route
            path="/manager/department/users/:userId"
            element={
              <ProtectedRoute>
                <ManagerDepartmentUserDetails />
              </ProtectedRoute>
            }
          />

          <Route
            path="/reports/my-reports"
            element={
              <ProtectedRoute>
                <MyReports />
              </ProtectedRoute>
            }
          />

          {/* ==================================================
              MANAGER REPORTING
          ================================================== */}

          <Route
            path="/manager/reports"
            element={
              <ProtectedRoute>
                <ManagerReports />
              </ProtectedRoute>
            }
          />

          <Route
            path="/manager/reported-items"
            element={
              <ProtectedRoute>
                <ManagerReportedItems />
              </ProtectedRoute>
            }
          />

          <Route
            path="/manager/reported-items/:reportId"
            element={
              <ProtectedRoute>
                <ManagerReportedItemDetails />
              </ProtectedRoute>
            }
          />

          {/* ==================================================
              ADMIN USERS
          ================================================== */}

          <Route
            path="/admin/users"
            element={
              <ProtectedRoute>
                <AdminUsers />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/users/password"
            element={
              <ProtectedRoute>
                <AdminUpdateUserPassword />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/users/:userId"
            element={
              <ProtectedRoute>
                <UserDetails />
              </ProtectedRoute>
            }
          />

          {/* ==================================================
               ADMIN REPORTING
           ================================================== */}

          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute>
                <AdminReports />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/reports/:reportId"
            element={
              <ProtectedRoute>
                <AdminReportedItemDetails />
              </ProtectedRoute>
            }
          />

          {/* ==================================================
              ADMIN TEAMS
          ================================================== */}

          <Route
            path="/admin/teams"
            element={
              <ProtectedRoute>
                <AdminTeams />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/teams/:teamId/edit"
            element={
              <ProtectedRoute>
                <TeamEdit />
              </ProtectedRoute>
            }
          />

          {/* ==================================================
              TEAM MANAGEMENT
          ================================================== */}

          <Route
            path="/my-teams"
            element={
              <ProtectedRoute>
                <MyTeams />
              </ProtectedRoute>
            }
          />
        </Routes>
      </>
    </WebSocketProvider>
  );
}

export default App;
