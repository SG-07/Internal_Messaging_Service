import React from 'react';
import {
  Navigate,
  Route,
  Routes,
} from 'react-router';

import Login from './pages/auth/login';
import Signup from './pages/auth/signup';
import Dashboard from './pages/dashboard/Dashboard';
import Compose from './pages/compose/Compose';
import Conversation from './pages/conversation/Conversation';
import Sent from './pages/Sent';
import Navbar from './component/navbar/Navbar';
import ProtectedRoute from './component/ProtectedRoute';

function App() {
  return (
    <>
      <Navbar />

      <Routes>

        {/* Default */}
        <Route
          path="/"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

        {/* Authentication */}
        <Route
          path="/auth/login"
          element={<Login />}
        />

        <Route
          path="/auth/signup"
          element={<Signup />}
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

      </Routes>
    </>
  );
}

export default App;