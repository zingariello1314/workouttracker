import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getProfileData,
  addAvatar,
  deleteAvatar,
  setActiveAvatar,
  saveHandle,
  addCardIcon,
  deleteCardIcon,
  setActiveCardIcon,
  getUserTitle,
  optimizeImage,
  getRotationSettings,
  saveRotationSettings,
  rotateToNextImage
} from '../services/profileCard/profileCardStorage';
import logger from '../utils/logger';

const profileCardHookLog = logger.module('useProfileCard');

/**
 * Hook personnalisé pour gérer les données de ProfileCard
 * @param {string} username - Nom d'utilisateur connecté
 * @returns {Object} État et fonctions du profil
 */
export const useProfileCard = (username = 'guest') => {
  const [profileData, setProfileData] = useState({
    avatarUrl: null,
    avatars: [],
    activeAvatarIndex: 0,
    handle: username,
    title: 'Utilisateur',
    status: 'En ligne',
    cardIconUrl: null,
    cardIcons: [],
    activeCardIconIndex: 0,
    isLoading: true
  });

  const [rotationSettings, setRotationSettings] = useState({
    cardIcon: {
      rotationEnabled: false,
      rotationMode: 'none',
      timerInterval: 60,
      changeOnTabSwitch: false,
      changeOnSubTabSwitch: false
    },
    avatar: {
      rotationEnabled: false,
      rotationMode: 'none',
      timerInterval: 120,
      changeOnTabSwitch: false,
      changeOnSubTabSwitch: false
    }
  });

  // Refs pour les timers
  const cardIconTimerRef = useRef(null);
  const avatarTimerRef = useRef(null);

  /**
   * Charge les données du profil depuis IndexedDB
   */
  const loadProfileData = useCallback(async () => {
    try {
      setProfileData(prev => ({ ...prev, isLoading: true }));

      const data = await getProfileData(username);
      const title = getUserTitle(username);
      const settings = await getRotationSettings(username);

      setProfileData({
        avatarUrl: data?.avatarUrl || null,
        avatars: data?.avatars || [],
        activeAvatarIndex: data?.activeAvatarIndex ?? 0,
        handle: data?.handle || username,
        title,
        status: 'En ligne',
        cardIconUrl: data?.cardIconUrl || null,
        cardIcons: data?.cardIcons || [],
        activeCardIconIndex: data?.activeCardIconIndex ?? 0,
        isLoading: false
      });

      if (settings) {
        setRotationSettings(settings);
      }
    } catch (error) {
      console.error('[useProfileCard] Erreur lors du chargement:', error);
      setProfileData(prev => ({ ...prev, isLoading: false }));
    }
  }, [username]);

  /**
   * Charge les données au montage et quand le username change
   */
  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  /**
   * Ajoute un nouvel avatar à la galerie
   * @param {File} file - Fichier image
   */
  const addNewAvatar = useCallback(async (file) => {
    try {
      // Optimiser l'image (400x400px, qualité 85%)
      const dataUrl = await optimizeImage(file, 400, 400, 0.85);
      const index = await addAvatar(username, dataUrl);
      
      // Recharger les données
      await loadProfileData();

      return { success: true, index };
    } catch (error) {
      console.error('[useProfileCard] Erreur lors de l\'ajout de l\'avatar:', error);
      return { success: false, error };
    }
  }, [username, loadProfileData]);

  /**
   * Supprime un avatar de la galerie
   * @param {number} index - Index de l'avatar à supprimer
   */
  const removeAvatar = useCallback(async (index) => {
    try {
      await deleteAvatar(username, index);
      
      // Recharger les données
      await loadProfileData();

      return { success: true };
    } catch (error) {
      console.error('[useProfileCard] Erreur lors de la suppression de l\'avatar:', error);
      return { success: false, error };
    }
  }, [username, loadProfileData]);

  /**
   * Définit l'avatar actif
   * @param {number} index - Index de l'avatar à activer
   */
  const selectAvatar = useCallback(async (index) => {
    try {
      await setActiveAvatar(username, index);
      
      // Recharger les données
      await loadProfileData();

      return { success: true };
    } catch (error) {
      console.error('[useProfileCard] Erreur lors de la sélection de l\'avatar:', error);
      return { success: false, error };
    }
  }, [username, loadProfileData]);

  /**
   * Met à jour le handle
   * @param {string} newHandle - Nouveau handle
   */
  const updateHandle = useCallback(async (newHandle) => {
    try {
      await saveHandle(username, newHandle);
      
      setProfileData(prev => ({
        ...prev,
        handle: newHandle.replace('@', '')
      }));

      return { success: true };
    } catch (error) {
      console.error('[useProfileCard] Erreur lors de la mise à jour du handle:', error);
      return { success: false, error };
    }
  }, [username]);

  /**
   * Ajoute une nouvelle image de fond à la galerie
   * @param {File} file - Fichier image
   */
  const addNewCardIcon = useCallback(async (file) => {
    try {
      // Optimiser l'image (1200x1200px pour plein écran, qualité 90%)
      const dataUrl = await optimizeImage(file, 1200, 1200, 0.90);
      const index = await addCardIcon(username, dataUrl);
      
      // Recharger les données
      await loadProfileData();

      return { success: true, index };
    } catch (error) {
      console.error('[useProfileCard] Erreur lors de l\'ajout de l\'image de fond:', error);
      return { success: false, error };
    }
  }, [username, loadProfileData]);

  /**
   * Supprime une image de fond de la galerie
   * @param {number} index - Index de l'image à supprimer
   */
  const removeCardIcon = useCallback(async (index) => {
    try {
      await deleteCardIcon(username, index);
      
      // Recharger les données
      await loadProfileData();

      return { success: true };
    } catch (error) {
      console.error('[useProfileCard] Erreur lors de la suppression de l\'image de fond:', error);
      return { success: false, error };
    }
  }, [username, loadProfileData]);

  /**
   * Définit l'image de fond active
   * @param {number} index - Index de l'image à activer
   */
  const selectCardIcon = useCallback(async (index) => {
    try {
      await setActiveCardIcon(username, index);
      
      // Recharger les données
      await loadProfileData();

      return { success: true };
    } catch (error) {
      console.error('[useProfileCard] Erreur lors de la sélection de l\'image de fond:', error);
      return { success: false, error };
    }
  }, [username, loadProfileData]);

  /**
   * Passe à l'image suivante (rotation)
   * @param {string} type - 'cardIcon' ou 'avatar'
   */
  const rotateNext = useCallback(async (type) => {
    try {
      profileCardHookLog.debug(`[useProfileCard] Rotation ${type}...`);
      await rotateToNextImage(username, type);
      await loadProfileData();
      return { success: true };
    } catch (error) {
      console.error(`[useProfileCard] Erreur lors de la rotation ${type}:`, error);
      return { success: false, error };
    }
  }, [username, loadProfileData]);

  /**
   * Met à jour les paramètres de rotation
   * @param {Object} newSettings - Nouveaux paramètres
   */
  const updateRotationSettings = useCallback(async (newSettings) => {
    try {
      await saveRotationSettings(username, newSettings);
      setRotationSettings(newSettings);
      return { success: true };
    } catch (error) {
      console.error('[useProfileCard] Erreur lors de la mise à jour des paramètres de rotation:', error);
      return { success: false, error };
    }
  }, [username]);

  /**
   * Gère la rotation au changement d'onglet
   */
  const handleTabChange = useCallback((event) => {
    const { isSubTab } = event.detail || {};
    
    // Rotation des images de fond
    if (rotationSettings.cardIcon.rotationEnabled) {
      const shouldRotate = 
        (rotationSettings.cardIcon.rotationMode === 'tab-change' || rotationSettings.cardIcon.rotationMode === 'both') &&
        ((isSubTab && rotationSettings.cardIcon.changeOnSubTabSwitch) || 
         (!isSubTab && rotationSettings.cardIcon.changeOnTabSwitch));
      
      if (shouldRotate && profileData.cardIcons.length > 1) {
        profileCardHookLog.debug('[useProfileCard] Rotation cardIcon au changement d\'onglet');
        rotateNext('cardIcon');
      }
    }
    
    // Rotation des avatars
    if (rotationSettings.avatar.rotationEnabled) {
      const shouldRotate = 
        (rotationSettings.avatar.rotationMode === 'tab-change' || rotationSettings.avatar.rotationMode === 'both') &&
        ((isSubTab && rotationSettings.avatar.changeOnSubTabSwitch) || 
         (!isSubTab && rotationSettings.avatar.changeOnTabSwitch));
      
      if (shouldRotate && profileData.avatars.length > 1) {
        profileCardHookLog.debug('[useProfileCard] Rotation avatar au changement d\'onglet');
        rotateNext('avatar');
      }
    }
  }, [rotationSettings, profileData, rotateNext]);

  /**
   * Écoute les changements d'onglets
   */
  useEffect(() => {
    window.addEventListener('tab-change', handleTabChange);
    return () => window.removeEventListener('tab-change', handleTabChange);
  }, [handleTabChange]);

  /**
   * Timer de rotation pour les images de fond
   */
  useEffect(() => {
    // Nettoyer le timer existant
    if (cardIconTimerRef.current) {
      clearInterval(cardIconTimerRef.current);
      cardIconTimerRef.current = null;
    }

    // Vérifier si la rotation par timer est activée
    if (!rotationSettings.cardIcon.rotationEnabled) return;
    if (rotationSettings.cardIcon.rotationMode === 'none') return;
    if (rotationSettings.cardIcon.rotationMode === 'tab-change') return;
    if (profileData.cardIcons.length <= 1) return;

    profileCardHookLog.debug(`[useProfileCard] Démarrage timer cardIcon (${rotationSettings.cardIcon.timerInterval}s)`);
    
    cardIconTimerRef.current = setInterval(() => {
      profileCardHookLog.debug('[useProfileCard] Rotation cardIcon par timer');
      rotateNext('cardIcon');
    }, rotationSettings.cardIcon.timerInterval * 1000);

    return () => {
      if (cardIconTimerRef.current) {
        clearInterval(cardIconTimerRef.current);
        cardIconTimerRef.current = null;
      }
    };
  }, [rotationSettings.cardIcon, profileData.cardIcons.length, rotateNext]);

  /**
   * Timer de rotation pour les avatars
   */
  useEffect(() => {
    // Nettoyer le timer existant
    if (avatarTimerRef.current) {
      clearInterval(avatarTimerRef.current);
      avatarTimerRef.current = null;
    }

    // Vérifier si la rotation par timer est activée
    if (!rotationSettings.avatar.rotationEnabled) return;
    if (rotationSettings.avatar.rotationMode === 'none') return;
    if (rotationSettings.avatar.rotationMode === 'tab-change') return;
    if (profileData.avatars.length <= 1) return;

    profileCardHookLog.debug(`[useProfileCard] Démarrage timer avatar (${rotationSettings.avatar.timerInterval}s)`);
    
    avatarTimerRef.current = setInterval(() => {
      profileCardHookLog.debug('[useProfileCard] Rotation avatar par timer');
      rotateNext('avatar');
    }, rotationSettings.avatar.timerInterval * 1000);

    return () => {
      if (avatarTimerRef.current) {
        clearInterval(avatarTimerRef.current);
        avatarTimerRef.current = null;
      }
    };
  }, [rotationSettings.avatar, profileData.avatars.length, rotateNext]);

  /**
   * Recharge les données du profil
   */
  const refresh = useCallback(() => {
    loadProfileData();
  }, [loadProfileData]);

  return {
    // État
    avatarUrl: profileData.avatarUrl,
    avatars: profileData.avatars,
    activeAvatarIndex: profileData.activeAvatarIndex,
    handle: profileData.handle,
    title: profileData.title,
    status: profileData.status,
    cardIconUrl: profileData.cardIconUrl,
    cardIcons: profileData.cardIcons,
    activeCardIconIndex: profileData.activeCardIconIndex,
    isLoading: profileData.isLoading,
    username,
    rotationSettings,

    // Fonctions
    addNewAvatar,
    removeAvatar,
    selectAvatar,
    updateHandle,
    addNewCardIcon,
    removeCardIcon,
    selectCardIcon,
    refresh,
    rotateNext,
    updateRotationSettings
  };
};

export default useProfileCard;
