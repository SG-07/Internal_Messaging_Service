// frontend/src/App.jsx

import { Routes, Route, Navigate } from 'react-router';
import Signup from './pages/auth/signup';
import Login from './pages/auth/login';

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
        element={
          <div className="flex min-h-screen items-center justify-center">
            <h1 className="text-3xl font-bold">
              Dashboard
            </h1>
          </div>
        }
      />
    </Routes>
  );
}

export default App;
