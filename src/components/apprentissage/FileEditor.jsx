/**
 * Composant FileEditor - Éditeur de fichiers pour l'apprentissage
 * Permet d'ouvrir, modifier et sauvegarder les fichiers avec suivi de session
 */

import React, { useState, useEffect, useCallback } from 'react';
import Modal from '../ui/Modal';
import { useApprentissageEngine } from '../../hooks/useApprentissageEngine';
import { useToast } from '../ui/Toast';

const FileEditor = ({ 
  isOpen, 
  onClose, 
  file, 
  subjectId,
  subjectName 
}) => {
  const { updateFile, addXP, calculateSessionXP, saveSessionsHistory } = useApprentissageEngine();
  const { showSuccess, showError } = useToast();
  
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [editDuration, setEditDuration] = useState(0);

  // Charger le contenu du fichier
  useEffect(() => {
    if (isOpen && file) {
      setContent(file.content || '');
      setOriginalContent(file.content || '');
      setHasChanges(false);
      setSessionStartTime(Date.now());
      setEditDuration(0);
    }
  }, [isOpen, file]);

  // Suivi du temps d'édition
  useEffect(() => {
    if (!isOpen || !sessionStartTime) return;

    const interval = setInterval(() => {
      setEditDuration(Math.floor((Date.now() - sessionStartTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, sessionStartTime]);

  // Détecter les changements
  useEffect(() => {
    if (content !== originalContent) {
      setHasChanges(true);
    } else {
      setHasChanges(false);
    }
  }, [content, originalContent]);

  // Sauvegarder le fichier
  const handleSave = useCallback(async () => {
    if (!file || !subjectId) return;

    // Calculer fileExt dans le callback pour éviter les problèmes d'initialisation
    const currentFileExt = file.fileExt || file.name.split('.').pop()?.toLowerCase();

    setIsSaving(true);
    try {
      let finalContent = content;
      let finalSize = file.size;

      // Si c'est un fichier .odt, reconstruire le fichier
      if (currentFileExt === 'odt' && file.originalBlob) {
        try {
          const { rebuildODTWithText } = await import('../../utils/odtHandler');
          
          // Convertir le base64 en ArrayBuffer puis en Blob
          const base64Data = file.originalBlob.split(',')[1] || file.originalBlob;
          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const originalBlob = new Blob([bytes], { type: 'application/vnd.oasis.opendocument.text' });
          
          const newBlob = await rebuildODTWithText(originalBlob, content);
          
          // Convertir le nouveau blob en base64 pour le stockage
          finalContent = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(newBlob);
          });
          
          finalSize = newBlob.size;
        } catch (error) {
          console.error('[FileEditor] Erreur reconstruction .odt:', error);
          showError('Erreur lors de la reconstruction du fichier .odt');
          setIsSaving(false);
          return;
        }
      }

      const updatedFile = {
        ...file,
        content: finalContent,
        size: finalSize,
        originalBlob: currentFileExt === 'odt' && file.originalBlob ? finalContent : file.originalBlob,
        lastModified: Date.now(),
      };

      await updateFile(subjectId, file.id, updatedFile);

      // Calculer la durée de la session d'édition
      const duration = editDuration || Math.floor((Date.now() - sessionStartTime) / 1000);
      
      // Créer une session d'apprentissage pour cette édition
      if (duration >= 60) { // Au moins 1 minute pour compter comme session
        const sessionData = {
          subject: subjectName,
          startTime: sessionStartTime,
          endTime: Date.now(),
          plannedDuration: duration,
          actualWorkTime: duration,
          pauseTime: 0,
          completed: true,
          type: 'work',
          activity: 'file_editing',
          fileId: file.id,
          fileName: file.name,
        };

        // Calculer et ajouter XP
        const baseXP = calculateSessionXP(sessionData);
        addXP(subjectName, baseXP, sessionData);
        
        showSuccess(`Fichier sauvegardé et session enregistrée (${Math.floor(duration / 60)} min)`);
      } else {
        showSuccess('Fichier sauvegardé');
      }

      setOriginalContent(content);
      setHasChanges(false);
      setSessionStartTime(Date.now()); // Redémarrer le timer pour la prochaine session
      setEditDuration(0);
    } catch (error) {
      console.error('[FileEditor] Erreur sauvegarde:', error);
      showError('Erreur lors de la sauvegarde du fichier');
    } finally {
      setIsSaving(false);
    }
  }, [file, subjectId, content, editDuration, sessionStartTime, subjectName, updateFile, addXP, calculateSessionXP, showSuccess, showError]);

  // Fermer avec confirmation si changements
  const handleClose = useCallback(() => {
    if (hasChanges) {
      if (window.confirm('Vous avez des modifications non sauvegardées. Voulez-vous vraiment fermer ?')) {
        onClose();
      }
    } else {
      onClose();
    }
  }, [hasChanges, onClose]);

  if (!file) return null;

  const fileExt = file.fileExt || file.name.split('.').pop()?.toLowerCase();
  const isTextFile = fileExt ? ['txt', 'md', 'json', 'js', 'jsx', 'ts', 'tsx', 'css', 'html', 'xml', 'odt'].includes(fileExt) : false;
  const canEdit = isTextFile && file.content !== null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`📄 ${file.name}`}
      size="large"
    >
      <div className="space-y-4">
        {/* Informations fichier */}
        <div className="flex items-center justify-between text-sm text-slate-400">
          <div className="flex items-center gap-4">
            <span>Taille: {(file.size / 1024).toFixed(1)} KB</span>
            <span>Type: {file.type || fileExt}</span>
            {sessionStartTime && (
              <span>
                ⏱️ Temps d'édition: {Math.floor(editDuration / 60)} min {editDuration % 60} s
              </span>
            )}
          </div>
          {hasChanges && (
            <span className="text-amber-400 font-semibold">● Modifications non sauvegardées</span>
          )}
        </div>

        {/* Éditeur de texte */}
        {canEdit ? (
          <div className="space-y-2">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-96 px-4 py-3 bg-slate-900 border-2 border-emerald-500/50 rounded-lg text-slate-200 font-mono text-sm focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all duration-200 resize-y"
              placeholder="Contenu du fichier..."
              spellCheck={false}
            />
            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-500">
                {content.length} caractères • {content.split('\n').length} lignes
              </div>
              <button
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
                className="gradient-button-premium gradient-button-premium-md rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? '💾 Sauvegarde...' : '💾 Sauvegarder'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {fileExt === 'pdf' ? (
              <div className="text-center py-12 bg-slate-900/50 rounded-lg border border-slate-700/50">
                <div className="text-4xl mb-4">📄</div>
                <div className="text-slate-300 mb-2">Fichier PDF</div>
                <div className="text-slate-500 text-sm mb-4">
                  Les fichiers PDF ne peuvent pas être édités directement
                </div>
                <a
                  href={file.content ? URL.createObjectURL(new Blob([file.content])) : '#'}
                  download={file.name}
                  className="gradient-button-premium gradient-button-premium-md rounded-lg inline-block"
                >
                  📥 Télécharger
                </a>
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-900/50 rounded-lg border border-slate-700/50">
                <div className="text-4xl mb-4">📎</div>
                <div className="text-slate-300 mb-2">Fichier non éditable</div>
                <div className="text-slate-500 text-sm">
                  Ce type de fichier ({fileExt}) ne peut pas être édité dans l'éditeur
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-700/50">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-300 hover:bg-slate-700 transition-all duration-200"
          >
            Fermer
          </button>
          {canEdit && hasChanges && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="gradient-button-premium gradient-button-premium-md rounded-lg disabled:opacity-50"
            >
              {isSaving ? '💾 Sauvegarde...' : '💾 Sauvegarder et fermer'}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default FileEditor;
