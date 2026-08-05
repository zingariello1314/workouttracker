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

import {

  resolveAnatomyFromMeshClick,

  visualGroupFromMesh

} from '../../../services/anatomy/resolveMeshToAnatomy';

import { VISUAL_GROUP_SURFACE_BIAS } from '../../../utils/anatomy/visualGroupMeta';

import { ANATOMY } from './anatomyTheme';



const QUICK_TAGS = [

  'haut des pectoraux',

  'douleur épaule',

  'tractions larges',

  'grand dorsal'

];



/** Hauteur d’une ligne famille (px) — alignée sur py-3.5 + deux lignes texte. */

const FAMILY_ROW_PX = 64;

const EXPLORER_COLUMN_PAD_PX = 48;



const FRONT_VIEW_PRESETS = new Set(['frontLow', 'front', 'frontHighWide', 'frontWideHang']);

const BACK_VIEW_PRESETS = new Set(['back', 'backLower']);



function explorerColumnHeight(familyCount) {

  return familyCount * FAMILY_ROW_PX + EXPLORER_COLUMN_PAD_PX;

}



export default function AnatomyAccueilView({ onOpenFamily, onOpenMuscle, onSearchNavigate }) {

  const t = useTranslation();

  const [hoverFamilyId, setHoverFamilyId] = useState(null);

  const [selectedFamilyId, setSelectedFamilyId] = useState(null);

  const [explorerView, setExplorerView] = useState('frontLow');

  const [backChoiceOpen, setBackChoiceOpen] = useState(false);

  const columnMinHeight = useMemo(

    () => explorerColumnHeight(ANATOMY_FAMILY_ORDER.length),

    []

  );



  const focusFamilyId = hoverFamilyId ?? selectedFamilyId;



  const muscleColors = useMemo(() => {

    if (!focusFamilyId) return buildEcorcheBaseMeshColors();

    const fam = getAnatomyFamily(focusFamilyId);

    return buildFamilyFocusMeshColors(fam?.visualGroupIds || [], { dimOthers: true, familyId: focusFamilyId });

  }, [focusFamilyId]);



  const onMuscleHover = useCallback((meshName) => {

    if (!meshName) {

      setHoverFamilyId(null);

      return;

    }

    const target = resolveAnatomyFromMeshClick(meshName);

    if (target?.kind === 'backChoice') {

      setHoverFamilyId(null);

      return;

    }

    if (target?.familyId) setHoverFamilyId(target.familyId);

  }, []);



  const onMeshClick = useCallback(

    (meshName) => {

      const target = resolveAnatomyFromMeshClick(meshName);

      if (!target) return;



      if (target.kind === 'backChoice') {

        const groupId = visualGroupFromMesh(meshName);

        if (groupId) {

          const bias = VISUAL_GROUP_SURFACE_BIAS[groupId];

          if (bias === 'posterior' && FRONT_VIEW_PRESETS.has(explorerView)) {

            setExplorerView('back');

          }

        }

        setBackChoiceOpen(true);

        return;

      }



      if (!target.familyId) return;



      const groupId = visualGroupFromMesh(meshName);

      if (groupId) {

        const bias = VISUAL_GROUP_SURFACE_BIAS[groupId];

        if (bias === 'posterior' && FRONT_VIEW_PRESETS.has(explorerView)) {

          setExplorerView('back');

        } else if (bias === 'anterior' && BACK_VIEW_PRESETS.has(explorerView)) {

          setExplorerView('frontLow');

        }

      }



      onOpenFamily(target.familyId);

    },

    [explorerView, onOpenFamily]

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

        <p className={`mt-2 max-w-2xl ${ANATOMY.summary}`}>

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

            className={`rounded-full px-3 py-1 text-[11px] ${ANATOMY.chip}`}

            onClick={() => handleSearch({ kind: 'family', id: 'pectoraux', label: tag, score: 5 })}

          >

            « {tag} »

          </button>

        ))}

      </div>



      <div className="grid lg:grid-cols-2 gap-4 items-stretch">

        <div

          className={`${ANATOMY.card} p-4 lg:p-5 flex flex-col min-h-0`}

          style={{ minHeight: columnMinHeight }}

        >

          <div className="flex-1 min-h-0 flex flex-col">

            <BodyMap

              muscleColors={muscleColors}

              onMuscleClick={onMeshClick}

              onMuscleHover={onMuscleHover}

              pickMode

              compactCanvas={false}

              anatomyExplorerLayout

              explorerFillHeight

              controlledViewPreset={explorerView}

              onViewPresetChange={setExplorerView}

            />

          </div>

          <p className={`mt-3 shrink-0 text-[11px] ${ANATOMY.muted}`}>

            {t(

              'anatomy.explorerHint',

              'Survole une famille à droite — ou touche directement le corps.'

            )}

          </p>

        </div>



        <div

          className={`${ANATOMY.card} flex flex-col overflow-hidden min-h-0`}

          style={{ minHeight: columnMinHeight }}

        >

          <div className="flex-1 divide-y divide-white/[0.06]">

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

                    active ? ANATOMY.listRowActive : ANATOMY.listRowHover

                  }`}

                  style={{ minHeight: FAMILY_ROW_PX }}

                >

                  <span

                    className={`h-2.5 w-2.5 shrink-0 rounded-full border ${

                      active ? 'border-[#3897F0] bg-[#3897F0]/80' : 'border-white/20 bg-transparent'

                    }`}

                  />

                  <div className="flex-1 min-w-0">

                    <div className="font-medium text-white text-sm">{fam.name}</div>

                    <div className={`text-xs truncate ${ANATOMY.muted}`}>{fam.summary}</div>

                  </div>

                  <span

                    className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] tabular-nums ${

                      active ? 'border-[#3897F0]/40 text-[#3897F0]' : 'border-white/10 text-[#8E8E93]'

                    }`}

                  >

                    {muscles.length} {t('anatomy.muscleCount', 'muscles')}

                  </span>

                  <ChevronRight className={`h-4 w-4 shrink-0 ${active ? ANATOMY.accent : 'text-white/25'}`} />

                </div>

              );

            })}

          </div>

        </div>

      </div>



      {backChoiceOpen ? (

        <div

          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"

          role="dialog"

          aria-modal="true"

          aria-labelledby="anatomy-back-choice-title"

        >

          <div className={`${ANATOMY.panel} max-w-md w-full space-y-4 shadow-2xl border border-white/10`}>

            <h2 id="anatomy-back-choice-title" className="text-lg font-semibold text-white">

              {t('anatomy.backChoiceTitle', 'Quelle partie du dos ?')}

            </h2>

            <p className={`text-sm ${ANATOMY.muted}`}>

              {t(

                'anatomy.backChoiceHint',

                'Le dos se travaille en deux zones complémentaires : tirages et largeur en haut, stabilité du rachis en bas.'

              )}

            </p>

            <div className="grid gap-2 sm:grid-cols-2">

              {['haut-dos', 'bas-dos'].map((fid) => {

                const fam = getAnatomyFamily(fid);

                if (!fam) return null;

                return (

                  <button

                    key={fid}

                    type="button"

                    className={`${ANATOMY.card} p-4 text-left hover:border-[#3897F0]/35 transition-colors`}

                    onClick={() => {

                      setBackChoiceOpen(false);

                      onOpenFamily(fid);

                    }}

                  >

                    <div className="font-semibold text-white text-sm">{fam.name}</div>

                    <p className={`text-xs mt-1 leading-snug ${ANATOMY.muted}`}>{fam.summary}</p>

                  </button>

                );

              })}

            </div>

            <button

              type="button"

              className={`w-full text-sm py-2 ${ANATOMY.muted} hover:text-white transition-colors`}

              onClick={() => setBackChoiceOpen(false)}

            >

              {t('common.cancel', 'Annuler')}

            </button>

          </div>

        </div>

      ) : null}

    </div>

  );

}

