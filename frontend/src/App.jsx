// frontend/src/App.jsx

import React from 'react';
import { Navigate, Route, Routes } from 'react-router';
import Login from './pages/auth/login';
import Signup from './pages/auth/signup';
import Dashboard from './pages/dashboard/Dashboard';
import Compose from './pages/compose/Compose';
import ProtectedRoute from './component/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <Navigate to="/dashboard" replace />
        }
      />

      <Route
        path="/auth/login"
        element={<Login />}
      />

      <Route
        path="/auth/signup"
        element={<Signup />}
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/compose"
        element={
          <ProtectedRoute>
            <Compose />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;