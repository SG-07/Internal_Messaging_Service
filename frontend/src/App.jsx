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

function App() {
  return (
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

        {/* Admin Users */}
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute>
              <AdminUsers />
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
  );
}

export default App;
