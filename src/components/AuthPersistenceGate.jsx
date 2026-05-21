import React from 'react';
import { useAuth } from '../context/AuthContext';
import { MomentumTabLoadOverlay } from './ui/MomentumBrandedLoading';

/**
 * Bloque le montage des providers de données tant que la session n'est pas résolue.
 * Évite storageKey=anonymous + écrasement des données au premier rendu après F5.
 */
export default function AuthPersistenceGate({ children }) {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <MomentumTabLoadOverlay message="Restauration de votre session…" />
      </div>
    );
  }

  return children;
}
