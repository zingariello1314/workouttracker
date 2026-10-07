import React, { useState, useRef } from 'react';
import { Lock } from 'lucide-react';
import { useProfileCard } from '../../hooks/useProfileCard';
import { useSportGrade } from '../../hooks/useSportGrade';
import ProfileCardRotationSettings from './ProfileCardRotationSettings';
import {
  SPORT_GRADE_IDS,
  gradeIndex,
  sportGradeArtUrl
} from '../../services/xp/sportGradeCatalog';
import { sportGradeLabel } from '../sport/grades/SportGradeIdentity';
import { useTranslation } from '../../utils/translations';
import './ProfileCardSettings.css';

/**
 * Modal de paramètres pour ProfileCard
 * Permet de modifier l'avatar et le handle
 */
const ProfileCardSettings = ({ username, isOpen, onClose }) => {
  const t = useTranslation();
  const { grades } = useSportGrade();
  const { 
    avatarUrl, 
    avatars, 
    activeAvatarIndex, 
    handle, 
    cardIconUrl,
    cardIcons,
    activeCardIconIndex,
    gradeArtId,
    cardIconMode,
    rotationSettings,
    addNewAvatar, 
    removeAvatar, 
    selectAvatar, 
    updateHandle,
    addNewCardIcon,
    removeCardIcon,
    selectCardIcon,
    selectGradeArt,
    updateRotationSettings
  } = useProfileCard(username);

  const meritedIdx = Math.max(0, gradeIndex(grades?.merited?.gradeId || 'novice'));
  
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

    // Validation explicite des formats supportés
    const validFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const fileType = file.type.toLowerCase();
    
    if (!validFormats.includes(fileType)) {
      setMessage('❌ Format non supporté. Utilisez: JPEG, PNG, GIF ou WebP');
      return;
    }

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage('❌ L\'image est trop grande (max 5MB)');
      return;
    }

    setIsUploading(true);
    setMessage('⏳ Optimisation et upload...');

    const result = await addNewAvatar(file);

    if (result.success) {
      setMessage('✅ Avatar ajouté et optimisé!');
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

    // Validation explicite des formats supportés
    const validFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const fileType = file.type.toLowerCase();
    
    if (!validFormats.includes(fileType)) {
      setMessage('❌ Format non supporté. Utilisez: JPEG, PNG, GIF ou WebP');
      return;
    }

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage('❌ L\'image est trop grande (max 5MB)');
      return;
    }

    setIsUploadingIcon(true);
    setMessage('⏳ Optimisation et upload...');

    const result = await addNewCardIcon(file);

    if (result.success) {
      setMessage('✅ Image de fond ajoutée et optimisée!');
      setTimeout(() => setMessage(''), 3000);
    } else {
      setMessage('❌ Erreur lors de l\'upload');
    }

    setIsUploadingIcon(false);
    
    // Reset input
    if (iconInputRef.current) {
      iconInputRef.current.value = '';
    }
  };

  const handleCardIconDelete = async (index) => {
    if (!confirm('Supprimer cette image de fond?')) return;

    setMessage('⏳ Suppression...');
    const result = await removeCardIcon(index);

    if (result.success) {
      setMessage('✅ Image de fond supprimée!');
      setTimeout(() => setMessage(''), 3000);
    } else {
      setMessage('❌ Erreur lors de la suppression');
    }
  };

  const handleCardIconSelect = async (index) => {
    setMessage('⏳ Sélection...');
    const result = await selectCardIcon(index);

    if (result.success) {
      setMessage('✅ Image de fond sélectionnée!');
      setTimeout(() => setMessage(''), 3000);
    } else {
      setMessage('❌ Erreur lors de la sélection');
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
          {/* Galerie d'avatars - Image de profil (petite ronde en bas) */}
          <div className="profile-settings-section">
            <h3>Image de Profil ({avatars.length})</h3>
            <p className="profile-settings-description">
              Cette image apparaît dans le petit cercle en bas de la carte
            </p>
            
            {/* Avatar actuel */}
            {avatarUrl && (
              <div className="profile-settings-avatar-current">
                <img src={avatarUrl} alt="Avatar actuel" />
                <p>Image de profil active</p>
              </div>
            )}

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
              {isUploading ? '⏳ Upload...' : '+ Ajouter une image de profil'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              onChange={handleAvatarAdd}
              style={{ display: 'none' }}
            />
            <p className="profile-settings-hint">
              Formats: JPEG, PNG, GIF, WebP (max 5MB) • Images optimisées automatiquement • Cliquez sur une image pour l'activer
            </p>
          </div>

          {/* Arts de grades (débloqués) */}
          <div className="profile-settings-section">
            <h3>Arts de grades — fond de carte</h3>
            <p className="profile-settings-description">
              Chaque grade mérité débloque son illustration pour ta carte. Les grades verrouillés
              restent grisés. Ton choix est enregistré.
            </p>
            <div className="profile-settings-avatar-gallery" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))' }}>
              {SPORT_GRADE_IDS.map((gid) => {
                const unlocked = gradeIndex(gid) <= meritedIdx;
                const art = sportGradeArtUrl(gid);
                const name = sportGradeLabel(gid, t);
                const selected = cardIconMode === 'grade' && gradeArtId === gid;
                return (
                  <div
                    key={gid}
                    className={`profile-settings-avatar-item ${selected ? 'active' : ''}`}
                    style={{ position: 'relative' }}
                    title={
                      unlocked
                        ? `Utiliser ${name}`
                        : `Débloque le grade ${name} pour ajouter cette image à ta carte de profil`
                    }
                  >
                    <button
                      type="button"
                      disabled={!unlocked}
                      onClick={async () => {
                        if (!unlocked) return;
                        setMessage('⏳ Application…');
                        const result = await selectGradeArt(gid);
                        setMessage(result.success ? '✅ Art de grade appliqué!' : '❌ Erreur');
                        setTimeout(() => setMessage(''), 3000);
                      }}
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: 0,
                        border: 0,
                        background: 'transparent',
                        cursor: unlocked ? 'pointer' : 'not-allowed'
                      }}
                    >
                      <img
                        src={art}
                        alt={name}
                        style={{
                          filter: unlocked ? 'none' : 'grayscale(1) brightness(0.45)',
                          opacity: unlocked ? 1 : 0.75
                        }}
                      />
                    </button>
                    {!unlocked ? (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 4,
                          pointerEvents: 'none',
                          color: '#e4e4e7',
                          textShadow: '0 1px 4px #000'
                        }}
                      >
                        <Lock size={16} />
                        <span style={{ fontSize: 9, padding: '0 4px', textAlign: 'center' }}>
                          {name}
                        </span>
                      </div>
                    ) : null}
                    {selected ? <div className="profile-settings-avatar-badge">✓</div> : null}
                    {unlocked ? (
                      <div
                        style={{
                          fontSize: 9,
                          textAlign: 'center',
                          marginTop: 4,
                          color: '#a1a1aa'
                        }}
                      >
                        {name}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
            <p className="profile-settings-hint">
              Survole un cadenas : « Débloque le grade … pour ajouter cette image à ta carte de
              profil ».
            </p>
          </div>

          {/* Galerie d'images de fond */}
          <div className="profile-settings-section">
            <h3>Images de Fond importées ({cardIcons.length})</h3>
            <p className="profile-settings-description">
              Photos personnelles en plein écran au fond de la carte (en plus des arts de grades)
            </p>
            
            {/* Image de fond actuelle */}
            {cardIconUrl && (
              <div className="profile-settings-avatar-current">
                <img src={cardIconUrl} alt="Image de fond actuelle" />
                <p>Image de fond active</p>
              </div>
            )}

            {/* Galerie d'images de fond */}
            {cardIcons.length > 0 && (
              <div className="profile-settings-avatar-gallery">
                {cardIcons.map((cardIcon, index) => (
                  <div 
                    key={cardIcon.id} 
                    className={`profile-settings-avatar-item ${
                      cardIconMode === 'upload' && index === activeCardIconIndex ? 'active' : ''
                    }`}
                  >
                    <img 
                      src={cardIcon.dataUrl} 
                      alt={`Image de fond ${index + 1}`}
                      onClick={() => handleCardIconSelect(index)}
                    />
                    {cardIconMode === 'upload' && index === activeCardIconIndex && (
                      <div className="profile-settings-avatar-badge">✓</div>
                    )}
                    <button
                      className="profile-settings-avatar-delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCardIconDelete(index);
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
              onClick={() => iconInputRef.current?.click()}
              disabled={isUploadingIcon}
            >
              {isUploadingIcon ? '⏳ Upload...' : '+ Ajouter une image de fond'}
            </button>
            <input
              ref={iconInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              onChange={handleCardIconAdd}
              style={{ display: 'none' }}
            />
            <p className="profile-settings-hint">
              Formats: JPEG, PNG, GIF, WebP (max 5MB) • Images optimisées automatiquement • Cliquez sur une image pour l'activer
            </p>
          </div>

          {/* Handle - Nom d'utilisateur */}
          <div className="profile-settings-section">
            <h3>Nom d'utilisateur (@handle)</h3>
            <p className="profile-settings-description">
              Ce nom apparaît dans le petit rectangle en bas de la carte
            </p>
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
                Mettre à jour le @handle
              </button>
            </form>
          </div>

          {/* Message de statut */}
          {message && (
            <div className="profile-settings-message">
              {message}
            </div>
          )}

          {/* Paramètres de rotation */}
          <ProfileCardRotationSettings
            rotationSettings={rotationSettings}
            onUpdate={updateRotationSettings}
          />
        </div>
      </div>
    </div>
  );
};

export default ProfileCardSettings;
