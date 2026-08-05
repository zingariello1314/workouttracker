import React, { useCallback, useMemo, useState } from 'react';
import BodyMap from '../../sport/recap/BodyMap';
import { useTranslation } from '../../../utils/translations';
import AnatomySearchBar from './AnatomySearchBar';
import AnatomyStickyNav from './AnatomyStickyNav';
import {
  ANATOMY_FAMILY_ORDER,
  getAnatomyFamily,
  listMusclesForFamily
} from '../../../data/anatomy/anatomyRegistry';
import { highlightColorsForVisualGroups } from '../../../services/anatomy/anatomyHighlight';
import {
  resolveAnatomyFromMeshClick,
  resolveMeshHoverLabel
} from '../../../services/anatomy/resolveMeshToAnatomy';
import {
  buildPickModeMeshColors,
  mergeHoverHighlight,
  visualGroupFromMeshName
} from '../../../services/anatomy/anatomyHoverColors';

function importanceBadge(level, label) {
  if (!level) return null;
  const colors =
    level === 'high'
      ? 'bg-teal-500/20 text-teal-200 border-teal-500/40'
      : level === 'medium'
        ? 'bg-slate-600/30 text-slate-300 border-slate-500/40'
        : 'bg-slate-800/50 text-slate-500 border-slate-600/40';
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${colors}`}>{label}</span>
  );
}

export default function AnatomyHomeView({ onOpenFamily, onOpenMuscle, onSearchNavigate }) {
  const t = useTranslation();
  const [hoverGroup, setHoverGroup] = useState(null);
  const [hoverOverlayLabel, setHoverOverlayLabel] = useState(null);

  const pickColors = useMemo(() => buildPickModeMeshColors(hoverGroup), [hoverGroup]);

  const onMuscleHover = useCallback((meshName) => {
    if (!meshName) {
      setHoverGroup(null);
      setHoverOverlayLabel(null);
      return;
    }
    setHoverGroup(visualGroupFromMeshName(meshName));
    const lbl = resolveMeshHoverLabel(meshName);
    if (lbl?.muscleName) {
      setHoverOverlayLabel(
        lbl.familyName ? `${lbl.familyName} — ${lbl.muscleName}` : lbl.muscleName
      );
    } else {
      setHoverOverlayLabel(null);
    }
  }, []);

  const onMeshClick = useCallback(
    (meshName) => {
      const target = resolveAnatomyFromMeshClick(meshName);
      if (!target?.muscleId) return;
      onOpenMuscle(target.muscleId);
    },
    [onOpenMuscle]
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
    <div className="space-y-8">
      <header className="text-center space-y-3 max-w-3xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-teal-200 to-cyan-300 bg-clip-text text-transparent">
          {t('anatomy.title', 'Anatomie')}
        </h1>
        <p className="text-sm text-slate-400 leading-relaxed">
          {t(
            'anatomy.subtitle',
            'Encyclopédie interactive du corps appliquée au sport — muscles, biomécanique et exercices Momentum.'
          )}
        </p>
      </header>

      <AnatomySearchBar onNavigate={handleSearch} />

      <div>
        <BodyMap
          muscleColors={pickColors}
          onMuscleClick={onMeshClick}
          onMuscleHover={onMuscleHover}
          pickMode
          hoverOverlayLabel={hoverOverlayLabel}
          compactCanvas={false}
        />
      </div>

      <div>
        <h2 className="text-lg font-semibold text-teal-100 mb-4">
          {t('anatomy.familiesTitle', 'Familles musculaires')}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ANATOMY_FAMILY_ORDER.map((fid) => {
            const fam = getAnatomyFamily(fid);
            if (!fam) return null;
            const muscles = listMusclesForFamily(fid);
            const ready = muscles.filter((m) => m.contentReady).length;
            return (
              <button
                key={fid}
                type="button"
                onClick={() => onOpenFamily(fid)}
                className="text-left rounded-xl border border-slate-700/60 bg-gradient-to-br from-slate-950 to-black p-4 hover:border-teal-600/50 transition-colors"
              >
                <div className="font-semibold text-white mb-1">{fam.name}</div>
                <p className="text-xs text-slate-400 line-clamp-2 mb-3">{fam.summary}</p>
                <div className="flex flex-wrap gap-2 text-[10px] text-slate-500">
                  <span>
                    {muscles.length} {t('anatomy.muscleCount', 'muscles')}
                  </span>
                  {ready > 0 ? (
                    <span className="text-teal-400/90">
                      {ready} {t('anatomy.fichesReady', 'fiche(s) complète(s)')}
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function AnatomyFamilyView({ familyId, onBack, onOpenMuscle }) {
  const t = useTranslation();
  const fam = getAnatomyFamily(familyId);
  const muscles = useMemo(() => listMusclesForFamily(familyId), [familyId]);
  const baseHighlight = useMemo(
    () => highlightColorsForVisualGroups(fam?.visualGroupIds || []),
    [fam?.visualGroupIds]
  );
  const [hoverGroup, setHoverGroup] = useState(null);
  const [hoverOverlayLabel, setHoverOverlayLabel] = useState(null);

  const muscleColors = useMemo(() => {
    if (!hoverGroup) return baseHighlight.meshColors;
    return mergeHoverHighlight(baseHighlight.meshColors, hoverGroup);
  }, [baseHighlight.meshColors, hoverGroup]);

  const onMuscleHover = useCallback((meshName) => {
    if (!meshName) {
      setHoverGroup(null);
      setHoverOverlayLabel(null);
      return;
    }
    setHoverGroup(visualGroupFromMeshName(meshName));
    const lbl = resolveMeshHoverLabel(meshName);
    setHoverOverlayLabel(lbl?.muscleName || null);
  }, []);

  const onMeshClick = useCallback(
    (meshName) => {
      const target = resolveAnatomyFromMeshClick(meshName);
      if (target?.muscleId) onOpenMuscle(target.muscleId);
    },
    [onOpenMuscle]
  );

  if (!fam) return null;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20">
      <AnatomyStickyNav
        onBackHome={onBack}
        title={fam.name}
        subtitle={fam.summary}
      />
      <div className="lg:grid lg:grid-cols-[minmax(260px,320px)_1fr] lg:gap-8 lg:items-start">
        <div className="lg:sticky lg:top-[12.5rem]">
          <BodyMap
            muscleColors={muscleColors}
            uniformBodyColor={baseHighlight.uniformBodyColor}
            onMuscleClick={onMeshClick}
            onMuscleHover={onMuscleHover}
            pickMode
            hoverOverlayLabel={hoverOverlayLabel}
            compactCanvas
            detailSidebar
          />
        </div>
        <div>
          <p className="text-sm text-slate-400 leading-relaxed mb-4">{fam.intro}</p>
          <div className="grid gap-3 sm:grid-cols-2">
        {muscles.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => onOpenMuscle(m.id)}
            className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-xl border border-slate-700/50 bg-black/50 p-4 text-left hover:border-teal-600/40"
          >
            <div className="flex-1">
              <div className="font-medium text-white">{m.name}</div>
              <p className="text-xs text-slate-400 mt-1">{m.summary}</p>
            </div>
            <div className="flex flex-wrap gap-1 shrink-0">
              {importanceBadge(m.functionalImportance, t('anatomy.func', 'Fonction'))}
              {importanceBadge(m.aestheticImportance, t('anatomy.aesthetic', 'Esthétique'))}
              {m.contentReady ? (
                <span className="text-[10px] text-teal-300 border border-teal-600/40 px-1.5 py-0.5 rounded">
                  {t('anatomy.fullSheet', 'Fiche complète')}
                </span>
              ) : null}
            </div>
          </button>
        ))}
          </div>
        </div>
      </div>
    </div>
  );
}
