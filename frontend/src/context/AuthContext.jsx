import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import { getCurrentUser } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /*
   * --------------------------------------------------
   * Load current authenticated user
   * --------------------------------------------------
   */
  async function loadUser() {
    try {
      const response = await getCurrentUser();

      if (import.meta.env.DEV) {
        console.log(
          '[AuthContext] Current user response:',
          response
        );
      }

      setUser(response?.user ?? null);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.log(
          '[AuthContext] User is not authenticated:',
          error
        );
      }

      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  /*
   * --------------------------------------------------
   * Initial authentication check
   * --------------------------------------------------
   */
  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    function handleAuthExpired() {
      if (import.meta.env.DEV) {
        console.warn(
          '[AuthContext] Authentication expired or is no longer valid.'
        );
      }

      setUser(null);
    }

    window.addEventListener(
      'auth-expired',
      handleAuthExpired
    );

    return () => {
      window.removeEventListener(
        'auth-expired',
        handleAuthExpired
      );
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        setUser,
        refreshUser: loadUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}