import React, { useCallback, useMemo, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import BodyMap from '../../sport/recap/BodyMap';
import { useTranslation } from '../../../utils/translations';
import AnatomySearchBar from './AnatomySearchBar';
import {
  ANATOMY_FAMILY_ORDER,
  getAnatomyFamily,
  listMusclesForFamily
} from '../../../data/anatomy/anatomyRegistry';
import { buildEcorcheBaseMeshColors, buildFamilyFocusMeshColors } from '../../../services/anatomy/ecorcheMeshColors';
import { resolveAnatomyFromMeshClick } from '../../../services/anatomy/resolveMeshToAnatomy';

const QUICK_TAGS = [
  'haut des pectoraux',
  'douleur épaule',
  'tractions larges',
  'grand dorsal'
];

export default function AnatomyAccueilView({ onOpenFamily, onOpenMuscle, onSearchNavigate }) {
  const t = useTranslation();
  const [hoverFamilyId, setHoverFamilyId] = useState(null);
  const [selectedFamilyId, setSelectedFamilyId] = useState(null);

  const focusFamilyId = hoverFamilyId ?? selectedFamilyId;

  const muscleColors = useMemo(() => {
    if (!focusFamilyId) return buildEcorcheBaseMeshColors();
    const fam = getAnatomyFamily(focusFamilyId);
    return buildFamilyFocusMeshColors(fam?.visualGroupIds || [], { dimOthers: true });
  }, [focusFamilyId]);

  const onMuscleHover = useCallback((meshName) => {
    if (!meshName) {
      setHoverFamilyId(null);
      return;
    }
    const target = resolveAnatomyFromMeshClick(meshName);
    if (target?.familyId) setHoverFamilyId(target.familyId);
  }, []);

  const onMeshClick = useCallback(
    (meshName) => {
      const target = resolveAnatomyFromMeshClick(meshName);
      if (target?.familyId) onOpenFamily(target.familyId);
    },
    [onOpenFamily]
  );

  const handleSearch = useCallback(
    (hit) => {
      if (hit.kind === 'muscle') onOpenMuscle(hit.id);
      else if (hit.kind === 'family') onOpenFamily(hit.id);
      else onSearchNavigate?.(hit);
    },
    [onOpenFamily, onOpenMuscle, onSearchNavigate]
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
          {t('anatomy.title', 'Anatomie')}
        </h1>
        <p className="mt-2 text-sm text-slate-400 max-w-2xl leading-relaxed">
          {t(
            'anatomy.subtitleHome',
            'Comprends ton corps pour t’entraîner plus intelligemment. Cherche un muscle, un exercice, un objectif — ou explore le modèle 3D.'
          )}
        </p>
      </header>

      <AnatomySearchBar
        onNavigate={handleSearch}
        placeholder={t(
          'anatomy.searchPlaceholderLong',
          'Rechercher un muscle, un exercice, une douleur, un objectif…'
        )}
      />

      <div className="flex flex-wrap gap-2">
        {QUICK_TAGS.map((tag) => (
          <button
            key={tag}
            type="button"
            className="rounded-full border border-slate-700/60 bg-slate-950/50 px-3 py-1 text-[11px] text-slate-400 hover:border-cyan-600/40 hover:text-cyan-200/90"
            onClick={() => handleSearch({ kind: 'family', id: 'pectoraux', label: tag, score: 5 })}
          >
            « {tag} »
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-700/40 bg-slate-950/30 overflow-hidden">
        <div className="grid lg:grid-cols-[minmax(280px,1fr)_minmax(320px,1.1fr)]">
          <div className="p-4 lg:p-6 border-b lg:border-b-0 lg:border-r border-slate-800/80">
            <BodyMap
              muscleColors={muscleColors}
              onMuscleClick={onMeshClick}
              onMuscleHover={onMuscleHover}
              pickMode
              compactCanvas={false}
              anatomyExplorerLayout
            />
            <p className="mt-3 text-[11px] text-slate-500 text-center lg:text-left">
              {t(
                'anatomy.explorerHint',
                'Survole une famille à droite — ou touche directement le corps.'
              )}
            </p>
          </div>

          <div className="max-h-[min(520px,70vh)] overflow-y-auto divide-y divide-slate-800/80">
            {ANATOMY_FAMILY_ORDER.map((fid) => {
              const fam = getAnatomyFamily(fid);
              if (!fam) return null;
              const muscles = listMusclesForFamily(fid);
              const isHover = hoverFamilyId === fid;
              const isSelected = selectedFamilyId === fid;
              const active = isHover || isSelected;
              return (
                <div
                  key={fid}
                  role="button"
                  tabIndex={0}
                  onMouseEnter={() => setHoverFamilyId(fid)}
                  onMouseLeave={() => setHoverFamilyId(null)}
                  onFocus={() => setHoverFamilyId(fid)}
                  onBlur={() => setHoverFamilyId(null)}
                  onClick={() => {
                    setSelectedFamilyId(fid);
                    onOpenFamily(fid);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setSelectedFamilyId(fid);
                      onOpenFamily(fid);
                    }
                  }}
                  className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-colors ${
                    active ? 'bg-cyan-950/25' : 'hover:bg-slate-900/40'
                  }`}
                >
                  <span
                    className={`h-2.5 w-2.5 shrink-0 rounded-full border ${
                      active ? 'border-cyan-400 bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]' : 'border-slate-600 bg-transparent'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-100 text-sm">{fam.name}</div>
                    <div className="text-xs text-slate-500 truncate">{fam.summary}</div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] tabular-nums ${
                      active
                        ? 'border-cyan-500/50 text-cyan-200/90'
                        : 'border-slate-700 text-slate-500'
                    }`}
                  >
                    {muscles.length} {t('anatomy.muscleCount', 'muscles')}
                  </span>
                  <ChevronRight className={`h-4 w-4 shrink-0 ${active ? 'text-cyan-400' : 'text-slate-600'}`} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
