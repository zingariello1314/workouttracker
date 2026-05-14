/**
 * Paramètres du profil (avatar, email, mot de passe, migration).
 */

import React, { useMemo } from 'react';
import { User, Mail, Lock, Image, BadgeCheck, HelpCircle } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../../../ui/Card';
import { Input } from '../../../ui/Input';
import { settingsTheme as S } from '../settingsThemeClasses';
import { ONBOARDING_OPEN_EVENT, PROFILE_QUESTION_DEFS } from '../../../../features/profileQuestionnaire/constants';
import { normalizeProfileQuestionnaire } from '../../../../features/profileQuestionnaire/schema';
import {
  buildQuizPrefillPayload,
  PENDING_QUIZ_PREFILL_NUTRITION_KEY,
  PENDING_QUIZ_PREFILL_TRAINING_KEY,
  writePendingQuizPrefill
} from '../../../../features/profileQuestionnaire/prefill';

import { useProfileQuestionnaire } from '../../../../features/profileQuestionnaire/useProfileQuestionnaire';

const ProfileSettings = ({
  currentUser,
  profileSettings,
  setActiveTab,
  migrationSettings
}) => {
  const { snoozeQuizReminder } = useProfileQuestionnaire();

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
    emailCode,
    setEmailCode,
    emailCodeStatus,
    requestEmailCode,
    handleEmailUpdate,
    oldPassword,
    setOldPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    passwordStatus,
    passwordError,
    appLockCode,
    setAppLockCode,
    lockReady,
    handlePasswordUpdate,
  } = profileSettings;

  const {
    migrationStatus,
    migrationProgress,
    migrationPreview,
    previewStatus,
    rollbackStatus,
    handleMigrateData,
    handlePreviewMigration,
    handleRollbackMigration,
  } = migrationSettings || {};

  const fieldClass = `${S.input} px-4 py-3`;
  const emailVerified = currentUser?.emailVerified === true;
  const profileQuestionnaire = normalizeProfileQuestionnaire(currentUser?.profileQuestionnaire || null);
  const questionnaireAnswers = profileQuestionnaire?.answers || {};
  const quizStarted = profileQuestionnaire.completedCount > 0;
  const quizComplete =
    profileQuestionnaire.totalCount > 0 &&
    profileQuestionnaire.completedCount === profileQuestionnaire.totalCount;
  const questionMap = PROFILE_QUESTION_DEFS.reduce((acc, q) => {
    acc[q.id] = q;
    return acc;
  }, {});
  const summarizeAnswer = (questionId) => {
    const q = questionMap[questionId];
    const raw = questionnaireAnswers?.[questionId];
    if (!q || raw == null) return 'Non renseigné';
    if (Array.isArray(raw)) {
      if (raw.length === 0) return 'Non renseigné';
      if (q.type === 'days') return raw.join(', ');
      const optionsMap = new Map((q.options || []).map((opt) => [String(opt.key), opt.label]));
      return raw.map((x) => optionsMap.get(String(x)) || String(x)).join(', ');
    }
    if (q.type === 'slider') return `${raw}%`;
    if (q.type === 'vitals' && typeof raw === 'object' && !Array.isArray(raw)) {
      const bits = [];
      if (raw.sex === 'male') bits.push('H');
      else if (raw.sex === 'female') bits.push('F');
      else if (raw.sex === 'other') bits.push('Autre');
      if (raw.age != null) bits.push(`${raw.age} ans`);
      if (raw.weightKg != null) bits.push(`${raw.weightKg} kg`);
      if (raw.heightCm != null) bits.push(`${raw.heightCm} cm`);
      return bits.length ? bits.join(' · ') : 'Non renseigné';
    }
    const option = (q.options || []).find((opt) => String(opt.key) === String(raw));
    return option?.label || String(raw);
  };
  const canSubmitPassword =
    Boolean(newPassword && confirmPassword) &&
    Boolean((oldPassword && oldPassword.trim()) || (lockReady && appLockCode && appLockCode.trim()));
  const prefillPayload = buildQuizPrefillPayload(currentUser?.profileQuestionnaire || null);

  const quizHistoryCount = (profileQuestionnaire.quizRoundHistory || []).length;
  const showQuizRenewal = useMemo(() => {
    const done = profileQuestionnaire.onboardingWizardCompletedAt;
    if (!done) return false;
    const snoozeUntil = profileQuestionnaire.quizReminderSnoozeUntil;
    if (snoozeUntil && new Date(snoozeUntil) > new Date()) return false;
    const t = new Date(done).getTime();
    return Number.isFinite(t) && Date.now() - t > 90 * 86400000;
  }, [profileQuestionnaire.onboardingWizardCompletedAt, profileQuestionnaire.quizReminderSnoozeUntil]);

  return (
    <Card variant="settings" className="profile-input-dark">
      <CardHeader variant="settings">
        <CardTitle tone="settings" className="flex flex-wrap items-center gap-2 normal-case tracking-normal">
          <User className="mr-2 text-red-400" size={20} />
          Mon profil
          {emailVerified && (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-600/50 bg-emerald-950/40 px-2.5 py-0.5 text-xs font-medium text-emerald-200">
              <BadgeCheck className="h-3.5 w-3.5" />
              Email vérifié
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-3 rounded-xl border border-violet-800/40 bg-violet-950/20 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-violet-100">Profil onboarding & personnalisation</p>
              <span className="rounded-full border border-violet-600/50 bg-violet-900/35 px-2.5 py-0.5 text-[11px] text-violet-100/90">
                {profileQuestionnaire.completedCount}/{profileQuestionnaire.totalCount} réponses
              </span>
            </div>

            {showQuizRenewal ? (
              <div className="rounded-lg border border-amber-600/45 bg-amber-950/25 p-3 text-[11px] leading-relaxed text-amber-100/90">
                <p className="font-semibold text-amber-200">Ton dernier quiz date de plus de 3 mois</p>
                <p className="mt-1">
                  Refaire le bilan depuis ici met à jour les suggestions ; les versions précédentes restent consultables
                  dans <span className="text-amber-200">Sport → Récap</span>.
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => window.dispatchEvent(new Event(ONBOARDING_OPEN_EVENT))}
                    className={`${S.btnSecondary} text-xs`}
                  >
                    Nouveau bilan quiz
                  </button>
                  <button
                    type="button"
                    onClick={() => snoozeQuizReminder()}
                    className="rounded-lg border border-amber-800/60 px-3 py-1.5 text-xs text-amber-200 hover:bg-amber-950/40"
                  >
                    Rappeler dans 3 mois
                  </button>
                </div>
              </div>
            ) : null}

            {!quizStarted ? (
              <>
                <p className="text-xs leading-relaxed text-violet-100/80">
                  Fais le quiz pour débloquer une expérience plus complète et pouvoir générer plus facilement des
                  programmes d’entraînement et nutrition adaptés à ton profil.
                </p>
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new Event(ONBOARDING_OPEN_EVENT))}
                  className={`${S.btnPrimary} w-full`}
                >
                  Démarrer le quiz profil
                </button>
              </>
            ) : (
              <>
                <div className="rounded-lg border border-violet-700/40 bg-black/30 p-3 text-xs text-violet-100/80">
                  <p className="mb-2 font-medium text-violet-100">
                    {quizComplete
                      ? 'Quiz complété : voici ton récapitulatif principal.'
                      : 'Quiz partiellement complété : voici le récapitulatif actuel.'}
                    {quizHistoryCount > 0 ? (
                      <span className="ml-2 text-[10px] font-normal text-violet-300/80">
                        ({quizHistoryCount} bilan antérieur{quizHistoryCount > 1 ? 's' : ''} en archive — Récap)
                      </span>
                    ) : null}
                  </p>
                  <div className="grid gap-1.5">
                    <p><span className="text-violet-200/90">Mesures (quiz):</span> {summarizeAnswer('vitalsSelfReport')}</p>
                    <p><span className="text-violet-200/90">Objectif:</span> {summarizeAnswer('goalPhysique')}</p>
                    <p><span className="text-violet-200/90">Physique actuel:</span> {summarizeAnswer('currentPhysique')}</p>
                    <p><span className="text-violet-200/90">Priorités:</span> {summarizeAnswer('priorityMuscleGroups')}</p>
                    <p><span className="text-violet-200/90">Niveau:</span> {summarizeAnswer('experienceLevel')}</p>
                    <p><span className="text-violet-200/90">Lieu:</span> {summarizeAnswer('trainingLocation')}</p>
                    <p><span className="text-violet-200/90">Jours disponibles:</span> {summarizeAnswer('availableTrainingDays')}</p>
                    <p><span className="text-violet-200/90">Durée séance:</span> {summarizeAnswer('preferredSessionDuration')}</p>
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => window.dispatchEvent(new Event(ONBOARDING_OPEN_EVENT))}
                    className={`${S.btnSecondary} w-full`}
                  >
                    Mettre à jour le quiz
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      writePendingQuizPrefill(PENDING_QUIZ_PREFILL_TRAINING_KEY, prefillPayload);
                      if (setActiveTab) setActiveTab('program');
                    }}
                    className={`${S.btnSecondary} w-full`}
                  >
                    Générer entraînement
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      writePendingQuizPrefill(PENDING_QUIZ_PREFILL_NUTRITION_KEY, prefillPayload);
                      if (setActiveTab) setActiveTab('nutrition');
                    }}
                    className={`${S.btnSecondary} w-full`}
                  >
                    Générer nutrition
                  </button>
                </div>
              </>
            )}
          </div>

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

          <div className="space-y-3 rounded-xl border border-red-900/40 bg-black/30 p-4">
            <label className={`flex items-center ${S.label}`}>
              <Mail className="mr-2" size={16} />
              Adresse email
            </label>
            {!emailVerified && (
              <p className={`rounded-lg border border-amber-800/40 bg-amber-950/20 px-3 py-2 text-xs leading-relaxed text-amber-100/95`}>
                La vérification se fait ici quand tu veux : envoie le code, saisis-le, puis valide. Ce n’est pas
                obligatoire pour utiliser l’app ; une fois fait, une pastille « email vérifié » apparaît à côté de ton
                pseudo dans l’en-tête.
              </p>
            )}
            <ol className={`list-decimal space-y-1 pl-4 text-xs ${S.muted}`}>
              <li>Saisis l’adresse deux fois (identique) pour éviter les fautes de frappe.</li>
              <li>Envoie-toi le code, puis recopie-le ci-dessous.</li>
              <li>Valide : l’email est enregistré et marqué comme vérifié.</li>
            </ol>
            <details className="rounded-lg border border-slate-700/60 bg-slate-950/50 p-3 text-xs text-slate-300">
              <summary className="flex cursor-pointer list-none items-center gap-2 font-medium text-slate-200 [&::-webkit-details-marker]:hidden">
                <HelpCircle className="h-4 w-4 shrink-0 text-sky-400" />
                Envoi de mails gratuit (codes / liens)
              </summary>
              <ul className="mt-2 list-disc space-y-1.5 pl-4 text-slate-400">
                <li>
                  <strong className="text-slate-300">EmailJS</strong> — gratuit (~200 envois/mois), sans backend : crée
                  un compte sur emailjs.com, un service + modèle qui affiche <code className="text-sky-300">{'{{verification_code}}'}</code>, puis renseigne{' '}
                  <code className="text-sky-300">VITE_EMAILJS_SERVICE_ID</code>, <code className="text-sky-300">VITE_EMAILJS_TEMPLATE_ID</code>,{' '}
                  <code className="text-sky-300">VITE_EMAILJS_PUBLIC_KEY</code> dans ton <code className="text-sky-300">.env</code> (voir{' '}
                  <code className="text-sky-300">.env.example</code>).
                </li>
                <li>
                  <strong className="text-slate-300">Resend</strong> — couche gratuite généreuse ; nécessite un petit
                  backend pour cacher la clé API (ex. route sur ton serveur Python existant).
                </li>
                <li>
                  <strong className="text-slate-300">Brevo</strong> (ex-Sendinblue) — envois transactionnels gratuits
                  avec quotas ; idem, clé côté serveur.
                </li>
                <li>
                  <strong className="text-slate-300">SMTP Gmail / Outlook</strong> — possible en perso avec mot de
                  passe d’application ; à utiliser depuis le backend uniquement.
                </li>
              </ul>
              <p className="mt-2 text-[11px] text-slate-500">
                Sans EmailJS configuré, l’app affiche le code à l’écran (mode secours) : pratique en dev, à éviter en
                production.
              </p>
            </details>
            <div className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Adresse email"
                className={fieldClass}
              />
              <input
                type="email"
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                placeholder="Confirmer la même adresse email"
                className={fieldClass}
              />
              <button
                type="button"
                onClick={requestEmailCode}
                disabled={emailStatus === 'loading' || !email || !confirmEmail}
                className={`${S.btnPrimary} w-full`}
              >
                {emailStatus === 'loading' ? 'Envoi...' : 'Envoyer le code de vérification'}
              </button>
              <input
                type="text"
                inputMode="numeric"
                value={emailCode}
                onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                placeholder="Code reçu par email (6 chiffres)"
                className={fieldClass}
              />
              <button
                type="button"
                onClick={handleEmailUpdate}
                disabled={emailStatus === 'loading' || !emailCode.trim()}
                className={`${S.btnSecondary} w-full`}
              >
                Vérifier le code et enregistrer l&apos;email
              </button>
              {emailCodeStatus && (
                <span
                  className={`block text-xs ${
                    /Code envoyé|vérifié|fallback/i.test(emailCodeStatus) ? 'text-emerald-400' : 'text-red-300'
                  }`}
                >
                  {emailCodeStatus}
                </span>
              )}
              {emailError && <span className="block text-xs text-red-400">{emailError}</span>}
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
            <p className={`text-xs leading-relaxed ${S.muted}`}>
              Pour confirmer ton identité : soit ton <strong className="text-slate-200">mot de passe actuel</strong>
              {lockReady ? (
                <>
                  , soit le <strong className="text-slate-200">code de verrouillage de l’app</strong> si tu l’as
                  configuré dans Paramètres → Verrouillage (l’un ou l’autre suffit).
                </>
              ) : (
                <>.</>
              )}{' '}
              Le <strong className="text-slate-200">nouveau</strong> mot de passe doit être saisi{' '}
              <strong className="text-slate-200">deux fois identiquement</strong>, avec au moins 8 caractères, une
              majuscule et un caractère spécial (comme à l’inscription). En mode compte serveur, l’ancien mot de passe
              reste exigé par l’API même si le code app est reconnu localement.
            </p>
            <div className="space-y-3 rounded-xl border border-red-900/40 bg-black/30 p-4">
              {lockReady && (
                <input
                  type="password"
                  value={appLockCode}
                  onChange={(e) => setAppLockCode(e.target.value)}
                  placeholder="Code de verrouillage de l’app (alternative au mot de passe actuel)"
                  autoComplete="off"
                  className={fieldClass}
                />
              )}
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Mot de passe actuel du compte"
                autoComplete="current-password"
                className={fieldClass}
              />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nouveau mot de passe (8+ car., 1 maj., 1 car. spécial)"
                autoComplete="new-password"
                className={fieldClass}
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Retaper le nouveau mot de passe à l’identique"
                autoComplete="new-password"
                className={fieldClass}
              />
              <button
                type="button"
                onClick={handlePasswordUpdate}
                disabled={passwordStatus === 'loading' || !canSubmitPassword}
                className={`${S.btnPrimary} w-full`}
              >
                {passwordStatus === 'loading' ? 'Mise à jour...' : 'Changer le mot de passe'}
              </button>
              {passwordError && <span className="block text-xs text-red-400">{passwordError}</span>}
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
                onClick={handlePreviewMigration}
                disabled={previewStatus === 'loading' || migrationStatus === 'loading'}
                className={`${S.btnSecondary} mr-2 disabled:opacity-50`}
              >
                {previewStatus === 'loading' ? 'Analyse…' : 'Prévisualiser la migration'}
              </button>
              <button
                type="button"
                onClick={handleMigrateData}
                disabled={migrationStatus === 'loading'}
                className={`${S.btnPrimary} disabled:opacity-50`}
              >
                Associer mes données locales à ce compte
              </button>
              <button
                type="button"
                onClick={handleRollbackMigration}
                disabled={rollbackStatus === 'loading'}
                className={`${S.btnSecondary} ml-2 disabled:opacity-50`}
              >
                {rollbackStatus === 'loading' ? 'Rollback…' : 'Rollback dernière migration'}
              </button>

              {previewStatus === 'ready' && migrationPreview && (
                <div className="mt-3 rounded border border-red-900/45 bg-black/40 p-3 text-xs text-red-100">
                  <p className="mb-1 font-medium">Prévisualisation :</p>
                  <p>Livres: {migrationPreview.books}</p>
                  <p>Nutrition: {migrationPreview.nutrition}</p>
                  <p>Body tracking: {migrationPreview.bodyTracking}</p>
                  <p>Garmin: {migrationPreview.garmin}</p>
                  <p>Programmes: {migrationPreview.programs}</p>
                  <p>Quêtes: {migrationPreview.quietQuest || 0}</p>
                  <p>Apprentissage: {migrationPreview.apprentissage || 0}</p>
                  <p>Finance: {migrationPreview.finance || 0}</p>
                  <p>Paramètres Garmin: {migrationPreview.garminSettings || 0}</p>
                  <p className="mt-1 font-semibold">Total: {migrationPreview.total}</p>
                </div>
              )}
              {previewStatus === 'error' && (
                <p className="mt-2 text-xs text-red-400">Impossible de prévisualiser la migration.</p>
              )}
              {rollbackStatus === 'success' && (
                <p className="mt-2 text-xs text-emerald-400">Rollback terminé avec succès.</p>
              )}
              {rollbackStatus === 'error' && (
                <p className="mt-2 text-xs text-red-400">Rollback impossible ou aucun snapshot disponible.</p>
              )}

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
