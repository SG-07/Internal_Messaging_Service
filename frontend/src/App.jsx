// frontend/src/App.jsx
import React from "react";
import { Navigate, Route, Routes } from "react-router";

import Login from "./pages/auth/login";
import Signup from "./pages/auth/signup";
import Dashboard from "./pages/dashboard/Dashboard";
import Compose from "./pages/compose/Compose";
import Conversation from "./pages/conversation/Conversation";
import Sent from "./pages/Sent";
import Navbar from "./component/navbar/Navbar";
import ProtectedRoute from "./component/ProtectedRoute";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminTeams from "./pages/admin/teams/AdminTeams";
import TeamEdit from "./pages/admin/teams/TeamEdit";
import PublicOnlyRoute from "./component/PublicOnlyRoute";
import ChangePassword from "./pages/auth/ChangePassword";
import { WebSocketProvider } from "./websocket/WebSocketProvider";
import PendingWorkflows from "./pages/workflows/PendingWorkflows";
import MyWorkflowRequests from "./pages/workflows/MyWorkflowRequests";
import UserDetails from "./pages/admin/UserDetails";
import CreateGroup from "./pages/groups/CreateGroup";

function App() {
  return (
    <WebSocketProvider>
      <>
        <Navbar />

        <Routes>
          {/* Default */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Authentication */}
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

          {/* Dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Sent */}
          <Route
            path="/dashboard/sent"
            element={
              <ProtectedRoute>
                <Sent />
              </ProtectedRoute>
            }
          />

          {/* Workflow - Pending */}
          <Route
            path="/dashboard/workflows/pending"
            element={
              <ProtectedRoute>
                <PendingWorkflows />
              </ProtectedRoute>
            }
          />

          {/* Workflow - My Requests */}
          <Route
            path="/dashboard/workflows/mine"
            element={
              <ProtectedRoute>
                <MyWorkflowRequests />
              </ProtectedRoute>
            }
          />

          {/* Compose */}
          <Route
            path="/compose"
            element={
              <ProtectedRoute>
                <Compose />
              </ProtectedRoute>
            }
          />

          {/* Conversation */}
          <Route
            path="/conversation/:id"
            element={
              <ProtectedRoute>
                <Conversation />
              </ProtectedRoute>
            }
          />

          {/* Create Group */}
          <Route
            path="/groups/create"
            element={
              <ProtectedRoute>
                <CreateGroup />
              </ProtectedRoute>
            }
          />

          {/* Admin Users */}
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute>
                <AdminUsers />
              </ProtectedRoute>
            }
          />

          {/* Admin User Details */}
          <Route
            path="/admin/users/:userId"
            element={
              <ProtectedRoute>
                <UserDetails />
              </ProtectedRoute>
            }
          />

          {/* Admin Teams */}
          <Route
            path="/admin/teams"
            element={
              <ProtectedRoute>
                <AdminTeams />
              </ProtectedRoute>
            }
          />

          {/* Admin Team Edit */}
          <Route
            path="/admin/teams/:teamId/edit"
            element={
              <ProtectedRoute>
                <TeamEdit />
              </ProtectedRoute>
            }
          />
        </Routes>
      </>
    </WebSocketProvider>
  );
}

export default App;
