// frontend/src/App.jsx

import { BrowserRouter, Routes, Route } from 'react-router';
import Signup from './pages/auth/signup';
import Login from './pages/auth/login';
import Dashboard from './pages/dashboard/Dashboard';
import Compose from './pages/compose/Compose';

function App() {
  return (
      <Routes>
        <Route path="/auth/signup" element={<Signup />} />
        <Route path="/auth/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/compose" element={<Compose />} />
      </Routes>
  );
}

export default App;