import { useState, useEffect } from 'react';

/**
 * Hook pour gérer l'authentification
 * Pour l'instant, retourne un utilisateur par défaut
 * À remplacer par votre système d'authentification réel
 */
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simuler le chargement de l'utilisateur
    // TODO: Remplacer par votre logique d'authentification réelle
    const loadUser = () => {
      try {
        // Essayer de récupérer l'utilisateur depuis localStorage
        const storedUser = localStorage.getItem('currentUser');
        
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        } else {
          // Utilisateur par défaut (admin pour les tests)
          const defaultUser = {
            username: 'zingariello1314',
            email: 'admin@quietquest.com',
            role: 'admin'
          };
          setUser(defaultUser);
          localStorage.setItem('currentUser', JSON.stringify(defaultUser));
        }
      } catch (error) {
        console.error('[useAuth] Erreur lors du chargement de l\'utilisateur:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  /**
   * Connecte un utilisateur
   * @param {string} username - Nom d'utilisateur
   */
  const login = (username) => {
    const newUser = {
      username,
      email: `${username}@quietquest.com`,
      role: username === 'zingariello1314' ? 'admin' : 'user'
    };
    setUser(newUser);
    localStorage.setItem('currentUser', JSON.stringify(newUser));
  };

  /**
   * Déconnecte l'utilisateur
   */
  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    login,
    logout
  };
};

export default useAuth;
