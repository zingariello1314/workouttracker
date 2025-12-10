import React, { useState, useEffect } from 'react';
import './ProfileCardRotationSettings.css';

/**
 * Composant de configuration de la rotation automatique des images
 */
const ProfileCardRotationSettings = ({ rotationSettings, onUpdate }) => {
  const [localSettings, setLocalSettings] = useState(rotationSettings);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLocalSettings(rotationSettings);
    setHasChanges(false);
  }, [rotationSettings]);

  const handleChange = (type, field, value) => {
    const newSettings = {
      ...localSettings,
      [type]: {
        ...localSettings[type],
        [field]: value
      }
    };
    setLocalSettings(newSettings);
    setHasChanges(true);
  };

  const handleSave = async () => {
    const result = await onUpdate(localSettings);
    if (result.success) {
      setHasChanges(false);
    }
  };

  const handleReset = () => {
    setLocalSettings(rotationSettings);
    setHasChanges(false);
  };

  return (
    <div className="rotation-settings">
      <div className="rotation-settings-header">
        <h3>🔄 Rotation Automatique</h3>
        <p className="rotation-settings-subtitle">
          Configurez comment et quand vos images changent automatiquement
        </p>
      </div>

      {/* Images de Fond */}
      <div className="rotation-section">
        <div className="rotation-section-header">
          <h4>🖼️ Images de Fond de la Carte</h4>
          <label className="rotation-toggle">
            <input
              type="checkbox"
              checked={localSettings.cardIcon.rotationEnabled}
              onChange={(e) => handleChange('cardIcon', 'rotationEnabled', e.target.checked)}
            />
            <span className="rotation-toggle-slider"></span>
          </label>
        </div>

        {localSettings.cardIcon.rotationEnabled && (
          <div className="rotation-options">
            {/* Mode de rotation */}
            <div className="rotation-option-group">
              <label className="rotation-label">Mode de rotation</label>
              <div className="rotation-radio-group">
                <label className="rotation-radio">
                  <input
                    type="radio"
                    name="cardIcon-mode"
                    value="tab-change"
                    checked={localSettings.cardIcon.rotationMode === 'tab-change'}
                    onChange={(e) => handleChange('cardIcon', 'rotationMode', e.target.value)}
                  />
                  <span>Changement d'onglet</span>
                </label>
                <label className="rotation-radio">
                  <input
                    type="radio"
                    name="cardIcon-mode"
                    value="timer"
                    checked={localSettings.cardIcon.rotationMode === 'timer'}
                    onChange={(e) => handleChange('cardIcon', 'rotationMode', e.target.value)}
                  />
                  <span>Timer automatique</span>
                </label>
                <label className="rotation-radio">
                  <input
                    type="radio"
                    name="cardIcon-mode"
                    value="both"
                    checked={localSettings.cardIcon.rotationMode === 'both'}
                    onChange={(e) => handleChange('cardIcon', 'rotationMode', e.target.value)}
                  />
                  <span>Les deux</span>
                </label>
              </div>
            </div>

            {/* Options de changement d'onglet */}
            {(localSettings.cardIcon.rotationMode === 'tab-change' || localSettings.cardIcon.rotationMode === 'both') && (
              <div className="rotation-option-group">
                <label className="rotation-checkbox">
                  <input
                    type="checkbox"
                    checked={localSettings.cardIcon.changeOnTabSwitch}
                    onChange={(e) => handleChange('cardIcon', 'changeOnTabSwitch', e.target.checked)}
                  />
                  <span>Changer au changement d'onglet principal</span>
                </label>
                <label className="rotation-checkbox">
                  <input
                    type="checkbox"
                    checked={localSettings.cardIcon.changeOnSubTabSwitch}
                    onChange={(e) => handleChange('cardIcon', 'changeOnSubTabSwitch', e.target.checked)}
                  />
                  <span>Changer au changement de sous-onglet</span>
                </label>
              </div>
            )}

            {/* Intervalle de timer */}
            {(localSettings.cardIcon.rotationMode === 'timer' || localSettings.cardIcon.rotationMode === 'both') && (
              <div className="rotation-option-group">
                <label className="rotation-label">
                  Intervalle: {localSettings.cardIcon.timerInterval}s
                </label>
                <input
                  type="range"
                  min="10"
                  max="300"
                  step="10"
                  value={localSettings.cardIcon.timerInterval}
                  onChange={(e) => handleChange('cardIcon', 'timerInterval', parseInt(e.target.value))}
                  className="rotation-slider"
                />
                <div className="rotation-slider-labels">
                  <span>10s</span>
                  <span>5min</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Images d'Avatar */}
      <div className="rotation-section">
        <div className="rotation-section-header">
          <h4>👤 Images de Profil (Avatar)</h4>
          <label className="rotation-toggle">
            <input
              type="checkbox"
              checked={localSettings.avatar.rotationEnabled}
              onChange={(e) => handleChange('avatar', 'rotationEnabled', e.target.checked)}
            />
            <span className="rotation-toggle-slider"></span>
          </label>
        </div>

        {localSettings.avatar.rotationEnabled && (
          <div className="rotation-options">
            {/* Mode de rotation */}
            <div className="rotation-option-group">
              <label className="rotation-label">Mode de rotation</label>
              <div className="rotation-radio-group">
                <label className="rotation-radio">
                  <input
                    type="radio"
                    name="avatar-mode"
                    value="tab-change"
                    checked={localSettings.avatar.rotationMode === 'tab-change'}
                    onChange={(e) => handleChange('avatar', 'rotationMode', e.target.value)}
                  />
                  <span>Changement d'onglet</span>
                </label>
                <label className="rotation-radio">
                  <input
                    type="radio"
                    name="avatar-mode"
                    value="timer"
                    checked={localSettings.avatar.rotationMode === 'timer'}
                    onChange={(e) => handleChange('avatar', 'rotationMode', e.target.value)}
                  />
                  <span>Timer automatique</span>
                </label>
                <label className="rotation-radio">
                  <input
                    type="radio"
                    name="avatar-mode"
                    value="both"
                    checked={localSettings.avatar.rotationMode === 'both'}
                    onChange={(e) => handleChange('avatar', 'rotationMode', e.target.value)}
                  />
                  <span>Les deux</span>
                </label>
              </div>
            </div>

            {/* Options de changement d'onglet */}
            {(localSettings.avatar.rotationMode === 'tab-change' || localSettings.avatar.rotationMode === 'both') && (
              <div className="rotation-option-group">
                <label className="rotation-checkbox">
                  <input
                    type="checkbox"
                    checked={localSettings.avatar.changeOnTabSwitch}
                    onChange={(e) => handleChange('avatar', 'changeOnTabSwitch', e.target.checked)}
                  />
                  <span>Changer au changement d'onglet principal</span>
                </label>
                <label className="rotation-checkbox">
                  <input
                    type="checkbox"
                    checked={localSettings.avatar.changeOnSubTabSwitch}
                    onChange={(e) => handleChange('avatar', 'changeOnSubTabSwitch', e.target.checked)}
                  />
                  <span>Changer au changement de sous-onglet</span>
                </label>
              </div>
            )}

            {/* Intervalle de timer */}
            {(localSettings.avatar.rotationMode === 'timer' || localSettings.avatar.rotationMode === 'both') && (
              <div className="rotation-option-group">
                <label className="rotation-label">
                  Intervalle: {localSettings.avatar.timerInterval}s
                </label>
                <input
                  type="range"
                  min="10"
                  max="300"
                  step="10"
                  value={localSettings.avatar.timerInterval}
                  onChange={(e) => handleChange('avatar', 'timerInterval', parseInt(e.target.value))}
                  className="rotation-slider"
                />
                <div className="rotation-slider-labels">
                  <span>10s</span>
                  <span>5min</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Boutons d'action */}
      {hasChanges && (
        <div className="rotation-actions">
          <button 
            className="rotation-btn rotation-btn-secondary" 
            onClick={handleReset}
          >
            Annuler
          </button>
          <button 
            className="rotation-btn rotation-btn-primary" 
            onClick={handleSave}
          >
            Enregistrer
          </button>
        </div>
      )}

      {/* Info */}
      <div className="rotation-info">
        <p>💡 <strong>Astuce:</strong> La rotation ne fonctionne que si vous avez plusieurs images dans votre galerie.</p>
      </div>
    </div>
  );
};

export default ProfileCardRotationSettings;
