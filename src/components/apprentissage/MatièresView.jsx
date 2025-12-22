/**
 * Composant MatièresView - Vue Matières de l'onglet Apprentissage
 * Gestion des matières avec formulaire d'ajout et liste des matières
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useApprentissageEngine } from '../../hooks/useApprentissageEngine';
import { useToast } from '../ui/Toast';
import { recommendationsCache } from '../../utils/apprentissageCache';
import EmptyState from '../ui/EmptyState';
import SkeletonLoader from '../ui/SkeletonLoader';
import Modal from '../ui/Modal';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Input from '../ui/Input';
import LazyFile from '../ui/LazyFile';

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
    undo,
    redo,
    canUndo,
    canRedo,
  } = useApprentissageEngine();

  const { showSuccess, showError } = useToast();

  // Raccourcis clavier pour undo/redo
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignorer si on est dans un input/textarea
      if (
        e.target.tagName === 'INPUT' ||
        e.target.tagName === 'TEXTAREA' ||
        e.target.isContentEditable
      ) {
        return;
      }

      // Ctrl+Z ou Cmd+Z pour undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) {
          undo();
          showSuccess('Action annulée');
        }
      }
      // Ctrl+Y ou Ctrl+Shift+Z pour redo
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        if (canRedo) {
          redo();
          showSuccess('Action refaite');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, undo, redo, showSuccess]);

  // Raccourcis clavier pour undo/redo
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+Z ou Cmd+Z pour undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) {
          undo();
          showSuccess('Action annulée');
        }
      }
      // Ctrl+Y ou Ctrl+Shift+Z pour redo
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        if (canRedo) {
          redo();
          showSuccess('Action refaite');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, undo, redo, showSuccess]);

  // État formulaire
  const [newSubject, setNewSubject] = useState({
    name: '',
    files: [],
    summary: '',
  });

  // État recherche et filtres
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState('all'); // 'all', 'novice', 'apprenti', 'etudiant', etc.
  const [sortBy, setSortBy] = useState('name'); // 'name', 'level', 'xp', 'recent'

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

  // État modale suppression
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState(null);

  // Supprimer une matière
  const handleDeleteSubject = useCallback(
    (subjectId) => {
      const subject = subjects.find((s) => s.id === subjectId);
      setSubjectToDelete(subject);
      setShowDeleteModal(true);
    },
    [subjects]
  );

  const confirmDeleteSubject = useCallback(() => {
    if (subjectToDelete) {
      deleteSubject(subjectToDelete.id);
      showSuccess('Matière supprimée');
      setShowDeleteModal(false);
      setSubjectToDelete(null);
    }
  }, [subjectToDelete, deleteSubject, showSuccess]);

  // Gestion fichiers supplémentaires
  const handleAdditionalFiles = useCallback((event, subjectId) => {
    const files = Array.from(event.target.files || []);
    // TODO: Implémenter l'ajout de fichiers à une matière existante
    console.log('Ajout fichiers supplémentaires pour matière:', subjectId, files);
  }, []);

  // Filtrer et trier les matières
  const filteredAndSortedSubjects = useMemo(() => {
    let filtered = [...subjects];

    // Filtre par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (subject) =>
          subject.name.toLowerCase().includes(query) ||
          subject.summary?.toLowerCase().includes(query)
      );
    }

    // Filtre par niveau
    if (filterLevel !== 'all') {
      filtered = filtered.filter((subject) => {
        const progression = getSubjectProgression(subject.name);
        const level = progression.level;
        
        switch (filterLevel) {
          case 'novice':
            return level < 3;
          case 'apprenti':
            return level >= 3 && level < 5;
          case 'etudiant':
            return level >= 5 && level < 8;
          case 'erudit':
            return level >= 8 && level < 12;
          case 'expert':
            return level >= 12 && level < 20;
          case 'maitre':
            return level >= 20;
          default:
            return true;
        }
      });
    }

    // Trier
    filtered.sort((a, b) => {
      const progA = getSubjectProgression(a.name);
      const progB = getSubjectProgression(b.name);

      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'level':
          return progB.level - progA.level;
        case 'xp':
          return progB.xp - progA.xp;
        case 'recent':
          return (b.createdAt || 0) - (a.createdAt || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [subjects, searchQuery, filterLevel, sortBy, getSubjectProgression]);

  // Calculer recommandations d'étude (avec cache)
  const recommendations = useMemo(() => {
    if (subjects.length === 0) return { behind: [], urgent: [] };

    // Vérifier le cache d'abord
    const cached = recommendationsCache.get(subjects);
    if (cached !== null) {
      return cached;
    }

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

    const result = { behind, urgent };
    
    // Mettre en cache
    recommendationsCache.set(subjects, result);
    
    return result;
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

      {/* Barre d'outils Undo/Redo */}
      {(canUndo || canRedo) && (
        <div className="flex items-center justify-end gap-2 mb-4">
          <button
            type="button"
            onClick={undo}
            disabled={!canUndo}
            title="Annuler (Ctrl+Z)"
            aria-label="Annuler la dernière action"
            className="gradient-button-premium gradient-button-premium-sm gradient-button-premium-variant rounded-lg flex items-center gap-2"
          >
            <span>↶</span>
            Annuler
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={!canRedo}
            title="Refaire (Ctrl+Y)"
            aria-label="Refaire la dernière action annulée"
            className="gradient-button-premium gradient-button-premium-sm gradient-button-premium-variant rounded-lg flex items-center gap-2"
          >
            <span>↷</span>
            Refaire
          </button>
        </div>
      )}

      {/* Formulaire d'ajout */}
      <Card variant="highlighted">
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
            aria-label="Initialiser un nouveau protocole d'apprentissage"
            aria-describedby={!newSubject.name || !newSubject.name.trim() ? 'name-required' : undefined}
            className="gradient-button-premium gradient-button-premium-md rounded-lg w-full"
          >
            ➕ INITIALISER LE PROTOCOLE
          </button>
          {(!newSubject.name || !newSubject.name.trim()) && (
            <p id="name-required" className="sr-only">Le nom du protocole est requis</p>
          )}
        </form>
      </Card>

      {/* Barre de recherche et filtres */}
      {subjects.length > 0 && (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-emerald-500/30 rounded-xl p-4 shadow-xl shadow-emerald-500/10">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Recherche */}
            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="🔍 Rechercher une matière..."
                className="w-full px-4 py-2 bg-black/30 border-2 border-emerald-500/50 rounded-lg text-slate-200 placeholder-slate-500 focus:border-cyan-400 focus:bg-emerald-500/5 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all duration-200 backdrop-blur-sm"
                aria-label="Rechercher une matière"
              />
            </div>

            {/* Filtre par niveau */}
            <div className="md:w-48">
              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="w-full px-4 py-2 bg-black/30 border-2 border-emerald-500/50 rounded-lg text-slate-200 focus:border-cyan-400 focus:bg-emerald-500/5 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all duration-200 backdrop-blur-sm"
                aria-label="Filtrer par niveau"
              >
                <option value="all">Tous les niveaux</option>
                <option value="novice">🔰 Novice (&lt; 3)</option>
                <option value="apprenti">📖 Apprenti (3-4)</option>
                <option value="etudiant">🎒 Étudiant (5-7)</option>
                <option value="erudit">📜 Érudit (8-11)</option>
                <option value="expert">🎓 Expert (12-19)</option>
                <option value="maitre">👑 Maître (20+)</option>
              </select>
            </div>

            {/* Tri */}
            <div className="md:w-48">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 bg-black/30 border-2 border-emerald-500/50 rounded-lg text-slate-200 focus:border-cyan-400 focus:bg-emerald-500/5 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all duration-200 backdrop-blur-sm"
                aria-label="Trier par"
              >
                <option value="name">Nom (A-Z)</option>
                <option value="level">Niveau (↓)</option>
                <option value="xp">XP (↓)</option>
                <option value="recent">Récent</option>
              </select>
            </div>
          </div>

          {/* Compteur résultats */}
          {filteredAndSortedSubjects.length !== subjects.length && (
            <div className="mt-3 text-sm text-slate-400">
              {filteredAndSortedSubjects.length} matière{filteredAndSortedSubjects.length > 1 ? 's' : ''} trouvée{filteredAndSortedSubjects.length > 1 ? 's' : ''} sur {subjects.length}
            </div>
          )}
        </div>
      )}

      {/* Liste des matières */}
      {subjects.length > 0 ? (
        <div className="space-y-4">
          {filteredAndSortedSubjects.length > 0 ? (
            filteredAndSortedSubjects.map((subject) => {
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
                      className="text-2xl md:text-3xl font-black uppercase mb-3 tracking-tight"
                      style={{ 
                        color: '#32ff9f',
                        textShadow: '0 0 20px rgba(50, 255, 159, 0.5)',
                        lineHeight: '1.2'
                      }}
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
                      type="button"
                      className="gradient-button-premium gradient-button-premium-md rounded-lg font-semibold uppercase text-xs tracking-wide"
                    >
                      ▶️ LANCER LE PROTOCOLE
                    </button>
                    {/* Bouton supprimer */}
                    <button
                      type="button"
                      onClick={() => handleDeleteSubject(subject.id)}
                      className="gradient-button-premium gradient-button-premium-sm rounded-lg font-semibold uppercase text-xs tracking-wide"
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
                      {subject.files.map((file, index) => (
                        <LazyFile
                          key={index}
                          file={file}
                          index={index}
                          onDelete={(fileIndex) => {
                            // TODO: Implémenter la suppression de fichier
                            console.log('Supprimer fichier:', fileIndex);
                          }}
                          onAccess={() => {
                            // Tracking d'accès si nécessaire
                          }}
                        />
                      ))}
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
            })
          ) : (
            <EmptyState
              icon="🔍"
              title="Aucun résultat"
              message={`Aucune matière ne correspond à votre recherche "${searchQuery}" ou au filtre sélectionné.`}
              actionLabel="Réinitialiser les filtres"
              onAction={() => {
                setSearchQuery('');
                setFilterLevel('all');
                setSortBy('name');
              }}
            />
          )}
        </div>
      ) : (
        <EmptyState
          icon="📚"
          title="Aucune matière créée"
          message="Créez votre première matière pour commencer à suivre votre progression d'apprentissage."
        />
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
                ⚠️ Matières urgentes (dernière étude &gt; 7 jours):
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
                    <Card key={subject.id} variant="danger" className="p-3">
                      <div className="font-semibold text-slate-200 mb-1">
                        {subject.name}
                      </div>
                      <Badge variant="danger" size="sm">
                        Dernière étude: {daysSince === 'Jamais' ? 'Jamais' : `Il y a ${daysSince} jour(s)`}
                      </Badge>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modale confirmation suppression */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSubjectToDelete(null);
        }}
        title="Supprimer la matière ?"
        variant="danger"
        onConfirm={confirmDeleteSubject}
        onCancel={() => {
          setShowDeleteModal(false);
          setSubjectToDelete(null);
        }}
        confirmLabel="Oui, supprimer"
        cancelLabel="Annuler"
      >
        <p className="text-slate-300 mb-2">
          Êtes-vous sûr de vouloir supprimer la matière <strong className="text-emerald-400">{subjectToDelete?.name}</strong> ?
        </p>
        <p className="text-slate-400 text-sm">
          Cette action est irréversible. Toutes les données associées (progression, sessions) seront également supprimées.
        </p>
      </Modal>
    </div>
  );
};

export default MatièresView;

