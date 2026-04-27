/**
 * Hook useProfileSettings - Gestion du profil utilisateur
 * 
 * ✅ PHASE 4 : Extraction de la logique de gestion du profil (Avatar, Email, Password)
 * 
 * Gère l'avatar, l'email et le mot de passe de l'utilisateur
 * 
 * @module components/tabs/SettingsTab/hooks/useProfileSettings
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { getAvatarByUserId } from '../../../../utils/authIndexedDB';
import { requestEmailVerificationCode, verifyEmailCode } from '../../../../utils/emailVerificationService';
import { useAppLock } from '../../../../context/AppLockContext';

/**
 * Hook pour gérer les paramètres du profil utilisateur
 * 
 * @param {Object} currentUser - Utilisateur actuel
 * @param {Function} updateAvatar - Fonction pour mettre à jour l'avatar
 * @param {Function} updateProfile - Fonction pour mettre à jour le profil
 * @param {Function} updatePassword - Fonction pour mettre à jour le mot de passe
 * @returns {Object} État et handlers pour le profil
 */
export const useProfileSettings = (currentUser, updateAvatar, updateProfile, updatePassword) => {
  const { lockReady, unlockWithCode } = useAppLock();
  // Avatar
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState(null);
  const [avatarStatus, setAvatarStatus] = useState(null); // 'success' | 'error' | 'loading' | null
  const avatarFileRef = useRef(null);

  // Email
  const [email, setEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [emailStatus, setEmailStatus] = useState(null); // 'success' | 'error' | 'loading' | null
  const [emailError, setEmailError] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [emailCodeStatus, setEmailCodeStatus] = useState('');

  // Password
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState(null); // 'success' | 'error' | 'loading' | null
  const [passwordError, setPasswordError] = useState('');
  const [appLockCode, setAppLockCode] = useState('');

  const usernameInitial = currentUser?.username?.charAt(0).toUpperCase() || 'M';

  // Charger l'avatar et l'email au chargement
  useEffect(() => {
    if (!currentUser?.id) {
      setAvatarPreviewUrl(null);
      setEmail('');
      return;
    }

    // Charger l'avatar
    let revokedUrl = null;
    const loadAvatar = async () => {
      const record = await getAvatarByUserId(currentUser.id);
      if (record && record.blob) {
        const url = URL.createObjectURL(record.blob);
        revokedUrl = url;
        setAvatarPreviewUrl(url);
      } else {
        setAvatarPreviewUrl(null);
      }
    };
    loadAvatar().catch(() => {
      setAvatarPreviewUrl(null);
    });

    // Charger l'email
    setEmail(currentUser.email || '');
    // Si l’email n’est pas encore vérifié, pré-remplir la confirmation pour accélérer l’envoi du code
    setConfirmEmail(
      currentUser.email && currentUser.emailVerified !== true ? currentUser.email || '' : ''
    );
    // Réinitialiser les mots de passe
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');

    return () => {
      if (revokedUrl) {
        URL.revokeObjectURL(revokedUrl);
      }
    };
  }, [currentUser?.id, currentUser?.email]);

  // Handler pour changer l'avatar
  const handleAvatarChange = useCallback(async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file || !currentUser) return;

    setAvatarStatus('loading');
    try {
      const result = await updateAvatar(file);
      if (result.success) {
        if (avatarPreviewUrl) {
          URL.revokeObjectURL(avatarPreviewUrl);
        }
        const url = URL.createObjectURL(file);
        setAvatarPreviewUrl(url);
        setAvatarStatus('success');
        setTimeout(() => setAvatarStatus(null), 3000);
      } else {
        setAvatarStatus('error');
        setTimeout(() => setAvatarStatus(null), 3000);
      }
    } catch (error) {
      console.error('[SettingsTab] Erreur lors de la mise à jour de l\'avatar:', error);
      setAvatarStatus('error');
      setTimeout(() => setAvatarStatus(null), 3000);
    }
  }, [currentUser, updateAvatar, avatarPreviewUrl]);

  const requestEmailCode = useCallback(async () => {
    if (!currentUser || !email || !confirmEmail) {
      setEmailError('Tous les champs sont requis');
      setEmailStatus('error');
      return;
    }

    if (email !== confirmEmail) {
      setEmailError('Les adresses email ne correspondent pas');
      setEmailStatus('error');
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      setEmailError('Adresse email invalide');
      setEmailStatus('error');
      return;
    }

    setEmailError('');
    setEmailCodeStatus('');
    setEmailStatus('loading');
    try {
      const result = await requestEmailVerificationCode({
        email,
        displayName: currentUser?.username || ''
      });
      if (result.success) {
        if (result.delivery === 'email') {
          setEmailCodeStatus('Code envoyé. Vérifie ta boîte mail.');
        } else {
          setEmailCodeStatus(`Mode fallback actif. Code: ${result.debugCode}`);
        }
        setEmailStatus(null);
      } else {
        setEmailError('Impossible d\'envoyer le code de vérification');
        setEmailStatus('error');
      }
    } catch (error) {
      console.error('[SettingsTab] Erreur envoi code email:', error);
      setEmailError('Erreur lors de l\'envoi du code');
      setEmailStatus('error');
    }
  }, [confirmEmail, currentUser, email]);

  const handleEmailUpdate = useCallback(async () => {
    if (!emailCode.trim()) {
      setEmailError('Le code de vérification est requis');
      setEmailStatus('error');
      return;
    }
    const verification = verifyEmailCode({ email, code: emailCode });
    if (!verification.success) {
      setEmailError('Code invalide ou expiré');
      setEmailStatus('error');
      return;
    }

    setEmailError('');
    setEmailStatus('loading');
    try {
      const result = await updateProfile({ email, emailVerified: true });
      if (result.success) {
        setEmailStatus('success');
        setConfirmEmail('');
        setEmailCode('');
        setEmailCodeStatus('Email vérifié et mis à jour.');
        setTimeout(() => setEmailStatus(null), 3000);
      } else {
        setEmailError('Erreur lors de la mise à jour de l\'email');
        setEmailStatus('error');
      }
    } catch (error) {
      console.error('[SettingsTab] Erreur mise à jour email:', error);
      setEmailError('Erreur lors de la mise à jour de l\'email');
      setEmailStatus('error');
    }
  }, [email, emailCode, updateProfile]);

  const isStrongPassword = useCallback((pwd) => {
    const value = String(pwd || '');
    if (value.length < 8) return false;
    if (!/[A-Z]/.test(value)) return false;
    if (!/[^A-Za-z0-9]/.test(value)) return false;
    return true;
  }, []);

  // Handler pour mettre à jour le mot de passe
  const handlePasswordUpdate = useCallback(async () => {
    if (!currentUser) {
      setPasswordError('Vous devez être connecté');
      setPasswordStatus('error');
      return;
    }

    if (!newPassword || newPassword.trim() === '') {
      setPasswordError('Le nouveau mot de passe est requis');
      setPasswordStatus('error');
      return;
    }

    if (!confirmPassword || confirmPassword.trim() === '') {
      setPasswordError('La confirmation du mot de passe est requise');
      setPasswordStatus('error');
      return;
    }

    if (!isStrongPassword(newPassword)) {
      setPasswordError(
        'Mot de passe trop faible : au moins 8 caractères, une majuscule et un caractère spécial (comme à l’inscription).'
      );
      setPasswordStatus('error');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Les deux saisies du nouveau mot de passe doivent être identiques');
      setPasswordStatus('error');
      return;
    }

    let skipOldPasswordCheck = false;
    if (lockReady && appLockCode.trim()) {
      const unlockRes = await unlockWithCode(appLockCode.trim());
      if (!unlockRes?.success) {
        setPasswordError('Code de verrouillage de l’app incorrect');
        setPasswordStatus('error');
        return;
      }
      skipOldPasswordCheck = true;
    } else if (!oldPassword || oldPassword.trim() === '') {
      setPasswordError(
        lockReady
          ? 'Indique soit ton mot de passe actuel, soit le code de verrouillage de l’app (remplis le champ correspondant).'
          : 'L’ancien mot de passe est requis.'
      );
      setPasswordStatus('error');
      return;
    }

    if (skipOldPasswordCheck && currentUser?.serverManaged) {
      setPasswordError(
        'Compte géré par le serveur : le changement de mot de passe exige toujours l’ancien mot de passe côté API. Le code de l’app ne remplace pas cette vérification en ligne.'
      );
      setPasswordStatus('error');
      return;
    }

    setPasswordError('');
    setPasswordStatus('loading');

    try {
      const result = await updatePassword(
        skipOldPasswordCheck ? '' : oldPassword,
        newPassword,
        { skipOldPasswordCheck }
      );
      
      if (result.success) {
        // Succès : vider tous les champs
        setPasswordStatus('success');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setAppLockCode('');
        setPasswordError('');
        setTimeout(() => {
          setPasswordStatus(null);
        }, 3000);
      } else {
        // Erreur : bloquer et afficher le message
        if (result.error === 'INVALID_OLD_PASSWORD') {
          setPasswordError('❌ Ancien mot de passe incorrect. Impossible de changer le mot de passe.');
          // Ne pas vider l'ancien mot de passe pour que l'utilisateur puisse réessayer
        } else if (result.error === 'PASSWORD_POLICY_FAILED') {
          setPasswordError('Politique mot de passe non respectée (8+ caractères, majuscule, spécial).');
        } else {
          setPasswordError('Erreur lors de la mise à jour du mot de passe');
        }
        setPasswordStatus('error');
        setTimeout(() => {
          setPasswordStatus(null);
          // Garder l'erreur visible plus longtemps
        }, 7000);
      }
    } catch (error) {
      console.error('[SettingsTab] Erreur lors de la mise à jour du mot de passe:', error);
      setPasswordError('Erreur lors de la mise à jour du mot de passe');
      setPasswordStatus('error');
      setTimeout(() => {
        setPasswordStatus(null);
        setPasswordError('');
      }, 7000);
    }
  }, [
    appLockCode,
    confirmPassword,
    currentUser,
    isStrongPassword,
    lockReady,
    newPassword,
    oldPassword,
    unlockWithCode,
    updatePassword
  ]);

  return {
    // Avatar
    avatarPreviewUrl,
    avatarStatus,
    avatarFileRef,
    handleAvatarChange,
    usernameInitial,
    
    // Email
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
    
    // Password
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
  };
};

export default useProfileSettings;
