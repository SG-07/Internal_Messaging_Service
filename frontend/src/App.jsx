// frontend/src/App.jsx

import { Routes, Route, Navigate } from 'react-router';
import Signup from './pages/auth/signup';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/auth/signup" replace />} />

      <Route path="/auth/signup" element={<Signup />} />
    </Routes>
  );
}

export default App;
