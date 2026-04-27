import { useAuth as useAuthContext } from '../context/AuthContext';
import { isAdminUser } from '../utils/accessControl';

/**
 * Hook legacy conservé pour compatibilité.
 * Redirige vers AuthContext pour éviter toute dérive de sécurité.
 */
export const useAuth = () => {
  const auth = useAuthContext();
  return {
    user: auth.currentUser,
    isLoading: auth.loading,
    isAuthenticated: auth.isAuthenticated,
    isAdmin: isAdminUser(auth.currentUser),
    login: auth.login,
    logout: auth.logout
  };
};

export default useAuth;
