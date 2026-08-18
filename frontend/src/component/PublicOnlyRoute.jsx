import { Navigate } from 'react-router';
import { useAuth } from '../context/AuthContext';

function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth();

  // Wait until AuthContext finishes checking
  // whether the user is already authenticated.
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <p className="text-sm text-gray-500">
          Checking authentication...
        </p>
      </div>
    );
  }

  // User is already authenticated.
  // Do not allow access to login/signup pages.
  if (user) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  // User is not authenticated.
  // Allow access to login/signup.
  return children;
}

export default PublicOnlyRoute;