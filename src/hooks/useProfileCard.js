import { useState, useEffect, useCallback } from 'react';
import {
  getProfileData,
  addAvatar,
  deleteAvatar,
  setActiveAvatar,
  saveHandle,
  saveCardIcon,
  getUserTitle,
  fileToDataUrl
} from '../services/profileCard/profileCardStorage';

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
    isLoading: true
  });

  /**
   * Charge les données du profil depuis IndexedDB
   */
  const loadProfileData = useCallback(async () => {
    try {
      setProfileData(prev => ({ ...prev, isLoading: true }));

      const data = await getProfileData(username);
      const title = getUserTitle(username);

      setProfileData({
        avatarUrl: data?.avatarUrl || null,
        avatars: data?.avatars || [],
        activeAvatarIndex: data?.activeAvatarIndex ?? 0,
        handle: data?.handle || username,
        title,
        status: 'En ligne',
        cardIconUrl: data?.cardIconUrl || null,
        isLoading: false
      });
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
      const dataUrl = await fileToDataUrl(file);
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
   * Met à jour l'image centrale de la carte
   * @param {File} file - Fichier image
   */
  const updateCardIcon = useCallback(async (file) => {
    try {
      const dataUrl = await fileToDataUrl(file);
      await saveCardIcon(username, dataUrl);
      
      console.log('[useProfileCard] Card icon saved, updating state with:', dataUrl.substring(0, 50) + '...');
      
      setProfileData(prev => ({
        ...prev,
        cardIconUrl: dataUrl
      }));

      // Force un rechargement pour être sûr
      await loadProfileData();

      return { success: true };
    } catch (error) {
      console.error('[useProfileCard] Erreur lors de la mise à jour de l\'icône de carte:', error);
      return { success: false, error };
    }
  }, [username, loadProfileData]);

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
    isLoading: profileData.isLoading,
    username,

    // Fonctions
    addNewAvatar,
    removeAvatar,
    selectAvatar,
    updateHandle,
    updateCardIcon,
    refresh
  };
};

export default useProfileCard;
