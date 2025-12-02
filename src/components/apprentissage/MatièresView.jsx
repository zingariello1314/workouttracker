/**
 * Composant MatièresView - Vue Matières de l'onglet Apprentissage
 * Gestion des matières avec formulaire d'ajout et liste des matières
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useApprentissageEngine } from '../../hooks/useApprentissageEngine';
import { useToast } from '../ui/Toast';

const MatièresView = () => {
  const {
    subjects,
    isLoading,
    progressionData,
    addSubject,
    deleteSubject,
    getSubjectProgression,
    getSubjectBadge,
    getXPForNextLevel,
    getCurrentLevelXP,
  } = useApprentissageEngine();

  const { showSuccess, showError } = useToast();

  // État formulaire
  const [newSubject, setNewSubject] = useState({
    name: '',
    files: [],
    summary: '',
  });

  // Gestion upload fichiers
  const handleFileUpload = useCallback((event) => {
    const files = Array.from(event.target.files || []);
    setNewSubject((prev) => ({
      ...prev,
      files: [...prev.files, ...files],
    }));
  }, []);

  // Ajouter une matière
  const handleAddSubject = useCallback(
    (e) => {
      e.preventDefault();

      if (!newSubject.name || !newSubject.name.trim()) {
        showError('Le nom de la matière est requis');
        return;
      }

      // Vérifier doublon
      const duplicate = subjects.find(
        (s) => s.name.toLowerCase() === newSubject.name.trim().toLowerCase()
      );
      if (duplicate) {
        showError('Cette matière existe déjà');
        return;
      }

      try {
        addSubject(newSubject);
        showSuccess('Matière ajoutée avec succès');
        setNewSubject({ name: '', files: [], summary: '' });
      } catch (error) {
        showError('Erreur lors de l\'ajout de la matière');
        console.error(error);
      }
    },
    [newSubject, subjects, addSubject, showSuccess, showError]
  );

  // Supprimer une matière
  const handleDeleteSubject = useCallback(
    (subjectId) => {
      if (window.confirm('Êtes-vous sûr de vouloir supprimer cette matière ?')) {
        deleteSubject(subjectId);
        showSuccess('Matière supprimée');
      }
    },
    [deleteSubject, showSuccess]
  );

  // Gestion fichiers supplémentaires
  const handleAdditionalFiles = useCallback((event, subjectId) => {
    const files = Array.from(event.target.files || []);
    // TODO: Implémenter l'ajout de fichiers à une matière existante
    console.log('Ajout fichiers supplémentaires pour matière:', subjectId, files);
  }, []);

  // Calculer recommandations d'étude
  const recommendations = useMemo(() => {
    if (subjects.length === 0) return { behind: [], urgent: [] };

    // Calculer niveau moyen
    const levels = subjects.map((s) => {
      const prog = getSubjectProgression(s.name);
      return prog.level;
    });
    const avgLevel = levels.reduce((a, b) => a + b, 0) / levels.length;

    // Matières en retard (niveau < moyenne - 0.5)
    const behind = subjects.filter((s) => {
      const prog = getSubjectProgression(s.name);
      return prog.level < avgLevel - 0.5;
    });

    // Matières urgentes (dernière étude > 7 jours)
    const urgent = subjects.filter((s) => {
      const subjectData = progressionData.subjects[s.name];
      if (!subjectData || !subjectData.lastStudyDate) return true;
      const lastStudy = new Date(subjectData.lastStudyDate);
      const daysSince = (Date.now() - lastStudy.getTime()) / (1000 * 60 * 60 * 24);
      return daysSince > 7;
    });

    return { behind, urgent };
  }, [subjects, progressionData, getSubjectProgression]);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6 text-center text-slate-300">
        Chargement...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Message vide */}
      {subjects.length === 0 && (
        <div className="text-center py-12">
          <div className="text-slate-300 text-xl font-semibold mb-2">
            AUCUN PROTOCOLE DÉTECTÉ...
          </div>
          <div className="text-slate-400 text-lg">
            INITIALISEZ VOTRE PREMIER MODULE D'APPRENTISSAGE
          </div>
        </div>
      )}

      {/* Formulaire d'ajout */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-emerald-500/30 rounded-xl p-6 shadow-xl shadow-emerald-500/10">
        <div className="text-center mb-6">
          <div className="text-3xl mb-2" style={{ filter: 'drop-shadow(0 0 8px rgba(50, 255, 159, 0.5))' }}>
            📚
          </div>
          <h2
            className="text-2xl font-extrabold uppercase tracking-wider"
            style={{
              color: '#32ff9f',
              textShadow: '0 0 15px rgba(50, 255, 159, 0.5)',
            }}
          >
            INITIALISATION D'UN NOUVEAU PROTOCOLE
          </h2>
        </div>

        <form onSubmit={handleAddSubject} className="space-y-4">
          {/* Champ nom */}
          <div>
            <input
              type="text"
              value={newSubject.name}
              onChange={(e) => setNewSubject((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Nom du protocole (ex: HISTOIRE NEURALE)"
              required
              maxLength={100}
              className="w-full px-4 py-3 bg-black/30 border-2 border-emerald-500/50 rounded-lg text-slate-200 placeholder-slate-500 focus:border-cyan-400 focus:bg-emerald-500/5 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:scale-[1.02] transition-all duration-200 backdrop-blur-sm"
            />
          </div>

          {/* Champ fichiers */}
          <div>
            <input
              type="file"
              multiple
              onChange={handleFileUpload}
              accept=".odt,.ods,.pdf,.docx,.xlsx,.txt,.md"
              className="w-full px-4 py-3 bg-black/30 border-2 border-emerald-500/50 rounded-lg text-slate-200 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-500/20 file:text-emerald-300 hover:file:bg-emerald-500/30 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all duration-200 backdrop-blur-sm"
            />
            {newSubject.files.length > 0 && (
              <div className="mt-2 text-sm text-slate-400">
                {newSubject.files.length} fichier(s) sélectionné(s)
              </div>
            )}
          </div>

          {/* Champ résumé */}
          <div>
            <textarea
              value={newSubject.summary}
              onChange={(e) => setNewSubject((prev) => ({ ...prev, summary: e.target.value }))}
              placeholder="Résumé du protocole (optionnel)"
              rows={3}
              maxLength={2000}
              className="w-full px-4 py-3 bg-black/30 border-2 border-emerald-500/50 rounded-lg text-slate-200 placeholder-slate-500 focus:border-cyan-400 focus:bg-emerald-500/5 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all duration-200 backdrop-blur-sm resize-y min-h-[80px]"
            />
          </div>

          {/* Bouton soumettre */}
          <button
            type="submit"
            disabled={!newSubject.name || !newSubject.name.trim()}
            className="w-full py-3 px-6 bg-gradient-to-r from-slate-900 to-slate-800 border-2 border-emerald-500 rounded-lg text-emerald-400 font-bold uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gradient-to-r hover:from-emerald-500/20 hover:to-cyan-500/20 hover:text-cyan-300 hover:border-cyan-400 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/40 transition-all duration-200"
          >
            ➕ INITIALISER LE PROTOCOLE
          </button>
        </form>
      </div>

      {/* Liste des matières */}
      {subjects.length > 0 && (
        <div className="space-y-4">
          {subjects.map((subject) => {
            const progression = getSubjectProgression(subject.name);
            const badge = getSubjectBadge(progression.level);
            const nextLevelXP = getXPForNextLevel(progression.level);
            const currentLevelXP = getCurrentLevelXP(progression.xp, progression.level);

            return (
              <div
                key={subject.id}
                className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 shadow-xl hover:border-emerald-500/30 transition-all duration-200"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3
                      className="text-xl font-bold uppercase mb-2"
                      style={{ color: '#32ff9f' }}
                    >
                      {subject.name || 'PROTOCOLE SANS NOM'}
                    </h3>

                    {/* Badge et niveau */}
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide"
                        style={{
                          borderColor: `${badge.color}60`,
                          backgroundColor: `${badge.color}20`,
                          color: badge.color,
                        }}
                      >
                        {badge.icon} {badge.name}
                      </div>
                      <div
                        className="text-sm font-bold"
                        style={{
                          background: 'linear-gradient(45deg, #32ff9f, #00ffc8)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          textShadow: '0 0 8px rgba(50, 255, 159, 0.6)',
                        }}
                      >
                        LEVEL {progression.level}
                      </div>
                    </div>

                    {/* Barre de progression XP */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>{currentLevelXP} / {nextLevelXP} XP</span>
                        <span className="text-emerald-400 font-semibold">
                          {Math.round(progression.progress)}%
                        </span>
                      </div>
                      <div className="w-full h-3 bg-black/40 border border-emerald-500/30 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-teal-400 transition-all duration-800 rounded-full"
                          style={{ width: `${progression.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="ml-4 flex flex-col gap-2">
                    {/* Bouton démarrer session */}
                    <button
                      className="px-4 py-2 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500 rounded-lg text-emerald-400 hover:from-emerald-500/30 hover:to-cyan-500/30 hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/50 transition-all duration-200 font-semibold uppercase text-xs tracking-wide"
                    >
                      ▶️ LANCER LE PROTOCOLE
                    </button>
                    {/* Bouton supprimer */}
                    <button
                      onClick={() => handleDeleteSubject(subject.id)}
                      className="px-4 py-2 bg-gradient-to-r from-red-900/90 to-red-800/90 border border-red-500 rounded-lg text-red-400 hover:bg-red-500/20 hover:border-red-400 hover:scale-105 hover:shadow-lg hover:shadow-red-500/50 transition-all duration-200 font-semibold uppercase text-xs tracking-wide"
                    >
                      🗑️ SUPPRIMER LE PROTOCOLE
                    </button>
                  </div>
                </div>

                {/* Status planification */}
                <div className="mt-3 text-sm text-slate-400">
                  <span className="text-slate-500">NON PLANIFIÉ</span>
                </div>

                {/* Résumé */}
                {subject.summary && (
                  <div className="mt-4 pt-4 border-t border-slate-700/50">
                    <div className="text-sm font-semibold text-emerald-400 mb-2">
                      RÉSUMÉ DU PROTOCOLE :
                    </div>
                    <div className="text-slate-300 text-sm leading-relaxed">
                      {subject.summary}
                    </div>
                  </div>
                )}

                {/* Fichiers */}
                {subject.files && subject.files.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-700/50">
                    <div className="text-sm font-semibold text-emerald-400 mb-3">
                      ➕ FICHIERS TÉLÉVERSÉS :
                    </div>
                    <div className="space-y-2">
                      {subject.files.map((file, index) => {
                        const fileName = file.name || file.fileName || 'UNNAMED ASSET';
                        const fileExt = fileName.split('.').pop()?.toLowerCase();
                        const getFileIcon = (ext) => {
                          if (['odt', 'docx', 'txt', 'md'].includes(ext)) return '📝';
                          if (['ods', 'xlsx'].includes(ext)) return '📊';
                          if (ext === 'pdf') return '📄';
                          return '📎';
                        };

                        return (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-700/50 hover:border-emerald-500/30 transition-all duration-200"
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <span className="text-lg">{getFileIcon(fileExt)}</span>
                              <div className="flex-1">
                                <div className="text-sm font-semibold text-slate-200 uppercase">
                                  {fileName.toUpperCase()}
                                </div>
                                {file.size && (
                                  <div className="text-xs text-slate-500 mt-0.5">
                                    {(file.size / 1024).toFixed(1)} KB
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {file.url ? (
                                <a
                                  href={file.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  download
                                  className="px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/50 rounded text-emerald-400 hover:bg-emerald-500/30 hover:border-emerald-400 transition-all duration-200 text-xs font-semibold uppercase"
                                >
                                  🔍 ACCÉDER
                                </a>
                              ) : (
                                <span className="px-3 py-1.5 text-slate-500 text-xs">
                                  ⏳ CHARGEMENT...
                                </span>
                              )}
                              <button
                                className="px-2 py-1.5 bg-red-900/30 border border-red-500/50 rounded text-red-400 hover:bg-red-500/20 hover:border-red-400 transition-all duration-200"
                                title="SUPPRIMER LE FICHIER"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Section ajout fichiers supplémentaires */}
                <div className="mt-4 pt-4 border-t border-slate-700/50">
                  <label className="text-sm font-semibold text-emerald-400 mb-2 block">
                    ➕ TÉLÉVERSER DES FICHIERS :
                  </label>
                  <input
                    type="file"
                    multiple
                    accept=".odt,.ods,.pdf,.docx,.xlsx,.txt,.md"
                    onChange={(e) => handleAdditionalFiles(e, subject.id)}
                    className="w-full px-4 py-2 bg-black/30 border-2 border-emerald-500/50 rounded-lg text-slate-200 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-500/20 file:text-emerald-300 hover:file:bg-emerald-500/30 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all duration-200 backdrop-blur-sm"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Module Recommandations d'Étude */}
      {(recommendations.behind.length > 0 || recommendations.urgent.length > 0) && (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-amber-500/30 rounded-xl p-6 shadow-xl shadow-amber-500/10">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">💡</span>
            <div>
              <h3 className="text-lg font-bold text-amber-400 uppercase tracking-wide">
                RECOMMANDATIONS D'OPTIMISATION
              </h3>
              <p className="text-sm text-slate-400">
                Maximisez l'efficacité de votre progression
              </p>
            </div>
          </div>

          {recommendations.behind.length > 0 && (
            <div className="mb-4">
              <div className="text-sm font-semibold text-amber-300 mb-2">
                📉 Matières en retard:
              </div>
              <div className="space-y-2">
                {recommendations.behind.map((subject) => {
                  const prog = getSubjectProgression(subject.name);
                  return (
                    <div
                      key={subject.id}
                      className="p-3 bg-slate-900/50 rounded-lg border border-amber-500/30"
                    >
                      <div className="font-semibold text-slate-200">
                        {subject.name}
                      </div>
                      <div className="text-xs text-slate-400">
                        Niveau {prog.level} (en dessous de la moyenne)
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {recommendations.urgent.length > 0 && (
            <div>
              <div className="text-sm font-semibold text-red-400 mb-2">
                ⚠️ Matières urgentes (dernière étude > 7 jours):
              </div>
              <div className="space-y-2">
                {recommendations.urgent.map((subject) => {
                  const subjectData = progressionData.subjects[subject.name];
                  const lastStudy = subjectData?.lastStudyDate
                    ? new Date(subjectData.lastStudyDate)
                    : null;
                  const daysSince = lastStudy
                    ? Math.floor((Date.now() - lastStudy.getTime()) / (1000 * 60 * 60 * 24))
                    : 'Jamais';

                  return (
                    <div
                      key={subject.id}
                      className="p-3 bg-slate-900/50 rounded-lg border border-red-500/30"
                    >
                      <div className="font-semibold text-slate-200">
                        {subject.name}
                      </div>
                      <div className="text-xs text-slate-400">
                        Dernière étude: {daysSince === 'Jamais' ? 'Jamais' : `Il y a ${daysSince} jour(s)`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MatièresView;

