/**
 * Composant ProfileSettings - Interface utilisateur pour les paramètres du profil
 * 
 * ✅ PHASE 4 : Extraction de l'UI pour Avatar, Email, Password
 * 
 * @module components/tabs/SettingsTab/components/ProfileSettings
 */

import React from 'react';
import { User, Mail, Lock, Image } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../../../ui/Card';
import { Input } from '../../../ui/Input';

/**
 * Composant pour gérer les paramètres du profil utilisateur
 * 
 * @param {Object} currentUser - Utilisateur actuel
 * @param {Object} profileSettings - Données du hook useProfileSettings
 * @param {Function} setActiveTab - Fonction pour changer d'onglet
 * @param {Object} migrationSettings - Données du hook useDataMigration
 * @returns {JSX.Element}
 */
const ProfileSettings = ({
  currentUser,
  profileSettings,
  setActiveTab,
  migrationSettings
}) => {
  if (!currentUser) return null;

  const {
    avatarPreviewUrl,
    avatarStatus,
    avatarFileRef,
    handleAvatarChange,
    usernameInitial,
    email,
    setEmail,
    confirmEmail,
    setConfirmEmail,
    emailStatus,
    emailError,
    handleEmailUpdate,
    oldPassword,
    setOldPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    passwordStatus,
    passwordError,
    handlePasswordUpdate,
  } = profileSettings;

  const {
    migrationStatus,
    migrationProgress,
    handleMigrateData,
  } = migrationSettings || {};

  return (
    <Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700 profile-input-dark">
      <CardHeader>
        <CardTitle className="flex items-center text-white">
          <User className="mr-2" size={20} />
          Mon profil
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Photo de profil */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-200 flex items-center">
              <Image className="mr-2" size={16} />
              Photo de profil
            </label>
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full overflow-hidden shadow-lg border border-white/20 flex items-center justify-center bg-gradient-to-br from-purple-500 to-blue-600">
                {avatarPreviewUrl ? (
                  <img
                    src={avatarPreviewUrl}
                    alt={currentUser.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-semibold text-white">{usernameInitial}</span>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <input
                  ref={avatarFileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="text-xs text-slate-300 file:mr-3 file:px-3 file:py-1.5 file:rounded-md file:border-0 file:bg-purple-600 file:text-white hover:file:bg-purple-700 cursor-pointer"
                />
                {avatarStatus === 'loading' && (
                  <span className="text-xs text-slate-300">Mise à jour…</span>
                )}
                {avatarStatus === 'success' && (
                  <span className="text-xs text-emerald-400">✅ Avatar mis à jour avec succès</span>
                )}
                {avatarStatus === 'error' && (
                  <span className="text-xs text-red-400">❌ Erreur lors de la mise à jour</span>
                )}
              </div>
            </div>
          </div>

          {/* Nom d'utilisateur (non modifiable) */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200 flex items-center">
              <User className="mr-2" size={16} />
              Nom d'utilisateur
            </label>
            <Input
              type="text"
              value={currentUser.username}
              disabled
              className="!bg-slate-700/50 !text-slate-300 cursor-not-allowed"
            />
            <p className="text-xs text-slate-400">Le nom d'utilisateur ne peut pas être modifié</p>
          </div>

          {/* Email */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-200 flex items-center">
              <Mail className="mr-2" size={16} />
              Adresse email
            </label>
            <div className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Nouvelle adresse email"
                style={{ backgroundColor: 'rgb(51 65 85)', color: '#e2e8f0', borderColor: '#475569' }}
                className="w-full px-4 py-3 !bg-slate-700 !text-slate-200 !border-slate-600 border rounded-lg placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-500 transition-all duration-200 focus:outline-none"
              />
              <input
                type="email"
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                placeholder="Confirmer votre adresse email"
                style={{ backgroundColor: 'rgb(51 65 85)', color: '#e2e8f0', borderColor: '#475569' }}
                className="w-full px-4 py-3 !bg-slate-700 !text-slate-200 !border-slate-600 border rounded-lg placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-500 transition-all duration-200 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleEmailUpdate}
                disabled={emailStatus === 'loading' || !email || !confirmEmail || (email === (currentUser.email || '') && confirmEmail === (currentUser.email || ''))}
                className="gradient-button-premium gradient-button-premium-md rounded-lg w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {emailStatus === 'loading' ? 'Mise à jour...' : 'Enregistrer l\'email'}
              </button>
              {emailError && (
                <span className="text-xs text-red-400 block">{emailError}</span>
              )}
              {emailStatus === 'success' && (
                <span className="text-xs text-emerald-400">✅ Email mis à jour avec succès</span>
              )}
            </div>
          </div>

          {/* Mot de passe */}
          <div className="space-y-3 pt-4 border-t border-slate-700">
            <label className="text-sm font-medium text-slate-200 flex items-center">
              <Lock className="mr-2" size={16} />
              Changer le mot de passe
            </label>
            <div className="space-y-3">
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Renseignez votre mot de passe actuel"
                autoComplete="off"
                style={{ backgroundColor: 'rgb(51 65 85)', color: '#e2e8f0', borderColor: '#475569' }}
                className="w-full px-4 py-3 !bg-slate-700 !text-slate-200 !border-slate-600 border rounded-lg placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 hover:border-slate-500 transition-all duration-200 focus:outline-none"
              />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nouveau mot de passe (min. 6 caractères)"
                autoComplete="new-password"
                style={{ backgroundColor: 'rgb(51 65 85)', color: '#e2e8f0', borderColor: '#475569' }}
                className="w-full px-4 py-3 !bg-slate-700 !text-slate-200 !border-slate-600 border rounded-lg placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 hover:border-slate-500 transition-all duration-200 focus:outline-none"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirmer votre mot de passe"
                autoComplete="new-password"
                style={{ backgroundColor: 'rgb(51 65 85)', color: '#e2e8f0', borderColor: '#475569' }}
                className="w-full px-4 py-3 !bg-slate-700 !text-slate-200 !border-slate-600 border rounded-lg placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 hover:border-slate-500 transition-all duration-200 focus:outline-none"
              />
              <button
                type="button"
                onClick={handlePasswordUpdate}
                disabled={passwordStatus === 'loading' || !oldPassword || !newPassword || !confirmPassword}
                className="gradient-button-premium gradient-button-premium-md rounded-lg w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {passwordStatus === 'loading' ? 'Mise à jour...' : 'Changer le mot de passe'}
              </button>
              {passwordError && (
                <span className="text-xs text-red-400 block">{passwordError}</span>
              )}
              {passwordStatus === 'success' && (
                <span className="text-xs text-emerald-400">✅ Mot de passe mis à jour avec succès</span>
              )}
            </div>
          </div>

          {/* Bouton Premium */}
          {setActiveTab && (
            <div className="space-y-3 pt-4 border-t border-slate-700">
              <button
                type="button"
                onClick={() => setActiveTab('pricing')}
                className="gradient-button-premium gradient-button-premium-lg gradient-button-premium-variant rounded-lg w-full flex items-center justify-center gap-2"
              >
                <span>⭐</span>
                <span>Passer à l'abonnement premium</span>
              </button>
              <p className="text-xs text-slate-400 text-center">
                Débloquez toutes les fonctionnalités avancées de Momentum
              </p>
            </div>
          )}

          {/* Migration des données */}
          {migrationSettings && (
            <div className="pt-4 border-t border-slate-700 mt-4">
              <p className="text-xs text-slate-400 mb-3">
                Tu peux associer toutes tes données locales actuelles (notamment les livres) à ce compte.
              </p>
              <button
                type="button"
                onClick={handleMigrateData}
                disabled={migrationStatus === 'loading'}
                className="gradient-button-premium gradient-button-premium-md rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Associer mes données locales à ce compte
              </button>
              
              {migrationStatus === 'loading' && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                    <span>{migrationProgress.message || 'Migration en cours...'}</span>
                    <span>{migrationProgress.current} / {migrationProgress.total}</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
                      style={{ 
                        width: `${migrationProgress.total > 0 ? (migrationProgress.current / migrationProgress.total) * 100 : 0}%` 
                      }}
                    />
                  </div>
                </div>
              )}
              
              {migrationStatus === 'success' && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs text-emerald-400">
                    ✅ Migration terminée avec succès !
                  </p>
                  {migrationProgress.message && (
                    <p className="text-xs text-slate-300">
                      {migrationProgress.message}
                    </p>
                  )}
                </div>
              )}
              
              {migrationStatus === 'error' && (
                <p className="text-xs text-red-400 mt-2">
                  ❌ Erreur lors de la migration. Réessaie plus tard.
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileSettings;
