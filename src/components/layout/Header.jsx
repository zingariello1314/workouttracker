import React, { useEffect, useState } from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';
import { useTranslation } from '../../utils/translations';
import { getAvatarByUserId } from '../../utils/authIndexedDB';

const Header = () => {
  const { setActiveTab } = useWorkout();
  const { currentUser, isAuthenticated, logout } = useAuth();
  const t = useTranslation();
  const [avatarUrl, setAvatarUrl] = useState(null);

  const handleGoToSettings = () => {
    setActiveTab('settings');
  };

  const handleLoginClick = () => {
    setActiveTab('auth');
  };

  const handleLogout = async () => {
    await logout();
    setActiveTab('home');
  };

  const avatarInitial = currentUser?.username ? currentUser.username.charAt(0).toUpperCase() : 'M';

  useEffect(() => {
    let revokedUrl = null;
    const loadAvatar = async () => {
      if (!currentUser?.id) {
        setAvatarUrl(null);
        return;
      }
      const record = await getAvatarByUserId(currentUser.id);
      if (record && record.blob) {
        const url = URL.createObjectURL(record.blob);
        revokedUrl = url;
        setAvatarUrl(url);
      } else {
        setAvatarUrl(null);
      }
    };
    loadAvatar().catch(() => {
      setAvatarUrl(null);
    });
    return () => {
      if (revokedUrl) {
        URL.revokeObjectURL(revokedUrl);
      }
    };
  }, [currentUser?.id]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10" style={{
      background: 'transparent',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
    }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo et titre */}
          <div className="flex items-center space-x-3">
            <img 
              src="/logo.png" 
              alt={t('common.header.logoAlt')} 
              className="w-12 h-12 rounded-lg shadow-lg"
            />
            <h1 
              className="text-2xl sm:text-3xl font-extrabold relative"
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              {/* Ombre portée simple pour la profondeur */}
              <span
                className="absolute inset-0"
                style={{
                  color: 'rgba(0, 0, 0, 0.4)',
                  transform: 'translate(1px, 1px)',
                  zIndex: 0,
                }}
              >
                Momentum
              </span>
              
              {/* Texte principal - Gradient clair et lisible harmonisé avec logo et thème */}
              <span
                className="relative z-10"
                style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #e0f2fe 25%, #a7f3d0 50%, #06b6d4 75%, #e0f2fe 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                  filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2))',
                }}
              >
                Momentum
              </span>
            </h1>
          </div>

          {/* Actions / Auth */}
          <div className="flex items-center space-x-4">
            {!isAuthenticated ? (
              <Button
                variant="primary"
                size="sm"
                onClick={handleLoginClick}
              >
                Se connecter
              </Button>
            ) : (
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={handleGoToSettings}
                  className="relative flex items-center space-x-2 px-3 py-1.5 rounded-full font-medium transition-all duration-300 overflow-hidden group"
                  style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                  }}
                >
                  {/* Effet de brillance au survol */}
                  <span
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full"
                    style={{
                      background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.15) 50%, transparent 100%)',
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 2s infinite',
                    }}
                  />
                  
                  {/* Contenu du bouton */}
                  <span className="relative z-10 flex items-center space-x-2">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={currentUser?.username || 'Avatar'}
                        className="w-8 h-8 rounded-full object-cover shadow-md border border-white/10"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 via-cyan-500 to-blue-500 flex items-center justify-center text-sm font-semibold text-white shadow-md">
                        {avatarInitial}
                      </div>
                    )}
                    <span 
                      className="text-sm text-slate-100 font-medium"
                      style={{
                        textShadow: '0 0 8px rgba(241, 245, 249, 0.2), 0 1px 2px rgba(0, 0, 0, 0.4)',
                      }}
                    >
                      {currentUser?.username || 'Profil'}
                    </span>
                  </span>
                  
                  {/* Effet hover - bordure lumineuse */}
                  <span
                    className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      border: '1px solid rgba(148, 163, 184, 0.4)',
                      boxShadow: '0 0 12px rgba(148, 163, 184, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
                    }}
                  />
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="relative px-4 py-2 rounded-lg font-semibold text-sm uppercase tracking-wide transition-all duration-300 overflow-hidden group"
                  style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    color: '#f1f5f9',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                  }}
                >
                  {/* Effet de brillance au survol */}
                  <span
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.15) 50%, transparent 100%)',
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 2s infinite',
                    }}
                  />
                  
                  {/* Texte avec glow subtil */}
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <span
                      style={{
                        textShadow: '0 0 8px rgba(241, 245, 249, 0.3), 0 1px 2px rgba(0, 0, 0, 0.5)',
                      }}
                    >
                      SE DÉCONNECTER
                    </span>
                  </span>
                  
                  {/* Effet hover - bordure lumineuse */}
                  <span
                    className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      border: '1px solid rgba(148, 163, 184, 0.4)',
                      boxShadow: '0 0 12px rgba(148, 163, 184, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
                    }}
                  />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;