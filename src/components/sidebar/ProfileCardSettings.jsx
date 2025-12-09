import React, { useState, useRef } from 'react';
import { useProfileCard } from '../../hooks/useProfileCard';
import './ProfileCardSettings.css';

/**
 * Modal de paramètres pour ProfileCard
 * Permet de modifier l'avatar et le handle
 */
const ProfileCardSettings = ({ username, isOpen, onClose }) => {
  const { 
    avatarUrl, 
    avatars, 
    activeAvatarIndex, 
    handle, 
    cardIconUrl,
    addNewAvatar, 
    removeAvatar, 
    selectAvatar, 
    updateHandle,
    updateCardIcon
  } = useProfileCard(username);
  
  const [newHandle, setNewHandle] = useState(handle);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingIcon, setIsUploadingIcon] = useState(false);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef(null);
  const iconInputRef = useRef(null);

  if (!isOpen) return null;

  const handleAvatarAdd = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      setMessage('❌ Veuillez sélectionner une image');
      return;
    }

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage('❌ L\'image est trop grande (max 5MB)');
      return;
    }

    setIsUploading(true);
    setMessage('⏳ Upload en cours...');

    const result = await addNewAvatar(file);

    if (result.success) {
      setMessage('✅ Avatar ajouté!');
      setTimeout(() => setMessage(''), 3000);
    } else {
      setMessage('❌ Erreur lors de l\'upload');
    }

    setIsUploading(false);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAvatarDelete = async (index) => {
    if (!confirm('Supprimer cet avatar?')) return;

    setMessage('⏳ Suppression...');
    const result = await removeAvatar(index);

    if (result.success) {
      setMessage('✅ Avatar supprimé!');
      setTimeout(() => setMessage(''), 3000);
    } else {
      setMessage('❌ Erreur lors de la suppression');
    }
  };

  const handleAvatarSelect = async (index) => {
    setMessage('⏳ Sélection...');
    const result = await selectAvatar(index);

    if (result.success) {
      setMessage('✅ Avatar sélectionné!');
      setTimeout(() => setMessage(''), 3000);
    } else {
      setMessage('❌ Erreur lors de la sélection');
    }
  };

  const handleHandleSubmit = async (e) => {
    e.preventDefault();

    if (!newHandle.trim()) {
      setMessage('❌ Le handle ne peut pas être vide');
      return;
    }

    setMessage('⏳ Mise à jour...');

    const result = await updateHandle(newHandle);

    if (result.success) {
      setMessage('✅ Handle mis à jour!');
      setTimeout(() => setMessage(''), 3000);
    } else {
      setMessage('❌ Erreur lors de la mise à jour');
    }
  };

  const handleCardIconAdd = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      setMessage('❌ Veuillez sélectionner une image');
      return;
    }

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage('❌ L\'image est trop grande (max 5MB)');
      return;
    }

    setIsUploadingIcon(true);
    setMessage('⏳ Upload en cours...');

    const result = await updateCardIcon(file);

    if (result.success) {
      setMessage('✅ Image de carte mise à jour!');
      console.log('[ProfileCardSettings] Card icon updated successfully');
      setTimeout(() => setMessage(''), 3000);
    } else {
      setMessage('❌ Erreur lors de l\'upload');
      console.error('[ProfileCardSettings] Failed to update card icon:', result.error);
    }

    setIsUploadingIcon(false);
    
    // Reset input
    if (iconInputRef.current) {
      iconInputRef.current.value = '';
    }
  };

  return (
    <div className="profile-settings-overlay" onClick={onClose}>
      <div className="profile-settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="profile-settings-header">
          <h2>Paramètres du Profil</h2>
          <button className="profile-settings-close" onClick={onClose} aria-label="Fermer">
            ✕
          </button>
        </div>

        <div className="profile-settings-content">
          {/* Galerie d'avatars */}
          <div className="profile-settings-section">
            <h3>Avatars ({avatars.length})</h3>
            
            {/* Avatar actuel */}
            <div className="profile-settings-avatar-current">
              <img src={avatarUrl} alt="Avatar actuel" />
              <p>Avatar actif</p>
            </div>

            {/* Galerie */}
            {avatars.length > 0 && (
              <div className="profile-settings-avatar-gallery">
                {avatars.map((avatar, index) => (
                  <div 
                    key={avatar.id} 
                    className={`profile-settings-avatar-item ${index === activeAvatarIndex ? 'active' : ''}`}
                  >
                    <img 
                      src={avatar.dataUrl} 
                      alt={`Avatar ${index + 1}`}
                      onClick={() => handleAvatarSelect(index)}
                    />
                    {index === activeAvatarIndex && (
                      <div className="profile-settings-avatar-badge">✓</div>
                    )}
                    <button
                      className="profile-settings-avatar-delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAvatarDelete(index);
                      }}
                      aria-label="Supprimer"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Bouton ajouter */}
            <button
              className="profile-settings-button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? '⏳ Upload...' : '+ Ajouter un avatar'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarAdd}
              style={{ display: 'none' }}
            />
            <p className="profile-settings-hint">
              Formats: JPG, PNG, GIF (max 5MB) • Cliquez sur un avatar pour l'activer
            </p>
          </div>

          {/* Image centrale de la carte */}
          <div className="profile-settings-section">
            <h3>Image de la Carte</h3>
            
            {/* Aperçu de l'image actuelle */}
            <div className="profile-settings-card-icon-preview">
              <img 
                src={cardIconUrl || '/logo.png'} 
                alt="Image de carte actuelle" 
                style={{ maxWidth: '150px', maxHeight: '150px', objectFit: 'contain' }}
              />
              <p>{cardIconUrl ? 'Image personnalisée' : 'Image par défaut'}</p>
            </div>

            {/* Bouton changer */}
            <button
              className="profile-settings-button"
              onClick={() => iconInputRef.current?.click()}
              disabled={isUploadingIcon}
            >
              {isUploadingIcon ? '⏳ Upload...' : '📷 Changer l\'image de la carte'}
            </button>
            <input
              ref={iconInputRef}
              type="file"
              accept="image/*"
              onChange={handleCardIconAdd}
              style={{ display: 'none' }}
            />
            <p className="profile-settings-hint">
              Formats: JPG, PNG, GIF, SVG (max 5MB) • Cette image apparaît au centre de votre carte
            </p>
          </div>

          {/* Handle */}
          <div className="profile-settings-section">
            <h3>Handle</h3>
            <form onSubmit={handleHandleSubmit}>
              <div className="profile-settings-input-group">
                <span className="profile-settings-prefix">@</span>
                <input
                  type="text"
                  value={newHandle}
                  onChange={(e) => setNewHandle(e.target.value)}
                  placeholder="votre_handle"
                  className="profile-settings-input"
                />
              </div>
              <button type="submit" className="profile-settings-button">
                Mettre à jour le handle
              </button>
            </form>
          </div>

          {/* Message de statut */}
          {message && (
            <div className="profile-settings-message">
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileCardSettings;
