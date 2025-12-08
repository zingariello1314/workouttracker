import React, { useEffect, useState } from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';
import { useTranslation } from '../../utils/translations';
import { useFormatters } from '../../utils/translations/formatters-hook';
import { getAvatarByUserId } from '../../utils/authIndexedDB';

const Header = () => {
  const { setActiveTab } = useWorkout();
  const { currentUser, isAuthenticated, logout } = useAuth();
  const t = useTranslation();
  const { formatDate } = useFormatters();
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
    <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/50 shadow-lg fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo et titre */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <img 
                src="/logo.png" 
                alt={t('common.header.logoAlt')} 
                className="w-12 h-12 rounded-lg"
              />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Momentum
              </h1>
            </div>
            <div className="text-sm text-slate-300">
              {formatDate(new Date(), { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
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
                  className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-600/70 shadow-sm hover:bg-slate-700/90 transition-colors"
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={currentUser?.username || 'Avatar'}
                      className="w-8 h-8 rounded-full object-cover shadow-md border border-white/10"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-sm font-semibold text-white shadow-md">
                      {avatarInitial}
                    </div>
                  )}
                  <span className="text-sm text-slate-100 font-medium">
                    {currentUser?.username || 'Profil'}
                  </span>
                </button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleLogout}
                >
                  Se déconnecter
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;