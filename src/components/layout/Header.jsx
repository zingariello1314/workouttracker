import React from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';
import { useTranslation } from '../../utils/translations';
import { useFormatters } from '../../utils/translations/formatters-hook';

const Header = () => {
  const { setActiveTab } = useWorkout();
  const { currentUser, isAuthenticated, logout } = useAuth();
  const t = useTranslation();
  const { formatDate } = useFormatters();

  const handleGoToToday = () => {
    setActiveTab('today');
  };

  const handleLoginClick = () => {
    setActiveTab('auth');
  };

  const handleLogout = async () => {
    await logout();
    setActiveTab('home');
  };

  const avatarInitial = currentUser?.username ? currentUser.username.charAt(0).toUpperCase() : 'M';

  return (
    <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/50 shadow-lg">
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
                  onClick={handleGoToToday}
                  className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-600/70 shadow-sm hover:bg-slate-700/90 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-sm font-semibold text-white shadow-md">
                    {avatarInitial}
                  </div>
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