import { useEffect, useState } from 'react';
import { Navigate } from 'react-router';
import { getCurrentUser } from '../api/auth';

function ProtectedRoute({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuthentication() {
      try {
        const { user } = await getCurrentUser();
        setUser(user);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    checkAuthentication();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-gray-500">
          Loading...
        </p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  return children;
}

export default ProtectedRoute;