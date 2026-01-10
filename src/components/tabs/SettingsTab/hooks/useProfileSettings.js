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
  // Avatar
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState(null);
  const [avatarStatus, setAvatarStatus] = useState(null); // 'success' | 'error' | 'loading' | null
  const avatarFileRef = useRef(null);

  // Email
  const [email, setEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [emailStatus, setEmailStatus] = useState(null); // 'success' | 'error' | 'loading' | null
  const [emailError, setEmailError] = useState('');

  // Password
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState(null); // 'success' | 'error' | 'loading' | null
  const [passwordError, setPasswordError] = useState('');

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
    setConfirmEmail('');
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

  // Handler pour mettre à jour l'email
  const handleEmailUpdate = useCallback(async () => {
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
    setEmailStatus('loading');
    try {
      const result = await updateProfile({ email });
      if (result.success) {
        setEmailStatus('success');
        setConfirmEmail('');
        setTimeout(() => {
          setEmailStatus(null);
        }, 3000);
      } else {
        setEmailError('Erreur lors de la mise à jour de l\'email');
        setEmailStatus('error');
        setTimeout(() => {
          setEmailStatus(null);
          setEmailError('');
        }, 5000);
      }
    } catch (error) {
      console.error('[SettingsTab] Erreur lors de la mise à jour de l\'email:', error);
      setEmailError('Erreur lors de la mise à jour de l\'email');
      setEmailStatus('error');
      setTimeout(() => {
        setEmailStatus(null);
        setEmailError('');
      }, 5000);
    }
  }, [currentUser, email, confirmEmail, updateProfile]);

  // Handler pour mettre à jour le mot de passe
  const handlePasswordUpdate = useCallback(async () => {
    // Validation stricte : tous les champs doivent être remplis
    if (!currentUser) {
      setPasswordError('Vous devez être connecté');
      setPasswordStatus('error');
      return;
    }

    if (!oldPassword || oldPassword.trim() === '') {
      setPasswordError('L\'ancien mot de passe est requis');
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

    if (newPassword.length < 6) {
      setPasswordError('Le mot de passe doit contenir au moins 6 caractères');
      setPasswordStatus('error');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas');
      setPasswordStatus('error');
      return;
    }

    // Vider les erreurs précédentes
    setPasswordError('');
    setPasswordStatus('loading');
    
    try {
      // La fonction updatePassword vérifie l'ancien mot de passe
      // Si incorrect, elle retourne { success: false, error: 'INVALID_OLD_PASSWORD' }
      const result = await updatePassword(oldPassword, newPassword);
      
      if (result.success) {
        // Succès : vider tous les champs
        setPasswordStatus('success');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordError('');
        setTimeout(() => {
          setPasswordStatus(null);
        }, 3000);
      } else {
        // Erreur : bloquer et afficher le message
        if (result.error === 'INVALID_OLD_PASSWORD') {
          setPasswordError('❌ Ancien mot de passe incorrect. Impossible de changer le mot de passe.');
          // Ne pas vider l'ancien mot de passe pour que l'utilisateur puisse réessayer
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
  }, [currentUser, oldPassword, newPassword, confirmPassword, updatePassword]);

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
    handlePasswordUpdate,
  };
};

export default useProfileSettings;
