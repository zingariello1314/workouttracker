import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useTranslation } from '../../../utils/translations';
import { usePlanificateur } from '../../../hooks/usePlanificateur';
import { useToast } from '../../ui/Toast/ToastProvider';
import { planificateurSync } from '../../../services/finance/planificateurSync';
import { debounce, formatCurrency } from '../../../utils/planificateurUtils';
import logger from '../../../utils/logger';
import RepartitionInterface from './RepartitionInterface';
import SkeletonLoader from '../bourse/SkeletonLoader';

const log = logger.module('RepartitionSalaireSubTab');

const FIXED_DEFAULTS = [
  { id: 'cat_loyer', key: 'loyer', label: 'Loyer', emoji: '🏠', type: 'charges', subType: 'loyer', order: 1 },
  { id: 'cat_investissementOr', key: 'investissementOr', label: 'Or', emoji: '🥇', type: 'investissement', subType: 'or', order: 2 },
  { id: 'cat_bourse', key: 'investissementBourse', label: 'Bourse', emoji: '📈', type: 'investissement', subType: 'bourse', order: 3 },
  { id: 'cat_cash', key: 'cashAccumulation', label: 'Cash', emoji: '💰', type: 'epargne', subType: 'cash', order: 4 },
  { id: 'cat_loisirs', key: 'loisirs', label: 'Loisirs', emoji: '🎮', type: 'loisirs', order: 5 }
];

function buildCategoriesFromLegacy(legacy) {
  if (!legacy) return [];
  const existingById = (legacy.categories || []).reduce((acc, c) => {
    if (c && c.id) acc[c.id] = c;
    return acc;
  }, {});
  const fixed = FIXED_DEFAULTS.map((def) => {
    const existing = existingById[def.id];
    const type = (existing && existing.type) || def.type;
    // Source de vérité V2 = montant sur la catégorie ; les clés legacy à 0 ne doivent pas écraser (bug ?? avec 0).
    const fromCat = existing?.montant;
    const hasCatMontant = existing != null && typeof fromCat === 'number' && !Number.isNaN(fromCat);
    const montant = Number(hasCatMontant ? fromCat : (legacy[def.key] ?? 0)) || 0;
    return { ...def, type, montant, fixed: true };
  });
  const custom = (legacy.categories || []).filter(c => c && !FIXED_CATEGORY_IDS.includes(c.id));
  return [...fixed, ...custom.map((c, i) => ({
    id: c.id,
    key: c.key,
    label: c.label || 'Catégorie',
    emoji: c.emoji || '🧩',
    type: c.type || 'autre',
    subType: c.subType,
    montant: Number(c.montant) || 0,
    fixed: false,
    order: 6 + i
  }))];
}

const FIXED_CATEGORY_IDS = ['cat_loyer', 'cat_investissementOr', 'cat_bourse', 'cat_cash', 'cat_loisirs'];

const REPARTITION_KEYS_SANS_SURPLUS = ['loyer', 'investissementOr', 'investissementBourse', 'cashAccumulation', 'loisirs'];

const KEY_TO_FIXED_ID = {
  loyer: 'cat_loyer',
  investissementOr: 'cat_investissementOr',
  investissementBourse: 'cat_bourse',
  cashAccumulation: 'cat_cash',
  loisirs: 'cat_loisirs'
};

const RepartitionSalaireSubTab = () => {
  const t = useTranslation();
  const { salaire, repartition, repartitionLegacy, updateSalaire, updateRepartition, loading } = usePlanificateur();
  const { showToast } = useToast();
  const overrunToastShownRef = React.useRef(false);
  const [localSalaire, setLocalSalaire] = useState(salaire?.netMensuel || 3000);
  const defaultLegacy = {
    loyer: 800,
    investissementOr: 300,
    investissementBourse: 500,
    cashAccumulation: 200,
    loisirs: 400,
    surplus: 800,
    categories: []
  };
  /** null = afficher la source hook (repartitionLegacy), objet = brouillon local après édition */
  const [localRepartition, setLocalRepartition] = useState(null);

  const dataForUi = useMemo(() => {
    // != null : évite undefined ; toujours hydrater categories (sinon liste vide = aucun slider malgré les clés legacy)
    let raw;
    if (localRepartition != null) {
      raw = localRepartition;
    } else if (repartitionLegacy) {
      raw = {
        loyer: repartitionLegacy.loyer ?? 0,
        investissementOr: repartitionLegacy.investissementOr ?? 0,
        investissementBourse: repartitionLegacy.investissementBourse ?? 0,
        cashAccumulation: repartitionLegacy.cashAccumulation ?? 0,
        loisirs: repartitionLegacy.loisirs ?? 0,
        surplus: repartitionLegacy.surplus ?? 0,
        categories: Array.isArray(repartitionLegacy.categories)
          ? repartitionLegacy.categories.map((c) => ({ ...c }))
          : []
      };
    } else {
      raw = defaultLegacy;
    }
    return {
      ...raw,
      categories: buildCategoriesFromLegacy(raw)
    };
  }, [localRepartition, repartitionLegacy]);

  /** Dernière répartition affichée (hook ou mémo) — pour setState fonctionnel sans closure périmée */
  const dataForUiRef = React.useRef(dataForUi);
  dataForUiRef.current = dataForUi;
  const localSalaireRef = React.useRef(localSalaire);
  localSalaireRef.current = localSalaire;

  // Total alloué : mêmes règles que handleRepartitionChange (pas de double comptage fixes + catégories)
  const totalAlloue = useMemo(() => {
    const fixedTotal = REPARTITION_KEYS_SANS_SURPLUS
      .reduce((sum, key) => sum + (dataForUi[key] || 0), 0);
    const customOnlyTotal = (dataForUi.categories || [])
      .filter((cat) => !FIXED_CATEGORY_IDS.includes(cat.id))
      .reduce((sum, cat) => sum + (cat.montant || 0), 0);
    return fixedTotal + customOnlyTotal;
  }, [dataForUi]);

  // Écart vs salaire
  const ecart = useMemo(() => {
    return localSalaire - totalAlloue;
  }, [localSalaire, totalAlloue]);

  // Mise à jour salaire
  const handleSalaireChange = useCallback(async (newSalaire) => {
    const salaireNum = parseFloat(newSalaire) || 0;
    if (salaireNum < 0) return;

    setLocalSalaire(salaireNum);
    try {
      await updateSalaire({ netMensuel: salaireNum });
      showToast('Salaire mis à jour', 'success');
    } catch (error) {
      showToast('Erreur lors de la mise à jour', 'error');
    }
  }, [updateSalaire, showToast]);

  // Debounced update pour éviter trop de requêtes
  const debouncedUpdateRepartition = useMemo(
    () => debounce(async (finalRepartitionLegacy) => {
      try {
        const v2 = {
          id: repartition?.id || 'current',
          categories: buildCategoriesFromLegacy(finalRepartitionLegacy),
          updatedAt: new Date().toISOString()
        };
        await updateRepartition(v2);
        try {
          await planificateurSync.propagateRepartitionChange(v2);
          const notifications = planificateurSync.getNotifications(v2);
          if (notifications.length > 0) {
            const notif = notifications[0];
            showToast(`${notif.icon} ${notif.message}`, 'info');
          }
        } catch (syncError) {
          log.warn('Sync error (non-blocking):', syncError);
        }
      } catch (error) {
        showToast('Erreur lors de la mise à jour', 'error');
      }
    }, 500),
    [updateRepartition, showToast, repartition?.id]
  );

  // Mise à jour répartition : setState fonctionnel + ref pour éviter les closures périmées (plusieurs onChange/slider avant re-render)
  const handleRepartitionChange = useCallback(
    (change) => {
      let computedFinal = null;

      setLocalRepartition((prev) => {
        const baseSource = prev != null ? prev : dataForUiRef.current;
        let baseRepartition = {
          ...baseSource,
          categories: buildCategoriesFromLegacy(baseSource)
        };

        if (change.kind === 'changeType') {
          const { id: catId, key: catKey, type: newType } = change;
          if (!newType || newType === 'surplus') return prev;
          const categories = (baseRepartition.categories || []).map((c) =>
            c.id === catId || c.key === catKey ? { ...c, type: newType } : c
          );
          baseRepartition = { ...baseRepartition, categories };
        } else {
          const valueNum = parseFloat(change.value) || 0;
          if (valueNum < 0) return prev;

          if (change.kind === 'fixed') {
            if (change.key === 'surplus') return prev;
            baseRepartition = {
              ...baseRepartition,
              [change.key]: valueNum
            };
            const fixedId = KEY_TO_FIXED_ID[change.key];
            if (fixedId && Array.isArray(baseRepartition.categories)) {
              baseRepartition = {
                ...baseRepartition,
                categories: baseRepartition.categories.map((c) =>
                  c.id === fixedId ? { ...c, montant: valueNum } : c
                )
              };
            }
          } else if (change.kind === 'custom') {
            const categories = (baseRepartition.categories || []).map((cat) =>
              cat.id === change.id ? { ...cat, montant: valueNum } : cat
            );
            baseRepartition = {
              ...baseRepartition,
              categories
            };
          }
        }

        const fixedTotal = REPARTITION_KEYS_SANS_SURPLUS.reduce((sum, k) => sum + (baseRepartition[k] || 0), 0);
        const customOnlyTotal = (baseRepartition.categories || [])
          .filter((cat) => !FIXED_CATEGORY_IDS.includes(cat.id))
          .reduce((sum, cat) => sum + (cat.montant || 0), 0);
        const totalSansSurplus = fixedTotal + customOnlyTotal;
        const salaireNum = localSalaireRef.current;
        const surplus = salaireNum - totalSansSurplus;

        const finalRepartition = {
          ...baseRepartition,
          surplus
        };
        computedFinal = finalRepartition;
        return finalRepartition;
      });

      if (computedFinal == null) return;

      const salaireNum = localSalaireRef.current;
      const fixedTotal = REPARTITION_KEYS_SANS_SURPLUS.reduce((sum, k) => sum + (computedFinal[k] || 0), 0);
      const customOnlyTotal = (computedFinal.categories || [])
        .filter((cat) => !FIXED_CATEGORY_IDS.includes(cat.id))
        .reduce((sum, cat) => sum + (cat.montant || 0), 0);
      const totalSansSurplus = fixedTotal + customOnlyTotal;

      if (totalSansSurplus > salaireNum) {
        if (!overrunToastShownRef.current) {
          showToast('Dépassement du salaire : ajustez les autres catégories ou acceptez un surplus négatif.', 'warning');
          overrunToastShownRef.current = true;
        }
      } else {
        overrunToastShownRef.current = false;
      }

      debouncedUpdateRepartition(computedFinal);
    },
    [debouncedUpdateRepartition, showToast]
  );

  // Synchroniser avec les données chargées
  React.useEffect(() => {
    if (salaire?.netMensuel) {
      setLocalSalaire(salaire.netMensuel);
    }
  }, [salaire]);

  // Création de catégorie personnalisée
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCatLabel, setNewCatLabel] = useState('');
  const [newCatEmoji, setNewCatEmoji] = useState('🧩');
  const [newCatType, setNewCatType] = useState('loisirs');
  const [newCatAmount, setNewCatAmount] = useState(0);

  const EMOJI_OPTIONS = [
    '🏠','🍔','🛒','🚗','🎮','🎧','📚','💻','💄','🐾','✈️','🎁','💡','📈','💰'
  ];

  const handleCreateCategory = useCallback(() => {
    const label = newCatLabel.trim();
    const amount = parseFloat(newCatAmount) || 0;
    if (!label || amount < 0) return;

    const id = `cat_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    const newCategory = {
      id,
      label,
      emoji: newCatEmoji || '🧩',
      type: newCatType,
      montant: amount
    };

    const updatedCategories = [...(dataForUi.categories || []), newCategory];

    const fixedTotal = REPARTITION_KEYS_SANS_SURPLUS
      .reduce((sum, k) => sum + (dataForUi[k] || 0), 0);
    const categoriesTotal = updatedCategories.reduce((sum, cat) => sum + (cat.montant || 0), 0);
    const totalSansSurplus = fixedTotal + categoriesTotal;
    const surplus = localSalaire - totalSansSurplus;

    const finalRepartition = {
      ...dataForUi,
      categories: updatedCategories,
      surplus
    };

    setLocalRepartition(finalRepartition);
    debouncedUpdateRepartition(finalRepartition);

    setShowNewCategory(false);
    setNewCatLabel('');
    setNewCatEmoji('🧩');
    setNewCatType('loisirs');
    setNewCatAmount(0);
  }, [dataForUi, localSalaire, debouncedUpdateRepartition, newCatAmount, newCatEmoji, newCatLabel, newCatType]);

  if (loading) {
    return <SkeletonLoader />;
  }

  return (
    <div className="repartition-salaire-sub-tab space-y-6">
      <h3 className="text-2xl font-bold text-white mb-6">
        {t('finance.planificateur.repartition.title')}
      </h3>

      {/* Configuration Salaire */}
      <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <label className="text-lg font-semibold text-white">
            Salaire Net Mensuel
          </label>
          <div className="flex items-center gap-4">
            <input
              type="number"
              value={localSalaire}
              onChange={(e) => handleSalaireChange(e.target.value)}
              className="px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-lg font-bold w-40"
              min="0"
              step="50"
            />
            <span className="text-slate-400">€/mois</span>
          </div>
        </div>
      </div>

      {/* Interface Révolutionnaire */}
      <div className="flex justify-end">
        <button
          type="button"
          className="px-4 py-2 mb-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors"
          onClick={() => setShowNewCategory(true)}
        >
          + Ajouter une catégorie
        </button>
      </div>

      {showNewCategory && (
        <div className="bg-slate-800/80 border border-emerald-500/40 rounded-xl p-4 space-y-3">
          <div className="flex gap-3 flex-wrap">
            <div className="flex-1 min-w-[140px]">
              <label className="block text-xs text-slate-400 mb-1">Nom</label>
              <input
                type="text"
                value={newCatLabel}
                onChange={(e) => setNewCatLabel(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-white"
                placeholder="Ex: Abonnement Apple Music"
              />
            </div>
            <div className="w-32">
              <label className="block text-xs text-slate-400 mb-1">Emoji</label>
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-5 gap-1">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setNewCatEmoji(emoji)}
                      className={`h-8 w-8 flex items-center justify-center rounded-md text-lg ${
                        newCatEmoji === emoji ? 'bg-emerald-600' : 'bg-slate-900'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={newCatEmoji}
                  onChange={(e) => setNewCatEmoji(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-center"
                  placeholder="Autre emoji"
                />
              </div>
            </div>
            <div className="w-40">
              <label className="block text-xs text-slate-400 mb-1">Type</label>
              <select
                value={newCatType}
                onChange={(e) => setNewCatType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-white"
              >
                <option value="investissement">Investissement</option>
                <option value="loisirs">Loisirs</option>
                <option value="epargne">Épargne / Sécurité</option>
                <option value="charges">Charges fixes</option>
                <option value="autre">Autre</option>
              </select>
            </div>
            <div className="w-32">
              <label className="block text-xs text-slate-400 mb-1">Montant</label>
              <input
                type="number"
                min="0"
                value={newCatAmount}
                onChange={(e) => setNewCatAmount(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-white"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="px-3 py-1.5 rounded-lg bg-slate-700 text-slate-200 text-xs"
              onClick={() => setShowNewCategory(false)}
            >
              Annuler
            </button>
            <button
              type="button"
              className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs"
              onClick={handleCreateCategory}
            >
              Créer
            </button>
          </div>
        </div>
      )}

      <RepartitionInterface
        salaire={localSalaire}
        repartition={dataForUi}
        onRepartitionChange={handleRepartitionChange}
        formatCurrency={formatCurrency}
      />
    </div>
  );
};

export default RepartitionSalaireSubTab;
