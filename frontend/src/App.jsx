// frontend/src/App.jsx

import { Routes, Route, Navigate } from 'react-router';
import Signup from './pages/auth/signup';
import Login from './pages/auth/login';
import Dashboard from './pages/dashboard';

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to="/auth/login" replace />}
      />

      <Route
        path="/auth/signup"
        element={<Signup />}
      />

      <Route
        path="/auth/login"
        element={<Login />}
      />

      <Route
        path="/dashboard"
        element={<Dashboard />}
      />
    </Routes>
  );
}

export default App;

