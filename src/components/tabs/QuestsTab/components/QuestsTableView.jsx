/**
 * Composant pour afficher le tableau des quêtes
 * 
 * ✅ PHASE 4 : Extraction de la vue tableau des quêtes
 * 
 * @module components/tabs/QuestsTab/components/QuestsTableView
 */

import React from 'react';
import { calculateQuestXP } from '../../../../hooks/useQuietQuestEngine';
import { getHeureDisplay, getCreneauForQuest, getQuestDureeMinutes, CRENEAU_ORDER, CRENEAUX } from '../../../../utils/quests';
import { formatDuration } from '../utils';
import { CATEGORIES, DIFFICULTIES, JOUR_OPTIONS } from '../constants';

/**
 * Vue tableau des quêtes avec filtres, tri et actions
 * 
 * @param {Object} props
 * @param {Array} props.sortedQuests - Liste de quêtes filtrées et triées
 * @param {Object} props.questFilters - Filtres actifs
 * @param {Function} props.setQuestFilters - Fonction pour mettre à jour les filtres
 * @param {string} props.searchQuery - Requête de recherche
 * @param {Function} props.setSearchQuery - Fonction pour mettre à jour la recherche
 * @param {Function} props.sortQuests - Fonction pour trier
 * @param {Function} props.getSortIcon - Fonction pour obtenir l'icône de tri
 * @param {Set} props.selectedQuests - Set des IDs des quêtes sélectionnées
 * @param {Function} props.toggleQuestSelection - Fonction pour basculer la sélection
 * @param {Function} props.selectAllQuests - Fonction pour sélectionner toutes les quêtes
 * @param {boolean} props.hasSelectedQuests - Si des quêtes sont sélectionnées
 * @param {Function} props.bulkActivate - Fonction pour activer en lot
 * @param {Function} props.bulkDeactivate - Fonction pour désactiver en lot
 * @param {Function} props.bulkDelete - Fonction pour supprimer en lot
 * @param {Function} props.openNewQuestPopup - Fonction pour ouvrir le popup de création
 * @param {Function} props.openEditQuestPopup - Fonction pour ouvrir le popup d'édition
 * @param {Function} props.toggleQuestActive - Fonction pour activer/désactiver une quête
 * @param {Function} props.duplicateQuest - Fonction pour dupliquer une quête
 * @param {Function} props.deleteQuest - Fonction pour supprimer une quête
 * @param {Function} props.startDrag - Fonction pour démarrer le drag
 * @param {Function} props.onDrop - Fonction pour gérer le drop
 * @param {string} [props.todayDate] - Date du jour (pour affichage heure des quêtes prière)
 * @param {{ lat: number, lng: number }} [props.prayerLocation] - Position pour horaires prière
 * @param {Object} [props.sortConfig] - Config de tri (pour grouper par créneau quand tri par heure)
 */
function getCreneauLabel(value) {
  if (value === 'sans-heure') return 'Sans heure';
  const c = CRENEAUX.find((x) => x.value === value);
  return c ? c.label : value;
}

export const QuestsTableView = ({
  sortedQuests,
  sortConfig = {},
  questFilters,
  setQuestFilters,
  searchQuery,
  setSearchQuery,
  sortQuests,
  getSortIcon,
  selectedQuests,
  toggleQuestSelection,
  selectAllQuests,
  hasSelectedQuests,
  bulkActivate,
  bulkDeactivate,
  bulkDelete,
  openNewQuestPopup,
  openEditQuestPopup,
  toggleQuestActive,
  duplicateQuest,
  deleteQuest,
  startDrag,
  onDrop,
  todayDate,
  prayerLocation,
}) => {
  const groupByHeure = sortConfig.column === 'heure';
  const groupedByCreneau = groupByHeure
    ? (() => {
        const groups = {};
        CRENEAU_ORDER.forEach((c) => { groups[c] = []; });
        sortedQuests.forEach((quest) => {
          const creneau = getCreneauForQuest(quest, todayDate, prayerLocation);
          if (groups[creneau]) groups[creneau].push(quest);
          else groups[creneau] = [quest];
        });
        return groups;
      })()
    : null;

  const renderQuestRow = (quest) => (
    <tr
      key={quest.id}
      className={`border-t border-slate-800/70 hover:bg-slate-800/80 transition-colors ${
        quest.active === false ? 'opacity-60' : ''
      }`}
      draggable
      onDragStart={() => startDrag(quest.id)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={() => onDrop(quest.id)}
    >
      <td className="px-3 py-2 align-top">
        <input
          type="checkbox"
          checked={selectedQuests.has(quest.id)}
          onChange={() => toggleQuestSelection(quest.id)}
          className="rounded border-slate-600 bg-slate-900"
        />
      </td>
      <td className="px-3 py-2 align-top">
        <div className="font-semibold text-slate-100">{quest.nom}</div>
        {quest.description && (
          <div className="text-[11px] text-slate-400 line-clamp-2">
            {quest.description}
          </div>
        )}
      </td>
      <td className="px-3 py-2 align-top text-amber-400/90 text-[11px] font-mono">
        {getHeureDisplay(quest, todayDate, prayerLocation) || '—'}
      </td>
      <td className="px-3 py-2 align-top text-slate-200 text-[11px]">
        {quest.categorie}
      </td>
      <td className="px-3 py-2 align-top">
        {'★'.repeat(quest.difficulte || 1)}
        <span className="text-slate-500 text-[10px] ml-1">
          ({quest.difficulte || 1})
        </span>
      </td>
      <td className="px-3 py-2 align-top text-[11px] text-slate-200">
        {formatDuration(getQuestDureeMinutes(quest))}
      </td>
      <td className="px-3 py-2 align-top text-[11px] text-slate-200">
        {quest.type === 'exceptionnelle'
          ? `Exceptionnelle – ${quest.date || 'date ?'}`
          : Array.isArray(quest.jours) && quest.jours.length
          ? `Jours : ${quest.jours.join(', ')}`
          : 'Récurrente'}
      </td>
      <td className="px-3 py-2 align-top text-[11px] text-emerald-300 font-semibold">
        {(quest.xp ?? calculateQuestXP(quest))} XP
      </td>
      <td className="px-3 py-2 align-top text-right">
        <div className="inline-flex gap-1">
          <button
            type="button"
            onClick={() => toggleQuestActive(quest.id)}
            title={quest.active === false ? 'Activer' : 'Désactiver'}
            className={`gradient-button-premium gradient-button-premium-sm rounded-lg ${
              quest.active === false ? '' : 'gradient-button-premium-variant'
            }`}
          >
            {quest.active === false ? '▶️' : '⏸️'}
          </button>
          <button
            type="button"
            onClick={() => openEditQuestPopup(quest.id)}
            className="gradient-button-premium gradient-button-premium-sm gradient-button-premium-variant rounded-lg"
            title="Éditer"
          >
            ✏️
          </button>
          <button
            type="button"
            onClick={() => duplicateQuest(quest.id)}
            className="gradient-button-premium gradient-button-premium-sm gradient-button-premium-variant rounded-lg"
            title="Dupliquer"
          >
            📋
          </button>
          <button
            type="button"
            onClick={() => deleteQuest(quest.id)}
            className="gradient-button-premium gradient-button-premium-sm rounded-lg"
            title="Supprimer"
          >
            🗑️
          </button>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-100">
            Arsenal de <span className="text-emerald-400">Missions</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Centralise toutes tes quêtes, filtre, trie, duplique et organise ton système QuietQuest.
          </p>
        </div>
        <button
          type="button"
          onClick={openNewQuestPopup}
          className="gradient-button-premium gradient-button-premium-md rounded-lg self-start inline-flex items-center gap-2"
        >
          <span>＋</span>
          <span>Nouvelle quête</span>
        </button>
      </div>

      {/* Barre de filtres */}
      <div className="bg-slate-900/60 border border-slate-700/80 rounded-2xl px-4 py-3 flex flex-wrap gap-3 items-center">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="🔍 Rechercher une quête..."
          className="flex-1 min-w-[200px] bg-slate-900/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400"
        />

        <select
          value={questFilters.categorie}
          onChange={(e) => setQuestFilters((prev) => ({ ...prev, categorie: e.target.value }))}
          className="bg-slate-900/80 border border-slate-700 rounded-xl px-2 py-2 text-xs text-slate-100"
        >
          <option value="all">Toutes catégories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <select
          value={questFilters.difficulte}
          onChange={(e) => setQuestFilters((prev) => ({ ...prev, difficulte: e.target.value }))}
          className="bg-slate-900/80 border border-slate-700 rounded-xl px-2 py-2 text-xs text-slate-100"
        >
          <option value="all">Toutes difficultés</option>
          {DIFFICULTIES.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>

        <select
          value={questFilters.jour}
          onChange={(e) => setQuestFilters((prev) => ({ ...prev, jour: e.target.value }))}
          className="bg-slate-900/80 border border-slate-700 rounded-xl px-2 py-2 text-xs text-slate-100"
        >
          {JOUR_OPTIONS.map((j) => (
            <option key={j.label} value={j.value}>
              {j.label}
            </option>
          ))}
          <option value="exceptionnelles">Exceptionnelles</option>
        </select>

        <label className="flex items-center gap-1 text-[11px] text-slate-300">
          <input
            type="checkbox"
            checked={questFilters.showInactive}
            onChange={(e) =>
              setQuestFilters((prev) => ({ ...prev, showInactive: e.target.checked }))
            }
            className="rounded border-slate-600 bg-slate-900"
          />
          Inactives
        </label>
      </div>

      {/* Actions en lot */}
      {hasSelectedQuests && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-200">
          <span className="text-slate-400 mr-1">
            {selectedQuests.size} quête(s) sélectionnée(s)
          </span>
          <button
            type="button"
            onClick={bulkActivate}
            className="gradient-button-premium gradient-button-premium-sm rounded-lg"
          >
            Activer
          </button>
          <button
            type="button"
            onClick={bulkDeactivate}
            className="gradient-button-premium gradient-button-premium-sm gradient-button-premium-variant rounded-lg"
          >
            Désactiver
          </button>
          <button
            type="button"
            onClick={bulkDelete}
            className="gradient-button-premium gradient-button-premium-sm rounded-lg"
          >
            Supprimer
          </button>
        </div>
      )}

      {/* Tableau des quêtes */}
      <div className="bg-slate-900/70 border border-slate-700/80 rounded-2xl overflow-hidden">
        <table className="min-w-full text-xs text-slate-100">
          <thead className="bg-slate-900/90">
            <tr className="border-b border-slate-700/80">
              <th className="px-3 py-2 text-left">
                <input
                  type="checkbox"
                  onChange={selectAllQuests}
                  checked={
                    sortedQuests.length > 0 &&
                    selectedQuests.size === sortedQuests.length
                  }
                  className="rounded border-slate-600 bg-slate-900"
                />
              </th>
              <th
                className="px-3 py-2 text-left cursor-pointer select-none"
                onClick={() => sortQuests('nom')}
              >
                Nom {getSortIcon('nom')}
              </th>
              <th
                className="px-3 py-2 text-left cursor-pointer select-none"
                onClick={() => sortQuests('heure')}
                title="Heure prévue (emploi du temps)"
              >
                Heure {getSortIcon('heure')}
              </th>
              <th
                className="px-3 py-2 text-left cursor-pointer select-none"
                onClick={() => sortQuests('categorie')}
              >
                Catégorie {getSortIcon('categorie')}
              </th>
              <th
                className="px-3 py-2 text-left cursor-pointer select-none"
                onClick={() => sortQuests('difficulte')}
              >
                Niveau {getSortIcon('difficulte')}
              </th>
              <th
                className="px-3 py-2 text-left cursor-pointer select-none"
                onClick={() => sortQuests('duree')}
              >
                Temps {getSortIcon('duree')}
              </th>
              <th
                className="px-3 py-2 text-left cursor-pointer select-none"
                onClick={() => sortQuests('recurrence')}
              >
                Répétition {getSortIcon('recurrence')}
              </th>
              <th
                className="px-3 py-2 text-left cursor-pointer select-none"
                onClick={() => sortQuests('xp')}
              >
                XP {getSortIcon('xp')}
              </th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedQuests.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-4 py-6 text-center text-sm text-slate-400 bg-slate-900/60"
                >
                  Aucune quête trouvée. Ajuste tes filtres ou crée une nouvelle quête.
                </td>
              </tr>
            ) : groupByHeure && groupedByCreneau ? (
              CRENEAU_ORDER.flatMap((creneau) => {
                const quests = groupedByCreneau[creneau] || [];
                if (quests.length === 0) return [];
                return [
                  <tr key={`section-${creneau}`} className="bg-slate-800/90 border-t border-slate-700/80">
                    <td colSpan={9} className="px-4 py-2 text-sm font-semibold text-amber-400/95">
                      {getCreneauLabel(creneau)}
                    </td>
                  </tr>,
                  ...quests.map((quest) => renderQuestRow(quest)),
                ];
              })
            ) : (
              sortedQuests.map((quest) => renderQuestRow(quest))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
