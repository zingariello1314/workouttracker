import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWorkout } from '../context/WorkoutContext';
import Card from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import { useTranslation } from '../utils/translations';
import Hyperspeed from './ui/Hyperspeed/Hyperspeed';
import { hyperspeedPresets } from './ui/Hyperspeed/hyperspeedPresets';

// Fonction de détection WebGL
const checkWebGLSupport = () => {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return !!gl;
  } catch (e) {
    return false;
  }
};

const AuthPage = () => {
  const { currentUser, isAuthenticated, loading, error, register, login, setError } = useAuth();
  const { setActiveTab } = useWorkout();
  const t = useTranslation();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [webglSupported, setWebglSupported] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Détection WebGL et mobile
  useEffect(() => {
    setWebglSupported(checkWebGLSupport());
    setIsMobile(window.innerWidth < 768);
    
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Si déjà connecté, rediriger immédiatement vers Aujourd'hui
  useEffect(() => {
    if (isAuthenticated) {
      setActiveTab('today');
    }
  }, [isAuthenticated, setActiveTab]);

  const resetError = () => {
    if (error && setError) {
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    resetError();
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login({ username, password, remember });
      } else {
        await register({ username, email, password });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const errorMessage = error === 'USERNAME_TAKEN'
    ? 'Ce nom d’utilisateur est déjà utilisé.'
    : error === 'INVALID_CREDENTIALS'
      ? 'Identifiants invalides.'
      : error === 'CREATE_FAILED'
        ? 'Erreur lors de la création du compte.'
        : error === 'LOGIN_FAILED'
          ? 'Erreur lors de la connexion.'
          : null;

  // Options optimisées selon le device
  const optimizedOptions = isMobile
    ? {
        ...hyperspeedPresets.one,
        totalSideLightSticks: 15,
        lightPairsPerRoadWay: 30,
        lanesPerRoad: 2,
      }
    : hyperspeedPresets.one;

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-10 overflow-hidden">
      {/* Fond animé Hyperspeed ou fallback */}
      <div className="fixed inset-0 z-0 w-full h-full">
        {webglSupported ? (
          <Hyperspeed effectOptions={optimizedOptions} />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900" />
        )}
      </div>

      {/* Contenu de connexion (au-dessus) */}
      <div className="relative z-10 max-w-3xl w-full grid gap-8 md:grid-cols-2 items-stretch">
        <Card variant="glass" padding="lg" className="h-full flex flex-col justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-4 text-white">
              {mode === 'login' ? 'Connexion à Momentum' : 'Créer un compte Momentum'}
            </h2>
            <p className="text-slate-300 text-sm mb-6">
              {mode === 'login'
                ? 'Connecte-toi pour retrouver toutes tes données et ton globe de livres.'
                : 'Crée un compte local pour lier toutes tes données d’entraînement, de nutrition et de livres.'}
            </p>
          </div>
          <div className="space-y-3 text-xs text-slate-400">
            <p>
              • Données stockées localement en IndexedDB, sans envoi vers un serveur.
            </p>
            <p>
              • Tu pourras ensuite migrer toutes tes données existantes vers ce compte depuis l’onglet Paramètres.
            </p>
            {currentUser && (
              <p className="text-emerald-400">
                Connecté en tant que <span className="font-semibold">{currentUser.username}</span>.
              </p>
            )}
          </div>
          
          {/* ✅ Bouton Premium */}
          <div className="mt-6 pt-4 border-t border-white/10">
            <Button
              onClick={() => setActiveTab('pricing')}
              variant="primary"
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 shadow-lg shadow-purple-500/50"
            >
              ⭐ Passer à l'abonnement premium
            </Button>
          </div>
        </Card>

        <Card variant="glass" padding="lg" className="h-full">
          <div className="flex mb-6 border-b border-white/10">
            <button
              type="button"
              onClick={() => { setMode('login'); resetError(); }}
              className={`flex-1 py-2 text-sm font-semibold ${
                mode === 'login'
                  ? 'text-white border-b-2 border-purple-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Se connecter
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); resetError(); }}
              className={`flex-1 py-2 text-sm font-semibold ${
                mode === 'register'
                  ? 'text-white border-b-2 border-purple-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Créer un compte
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Nom d’utilisateur"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              variant="glass"
            />

            {mode === 'register' && (
              <Input
                label="E‑mail (optionnel)"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                variant="glass"
              />
            )}

            <Input
              label="Mot de passe"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              variant="glass"
              minLength={8}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              help="Au moins 8 caractères. Idéalement une combinaison de lettres, chiffres et symboles."
            />

            {mode === 'login' && (
              <label className="flex items-center gap-2 text-xs text-slate-300 mt-1">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="rounded border-slate-500 bg-slate-800 text-purple-400 focus:ring-purple-500"
                />
                Se souvenir de moi sur cet appareil
              </label>
            )}

            {errorMessage && (
              <div className="text-xs text-red-400 mt-2">
                {errorMessage}
              </div>
            )}

            <div className="pt-4">
              <Button
                type="submit"
                variant="primary"
                className="w-full"
                disabled={loading || submitting}
              >
                {submitting || loading
                  ? (mode === 'login' ? 'Connexion…' : 'Création du compte…')
                  : (mode === 'login' ? 'Se connecter' : 'Créer mon compte')}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default AuthPage;


