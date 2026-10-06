import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useWorkout } from '../../../../context/WorkoutContext';
import { useProfileQuestionnaire } from '../../../../features/profileQuestionnaire/useProfileQuestionnaire';
import { useTranslation } from '../../../../utils/translations';
import {
  buildGtgPersonalizedCase,
  defaultGtgProtocolGoal,
  estimateGtgMaxFromWorkingReps,
  estimateGtgProtocolDay,
  getGtgExerciseLabel,
  normalizeGtgData,
  resolveGtgBodyWeightKg,
  resolveGtgMaxReps,
  todayYmd,
  updateGtgExerciseConfig,
  updateGtgProtocolExercise
} from '../../../../services/endurance/gtgService';
import { applyGtgDeclaredMaxToData } from '../../../../services/endurance/gtgMaxPerformance';
import '../../../../styles/gtg-protocol.css';

const RAIL = [
  {
    id: 'I',
    title: 'I — Fondations',
    links: [
      ['s01', '01 Définition'],
      ['s02', '02 Pourquoi'],
      ['s03', '03 Spécificité'],
      ['s04', '04 Échec & fatigue'],
      ['s06', '05 RIR & intensité'],
      ['s09', '06 Combien de reps'],
      ['s11', '07 Autorégulation'],
      ['s12', '08 Signaux'],
      ['s15', '09 Volume'],
      ['s17', '10 Ratio'],
      ['s19', '11 Pratique fréquente']
    ]
  },
  {
    id: 'II',
    title: 'II — Lest',
    links: [
      ['s20', '12 Pourquoi lester'],
      ['s22', '13 Continuum'],
      ['s25', '14 Force ≠ série'],
      ['s28', '15 Trois volets']
    ]
  },
  {
    id: 'III',
    title: 'III — Par mouvement',
    links: [
      ['s29', '16 Matrice'],
      ['s30', '17 Pompes & dips'],
      ['s32', '18 Isométriques'],
      ['s34', '19 Technique & explosif'],
      ['s36', '20 Objectifs']
    ]
  },
  {
    id: 'IV',
    title: 'IV — Construire',
    links: [
      ['s38', '21 Logique GTG'],
      ['s40', '22 Volume & récup'],
      ['s43', '23 Progresser'],
      ['s46', '24 Limites']
    ]
  },
  {
    id: 'V',
    title: 'V — Science',
    links: [
      ['s50', '25 Preuves'],
      ['sources', 'Sources']
    ]
  },
  {
    id: 'VI',
    title: 'VI — Ton cas',
    links: [
      ['s53', '26 Point de départ'],
      ['s56', '27 Progression'],
      ['s57', '28 Mesurer'],
      ['s59', '29 Boîte à outils'],
      ['s62', '30 Conclusion']
    ]
  }
];

function ChapterDivider({ num, title, subtitle }) {
  return (
    <div className="chapter-divider">
      <span className="num">{num}</span>
      <div className="txt">
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      <div className="rule" />
    </div>
  );
}

function Sec({ id, num, title, children }) {
  return (
    <section className="sec" id={id}>
      <p className="sec-num">{num}</p>
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function MiniBar({ stimulus, fatigue }) {
  return (
    <div className="mini-gauge" style={{ margin: 0 }}>
      <div className="track" style={{ flex: 1 }}>
        <div style={{ background: 'var(--gtg-stimulus)', width: `${stimulus}%` }} />
        <div style={{ background: 'var(--gtg-fatigue)', width: `${fatigue}%` }} />
      </div>
    </div>
  );
}

function computeGtgAnchorOffset(root) {
  const header = document.querySelector('header');
  const headerH = header ? Math.round(header.getBoundingClientRect().height) : 64;
  let extra = 88;
  if (typeof window !== 'undefined' && window.innerWidth <= 880) {
    const rail = root?.querySelector('.rail');
    extra += rail ? Math.round(rail.getBoundingClientRect().height) : 72;
  }
  return headerH + extra + 8;
}

function ProtocolExerciseCard({
  name,
  currentMax,
  goal,
  workingReps,
  maxIsEstimated,
  onChangeMax,
  onChangeGoal,
  onChangeReps
}) {
  const est = estimateGtgProtocolDay(currentMax, goal, {
    workingReps,
    maxEstimatedFromReps: maxIsEstimated
  });
  const rir = Math.max(0, Math.round(currentMax) - Math.round(est.reps));
  const pct = currentMax > 0 ? Math.round((est.reps / currentMax) * 100) : null;
  return (
    <div className="gauge-wrap">
      <h2 className="gauge-exercise">{name}</h2>
      <p className="gauge-sync-note">
        Modifier ici met à jour Pratique (créneaux, dose) et Aujourd’hui — même base de données GTG.
      </p>
      <div className="gauge-labels">
        <span className="s">Stimulus</span>
        <span className="f">Fatigue</span>
      </div>
      <div className="gauge-track">
        <div className="gauge-fill-s" style={{ width: `${est.stimulusPct}%` }} />
        <div className="gauge-fill-f" style={{ width: `${est.fatiguePct}%` }} />
      </div>
      <div className="gauge-metrics top">
        <div className="gauge-stat">
          <input
            className="gauge-input"
            type="number"
            min={1}
            max={999}
            inputMode="numeric"
            aria-label="Max actuel"
            value={currentMax}
            onChange={(e) => onChangeMax(e.target.value)}
          />
          <span className="lbl">Max actuel</span>
          <span className="gauge-hint">
            {maxIsEstimated
              ? 'estimé ≈ 2× reps — saisis ton vrai max pour caler RIR & textes'
              : 'standard stable (prise, amplitude, fin)'}
          </span>
        </div>
        <div className="gauge-arrow">→</div>
        <div className="gauge-stat">
          <input
            className="gauge-input"
            type="number"
            min={1}
            max={999}
            inputMode="numeric"
            aria-label="Objectif"
            value={goal}
            onChange={(e) => onChangeGoal(e.target.value)}
          />
          <span className="lbl">Objectif</span>
          <span className="gauge-hint">cible à moyen terme — alimente la boîte à outils</span>
        </div>
      </div>
      <div className="gauge-metrics bottom">
        <div className="gauge-stat">
          <input
            className="gauge-input gauge-input-sm"
            type="number"
            min={1}
            max={200}
            inputMode="numeric"
            aria-label="Reps par créneau"
            value={est.reps}
            onChange={(e) => onChangeReps(e.target.value)}
          />
          <span className="lbl">reps / passage</span>
          <span className="gauge-hint">
            = dose Pratique / Aujourd’hui
            {pct != null ? ` · ~${pct}% · RIR ${rir}` : ''}
          </span>
        </div>
        <div className="gauge-stat">
          <span className="val">{est.minPassages}</span>
          <span className="lbl">passages min.</span>
          <span className="gauge-hint">fourchette indicative</span>
        </div>
        <div className="gauge-stat">
          <span className="val">{est.maxPassages}</span>
          <span className="lbl">passages max.</span>
          <span className="gauge-hint">à valider par ta récup</span>
        </div>
      </div>
    </div>
  );
}

export default function GtgProtocolGuide() {
  const rootRef = useRef(null);
  const { data, updateData } = useWorkout();
  const { questionnaire: profileQuestionnaire } = useProfileQuestionnaire();
  const t = useTranslation();
  const gtgRaw = data?.enduranceData?.gtg;
  const gtgData = useMemo(() => normalizeGtgData(gtgRaw), [gtgRaw]);
  const ctx = useMemo(
    () => ({ workoutData: data, profileQuestionnaire, t }),
    [data, profileQuestionnaire, t]
  );

  const selectedIds = gtgData.config.selectedIds || [];

  const caseExample = useMemo(() => {
    const enabledId =
      selectedIds.find((id) => gtgData.config.protocolByExercise?.[id]?.enabled !== false) ||
      selectedIds[0] ||
      null;
    if (!enabledId) {
      return buildGtgPersonalizedCase({ max: 9, reps: 2, goal: 15, label: 'tractions' });
    }
    const proto = gtgData.config.protocolByExercise?.[enabledId] || {};
    const workingRepsRaw = gtgData.config.perExercise?.[enabledId]?.repsPerSet;
    const workingReps =
      Number.isFinite(Number(workingRepsRaw)) && Number(workingRepsRaw) > 0
        ? Math.round(Number(workingRepsRaw))
        : null;
    const estimatedMax =
      workingReps != null ? estimateGtgMaxFromWorkingReps(workingReps) : null;
    const resolvedMax = resolveGtgMaxReps(enabledId, ctx);
    const max =
      proto.currentMax > 0
        ? Math.round(proto.currentMax)
        : estimatedMax != null
          ? estimatedMax
          : resolvedMax > 0
            ? Math.round(resolvedMax)
            : 9;
    const reps =
      workingReps != null
        ? workingReps
        : Math.max(1, Math.min(3, Math.round(max * 0.25) || 2));
    const goal = proto.goal > 0 ? Math.round(proto.goal) : defaultGtgProtocolGoal(max);
    return buildGtgPersonalizedCase({
      max,
      reps,
      goal,
      label: getGtgExerciseLabel(enabledId, gtgData.config, ctx)
    });
  }, [selectedIds, gtgData, ctx]);

  const mx = caseExample.max;
  const wr = caseExample.reps;
  const pct2 = mx > 0 ? Math.round((2 / mx) * 100) : 22;
  const pct3 = mx > 0 ? Math.round((3 / mx) * 100) : 33;
  const pct5 = mx > 0 ? Math.round((5 / mx) * 100) : 56;
  const pctWr = caseExample.pct;
  const rirWr = caseExample.rir;

  const bodyW = useMemo(
    () => resolveGtgBodyWeightKg(gtgData, { workoutData: data, profileQuestionnaire }),
    [gtgData, data, profileQuestionnaire]
  );
  const bwKnown = bodyW.known;
  const bw = bodyW.kg;
  const bwLabel = bwKnown ? `${bw}` : '~70';
  const bwSourceNote =
    bodyW.source === 'impedance'
      ? 'impédancemètre'
      : bodyW.source === 'metrics'
        ? 'Aujourd’hui / métriques'
        : bodyW.source === 'quiz'
          ? 'profil'
          : bodyW.source === 'gtg'
            ? 'saisie GTG'
            : null;
  const bwPlus5 = bwKnown ? Math.round((bw + 5) * 10) / 10 : 75;
  const bwPlus10 = bwKnown ? Math.round((bw + 10) * 10) / 10 : 80;
  const pctLest5 = bwKnown ? Math.round((5 / bw) * 1000) / 10 : 7.1;
  const pctLest10 = bwKnown ? Math.round((10 / bw) * 1000) / 10 : 14.3;

  const passagesEx = caseExample.passagesMid;
  const dayVol = caseExample.dayVol;
  const weekVol = caseExample.weekVol;
  const startLow = caseExample.startLow;
  const startHigh = caseExample.startHigh;
  const startMid = caseExample.startMid;
  const classicPerSet = caseExample.classicPerSet;
  const classicVol = caseExample.classicVol;
  const classicLow = caseExample.classicLow;
  const classicHigh = caseExample.classicHigh;
  const halfMax = caseExample.halfMax;
  const gtgSamplePassages = caseExample.samplePassages;
  const gtgVsClassicPct = caseExample.vsClassicPct;
  const bumpPct = caseExample.bumpPct;
  const doseBand = caseExample.doseBand;
  const maxBand = caseExample.maxBand;

  const rail = useMemo(() => {
    return RAIL.map((ch) => {
      if (ch.id !== 'VI') return ch;
      return {
        ...ch,
        title: `VI — ${caseExample.label} · max ${mx}`,
        links: [
          ['s53', `26 ${startLow}–${startHigh}`],
          ['s56', '27 Progression'],
          ['s57', `28 ${mx}→${caseExample.goal}`],
          ['s59', '29 Boîte à outils'],
          ['s62', '30 Conclusion']
        ]
      };
    });
  }, [caseExample.label, caseExample.goal, mx, startLow, startHigh]);

  const pushMax = useMemo(() => resolveGtgMaxReps('pushups', ctx), [ctx]);
  const dipMax = useMemo(() => resolveGtgMaxReps('dips', ctx), [ctx]);
  const pushStartLow = Math.max(1, Math.round(pushMax * 0.25));
  const pushStartHigh = Math.max(pushStartLow, Math.round(pushMax * 0.35));

  const persistProtocol = useCallback(
    (exerciseId, patch) => {
      if (typeof updateData !== 'function') return;
      const nextGtg = updateGtgProtocolExercise(gtgData, exerciseId, patch);
      let nextData = {
        ...data,
        enduranceData: {
          ...(data.enduranceData || {}),
          gtg: nextGtg,
          lastUpdated: new Date().toISOString()
        }
      };
      const maxVal = patch.currentMax != null ? Number(patch.currentMax) : null;
      if (Number.isFinite(maxVal) && maxVal > 0) {
        nextData = applyGtgDeclaredMaxToData(nextData, {
          gtgExerciseId: exerciseId,
          reps: maxVal,
          config: nextGtg.config,
          dateStr: todayYmd(),
          ctx
        });
      }
      updateData(nextData);
    },
    [data, gtgData, updateData, ctx]
  );

  const persistWorkingReps = useCallback(
    (exerciseId, raw) => {
      if (typeof updateData !== 'function') return;
      const trimmed = String(raw ?? '').trim();
      const n = trimmed === '' ? null : Math.round(Number(String(trimmed).replace(',', '.')));
      const repsPerSet = Number.isFinite(n) && n > 0 ? n : null;
      let nextGtg = updateGtgExerciseConfig(gtgData, exerciseId, { repsPerSet });
      const proto = nextGtg.config.protocolByExercise?.[exerciseId] || {};
      // Si le max n’a pas été saisi à la main, on laisse l’estimation suivre les reps
      if (!(proto.currentMax > 0) && repsPerSet > 0) {
        // no-op on protocol.currentMax — l’UI estimera via estimateGtgMaxFromWorkingReps
      }
      updateData({
        ...data,
        enduranceData: {
          ...(data.enduranceData || {}),
          gtg: nextGtg,
          lastUpdated: new Date().toISOString()
        }
      });
    },
    [data, gtgData, updateData]
  );

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const applyOffset = () => {
      const px = computeGtgAnchorOffset(root);
      root.style.setProperty('--gtg-anchor-offset', `${px}px`);
      return px;
    };
    applyOffset();

    const links = Array.from(root.querySelectorAll('.rail a[href^="#"]'));
    const sections = links
      .map((a) => root.querySelector(a.getAttribute('href')))
      .filter(Boolean);
    const chapters = Array.from(root.querySelectorAll('.rail-chapter'));

    const setActive = (id) => {
      links.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === `#${id}`));
      const activeLink = links.find((a) => a.getAttribute('href') === `#${id}`);
      if (!activeLink) return;
      const chap = activeLink.closest('.rail-chapter');
      chapters.forEach((c) => c.classList.toggle('current', c === chap));
      if (window.innerWidth <= 880) {
        activeLink.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
      }
    };

    const onLinkClick = (e) => {
      const a = e.currentTarget;
      const href = a.getAttribute('href') || '';
      if (!href.startsWith('#')) return;
      e.preventDefault();
      const id = href.slice(1);
      const el = root.querySelector(`#${CSS.escape(id)}`);
      if (!el) return;
      const offset = applyOffset();
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
      setActive(id);
    };

    links.forEach((a) => a.addEventListener('click', onLinkClick));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: `-${applyOffset()}px 0px -62% 0px`, threshold: 0 }
    );

    sections.forEach((s) => observer.observe(s));
    chapters[0]?.classList.add('current');
    if (links[0]) links[0].classList.add('active');

    const onResize = () => applyOffset();
    window.addEventListener('resize', onResize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', onResize);
      links.forEach((a) => a.removeEventListener('click', onLinkClick));
    };
  }, []);

  return (
    <div className="gtg-protocol" ref={rootRef}>
      <header className="hero">
        <div className="hero-inner">
          <p className="eyebrow">Protocole d’entraînement</p>
          <h1 className="title">
            Grease the
            <br />
            Groove
          </h1>
          <p className="subhead">
            Comment répéter un mouvement des dizaines de fois par jour sans jamais l’épuiser — et
            où le lest s’intègre là-dedans.
          </p>

          {selectedIds.length > 0 && (
            <div className="hero-picks" role="group" aria-label="Exercices du protocole">
              {selectedIds.map((id) => {
                const enabled = gtgData.config.protocolByExercise?.[id]?.enabled !== false;
                return (
                  <button
                    key={id}
                    type="button"
                    className={`hero-pick${enabled ? ' on' : ''}`}
                    onClick={() => persistProtocol(id, { enabled: !enabled })}
                  >
                    {getGtgExerciseLabel(id, gtgData.config, ctx)}
                  </button>
                );
              })}
            </div>
          )}

          <div className="hero-cards">
            {selectedIds.filter((id) => gtgData.config.protocolByExercise?.[id]?.enabled !== false)
              .length === 0 && (
              <p className="hero-empty">
                Choisis au moins un exercice parmi ceux déjà suivis dans Pratique (puces ci-dessus).
              </p>
            )}
            {selectedIds
              .filter((id) => gtgData.config.protocolByExercise?.[id]?.enabled !== false)
              .map((id) => {
                const proto = gtgData.config.protocolByExercise?.[id] || {};
                const workingRepsRaw = gtgData.config.perExercise?.[id]?.repsPerSet;
                const workingReps =
                  Number.isFinite(Number(workingRepsRaw)) && Number(workingRepsRaw) > 0
                    ? Math.round(Number(workingRepsRaw))
                    : null;
                const estimatedMax =
                  workingReps != null ? estimateGtgMaxFromWorkingReps(workingReps) : null;
                const resolvedMax = resolveGtgMaxReps(id, ctx);
                const maxIsEstimated = !(proto.currentMax > 0) && estimatedMax != null;
                const currentMax =
                  proto.currentMax > 0
                    ? proto.currentMax
                    : estimatedMax != null
                      ? estimatedMax
                      : resolvedMax;
                const goal =
                  proto.goal > 0 ? proto.goal : defaultGtgProtocolGoal(currentMax);
                return (
                  <ProtocolExerciseCard
                    key={id}
                    name={getGtgExerciseLabel(id, gtgData.config, ctx)}
                    currentMax={currentMax}
                    goal={goal}
                    workingReps={workingReps}
                    maxIsEstimated={maxIsEstimated}
                    onChangeMax={(raw) => persistProtocol(id, { currentMax: raw })}
                    onChangeGoal={(raw) => persistProtocol(id, { goal: raw })}
                    onChangeReps={(raw) => persistWorkingReps(id, raw)}
                  />
                );
              })}
          </div>
        </div>
      </header>

      <div className="layout">
        <nav className="rail" aria-label="Sommaire du protocole GTG">
          {rail.map((ch) => (
            <div key={ch.id} className="rail-chapter" data-chapter={ch.id}>
              <div className="rail-chapter-title">{ch.title}</div>
              <div className="rail-links">
                {ch.links.map(([id, label]) => (
                  <a key={id} href={`#${id}`}>
                    {label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <main className="content">
          <div className="article">
            <ChapterDivider
              num="I"
              title="Fondations"
              subtitle="Ce qu’est le GTG, et pourquoi il fonctionne"
            />

            <Sec id="s01" num="01" title="Qu’est-ce que le Grease the Groove ?">
              <p>
                Le <strong>Grease the Groove (GTG)</strong> est une méthode de pratique destinée à
                améliorer la performance dans un mouvement précis en multipliant les occasions de
                l’exécuter — sans que chaque exposition ne devienne une vraie série d’entraînement
                fatigante.
              </p>
              <div className="quote">Pratiquer souvent, avec suffisamment de marge pour pouvoir pratiquer à nouveau.</div>
              <p>
                Chaque exposition doit rester assez submaximale pour préserver la qualité, limiter la
                fatigue aiguë et permettre de répéter le mouvement régulièrement. Le GTG n’impose{' '}
                <strong>ni nombre universel de reps, ni % fixe du max, ni intervalle obligatoire</strong>{' '}
                entre les séries.
              </p>
              <ul className="bullets">
                <li>niveau du pratiquant, mouvement et variante</li>
                <li>charge externe éventuelle et nombre de reps</li>
                <li>proximité de l’échec et fréquence des expositions</li>
                <li>capacité à récupérer de l’ensemble du programme</li>
              </ul>
              <div className="principle">
                Méthode de distribution de la pratique et de gestion de la fatigue — pas une recette « X
                reps toutes les Y heures ».
              </div>
              <div className="split">
                <div className="a">
                  <h4>Séance classique</h4>
                  <p>
                    4 × {classicPerSet} → repos → encore des séries. Volume concentré : la fatigue monte
                    et peut modifier les perfs en cours de séance.
                  </p>
                </div>
                <div className="b">
                  <h4>GTG</h4>
                  <p>
                    {startLow}–{startHigh} reps → plusieurs heures → encore… Pratique répartie : chaque
                    exposition peut rester plus fraîche. Chez toi : {wr}/passage.
                  </p>
                </div>
              </div>
              <div className="quote">
                La différence n’est pas « beaucoup vs peu de reps » — c’est volume concentré vs volume
                distribué. À volume équivalent, une fréquence plus élevée n’est pas automatiquement
                supérieure : l’intérêt du GTG est surtout la qualité et la distribution de la pratique.
              </div>
            </Sec>

            <Sec id="s02" num="02" title="Pourquoi cette méthode peut fonctionner">
              <p>
                Une performance ne dépend pas uniquement de la quantité de muscle. Pour un(e){' '}
                {caseExample.label.toLowerCase()} propre, il faut notamment :
              </p>
              <ul className="bullets">
                <li>produire assez de force et activer les muscles au bon moment</li>
                <li>coordonner les articulations, contrôler la trajectoire</li>
                <li>stabiliser le tronc, position efficace des épaules / omoplates</li>
                <li>appliquer cette force dans le contexte précis du mouvement</li>
              </ul>
              <div className="quote">
                Les premières améliorations sur un mouvement complexe peuvent être fortement influencées
                par des adaptations neuromusculaires et spécifiques à la tâche — sans que le muscle soit
                exclu. Les adaptations de force peuvent dépendre de la tâche entraînée.
              </div>
              <div className="split">
                <div className="a">
                  <h4>Débutant</h4>
                  <p>
                    Beaucoup de progression via l’apprentissage : trajectoire, coordination, moins de
                    parasites, meilleur timing, meilleure utilisation des muscles déjà disponibles —
                    sans transformer immédiatement la masse.
                  </p>
                </div>
                <div className="b">
                  <h4>Avancé</h4>
                  <p>
                    Moins de « gains gratuits ». La progression dépend davantage de force max / relative,
                    puissance, endurance spécifique, maintien de la technique sous contrainte.
                  </p>
                </div>
              </div>
              <p>
                Le GTG ne remplace pas toutes les autres formes d’entraînement. Son intérêt apparaît
                surtout quand une partie de la limitation vient du fait que{' '}
                <strong>le mouvement lui-même doit être beaucoup pratiqué</strong>, avec une qualité
                assez élevée. C’est une méthode de pratique — pas une théorie où toute progression serait
                « simplement nerveuse ».
              </p>
            </Sec>

            <Sec id="s03" num="03" title="Le principe de spécificité">
              <p>
                Plus l’objectif concerne un mouvement précis, plus une partie importante de
                l’entraînement doit en reproduire les caractéristiques pertinentes. Pour{' '}
                {caseExample.label}, pratiquer ce mouvement reste le moyen le plus spécifique.
                Complémentaires (rowing, développé, curl…) renforcent des capacités utiles sans
                reproduire prise, trajectoire, amplitude, coordination, stabilisation ni la façon dont
                la fatigue s’exprime dans le mouvement cible.
              </p>
              <div className="quote">
                La spécificité n’est pas binaire — c’est un continuum. Un exercice peut être très
                spécifique sur une dimension et beaucoup moins sur une autre.
              </div>
              <div className="metrics-4">
                <div>
                  <div className="k">Mouvement</div>
                  <p>Même geste ou geste différent ?</p>
                </div>
                <div>
                  <div className="k">Charge</div>
                  <p>PDC, externe, assistance ou variante plus dure ?</p>
                </div>
                <div>
                  <div className="k">Vitesse / amplitude</div>
                  <p>Contrôlé, dynamique, explosif ? Même amplitude ?</p>
                </div>
                <div>
                  <div className="k">Fatigue</div>
                  <p>Rep isolée, petite série ou longue série ?</p>
                </div>
              </div>
              <p>
                Un(e) {caseExample.label.toLowerCase()} lesté(e) peut être{' '}
                <strong>très spécifique au mouvement</strong>, tout en étant moins spécifique à une
                série longue au poids du corps ({mx} → {caseExample.goal}) : même geste, résistance
                par rep différente. Cohérent avec la littérature : les adaptations de force dépendent
                de la tâche réellement entraînée.
              </p>
            </Sec>

            <Sec id="s04" num="04" title="Échec, fatigue et répétabilité">
              <p>
                Le GTG ne transforme pas chaque exposition en test maximal. L’échec n’est pas nécessaire
                pour provoquer des adaptations — les méta-analyses ne montrent pas de supériorité
                systématique de l’échec pour force ou hypertrophie.
              </p>
              <div className="quote">Mais « plus loin de l’échec = toujours mieux » n’est pas non plus la règle.</div>
              <div className="stat-row">
                <div>
                  <div className="num">{mx}</div>
                  <div className="lbl">0 RIR — échec</div>
                </div>
                <div>
                  <div className="num">{Math.max(1, mx - 1)}</div>
                  <div className="lbl">~1 RIR — trop proche</div>
                </div>
                <div>
                  <div className="num">2–3</div>
                  <div className="lbl">marge / répétabilité</div>
                </div>
              </div>
              <p>
                Plus on se rapproche de l’échec, plus la fatigue aiguë monte et plus certaines qualités
                de performance chutent. Compare deux séries du même mouvement :
              </p>
              <div className="split">
                <div className="a">
                  <h4>Série A</h4>
                  <p>
                    Reps propres, amplitude et trajectoire stables, vitesse relative conservée, marge
                    importante.
                  </p>
                </div>
                <div className="b">
                  <h4>Série B</h4>
                  <p>
                    Reps plus lentes, amplitude qui raccourcit, trajectoire dégradée, compensations,
                    dernière rep très proche de la limite.
                  </p>
                </div>
              </div>
              <div className="principle">
                Les deux peuvent stimuler — mais pas le même coût immédiat, ni la même facilité à être
                reproduites plusieurs fois dans la journée. Compromis : stimulus spécifique × qualité ×
                répétabilité.
              </div>
            </Sec>

            <Sec id="s06" num="05" title="RIR, % du max et ton cas">
              <p>
                Le <strong>RIR</strong> (<em>Repetitions In Reserve</em>) = reps qu’il resterait
                théoriquement possible de faire avant l’échec dans les mêmes conditions. Si{' '}
                <strong>{mx}</strong> est réellement ton max <em>du jour</em> au même standard :
              </p>
              <div className="box">
                <div className="box-title">Approximation théorique — max du jour = {mx}</div>
                <table className="rir">
                  <thead>
                    <tr>
                      <th>Reps réalisées</th>
                      <th>RIR théorique</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: Math.min(mx, 9) }, (_, i) => {
                      const reps = mx - i;
                      return (
                        <tr key={reps}>
                          <td className="reps">{reps}</td>
                          <td>{i === 0 ? '0' : `~${i}`}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p>
                Moins fiable si le max est ancien, la récup varie, la technique n’est pas standardisée,
                la vitesse change, ou le « max » n’est pas réellement maximal.
              </p>
              <div className="metrics-4">
                <div>
                  <div className="k">% max de reps</div>
                  <p>
                    {`2/${mx} ≈ ${pct2}%`} = proportion de reps effectuées — pas « {pct2}% d’intensité ».
                  </p>
                </div>
                <div>
                  <div className="k">% 1RM</div>
                  <p>
                    Au PDC : charge externe max ≠ résistance totale ≠ difficulté de variante. Pas
                    interchangeables.
                  </p>
                </div>
                <div>
                  <div className="k">RIR / RPE</div>
                  <p>Marge et effort ressenti vs la limite du jour — mieux pour autoréguler.</p>
                </div>
                <div>
                  <div className="k">Ton cas</div>
                  <p>
                    5/{mx} = {pct5}% du max de reps. Ne permet pas de conclure à un RIR fixe ni à un %
                    d’intensité.
                  </p>
                </div>
              </div>
              <div className="quote">
                Le % du max de reps est un repère descriptif, pas une mesure complète de l’intensité.
              </div>
            </Sec>

            <Sec id="s09" num="06" title="Combien de répétitions pour ton GTG ?">
              <p>
                Il n’existe pas de chiffre scientifiquement établi du type « max {mx} → GTG optimal =
                exactement X reps ». Les études éclairent charge, effort, fatigue, force et hypertrophie
                — elles ne démontrent pas 2 ou 3 reps comme dose universelle.
              </p>
              <div className="rep-grid">
                <div>
                  <div className="n">1</div>
                  <div className="t">rep</div>
                  <div className="d">Très faible coût, qualité max, exposition minimale</div>
                </div>
                <div className="pick">
                  <div className="n">2</div>
                  <div className="t">reps</div>
                  <div className="d">Très conservateur</div>
                </div>
                <div className="pick">
                  <div className="n">3</div>
                  <div className="t">reps</div>
                  <div className="d">Toujours submax, exposition plus réelle</div>
                </div>
                <div>
                  <div className="n">4</div>
                  <div className="t">reps</div>
                  <div className="d">Demande sensiblement plus importante</div>
                </div>
                <div>
                  <div className="n">5</div>
                  <div className="t">reps</div>
                  <div className="d">Se rapproche d’une série classique</div>
                </div>
              </div>
              <div className="quote">
                Avec un max de {mx}, 2–3 reps = point de départ prudent, pas zone optimale démontrée.
                Pas « {mx} max → 20 % → 3 reps → donc GTG », mais : besoin de pratique fréquente →
                forte marge → 2–3 comme hypothèse → observation de la réponse.
              </div>
              <div className="split">
                <div className="a">
                  <h4>Sensation cible</h4>
                  <p>« J’aurais pu continuer facilement. »</p>
                </div>
                <div className="b">
                  <h4>À éviter</h4>
                  <p>« J’ai réussi à faire mes 3 reps. »</p>
                </div>
              </div>
              <p>
                Une personne à {mx} peut tolérer 4 ; une autre trouver 3 déjà trop coûteux selon le reste
                de l’entraînement. Le nombre se valide par la réponse — pas par un simple calcul.
              </p>
            </Sec>

            <Sec id="s11" num="07" title="Comment déterminer toi-même le nombre de reps ?">
              <p>Le meilleur départ n’est pas un pourcentage magique — trois questions :</p>
              <div className="steps">
                <div>
                  <h4>Maximum propre</h4>
                  <p>
                    Même prise, départ, amplitude, fin, sans compensation volontaire. Sinon « +1 rep »
                    peut juste être un changement de standard.
                  </p>
                </div>
                <div>
                  <h4>Quelle marge conserver ?</h4>
                  <p>
                    Un % du max de reps peut servir de point de départ, jamais de loi : 20 % d’un max de
                    5 ≠ 20 % d’un max de 50 en coût. Interprète avec niveau, variante, mécanique,
                    fréquence et reste du programme.
                  </p>
                </div>
                <div>
                  <h4>Que se passe-t-il après ?</h4>
                  <p>
                    « Cette dose me permet-elle de continuer à pratiquer de la même manière ? » — plutôt
                    que « ai-je réussi le nombre prévu ? ».
                  </p>
                </div>
              </div>
              <div className="box">
                <div className="box-title">Grille — réussir ≠ correctement doser</div>
                <table className="obj">
                  <thead>
                    <tr>
                      <th>Indicateur</th>
                      <th>Compatible GTG</th>
                      <th>Trop difficile</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="o">Marge</td>
                      <td className="a">importante</td>
                      <td>faible</td>
                    </tr>
                    <tr>
                      <td className="o">Exécution</td>
                      <td className="a">stable</td>
                      <td>compensation</td>
                    </tr>
                    <tr>
                      <td className="o">Amplitude</td>
                      <td className="a">conservée</td>
                      <td>réduction</td>
                    </tr>
                    <tr>
                      <td className="o">Effort</td>
                      <td className="a">maîtrisé</td>
                      <td>série très difficile</td>
                    </tr>
                    <tr>
                      <td className="o">Exposition suivante</td>
                      <td className="a">perfs proches</td>
                      <td>baisse nette</td>
                    </tr>
                    <tr>
                      <td className="o">Récupération</td>
                      <td className="a">normale</td>
                      <td>fatigue inhabituelle</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Sec>

            <Sec id="s12" num="08" title="Signaux : RIR, vitesse et qualité">
              <p>
                Le RIR est utile, mais pas l’unique signal. La priorité dépend de la nature du mouvement
                — une rep peut être « valide » tout en étant beaucoup plus lente et coûteuse.
              </p>
              <div className="box">
                <table className="obj">
                  <thead>
                    <tr>
                      <th>Mouvement</th>
                      <th>Signal particulièrement important</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="o">Traction stricte</td>
                      <td>amplitude, trajectoire, vitesse</td>
                    </tr>
                    <tr>
                      <td className="o">Muscle-up</td>
                      <td>hauteur, vitesse, transition, trajectoire</td>
                    </tr>
                    <tr>
                      <td className="o">Handstand</td>
                      <td>ligne corporelle, équilibre, contrôle</td>
                    </tr>
                    <tr>
                      <td className="o">L-sit</td>
                      <td>hauteur des jambes, bassin, épaules</td>
                    </tr>
                    <tr>
                      <td className="o">Explosif</td>
                      <td>vitesse, hauteur ou puissance</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="quote">
                Velocity loss : plus la perte de vitesse monte, plus reps, effort perçu et fatigue
                montent, et certaines perfs explosives baissent — selon exercice et charge. Pas de règle
                « −20 % = arrêt obligatoire ». Plus la vitesse est centrale au mouvement, plus une
                dégradation nette devient pertinente pour juger l’exposition.
              </div>
              <div className="split">
                <div className="a">
                  <h4>Traction stricte</h4>
                  <p>Légère variation de vitesse souvent acceptable.</p>
                </div>
                <div className="b">
                  <h4>Mouvement explosif</h4>
                  <p>La même perte peut changer profondément la nature de la rep.</p>
                </div>
              </div>
            </Sec>

            <Sec id="s15" num="09" title="Le problème du volume">
              <p>Répartir les séries ne fait pas disparaître le volume. Fréquence ≠ volume.</p>
              <div className="box">
                <div className="box-title">Organisations — volume brut</div>
                <table className="rir">
                  <thead>
                    <tr>
                      <th>Organisation</th>
                      <th>Répétitions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['10 × 2', '20'],
                      ['10 × 3', '30'],
                      ['10 × 5', '50'],
                      ['20 × 3', '60'],
                      ['30 × 3', '90']
                    ].map(([f, v]) => (
                      <tr key={f}>
                        <td className="reps">{f}</td>
                        <td>{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="quote">
                90 reps restent 90 reps en volume brut — pas forcément le même coût. Deux séries de 5
                peuvent différer selon variante, charge, RIR, amplitude, vitesse, technique et récup.
              </div>
              <p>
                Une rep très loin de l’échec ≠ une rep après une longue série déjà très fatigante. Le
                fractionnement modifie fortement le <strong>coût aigu</strong> de chaque exposition —
                sans rendre le volume total gratuit. Le GTG organise volume et pratique ; il ne fait pas
                disparaître la fatigue.
              </p>
            </Sec>

            <Sec id="s17" num="10" title="Maximiser le ratio stimulus / fatigue">
              <p>
                Le ratio stimulus / fatigue n’est pas une grandeur physiologique à unité universelle —
                c’est un <strong>cadre de décision</strong>.
              </p>
              <div className="split">
                <div className="a">
                  <h4>Exposition A</h4>
                  <MiniBar stimulus={70} fatigue={15} />
                  <p style={{ marginTop: '0.7rem' }}>
                    Pratique spécifique intéressante, assez de fraîcheur pour recommencer des heures plus
                    tard.
                  </p>
                </div>
                <div className="b">
                  <h4>Exposition B</h4>
                  <MiniBar stimulus={75} fatigue={70} />
                  <p style={{ marginTop: '0.7rem' }}>
                    Un peu plus stimulante, mais fatigue beaucoup plus haute — qualité ou répétabilité
                    réduites.
                  </p>
                </div>
              </div>
              <div className="principle">
                Pour une méthode fondée sur de nombreuses expositions, A peut être plus intéressant même
                si B « paraît » plus productif isolément. But ≠ maximiser le stimulus d’une série →
                maximiser la pratique de qualité accumulable et répétable dans le temps.
              </div>
              <p>
                Compatible avec les données : se rapprocher systématiquement de l’échec n’est pas
                nécessaire pour s’adapter, et peut augmenter le coût de fatigue sans meilleurs résultats
                automatiques.
              </p>
            </Sec>

            <Sec
              id="s19"
              num="11"
              title={`Pourquoi les ${caseExample.label.toLowerCase()} se prêtent bien à une pratique fréquente`}
            >
              <p>
                Les {caseExample.label.toLowerCase()} possèdent plusieurs caractéristiques qui les
                rendent particulièrement intéressantes pour une pratique fréquente — sans que cela
                les rende automatiquement adaptées à une fréquence élevée pour tout le monde.
              </p>
              <div className="metrics-4">
                <div>
                  <div className="k">Identifiable</div>
                  <p>
                    Prise, départ, trajectoire, amplitude, position du corps, critère de validation —
                    le geste peut être standardisé. Sinon on ne sait plus si la progression vient de la
                    perf ou d’un changement d’exécution.
                  </p>
                </div>
                <div>
                  <div className="k">Mesurable</div>
                  <p>
                    Max de reps, reps à difficulté donnée, qualité, variante, charge externe,
                    répétabilité. Deux pratiquants à max {mx} peuvent avoir une capacité très
                    différente à reproduire {wr} reps plusieurs fois dans la journée.
                  </p>
                </div>
                <div>
                  <div className="k">Spécifique</div>
                  <p>
                    Coordination, trajectoire, stabilisation, production de force dans cette
                    configuration, rythme, contrôle. Une partie de l’amélioration dépend de la façon
                    dont la force doit être produite — les compléments ne remplacent pas tout.
                  </p>
                </div>
                <div>
                  <div className="k">Modulable</div>
                  <p>
                    PDC, variante, assistance, lest. Les petites séries ({wr} reps chez toi) sont
                    faciles à caser sans transformer chaque passage en séance.
                  </p>
                </div>
              </div>
              <div className="quote">
                Une bonne candidate au GTG n’est pas seulement un exercice qu’on peut répéter souvent —
                c’est un mouvement dont la difficulté peut être assez contrôlée pour que la répétition
                fréquente reste compatible avec qualité, performance et récupération.
              </div>
              <p>
                La tolérance dépend du volume total, de ton niveau (max {mx}), de la récupération, des
                autres tirages, de la charge, et de la tolérance des coudes, épaules, poignets et tissus
                conjonctifs.
              </p>
            </Sec>

            <ChapterDivider
              num="II"
              title="La question du lest"
              subtitle="Force, réserve, et ce que le GTG ne remplace pas"
            />

            <Sec id="s20" num="12" title="Mais alors pourquoi ajouter du lest ?">
              <p>
                Si le poids du corps permet déjà de pratiquer le mouvement, pourquoi ajouter une charge
                ? Parce que le PDC n’est pas forcément une résistance assez élevée pour développer au
                mieux certaines qualités de force. Une ou quelques reps lestées exposent à une{' '}
                <strong>production de force plus importante par répétition</strong>, avec moins de
                reps — mais ça change la nature du travail.
              </p>
              <div className="stat-row">
                <div>
                  <div className="num">{bwLabel}</div>
                  <div className="lbl">
                    kg PDC
                    {bwKnown
                      ? bwSourceNote
                        ? ` · ${bwSourceNote}`
                        : ''
                      : ' (ordre de grandeur)'}
                  </div>
                </div>
                <div>
                  <div className="num">{bwPlus5}</div>
                  <div className="lbl">+5 kg → masse externe ≈</div>
                </div>
                <div>
                  <div className="num">+{pctLest10}%</div>
                  <div className="lbl">
                    vs PDC seul avec +10 kg ({bwPlus10} kg)
                  </div>
                </div>
              </div>
              {!bwKnown && (
                <p>
                  Indique ton poids (ou mesure-le en Impédancemètre / Aujourd’hui) pour caler ces
                  pourcentages sur toi — {pctLest5}&nbsp;% pour +5&nbsp;kg et {pctLest10}&nbsp;% pour
                  +10&nbsp;kg sur ~70&nbsp;kg ne sont que des repères moyens.
                </p>
              )}
              <div className="quote">
                {bwKnown ? bw : '~70'} kg de PDC ≠ « les muscles soulèvent exactement {bwKnown ? bw : 70}{' '}
                kg ». Répartition des masses, angles, bras de levier et trajectoire modifient la demande.
                PDC + lest = approximation de la résistance externe, pas une mesure de force par muscle.
              </div>
              <div className="split">
                <div className="a">
                  <h4>Pourquoi le lest intéresse</h4>
                  <p>
                    Charge ↑ → reps réalisables ↓ → chaque rep demande plus de force, volume plus
                    bas, production de force davantage prioritaire. Les méta-analyses favorisent les
                    charges élevées pour la force max ; l’hypertrophie tolère une gamme plus large.
                  </p>
                </div>
                <div className="b">
                  <h4>Ce que ce n’est pas</h4>
                  <p>
                    Pas juste « rendre les {caseExample.label.toLowerCase()} plus dures ». C’est
                    modifier la <strong>qualité de contrainte</strong> de chaque répétition —
                    complémentaire du GTG à {wr} reps / {mx} max, pas un remplacement automatique.
                  </p>
                </div>
              </div>
            </Sec>

            <Sec id="s22" num="13" title="Continuum : GTG, force, et complémentarité">
              <div className="principle">
                très facile → submaximal → modérément difficile → proche de l’échec → maximal
              </div>
              <p>
                Une zone ne dicte pas une fréquence magique. Une série plus difficile a souvent un
                coût aigu plus élevé, mais la tolérance dépend aussi du nombre de séries, des reps, du
                mouvement, de la charge, du niveau, de la récupération et des tissus.
              </p>
              <div className="split">
                <div className="a">
                  <h4>Bloc GTG</h4>
                  <p>
                    Priorité : spécificité, qualité, répétabilité, pratique fréquente, faible fatigue
                    aiguë par exposition. Chez toi : ~{wr} reps (≈ {pctWr != null ? `${pctWr}%` : '—'}{' '}
                    du max {mx}, RIR ~{rirWr ?? '—'}). Le PDC suffit si ces caractéristiques tiennent.
                  </p>
                </div>
                <div className="b">
                  <h4>Bloc force</h4>
                  <p>
                    Produire beaucoup de force, résistance élevée. Souvent 1–5 reps —{' '}
                    <em>exemple</em>, pas définition universelle ni prescription GTG. Pas un test max
                    à chaque série. Les charges élevées favorisent davantage le 1RM ; l’hypertrophie
                    s’obtient sur une gamme plus large.
                  </p>
                </div>
              </div>
              <div className="quote">
                On ne peut pas conclure « GTG lesté &gt; GTG au PDC » dans tous les cas. Ce sont deux
                contraintes pour des besoins différents.
              </div>
            </Sec>

            <Sec
              id="s25"
              num="14"
              title={`Un max à 1 et une série de ${mx} ne sont pas la même qualité`}
            >
              <p>
                Une répétition très lourde et une série très longue peuvent toutes deux être
                « difficiles », sans demander exactement la même chose.
              </p>
              <div className="split">
                <div className="a">
                  <h4>1 rep lourde</h4>
                  <p>
                    Production de force élevée, coordination sous forte contrainte, capacité à
                    produire cette force sur une seule répétition.
                  </p>
                </div>
                <div className="b">
                  <h4>Série de {mx} (ton max)</h4>
                  <p>
                    Force suffisante + capacité à répéter + économie + coordination maintenue +
                    tolérance à la fatigue locale + technique qui tient malgré l’accumulation. Pas
                    simplement « 1 = force » et « {mx} = endurance » : les qualités se chevauchent ;
                    la différence est la <strong>contrainte dominante</strong>.
                  </p>
                </div>
              </div>
              <p>
                Pour une perf max sur série longue, il faut pouvoir produire assez de force{' '}
                <em>et</em> la reproduire assez longtemps — d’où l’intérêt de séparer GTG (marge) et
                tests / blocs force.
              </p>
            </Sec>

            <Sec id="s28" num="15" title="Ce que cela signifie pour ton GTG">
              <p>
                Trois outils, sans leur coller artificiellement une seule adaptation — calés sur ton
                max {mx} et ta dose actuelle ({wr}/passage) :
              </p>
              <div className="split cols-3">
                <div className="a">
                  <h4>GTG PDC</h4>
                  <p>
                    Spécificité, pratique fréquente, qualité, répétabilité, faible fatigue aiguë.
                    Ton cas : {wr} reps × ~{passagesEx} passages ≈ {dayVol} reps/jour possibles.
                  </p>
                </div>
                <div className="b">
                  <h4>Travail lesté</h4>
                  <p>
                    Production de force élevée, surcharge externe
                    {bwKnown
                      ? ` (ex. +10 kg ≈ +${pctLest10}% vs tes ${bw} kg)`
                      : ' (renseigne ton poids pour un % précis)'}
                    . Utile quand l’objectif inclut la force max.
                  </p>
                </div>
                <div className="c">
                  <h4>Séries classiques</h4>
                  <p>
                    Volume concentré, fatigue locale, séries de plusieurs reps, hypertrophie
                    potentielle si volume/effort suffisent. Un 4 × {classicPerSet} avec max {mx} n’est
                    pas auto « de l’endurance » — ça dépend de la proximité de l’échec, du repos, de
                    la charge.
                  </p>
                </div>
              </div>
              <div className="quote">
                La différence n’est pas « une méthode = une adaptation », mais la qualité que chaque
                méthode met davantage au premier plan.
              </div>
            </Sec>

            <ChapterDivider
              num="III"
              title="Par mouvement"
              subtitle="Même méthode, prescriptions différentes"
            />

            <Sec id="s29" num="16" title="Pourquoi tous les exercices ne doivent pas être traités pareil">
              <p>
                « GTG » décrit une manière de distribuer et de gérer la pratique — pas{' '}
                <strong>
                  {wr} reps × {passagesEx} passages/jour pour tout
                </strong>
                . L’unité de travail dépend du mouvement.
              </p>
              <div className="box">
                <table className="obj">
                  <thead>
                    <tr>
                      <th>Exercice</th>
                      <th>Intérêt GTG</th>
                      <th>Variable prioritaire</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="o">Traction</td>
                      <td className="a">élevé</td>
                      <td>reps / qualité / RIR</td>
                    </tr>
                    <tr>
                      <td className="o">Pompe</td>
                      <td className="a">élevé</td>
                      <td>reps / variante</td>
                    </tr>
                    <tr>
                      <td className="o">Dip</td>
                      <td>intéressant, prudent</td>
                      <td>reps / qualité / RIR</td>
                    </tr>
                    <tr>
                      <td className="o">Handstand</td>
                      <td className="a">très intéressant tech.</td>
                      <td>qualité / temps</td>
                    </tr>
                    <tr>
                      <td className="o">L-sit</td>
                      <td className="a">intéressant</td>
                      <td>secondes / variante</td>
                    </tr>
                    <tr>
                      <td className="o">Muscle-up</td>
                      <td>si niveau suffisant</td>
                      <td>vitesse / qualité</td>
                    </tr>
                    <tr>
                      <td className="o">Planche / front lever</td>
                      <td>intéressant</td>
                      <td>variante / temps</td>
                    </tr>
                    <tr>
                      <td className="o">Saut</td>
                      <td>spécifique, vol. limité</td>
                      <td>vitesse / hauteur / qualité</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                Coût mécanique, technicité, risque de dégradation, besoin de vitesse, mode de mesure,
                tolérance aux reps et potentiel de fréquence ne sont pas les mêmes. Adapte le GTG à la
                variable qui limite vraiment la performance.
              </p>
            </Sec>

            <Sec id="s30" num="17" title="Pompes et dips">
              <div className="split">
                <div className="a">
                  <h4>Pompes</h4>
                  <p>
                    Faciles à fractionner. Avec un max autour de {pushMax}, un départ type{' '}
                    {pushStartLow}–{pushStartHigh} reps peut convenir à certains — ce n’est{' '}
                    <em>pas</em> déduit mécaniquement du max. Observe RIR, vitesse, amplitude,
                    stabilité, fréquence prévue, réponse aux passages suivants. Variante (pieds
                    surélevés, lest) = autre coût. Poignets / coudes / épaules peuvent limiter avant
                    les muscles.
                  </p>
                </div>
                <div className="b">
                  <h4>Dips</h4>
                  <p>
                    {dipMax > 0
                      ? `Max de référence ~${dipMax} — `
                      : ''}
                    prudence supplémentaire : contrainte mécanique et position articulaire. Évite la
                    règle « plus dur = fréquence forcément plus basse » : ça dépend de toi, de la
                    technique, du volume et de la charge. Une série peut sembler facile
                    musculairement tout en chargeant beaucoup les tissus — temporalités différentes.
                  </p>
                </div>
              </div>
            </Sec>

            <Sec id="s32" num="18" title="L-sit et handstand">
              <div className="split">
                <div className="a">
                  <h4>L-sit</h4>
                  <p>
                    Compter des « reps » a peu de sens. Variables : durée, qualité de position,
                    variante, hauteur des jambes, bassin, épaules. Progresser sans poids : tuck → une
                    jambe → straddle → jambes tendues ; aussi levier, hauteur, angles, compression.
                    Deux L-sits de 10 s peuvent être très différents. Critère d’arrêt = dégradation
                    de la position, pas un chrono arbitraire.
                  </p>
                </div>
                <div className="b">
                  <h4>Handstand</h4>
                  <p>
                    Pratique fraîche : équilibre, ligne, corrections, épaules, perception. La fatigue
                    rend les corrections moins précises → accumulation de tentatives dégradées.
                    Fréquence utile <em>si</em> chaque exposition garde assez de qualité. Poignets,
                    coudes, épaules comptent. Davantage de tentatives ≠ mieux pratiquer.
                  </p>
                </div>
              </div>
              <div className="quote">
                Pour un mouvement technique, une tentative supplémentaire qui dégrade fortement la
                ligne ou l’équilibre a une valeur très différente d’une tentative fraîche.
              </div>
            </Sec>

            <Sec id="s34" num="19" title="Technique, muscle-up et explosivité">
              <div className="quote">1 répétition propre peut être plus informative que 3 répétitions dégradées.</div>
              <p>
                Le muscle-up combine force de tirage, vitesse, coordination, trajectoire, transition,
                et force dans une fenêtre temporelle précise. La pratique fréquente peut améliorer la
                coordination, mais ne compense pas indéfiniment une qualité physique limitante. Si
                force ou puissance manquent, multiplier des reps techniquement insuffisantes ne
                résout pas le problème — il faut entraîner la qualité limitante.
              </p>
              <div className="split">
                <div className="a">
                  <h4>Mouvements explosifs</h4>
                  <p>
                    Le RIR est parfois moins informatif que vitesse, hauteur, distance, qualité du
                    geste ou puissance. Une rep peut être loin de l’échec tout en étant déjà trop
                    lente pour l’objectif. La perte de vitesse compte surtout quand la vitesse{' '}
                    <em>est</em> l’objectif.
                  </p>
                </div>
                <div className="b">
                  <h4>Pas de seuil universel</h4>
                  <p>
                    Aucun % de velocity loss optimal pour tous les mouvements. Le seuil dépend de
                    l’exercice, de la charge, de l’objectif, du niveau et de la fatigue recherchée. La
                    littérature : plus de perte de vitesse ↔ plus de fatigue aiguë — pas un seuil
                    unique optimal.
                  </p>
                </div>
              </div>
            </Sec>

            <Sec id="s36" num="20" title="Tableau des objectifs">
              <div className="box">
                <table className="obj">
                  <thead>
                    <tr>
                      <th>Objectif</th>
                      <th>Priorité</th>
                      <th>Effort</th>
                      <th>Critère d’arrêt</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="o">Technique</td>
                      <td>précision</td>
                      <td>très faible → faible</td>
                      <td className="a">perte technique</td>
                    </tr>
                    <tr>
                      <td className="o">Force</td>
                      <td>production de force</td>
                      <td>modéré → élevé</td>
                      <td>qualité / capacité à produire</td>
                    </tr>
                    <tr>
                      <td className="o">Hypertrophie</td>
                      <td>tension + volume</td>
                      <td>modéré → élevé</td>
                      <td>fatigue contrôlée / qualité</td>
                    </tr>
                    <tr>
                      <td className="o">Endurance de reps</td>
                      <td>volume spécifique</td>
                      <td>variable</td>
                      <td>dégradation liée à la fatigue</td>
                    </tr>
                    <tr>
                      <td className="o">Explosivité</td>
                      <td>vitesse / puissance</td>
                      <td>faible → modéré</td>
                      <td className="a">ralentissement / baisse de perf</td>
                    </tr>
                    <tr>
                      <td className="o">GTG perf.</td>
                      <td>spécificité + répétabilité</td>
                      <td>faible → modéré</td>
                      <td className="a">dérive qualité / marge insuffisante</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                Catégories non étanches. Une série de {wr} (ta dose GTG) ou de 5 peut servir force,
                hypertrophie, technique, perf spécifique ou endurance locale selon charge, difficulté,
                RIR, repos et contexte. Ne définis pas un objectif uniquement par une plage de reps.
              </p>
            </Sec>

            <ChapterDivider
              num="IV"
              title="Construire le GTG"
              subtitle="Dose, récupération, progression — sans te brûler"
            />

            <Sec id="s38" num="21" title="Logique GTG : dose, qualité, signaux d’arrêt">
              <div className="quote">
                Pas « combien de reps puis-je réussir ? » — plutôt « combien puis-je pratiquer tout en
                gardant une qualité assez stable pour recommencer ? »
              </div>
              <p>
                La dose naît de l’interaction{' '}
                <strong>difficulté × volume × fréquence × récupération</strong>. Isolément, {wr} reps
                sont faciles ; répétées {passagesEx} fois, ça devient {dayVol} reps — un vrai volume.
              </p>
              <div className="box">
                <div className="box-title">Hiérarchie pratique des signaux — outil d’autorégulation</div>
                <table className="obj">
                  <thead>
                    <tr>
                      <th>Priorité</th>
                      <th>Signal</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="o">1</td>
                      <td>technique qui change</td>
                      <td className="a">réduire</td>
                    </tr>
                    <tr>
                      <td className="o">2</td>
                      <td>vitesse qui chute nettement</td>
                      <td className="a">réduire</td>
                    </tr>
                    <tr>
                      <td className="o">3</td>
                      <td>marge devenue faible (RIR)</td>
                      <td className="a">réduire</td>
                    </tr>
                    <tr>
                      <td className="o">4</td>
                      <td>passage suivant moins bon</td>
                      <td className="a">réduire</td>
                    </tr>
                    <tr>
                      <td className="o">5</td>
                      <td>récupération anormale</td>
                      <td className="a">réduire le volume total</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                Si le nombre prévu est atteint mais avec amplitude réduite, trajectoire différente ou
                compensation, la série n’est plus équivalente à la précédente — même si le compteur
                affiche encore {wr}.
              </p>
            </Sec>

            <Sec id="s40" num="22" title="Volume, récupération et volume invisible">
              <div className="flow">
                <div>
                  Passage : {wr} reps
                </div>
                <div>
                  Journée : {wr} × {passagesEx} = {dayVol}
                </div>
                <div>
                  Semaine (5 j) : {dayVol} × 5 = {weekVol}
                </div>
                <div className="goal">+ séances classiques → volume total réel</div>
              </div>
              <div className="quote">
                Volume brut ≠ contrainte totale. Deux semaines à {weekVol} reps peuvent produire des
                charges très différentes selon variante, amplitude, charge, RIR, vitesse, qualité et
                repos.
              </div>
              <div className="split">
                <div className="a">
                  <h4>Récupérer quoi ?</h4>
                  <p>
                    Capacité neuromusculaire (force + qualité), tissus conjonctifs, articulations,
                    sommeil, stress, autres entraînements, séances prioritaires. Un GTG qui dégrade
                    systématiquement la séance principale du lendemain n’est plus « gratuit ».
                  </p>
                </div>
                <div className="b">
                  <h4>Volume invisible</h4>
                  <p>
                    {wr} « faciles » × encore × encore → +{dayVol} reps/jour. Le coût ne disparaît pas
                    parce que chaque exposition est courte : la charge se cumule.
                  </p>
                </div>
              </div>
            </Sec>

            <Sec id="s43" num="23" title="Comment progresser sans seulement ajouter des reps ?">
              <p>
                Progresser ≠ forcément plus de reps. Plusieurs variables — et le principe clé :{' '}
                <strong>ne pas tout augmenter en même temps</strong>.
              </p>
              <div className="metrics-4">
                <div>
                  <div className="k">Qualité</div>
                  <p>
                    Même volume ({dayVol}/j), meilleure amplitude, trajectoire, moins de
                    compensation, meilleure vitesse.
                  </p>
                </div>
                <div>
                  <div className="k">Passages</div>
                  <p>
                    Même {wr}/passage, plus d’expositions → volume ↑. Traite ça comme une vraie
                    progression.
                  </p>
                </div>
                <div>
                  <div className="k">Par passage</div>
                  <p>
                    {wr} → {wr + 1} augmente le coût de chaque exposition. Ne combine pas auto avec +
                    fréquence.
                  </p>
                </div>
                <div>
                  <div className="k">Difficulté</div>
                  <p>Variante, charge, amplitude, vitesse, position — ou même volume ressenti plus facile.</p>
                </div>
              </div>
              <div className="quote">
                Ex. : {dayVol} reps → encore {dayVol} reps, mais moins de ralentissement et plus de
                marge. Ce n’est pas forcément une « surcharge progressive » classique, mais c’est une
                adaptation. Si tu montes reps + passages + difficulté d’un coup, tu ne sauras plus
                quoi a marché — ni quoi a surchargé.
              </div>
            </Sec>

            <Sec id="s46" num="24" title="Limites : fin du GTG, coût et fréquence">
              <div className="quote">
                Le GTG n’est pas un nombre de reps, de passages, d’intervalles ou d’heures. C’est la
                relation difficulté → qualité → fatigue → fréquence → récupération.
              </div>
              <p>
                Quand augmenter la fréquence provoque une dégradation persistante de la qualité ou de
                la récupération, le principe cesse progressivement d’être respecté — même si tu coches
                encore {wr} reps.
              </p>
              <div className="metrics-4">
                <div>
                  <div className="k">Coût / rep</div>
                  <p>
                    50 pompes ≠ 50 dips. Masse déplacée, amplitude, leviers, position, stabilité,
                    variante, RIR, vitesse, charge externe.
                  </p>
                </div>
                <div>
                  <div className="k">Force / poids</div>
                  <p>
                    {bwKnown
                      ? `À ${bw} kg, +10 kg ≈ +${pctLest10}% de masse externe vs PDC.`
                      : `À ~70 kg, +10 kg ≈ +${pctLest10}% (poids Body / Aujourd’hui pour un chiffre perso).`}{' '}
                    Repère utile — pas +{pctLest10}% d’intensité musculaire.
                  </p>
                </div>
                <div>
                  <div className="k">Fréquence ≠ volume</div>
                  <p>
                    Fréquence = expositions. Volume = travail accumulé. On peut monter l’une sans
                    l’autre, ou les deux. Le GTG joue surtout sur la{' '}
                    <strong>distribution dans le temps</strong>.
                  </p>
                </div>
                <div>
                  <div className="k">Fatigue</div>
                  <p>
                    Submaximal = moins de fatigue aiguë <em>par</em> exposition. Pas volume gratuit :
                    {passagesEx} × {wr} reste {dayVol} reps.
                  </p>
                </div>
              </div>
            </Sec>

            <ChapterDivider
              num="V"
              title="Science et niveau de preuve"
              subtitle="Ce qui est établi, ce qui est extrapolé"
            />

            <Sec id="s50" num="25" title="Science : ce qu’on sait, et à quel niveau">
              <div className="split">
                <div className="a">
                  <h4>Bien établi</h4>
                  <p>
                    Résistance → force ; spécificité ; charges élevées pour force max ; échec non
                    indispensable ; hypertrophie sur large gamme ; à volume égalisé, fréquence ≠ avantage
                    magique.
                  </p>
                </div>
                <div className="b">
                  <h4>Moins démontré</h4>
                  <p>
                    GTG multi-jours &gt; séance classique ; GTG lesté &gt; PDC ; ratio précis « optimal »
                    pour un max donné.
                  </p>
                </div>
              </div>
              <div className="metrics-4">
                <div>
                  <div className="k">A</div>
                  <p>Démontré directement.</p>
                </div>
                <div>
                  <div className="k">B</div>
                  <p>Cohérent avec la littérature.</p>
                </div>
                <div>
                  <div className="k">C</div>
                  <p>Principe pratique.</p>
                </div>
                <div>
                  <div className="k">D</div>
                  <p>Exemple de programmation individuelle.</p>
                </div>
              </div>
              <div className="quote">
                La plupart des études viennent de l’entraînement classique — elles éclairent le GTG sans
                le démontrer comme protocole. « Fréquence sans bénéfice à volume égal » ≠ « GTG inutile ».
              </div>
            </Sec>

            <ChapterDivider
              num="VI"
              title={caseExample.chapterTitle}
              subtitle={caseExample.chapterSubtitle}
            />

            <Sec id="s53" num="26" title={caseExample.startTitle}>
              <p>
                Ton maximum actuel est de <strong>{mx}</strong> {caseExample.label.toLowerCase()}{' '}
                propres (même standard). Objectif déclaré : <strong>{caseExample.goal}</strong>.
                Cela permet un point de départ pratique — pas de déduire une « dose optimale » de
                GTG. L’objectif initial : trouver{' '}
                <strong>
                  la plus petite dose qui ajoute une pratique utile sans perturber ton entraînement
                  habituel
                </strong>
                .
              </p>
              {maxBand === 'novice' && (
                <div className="quote">
                  Max bas ({mx}) : la littérature pratique GTG pousse plutôt vers{' '}
                  <strong>1 rep propre × plus de passages</strong> que vers des mini-séries
                  multi-reps. La « moitié du max » n’a presque plus de sens ici.
                </div>
              )}
              {doseBand === 'tooHot' && (
                <div className="quote">
                  Attention : {wr}/passage ≈ {pctWr}% de ton max ({mx}) — au-delà de la zone
                  classique ~{classicLow}–{classicHigh} (~½ max = {halfMax}). Qualité et RIR (~
                  {rirWr}) d’abord.
                </div>
              )}
              <div className="stat-row">
                <div>
                  <div className="num">
                    {startLow}–{startHigh}
                  </div>
                  <div className="lbl">reps / passage (départ prudent)</div>
                </div>
                <div>
                  <div className="num">{wr}</div>
                  <div className="lbl">
                    ton réglage ({pctWr}% · RIR {rirWr})
                  </div>
                </div>
                <div>
                  <div className="num">
                    {classicLow}–{classicHigh}
                  </div>
                  <div className="lbl">zone classique (~½ max {halfMax})</div>
                </div>
              </div>
              <div className="box">
                <div className="box-title">
                  Exemple — {startMid} reps × {gtgSamplePassages} passages = {startMid * gtgSamplePassages}{' '}
                  reps (départ)
                </div>
                <div className="flow" style={{ margin: 0 }}>
                  {Array.from({ length: Math.min(6, gtgSamplePassages) }).map((_, i) => {
                    const labels = [
                      'Matin',
                      'Fin de matinée',
                      'Début d’après-midi',
                      'Milieu d’après-midi',
                      'Fin d’après-midi',
                      'Soir'
                    ];
                    return (
                      <div key={labels[i]}>
                        {labels[i]} — {startMid}
                      </div>
                    );
                  })}
                  <div className="goal">
                    Total {startMid * gtgSamplePassages} · vs {classicVol} sur 4×{classicPerSet} (= +
                    {gtgVsClassicPct} % de volume brut au départ, pas d’intensité)
                  </div>
                </div>
              </div>
              <p>
                Les {classicVol} reps du 4×{classicPerSet} sont concentrées ; les{' '}
                {startMid * gtgSamplePassages} du GTG de départ sont dispersées, avec une fatigue
                aiguë généralement plus faible par exposition. Même volume brut ≠ même contrainte.
                À ta dose actuelle ({wr}×{passagesEx}) ≈ {dayVol} reps/jour possibles.
              </p>
              <div className="quote">
                Point de départ = hypothèse testable, pas prescription scientifiquement optimale.
                Fourchettes inspirées des pratiques GTG (≈½ max classique, 20–30 % prudent) —
                niveau de preuve D.
              </div>
              <div className="sign-list">
                <div className="good">
                  <h4>
                    Passer de {startLow} → {startHigh}
                    {startHigh < classicHigh ? ` puis → ${classicHigh}` : ''}
                  </h4>
                  <ul>
                    <li>{startLow} systématiquement facile</li>
                    <li>technique & vitesse stables</li>
                    <li>passages suivants comparables</li>
                    <li>pas de douleur inhabituelle</li>
                    <li>séances classiques + max OK</li>
                  </ul>
                  <p>
                    {startLow} → {startHigh} = +{bumpPct} % du volume par exposition — n’augmente pas
                    la fréquence en même temps.
                  </p>
                </div>
                <div className="bad">
                  <h4>Réduire si (tendance, pas 1 jour)</h4>
                  <ul>
                    <li>série anormalement lente</li>
                    <li>technique / amplitude qui dérive</li>
                    <li>passages de moins en moins bons</li>
                    <li>baisse inhabituelle en séance classique</li>
                    <li>fatigue qui persiste / douleur</li>
                  </ul>
                </div>
              </div>
              {wr > startHigh && doseBand !== 'tooHot' && (
                <p>
                  Ton réglage actuel ({wr}/passage) est au-dessus du départ prudent {startLow}–
                  {startHigh}
                  {wr <= classicHigh
                    ? ` — encore dans / près de la zone classique (${classicLow}–${classicHigh}).`
                    : '.'}{' '}
                  Observe qualité, RIR (~{rirWr}) et ressenti ; baisse si la tendance dérive.
                </p>
              )}
            </Sec>

            <Sec id="s56" num="27" title={caseExample.progressionTitle}>
              <div className="quote">
                Pas une progression démontrée comme optimale — exemple prudent pour tester la
                quantité de pratique tolérable. <strong>Niveau de preuve : D</strong> (exemple
                individuel, calé sur max {mx}, dose {wr}, objectif {caseExample.goal}).
              </div>
              <div className="phase-grid">
                <div>
                  <div className="ph">Phase 1 — tolérance</div>
                  <div className="rx">
                    {startLow} rep{startLow > 1 ? 's' : ''} × {caseExample.passagesMin}–
                    {Math.min(caseExample.passagesMin + 1, caseExample.passagesMax)} passages
                  </div>
                  <p>
                    {maxBand === 'novice'
                      ? 'Installe 1 rep propre répétée. Qualité > volume/passage.'
                      : 'Petite quantité supplémentaire bien tolérée ? Observe qualité, vitesse, récup, impact sur les séances.'}
                  </p>
                </div>
                <div>
                  <div className="ph">Phase 2 — volume distribué</div>
                  <div className="rx">
                    {startLow} rep{startLow > 1 ? 's' : ''} × {caseExample.passagesMin + 2}–
                    {caseExample.passagesMax} passages
                  </div>
                  <p>
                    Même difficulté / passage, plus d’expositions → volume ↑. Le GTG n’annule pas la
                    surveillance de la récupération.
                  </p>
                </div>
                <div>
                  <div className="ph">Phase 3 — travail / passage</div>
                  <div className="rx">
                    évent. {startHigh}
                    {startHigh < classicHigh ? `–${classicHigh}` : ''} reps × quelques passages
                  </div>
                  <p>
                    Seulement si {startLow} reste systématiquement facile. Zone classique cible ≈{' '}
                    {classicLow}–{classicHigh} (~½ de {mx}). Ne monte pas reps + fréquence +
                    difficulté + travail classique d’un coup.
                  </p>
                </div>
                <div>
                  <div className="ph">Phase 4 — stabiliser & évaluer</div>
                  <div className="rx">
                    dose stable ({wr}) → tendance vers {caseExample.goal}
                  </div>
                  <p>
                    Max, qualité, perf à N reps, répétabilité, récup, impact sur le reste. Pas besoin
                    d’augmenter le GTG juste parce que la journée paraît facile.
                  </p>
                </div>
              </div>
              <div className="split">
                <div className="a">
                  <h4>GTG</h4>
                  <p>
                    Pratique fréquente et spécifique — chez toi {wr}/passage (~{pctWr}%), objectif{' '}
                    {caseExample.goal}.
                  </p>
                </div>
                <div className="b">
                  <h4>Lesté</h4>
                  <p>
                    Bloc distinct : surcharge orientée force, reps selon charge et marge — pas chaque
                    mini-série GTG.
                  </p>
                </div>
              </div>
            </Sec>

            <Sec id="s57" num="28" title={caseExample.measureTitle}>
              <p>
                <strong>Semaine 0 → max {mx}</strong>, seulement si le standard est identique : prise,
                départ, amplitude, critère de fin, sans compensations artificielles. Sans ça, comparer{' '}
                {mx} → {caseExample.midGoal} → {caseExample.goal} ne dit pas si la capacité a vraiment
                progressé.
              </p>
              <div className="split">
                <div className="a">
                  <h4>Ne pas tester constamment</h4>
                  <p>
                    Un max est une mesure, pas un exercice quotidien. Retest toutes les{' '}
                    <strong>2–6 semaines</strong> comme repère (pas une règle universelle) —
                    standardise surtout les conditions.
                  </p>
                </div>
                <div className="b">
                  <h4>Autres indicateurs</h4>
                  <p>
                    Vitesse à {wr} reps, qualité à volume égal, RIR (~{rirWr}), volume toléré,
                    récupération. Ils peuvent bouger avant le max. En Pratique : ressenti du jour +
                    dose ; en Stats : volume, RIR/zone, feels.
                  </p>
                </div>
              </div>
              <div className="split">
                <div className="a">
                  <h4>4 × {classicPerSet}</h4>
                  <p>
                    Volume concentré ({classicVol} reps), fatigue qui s’accumule dans la séance,
                    pratique structurée sous fatigue locale.
                  </p>
                </div>
                <div className="b">
                  <h4>GTG</h4>
                  <p>
                    Volume dispersé (~{dayVol}/j si {wr}×{passagesEx}), faible fatigue / exposition,
                    plus d’occasions fraîches. Pas concurrents : tu peux combiner les deux.
                  </p>
                </div>
              </div>
              <div className="quote">
                Quelle organisation développe la qualité visée ({caseExample.label.toLowerCase()} →{' '}
                {caseExample.goal}) sans dépasser la récupération ? Aucune n’est automatiquement «
                meilleure ».
              </div>
            </Sec>

            <Sec id="s59" num="29" title={caseExample.toolkitTitle}>
              <p>
                Passer de <strong>{mx}</strong> à <strong>{caseExample.goal}</strong>{' '}
                {caseExample.label.toLowerCase()} propres ne tient probablement pas à une seule
                qualité — plusieurs facteurs se chevauchent.
              </p>
              <div className="toolkit">
                <div>
                  <h4>Classique</h4>
                  <MiniBar stimulus={60} fatigue={40} />
                  <p>
                    Volume concentré (ex. 4×{classicPerSet}), séries multi-reps, fatigue, hypertrophie
                    potentielle, tenir sous fatigue.
                  </p>
                </div>
                <div>
                  <h4>GTG</h4>
                  <MiniBar
                    stimulus={caseExample.stimulusPct || 38}
                    fatigue={caseExample.fatiguePct || 8}
                  />
                  <p>
                    Spécificité, fréquence, qualité, pratique à faible fatigue aiguë — ton dose : {wr}
                    /passage ({pctWr}% · zone {doseBand}).
                  </p>
                </div>
                <div>
                  <h4>Lourd</h4>
                  <MiniBar stimulus={55} fatigue={45} />
                  <p>
                    Force max / réserve. Une rep qui était lourde peut devenir plus légère — sans
                    garantir seul le max PDC.
                  </p>
                </div>
                <div>
                  <h4>Test max</h4>
                  <MiniBar stimulus={65} fatigue={65} />
                  <p>Mesurer, vérifier, comparer — pas le cœur du programme.</p>
                </div>
              </div>
              <div className="box">
                <div className="box-title">Complémentaire</div>
                <p>
                  Dorsaux, biceps, tronc, stabilisateurs d’épaule… complètent la pratique spécifique
                  sans la remplacer.
                </p>
              </div>
              <p className="box-title" style={{ marginTop: '1.2rem' }}>
                Quelle qualité limite réellement tes {caseExample.goal}{' '}
                {caseExample.label.toLowerCase()} ?
              </p>
              <div className="qa-grid">
                <div>
                  <div className="k">Force</div>
                  <p className="q">Puis-je produire assez de force pour la répétition ?</p>
                  <p className="a">→ travail lourd / variantes adaptées</p>
                </div>
                <div>
                  <div className="k">Technique</div>
                  <p className="q">Puis-je organiser correctement le mouvement ?</p>
                  <p className="a">→ pratique spécifique fraîche (GTG)</p>
                </div>
                <div>
                  <div className="k">Répéter</div>
                  <p className="q">Puis-je reproduire encore et encore ?</p>
                  <p className="a">→ pratique multi-reps spécifique</p>
                </div>
                <div>
                  <div className="k">Fatigue</div>
                  <p className="q">Puis-je tenir quand la fatigue monte ?</p>
                  <p className="a">→ séries classiques / multi-reps</p>
                </div>
              </div>
              <p>
                Autres freins possibles : mobilité, position articulaire, puissance, masse corporelle
                {bwKnown ? ` (${bw} kg)` : ''}, tolérance au volume, douleurs. La bonne question n’est
                pas « quelle méthode est la meilleure ? » mais{' '}
                <strong>« quelle qualité me limite actuellement ? »</strong>.
              </p>
            </Sec>

            <Sec id="s62" num="30" title={caseExample.conclusionTitle}>
              <p>{caseExample.conclusionLead}</p>
              <div className="split">
                <div className="a">
                  <h4>Pas le critère</h4>
                  <p>« J’ai réussi toutes mes séries de {wr}. »</p>
                </div>
                <div className="b">
                  <h4>Le vrai critère</h4>
                  <p>
                    « Je peux les répéter avec exécution propre, marge suffisante (RIR ~{rirWr}) et
                    mes perfs habituelles ailleurs. »
                  </p>
                </div>
              </div>
              <p>
                Lest en complément de force si besoin ; test max périodique et standardisé ; séries
                classiques pour volume sous fatigue ; GTG pour répartir la pratique spécifique à
                faible coût aigu (~{dayVol} reps/j à ta dose actuelle × {passagesEx} passages).
              </p>
              <div className="principle">
                Objectif → facteur limitant → exercice → difficulté → marge/RIR → qualité & vitesse →
                volume → fréquence → récupération → progression → évaluation — puis seulement : «{' '}
                {caseExample.conclusionRule} »
              </div>
              <p>
                Cette logique s’adapte à un max de 3, {mx} ou 30, comme à un muscle-up, un L-sit ou un
                handstand — sans transformer une règle pratique en pseudo-loi. Recale max / reps /
                objectif dans le module Protocole (Pratique) : titres et conclusions de cette partie
                suivent.
              </p>
              <div className="quote">
                Le meilleur GTG n’est pas celui qui maximise les reps d’aujourd’hui. C’est celui qui
                maximise la pratique spécifique de qualité que tu peux répéter assez longtemps pour
                progresser, sans que fatigue, dégradation technique, récupération ou volume total ne
                deviennent limitants.
              </div>
            </Sec>

            <footer className="proto-footer" id="sources">
              <h3 className="mono">SOURCES</h3>
              <ol>
                <li>
                  <em>Muscular adaptations in low- versus high-load resistance training: A meta-analysis</em>{' '}
                  — Schoenfeld et al., 2016
                </li>
                <li>
                  <em>Strength and Hypertrophy Adaptations Between Low- vs. High-Load Resistance Training</em>{' '}
                  — Schoenfeld et al., 2017
                </li>
                <li>
                  <em>Resistance Training Load Effects on Muscle Hypertrophy and Strength Gain</em> — Lopez
                  et al., 2021
                </li>
                <li>
                  <em>Influence of Resistance Training Proximity-to-Failure on Skeletal Muscle Hypertrophy</em>{' '}
                  — Refalo et al., 2023
                </li>
                <li>
                  <em>Effects of resistance training performed to repetition failure or non-failure</em> —
                  Grgic et al., 2022
                </li>
                <li>
                  <em>
                    Effects of resistance training performed to repetition non-failure on exercise
                    performance
                  </em>{' '}
                  — Wu et al., 2026
                </li>
                <li>
                  <em>Non-Specific Strength Changes Between High- and Low-Load Isotonic Resistance Training</em>{' '}
                  — Hammert et al., 2026
                </li>
                <li>
                  <em>
                    Pull-Up Performance Is Affected Differently by the Muscle Contraction Regimens
                    Practiced during Training among Climbers
                  </em>{' '}
                  — 2024
                </li>
                <li>
                  <em>Specificity of early motor unit adaptations with resistive exercise training</em> — Del
                  Vecchio et al., 2024
                </li>
                <li>
                  <em>
                    Resistance training-induced adaptations in the neuromuscular system: Physiological
                    mechanisms and implications for human performance
                  </em>{' '}
                  — 2025
                </li>
                <li>
                  <em>
                    How many times per week should a muscle be trained to maximize muscle hypertrophy? A
                    systematic review and meta-analysis of studies examining the effects of resistance
                    training frequency
                  </em>{' '}
                  — Schoenfeld, Grgic &amp; Krieger, 2019
                </li>
                <li>
                  <em>
                    Effect of Resistance Training Frequency on Gains in Muscular Strength: A Systematic
                    Review and Meta-Analysis
                  </em>{' '}
                  — Ralston et al., 2018
                </li>
                <li>
                  <em>
                    The Acute and Chronic Effects of Implementing Velocity Loss Thresholds During Resistance
                    Training: A Systematic Review, Meta-Analysis, and Critical Evaluation of the Literature
                  </em>{' '}
                  — García-Ramos et al., 2022
                </li>
                <li>
                  <em>
                    The Effect of Velocity Loss on Strength Development and Related Training Efficiency: A
                    Dose–Response Meta-Analysis
                  </em>{' '}
                  — 2023
                </li>
                <li>
                  <em>
                    Effects of Velocity Loss Threshold during Resistance Training on Strength and Athletic
                    Adaptations: A Systematic Review with Meta-Analysis
                  </em>{' '}
                  — 2022
                </li>
                <li>
                  <em>
                    Resistance training prescription for muscle strength and hypertrophy in healthy adults: a
                    systematic review and Bayesian network meta-analysis
                  </em>{' '}
                  — 2023
                </li>
              </ol>
            </footer>
          </div>
        </main>

      </div>
    </div>
  );
}
