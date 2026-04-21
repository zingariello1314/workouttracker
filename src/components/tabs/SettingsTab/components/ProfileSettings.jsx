/**
 * Paramètres du profil (avatar, email, mot de passe, migration).
 */

import React from 'react';
import { User, Mail, Lock, Image } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../../../ui/Card';
import { Input } from '../../../ui/Input';
import { settingsTheme as S } from '../settingsThemeClasses';

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

  const fieldClass = `${S.input} px-4 py-3`;

  return (
    <Card variant="settings" className="profile-input-dark">
      <CardHeader variant="settings">
        <CardTitle tone="settings" className="flex items-center normal-case tracking-normal">
          <User className="mr-2 text-red-400" size={20} />
          Mon profil
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-3">
            <label className={`flex items-center ${S.label}`}>
              <Image className="mr-2" size={16} />
              Photo de profil
            </label>
            <div className="flex items-center gap-6">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-red-700/60 bg-gradient-to-br from-red-950 to-black shadow-lg">
                {avatarPreviewUrl ? (
                  <img
                    src={avatarPreviewUrl}
                    alt={currentUser.username}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-semibold text-red-100">{usernameInitial}</span>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <input
                  ref={avatarFileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="cursor-pointer text-xs text-red-200/80 file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-red-900/70 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-red-50 hover:file:bg-red-800/80"
                />
                {avatarStatus === 'loading' && (
                  <span className={`text-xs ${S.muted}`}>Mise à jour…</span>
                )}
                {avatarStatus === 'success' && (
                  <span className="text-xs text-emerald-400">Avatar mis à jour avec succès</span>
                )}
                {avatarStatus === 'error' && (
                  <span className="text-xs text-red-400">Erreur lors de la mise à jour</span>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className={`flex items-center ${S.label}`}>
              <User className="mr-2" size={16} />
              Nom d'utilisateur
            </label>
            <Input
              type="text"
              value={currentUser.username}
              disabled
              className="!cursor-not-allowed !border-red-900/50 !bg-black !text-red-300/80"
            />
            <p className={S.mutedXs}>Le nom d'utilisateur ne peut pas être modifié</p>
          </div>

          <div className="space-y-3">
            <label className={`flex items-center ${S.label}`}>
              <Mail className="mr-2" size={16} />
              Adresse email
            </label>
            <div className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Nouvelle adresse email"
                className={fieldClass}
              />
              <input
                type="email"
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                placeholder="Confirmer votre adresse email"
                className={fieldClass}
              />
              <button
                type="button"
                onClick={handleEmailUpdate}
                disabled={emailStatus === 'loading' || !email || !confirmEmail || (email === (currentUser.email || '') && confirmEmail === (currentUser.email || ''))}
                className={`${S.btnPrimary} w-full`}
              >
                {emailStatus === 'loading' ? 'Mise à jour...' : 'Enregistrer l\'email'}
              </button>
              {emailError && (
                <span className="block text-xs text-red-400">{emailError}</span>
              )}
              {emailStatus === 'success' && (
                <span className="text-xs text-emerald-400">Email mis à jour avec succès</span>
              )}
            </div>
          </div>

          <div className="space-y-3 border-t border-red-900/45 pt-4">
            <label className={`flex items-center ${S.label}`}>
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
                className={fieldClass}
              />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nouveau mot de passe (min. 6 caractères)"
                autoComplete="new-password"
                className={fieldClass}
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirmer votre mot de passe"
                autoComplete="new-password"
                className={fieldClass}
              />
              <button
                type="button"
                onClick={handlePasswordUpdate}
                disabled={passwordStatus === 'loading' || !oldPassword || !newPassword || !confirmPassword}
                className={`${S.btnPrimary} w-full`}
              >
                {passwordStatus === 'loading' ? 'Mise à jour...' : 'Changer le mot de passe'}
              </button>
              {passwordError && (
                <span className="block text-xs text-red-400">{passwordError}</span>
              )}
              {passwordStatus === 'success' && (
                <span className="text-xs text-emerald-400">Mot de passe mis à jour avec succès</span>
              )}
            </div>
          </div>

          {setActiveTab && (
            <div className="space-y-3 border-t border-red-900/45 pt-4">
              <button
                type="button"
                onClick={() => setActiveTab('pricing')}
                className={`${S.btnSecondary} w-full gap-2`}
              >
                <span>⭐</span>
                <span>Passer à l'abonnement premium</span>
              </button>
              <p className={`text-center text-xs ${S.muted}`}>
                Débloquez toutes les fonctionnalités avancées de Momentum
              </p>
            </div>
          )}

          {migrationSettings && (
            <div className="mt-4 border-t border-red-900/45 pt-4">
              <p className={`mb-3 text-xs ${S.muted}`}>
                Tu peux associer toutes tes données locales actuelles (notamment les livres) à ce compte.
              </p>
              <button
                type="button"
                onClick={handleMigrateData}
                disabled={migrationStatus === 'loading'}
                className={`${S.btnPrimary} disabled:opacity-50`}
              >
                Associer mes données locales à ce compte
              </button>

              {migrationStatus === 'loading' && (
                <div className="mt-4 space-y-2">
                  <div className={`mb-1 flex items-center justify-between text-xs ${S.muted}`}>
                    <span>{migrationProgress.message || 'Migration en cours...'}</span>
                    <span>{migrationProgress.current} / {migrationProgress.total}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-red-950/60">
                    <div
                      className="h-2 rounded-full bg-red-600 transition-all duration-300 ease-out"
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
                    Migration terminée avec succès !
                  </p>
                  {migrationProgress.message && (
                    <p className={`text-xs ${S.muted}`}>
                      {migrationProgress.message}
                    </p>
                  )}
                </div>
              )}

              {migrationStatus === 'error' && (
                <p className="mt-2 text-xs text-red-400">
                  Erreur lors de la migration. Réessaie plus tard.
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
