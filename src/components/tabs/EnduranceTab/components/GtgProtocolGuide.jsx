import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useWorkout } from '../../../../context/WorkoutContext';
import { useProfileQuestionnaire } from '../../../../features/profileQuestionnaire/useProfileQuestionnaire';
import { useTranslation } from '../../../../utils/translations';
import {
  defaultGtgProtocolGoal,
  estimateGtgProtocolDay,
  getGtgExerciseLabel,
  normalizeGtgData,
  resolveGtgMaxReps,
  todayYmd,
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
      ['s04', '04 Sans échec'],
      ['s05', '05 Fatigue'],
      ['s06', '06 RIR'],
      ['s07', '07 Ton cas'],
      ['s08', '08 Combien'],
      ['s09', '09 2–3 reps']
    ]
  },
  {
    id: 'II',
    title: 'II — La question du lest',
    links: [
      ['s10', '10 Pourquoi lester'],
      ['s11', '11 Le mécanisme'],
      ['s12', '12 Le piège'],
      ['s13', '13 GTG + force'],
      ['s14', '14 Pas obligatoire'],
      ['s15', '15 Étude grimpeurs'],
      ['s16', '16 Le volume'],
      ['s17', '17 Le ratio'],
      ['s18', '18 Hypertrophie'],
      ['s19', '19 Pourquoi tractions']
    ]
  },
  {
    id: 'III',
    title: 'III — Par mouvement',
    links: [
      ['s20', '20 Pompes'],
      ['s21', '21 Dips'],
      ['s22', '22 Technique'],
      ['s23', '23 Explosif'],
      ['s24', '24 Quand lester'],
      ['s25', '25 Effet indirect'],
      ['s26', '26 Force ≠ endurance'],
      ['s27', '27 Les charges'],
      ['s28', '28 Synthèse']
    ]
  },
  {
    id: 'IV',
    title: 'IV — Ton programme',
    links: [
      ['s29', '29 Pas toute la journée'],
      ['s30', '30 Trop dur ?'],
      ['s31', '31 Récupération'],
      ['s32', '32 Le piège'],
      ['s33', '33 Ton plan'],
      ['s34', '34 Ton lest'],
      ['s35', '35 Ton max'],
      ['s36', '36 Pas chaque jour'],
      ['s37', '37 4×5 vs GTG'],
      ['s38', '38 Optimisation'],
      ['s39', '39 L’idée centrale'],
      ['s40', '40 Verdict'],
      ['s41', '41 Conclusion']
    ]
  },
  {
    id: 'V',
    title: 'V — La science',
    links: [
      ['s42', '42 Ce qu’on sait'],
      ['sources', 'Sources']
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

function ProtocolExerciseCard({ name, currentMax, goal, onChangeMax, onChangeGoal }) {
  const est = estimateGtgProtocolDay(currentMax, goal);
  return (
    <div className="gauge-wrap">
      <h2 className="gauge-exercise">{name}</h2>
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
        </div>
      </div>
      <div className="gauge-metrics bottom">
        <div className="gauge-stat">
          <span className="val">{est.reps}</span>
          <span className="lbl">reps</span>
        </div>
        <div className="gauge-stat">
          <span className="val">{est.minPassages}</span>
          <span className="lbl">passages min.</span>
        </div>
        <div className="gauge-stat">
          <span className="val">{est.maxPassages}</span>
          <span className="lbl">passages max.</span>
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
                const resolvedMax = resolveGtgMaxReps(id, ctx);
                const currentMax = proto.currentMax > 0 ? proto.currentMax : resolvedMax;
                const goal =
                  proto.goal > 0 ? proto.goal : defaultGtgProtocolGoal(currentMax);
                return (
                  <ProtocolExerciseCard
                    key={id}
                    name={getGtgExerciseLabel(id, gtgData.config, ctx)}
                    currentMax={currentMax}
                    goal={goal}
                    onChangeMax={(raw) => persistProtocol(id, { currentMax: raw })}
                    onChangeGoal={(raw) => persistProtocol(id, { goal: raw })}
                  />
                );
              })}
          </div>
        </div>
      </header>

      <div className="layout">
        <nav className="rail" aria-label="Sommaire du protocole GTG">
          {RAIL.map((ch) => (
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
                Le Grease the Groove, généralement abrégé GTG, est une méthode d’entraînement destinée
                principalement à améliorer la performance dans un mouvement précis. L’idée
                fondamentale est simple : faire très souvent le mouvement, mais avec suffisamment peu
                de fatigue pour pouvoir le refaire fréquemment.
              </p>
              <p>
                Contrairement à une séance classique où tu pourrais faire 4 × 5 tractions suivies d’un
                repos puis recommencer, le GTG disperse les répétitions dans la journée. Par exemple,
                tu pourrais faire 2 tractions à 10h, 2 à 12h, 2 à 14h, 2 à 16h et 2 à 18h : tu as
                effectué 10 répétitions, mais elles n’ont pas été concentrées dans une seule séance.
              </p>
              <p>
                Le principe n’est donc pas simplement de faire beaucoup de répétitions, c’est de
                multiplier les occasions de pratiquer le mouvement sans accumuler énormément de
                fatigue à chaque occasion.
              </p>
            </Sec>

            <Sec id="s02" num="02" title="Pourquoi cette méthode peut fonctionner">
              <p>
                Il faut comprendre qu’une performance comme une traction maximale n’est pas uniquement
                déterminée par la taille ou la force brute de tes muscles. Elle dépend notamment de la
                force musculaire, de la coordination intermusculaire, de la coordination
                intramusculaire, de la capacité du système nerveux à recruter les unités motrices, de
                la technique, de la trajectoire, du rythme du mouvement, de la capacité à maintenir
                cette technique lorsque la fatigue augmente, et de la spécificité de l’exercice. C’est
                particulièrement important pour les mouvements comme les tractions, les pompes, les
                dips, le muscle-up, le handstand ou le L-sit.
              </p>
              <p>
                Tu peux donc devenir meilleur à un mouvement non seulement parce que tes muscles
                deviennent plus gros, mais aussi parce que ton système nerveux devient plus efficace
                pour produire ce mouvement. C’est l’une des raisons pour lesquelles le GTG est
                particulièrement intéressant pour les exercices où l’objectif est d’augmenter le
                nombre de répétitions propres.
              </p>
            </Sec>

            <Sec id="s03" num="03" title="Le principe de spécificité">
              <p>
                C’est probablement l’un des concepts les plus importants à comprendre. Si ton objectif
                est de faire davantage de tractions, alors faire des tractions est extrêmement
                spécifique à cet objectif. Faire du tirage horizontal peut renforcer certains muscles
                utiles, faire du curl peut renforcer les biceps, faire du rowing peut renforcer le
                dos, mais aucun de ces exercices ne reproduit exactement la coordination nécessaire
                pour réaliser une traction.
              </p>
              <p>
                C’est le principe de spécificité de l’entraînement, et cela explique pourquoi le GTG
                peut être particulièrement intéressant pour les mouvements au poids du corps : tu
                pratiques exactement la compétence que tu souhaites améliorer, très régulièrement.
              </p>
            </Sec>

            <Sec id="s04" num="04" title="Le deuxième principe : ne pas aller à l’échec">
              <p>
                C’est là que le GTG se distingue vraiment d’un entraînement classique. Supposons que
                ton maximum actuel soit 9 tractions. Si tu fais 9 reps, tu es à l’échec ou
                pratiquement à l’échec ; si tu fais 8 reps, tu es extrêmement proche de l’échec ; mais
                si tu fais 2 à 3 reps, tu es très loin de ton maximum. Et c’est précisément ce que
                l’on recherche avec le GTG.
              </p>
              <p>
                La littérature scientifique moderne est d’ailleurs assez intéressante sur ce point :
                atteindre systématiquement l’échec n’est pas nécessaire pour développer la force. Une
                méta-analyse de 2022 portant sur 15 études n’a trouvé aucune différence significative
                globale entre l’entraînement à l’échec et sans échec pour les gains de force ou
                d’hypertrophie. Une méta-analyse publiée en 2026, portant sur 20 études et 556
                participants, arrive également à la conclusion que l’entraînement sans échec est au
                moins aussi efficace pour la plupart des adaptations neuromusculaires et pourrait même
                présenter un petit avantage pour la force dynamique.
              </p>
              <p>
                Cela ne signifie pas que l’échec est mauvais, cela signifie plutôt qu’il n’est pas
                obligatoire pour progresser. Et pour une méthode basée sur la répétition fréquente
                d’un mouvement, c’est extrêmement intéressant.
              </p>
            </Sec>

            <Sec id="s05" num="05" title="Pourquoi éviter la fatigue dans le GTG">
              <div className="split">
                <div className="a">
                  <h4>5 reps, frais</h4>
                  <p>
                    Technique propre, descente et remontée contrôlées. Tu recommences plusieurs heures
                    plus tard dans le même état.
                  </p>
                </div>
                <div className="b">
                  <h4>9 reps, à l’échec</h4>
                  <p>
                    Dernières répétitions lentes, technique dégradée, récupération longue avant de
                    pouvoir recommencer.
                  </p>
                </div>
              </div>
              <p>
                La seconde situation produit beaucoup plus de fatigue, mais elle ne produit pas
                nécessairement davantage d’amélioration de ta capacité à faire une nouvelle série
                plusieurs heures plus tard. C’est justement pour cela que le GTG cherche à maximiser
                la qualité de pratique rapportée à la fatigue, plutôt que simplement la fatigue par
                séance.
              </p>
            </Sec>

            <Sec id="s06" num="06" title="Le concept de RIR">
              <p>
                Pour comprendre le GTG, il faut connaître le RIR (Reps In Reserve), c’est-à-dire le
                nombre de répétitions que tu pourrais encore faire avant l’échec. Ce sont des
                estimations : le RIR réel varie selon la fatigue, la technique, le jour ou le
                sommeil — mais cela permet de comprendre ton cas, avec un maximum de 9.
              </p>
              <div className="box">
                <table className="rir">
                  <thead>
                    <tr>
                      <th>Répétitions</th>
                      <th>RIR estimé</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['9 reps', '0 RIR'],
                      ['8 reps', '~1 RIR'],
                      ['7 reps', '~2 RIR'],
                      ['6 reps', '~3 RIR'],
                      ['5 reps', '~4 RIR'],
                      ['4 reps', '~5 RIR'],
                      ['3 reps', '~6 RIR'],
                      ['2 reps', '~7 RIR'],
                      ['1 rep', '~8 RIR']
                    ].map(([reps, rir]) => (
                      <tr key={reps}>
                        <td className="reps">{reps}</td>
                        <td>{rir}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Sec>

            <Sec id="s07" num="07" title="Ton cas : maximum de 9 tractions">
              <p>
                Ton maximum actuel est de 9 tractions, et à 9 tu es complètement mort. Ton
                entraînement classique actuel est 4 × 5 tractions, soit 20 répétitions au total. Le
                point intéressant est que 5 répétitions représentent environ 56 % de ton maximum de
                9, mais ce pourcentage ne signifie pas 56 % de ton effort : la quatrième série peut
                devenir beaucoup plus difficile parce que la fatigue s’accumule.
              </p>
              <p>
                Ton entraînement classique ressemble donc davantage à une succession de 5 répétitions
                entrecoupées de repos, alors que ton GTG pourrait ressembler à 2 répétitions espacées
                de plusieurs heures. La fatigue locale et systémique est beaucoup plus faible à chaque
                occasion.
              </p>
            </Sec>

            <Sec id="s08" num="08" title="Combien de répétitions pour ton GTG ?">
              <p>
                Avec un maximum de 9 : <strong>1 répétition</strong> est extrêmement facile mais
                potentiellement un stimulus assez faible si tu ne fais pas assez de passages.{' '}
                <strong>2 répétitions</strong> sont très intéressantes — tu pratiques énormément le
                mouvement tout en restant très loin de l’échec. <strong>3 répétitions</strong> le sont
                également, en augmentant légèrement le stimulus. <strong>4 répétitions</strong>{' '}
                commencent à devenir un vrai travail, et se rapprochent de ton entraînement classique.{' '}
                <strong>5 répétitions</strong> correspondent déjà à ton niveau actuel — pour un GTG,
                on ne commence pas ici.
              </p>
            </Sec>

            <Sec id="s09" num="09" title="Pourquoi 2–3 reps te conviennent particulièrement">
              <div className="stat-row">
                <div>
                  <div className="num">22%</div>
                  <div className="lbl">de ton max à 2 reps</div>
                </div>
                <div>
                  <div className="num">33%</div>
                  <div className="lbl">de ton max à 3 reps</div>
                </div>
              </div>
              <p>
                Cela laisse énormément de marge, et c’est précisément ce que l’on veut. L’objectif
                n’est pas de savoir quelle est la plus grosse série que tu peux répéter, mais plutôt
                quelle est la plus grosse quantité de pratique de qualité que tu peux accumuler sans
                compromettre les répétitions suivantes. C’est une distinction fondamentale.
              </p>
            </Sec>

            <ChapterDivider
              num="II"
              title="La question du lest"
              subtitle="Ta question de départ, en détail"
            />

            <Sec id="s10" num="10" title="Mais alors pourquoi ajouter du lest ?">
              <p>
                Tu t’es demandé : si tu fais déjà du GTG avec 2 à 3 tractions, pourquoi ne pas mettre
                du lest et faire 1 à 2 tractions lestées ? Est-ce que ça ne serait pas encore plus
                efficace ? Oui, dans certaines conditions, parce que le lest augmente l’intensité. Une
                traction lestée avec +5 kg signifie que ton système musculaire doit produire davantage
                de force qu’avec ton poids seul : tu transformes le mouvement en un exercice davantage
                orienté vers la force.
              </p>
              <p>
                Les données scientifiques générales sur l’entraînement en résistance vont dans ce
                sens : les charges élevées sont généralement plus efficaces pour développer la force
                maximale, alors que l’hypertrophie peut être obtenue avec une gamme beaucoup plus
                large de charges.
              </p>
            </Sec>

            <Sec id="s11" num="11" title="Pourquoi le lest peut améliorer la force">
              <p>
                Avec une traction lestée à +10 kg, tu dois déplacer ton poids plus 10 kg, et le
                système nerveux doit produire davantage de force. Cela peut améliorer ta capacité à
                produire une force élevée, et une capacité de force supérieure peut ensuite rendre ton
                poids corporel relativement « plus léger ». Les méta-analyses sur les charges montrent
                effectivement que les entraînements à charge élevée donnent généralement de meilleurs
                résultats pour la force maximale, tandis que l’hypertrophie est beaucoup moins
                dépendante de la charge lorsque le volume et l’effort sont appropriés.
              </p>
            </Sec>

            <Sec id="s12" num="12" title="Mais attention : « plus lourd » ≠ « meilleur GTG »">
              <p>
                Le GTG n’a pas pour objectif de maximiser chaque mini-série. Si tu prends un lest
                tellement lourd qu’une seule répétition représente quasiment ton maximum, tu détruis
                le principe du GTG : tu obtiens plutôt du travail de force lourde. Ce n’est pas
                mauvais, mais ce n’est plus vraiment le même stimulus.
              </p>
              <div className="mini-gauge">
                <span className="lab" style={{ color: 'var(--gtg-stimulus)' }}>
                  GTG
                </span>
                <div className="track">
                  <div style={{ background: 'var(--gtg-stimulus)', width: '35%' }} />
                  <div style={{ background: 'var(--gtg-fatigue)', width: '8%' }} />
                </div>
              </div>
              <div className="mini-gauge">
                <span className="lab" style={{ color: 'var(--gtg-fatigue)' }}>
                  Travail lourd
                </span>
                <div className="track">
                  <div style={{ background: 'var(--gtg-stimulus)', width: '55%' }} />
                  <div style={{ background: 'var(--gtg-fatigue)', width: '45%' }} />
                </div>
              </div>
            </Sec>

            <Sec id="s13" num="13" title="Le meilleur raisonnement : GTG + force">
              <div className="split">
                <div className="a">
                  <h4>Bloc A — GTG</h4>
                  <p>
                    2–3 tractions au poids du corps, plusieurs fois par jour. Technique, coordination,
                    automatisation, volume de pratique, faible fatigue.
                  </p>
                </div>
                <div className="b">
                  <h4>Bloc B — lesté</h4>
                  <p>
                    1–3 tractions lestées, charge faible, très loin de l’échec. Force, recrutement,
                    exposition à une intensité supérieure.
                  </p>
                </div>
              </div>
              <p>Cela combine deux qualités différentes.</p>
            </Sec>

            <Sec id="s14" num="14" title="Et le lest n’est pas forcément nécessaire">
              <p>
                Il ne faut pas conclure que GTG plus lest est obligatoirement supérieur au GTG sans
                lest. On ne dispose pas de suffisamment de données directes permettant de faire cette
                affirmation pour le GTG spécifiquement. C’est une extrapolation raisonnable à partir
                de la littérature sur la force et la spécificité, pas une conclusion directement
                démontrée par un essai clinique comparant les deux méthodes.
              </p>
            </Sec>

            <Sec id="s15" num="15" title="Une étude particulièrement intéressante pour les tractions">
              <p>
                Une étude publiée en 2024 chez des grimpeurs a comparé différentes modalités
                d’entraînement impliquant notamment des tractions. Après cinq semaines, les groupes
                d’entraînement ont amélioré leur force maximale, avec des adaptations différentes
                selon le type de contraction utilisé. Cela confirme que la manière dont tu entraînes
                la traction influence les adaptations obtenues — mais cela ne permet pas de dire que
                le GTG lesté est automatiquement supérieur.
              </p>
            </Sec>

            <Sec id="s16" num="16" title="Le problème du volume">
              <div className="box">
                <div className="box-title">Trois programmes, 10 passages</div>
                <table className="rir">
                  <thead>
                    <tr>
                      <th>Format</th>
                      <th>Volume total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="reps">10 × 2 reps</td>
                      <td>20 tractions</td>
                    </tr>
                    <tr>
                      <td className="reps">10 × 3 reps</td>
                      <td>30 tractions</td>
                    </tr>
                    <tr>
                      <td className="reps">10 × 5 reps</td>
                      <td>50 tractions</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                Le dernier programme semble évidemment « meilleur » sur le papier, mais ce n’est pas
                aussi simple : plus le nombre de répétitions par mini-série augmente, plus la fatigue
                augmente, et tu risques de transformer progressivement ton GTG en entraînement
                classique simplement dispersé dans la journée.
              </p>
            </Sec>

            <Sec id="s17" num="17" title="Le vrai objectif : maximiser le ratio stimulus/fatigue">
              <p>
                Un stimulus de 10 pour une fatigue de 2 est excellent. Un stimulus de 12 pour une
                fatigue de 10 peut être moins intéressant si tu dois répéter le mouvement plusieurs
                fois dans la journée. Le GTG cherche à obtenir beaucoup de stimulus technique et
                nerveux avec relativement peu de fatigue — cohérent avec le fait que l’échec
                musculaire n’est pas nécessaire pour obtenir des gains de force.
              </p>
            </Sec>

            <Sec id="s18" num="18" title="GTG et hypertrophie : ce n’est pas la même chose">
              <p>
                Le GTG est surtout intéressant lorsqu’on veut améliorer une performance spécifique,
                par exemple passer de 9 à 15 tractions. Mais si ton objectif principal est de
                maximiser la masse musculaire du dos et des biceps, le GTG n’est pas nécessairement
                la meilleure méthode à lui seul, parce que l’hypertrophie répond principalement à
                l’ensemble du stimulus d’entraînement : tension mécanique, volume, proximité de
                l’échec, progression, récupération et nutrition.
              </p>
              <p>
                Le GTG est donc un excellent outil de performance spécifique, mais il ne constitue pas
                à lui seul un programme d’hypertrophie complet.
              </p>
            </Sec>

            <Sec id="s19" num="19" title="Pourquoi le GTG est particulièrement adapté aux tractions">
              <p>
                Les tractions sont presque un cas d’école pour le GTG, parce qu’elles sont faciles à
                standardiser, relativement peu traumatisantes lorsqu’elles sont maîtrisées, très
                spécifiques, mesurables, réalisables sans énormément de matériel, fortement
                dépendantes de la technique et de la coordination, et facilement divisibles en petites
                séries.
              </p>
            </Sec>

            <ChapterDivider
              num="III"
              title="Par mouvement"
              subtitle="Pompes, dips, mouvements techniques et explosifs"
            />

            <Sec id="s20" num="20" title="Et pour les pompes ?">
              <p>
                Même logique. Si ton objectif est de faire plus de pompes, tu peux parfaitement
                utiliser un GTG : par exemple, avec un maximum de 30, tu pourrais faire 8 à 10 reps
                plusieurs fois dans la journée. Mais l’intérêt du lest dépend de ton objectif : si tu
                veux simplement augmenter ton nombre de pompes, le poids du corps est déjà très
                efficace ; si tu veux augmenter ta force maximale, le lest devient plus intéressant.
              </p>
            </Sec>

            <Sec id="s21" num="21" title="Et pour les dips ?">
              <p>
                Encore plus intéressant, car les dips sont naturellement plus faciles à charger. Tu
                peux avoir des dips au poids du corps pour le GTG et des dips lestés pour la force. Le
                problème est que les dips chargent fortement les épaules, les pectoraux et les
                triceps, donc la tolérance au volume doit être surveillée : plus un exercice est
                exigeant pour les articulations, moins on est agressif avec la fréquence du GTG.
              </p>
            </Sec>

            <Sec id="s22" num="22" title="Et pour les exercices très techniques ?">
              <p>
                Là, le GTG peut être extrêmement intéressant, par exemple pour le handstand, le L-sit,
                le muscle-up, le front lever ou la planche, parce que la performance dépend énormément
                de la coordination. Mais le GTG doit parfois être encore plus éloigné de l’échec : tu
                veux pratiquer une répétition propre, et non une répétition dégueulasse obtenue avec
                compensation.
              </p>
            </Sec>

            <Sec id="s23" num="23" title="Le cas particulier des mouvements explosifs">
              <p>
                Pour des mouvements comme le muscle-up, les tractions explosives, les pompes
                explosives ou les sauts, le principe reste valable mais il faut être particulièrement
                attentif à la qualité. Une répétition explosive doit rester explosive : si ta vitesse
                diminue fortement, le stimulus n’est plus exactement le même. Le GTG doit être arrêté
                avant que la fatigue ne dégrade la vitesse ou la technique.
              </p>
            </Sec>

            <Sec id="s24" num="24" title="Quand le lest est particulièrement intéressant">
              <table className="obj">
                <thead>
                  <tr>
                    <th>Objectif</th>
                    <th>Approche</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="o">Endurance de reps (9→15)</td>
                    <td className="a">Principalement poids du corps</td>
                  </tr>
                  <tr>
                    <td className="o">Force maximale (+20kg)</td>
                    <td className="a">Le lest devient très intéressant</td>
                  </tr>
                  <tr>
                    <td className="o">Hypertrophie</td>
                    <td className="a">Lest ou poids du corps, peu importe</td>
                  </tr>
                  <tr>
                    <td className="o">Technique</td>
                    <td className="a">Poids du corps ou charge très faible</td>
                  </tr>
                  <tr>
                    <td className="o">Mouvement explosif</td>
                    <td className="a">Charge légère, priorité à la vitesse</td>
                  </tr>
                </tbody>
              </table>
            </Sec>

            <Sec id="s25" num="25" title="Pourquoi le lest peut indirectement améliorer ton nombre de reps">
              <p>
                Si tu es capable de faire une traction avec +15 kg mais que ton maximum au poids du
                corps est 9, développer davantage de force maximale fait que ton poids corporel
                représente une proportion moindre de ta capacité maximale — comparable à quelqu’un qui
                devient plus fort au squat. Cela peut rendre les répétitions au poids du corps moins
                coûteuses. Mais une traction maximale et une série maximale de tractions ne sont pas
                exactement la même qualité physique.
              </p>
            </Sec>

            <Sec id="s26" num="26" title="Force ≠ endurance musculaire">
              <p>
                Pour faire une traction très lourde, tu as besoin de beaucoup de force. Pour faire 15
                tractions consécutives, tu as besoin de force, de coordination, de technique, de
                résistance musculaire locale, de capacité à gérer la fatigue et d’une bonne économie
                du mouvement. Si ton objectif est de passer de 9 à 15, faire uniquement du très lourd
                serait une erreur : tu dois conserver du travail spécifique au poids du corps.
              </p>
            </Sec>

            <Sec id="s27" num="27" title="Ce que les recherches sur les charges nous apprennent">
              <p>
                Une méta-analyse de Schoenfeld et collègues portant sur 21 études a trouvé des gains
                de 1RM supérieurs avec les charges élevées, alors que les gains d’hypertrophie étaient
                comparables entre différentes plages de charges lorsqu’elles étaient menées à un
                niveau d’effort suffisant. Une autre méta-analyse portant sur 28 études et 747 adultes
                retrouve également un avantage des charges élevées et modérées pour la force, tandis
                que l’hypertrophie ne dépend pas fortement de la charge. Une large méta-analyse en
                réseau portant sur 178 études pour la force et 119 pour l’hypertrophie a classé les
                charges élevées parmi les plus efficaces pour développer la force.
              </p>
            </Sec>

            <Sec id="s28" num="28" title="Ce que cela signifie pour ton GTG">
              <p>
                On peut construire une logique en trois volets : le <strong>GTG au poids du corps</strong>{' '}
                apporte spécificité, technique, répétition, coordination et faible fatigue ; les{' '}
                <strong>tractions lestées</strong> apportent intensité, force maximale, recrutement et
                réserve de force ; les <strong>séries classiques</strong> apportent volume, résistance
                musculaire et tolérance aux répétitions sous fatigue. C’est beaucoup plus complet que
                de choisir une seule méthode.
              </p>
            </Sec>

            <ChapterDivider
              num="IV"
              title="Ton programme"
              subtitle="Application concrète, avec un max de 9"
            />

            <Sec id="s29" num="29" title="Le GTG n’est pas « faire des tractions toute la journée »">
              <p>
                C’est une erreur fréquente. Le GTG n’est pas de faire le maximum de tractions possible
                pendant toute la journée : c’est presque l’inverse. C’est faire suffisamment de
                répétitions pour pratiquer énormément le mouvement, sans que cette pratique ne fatigue
                suffisamment pour dégrader les répétitions suivantes. La fatigue est une variable que
                tu cherches activement à contrôler.
              </p>
            </Sec>

            <Sec id="s30" num="30" title="Comment savoir si tes séries sont trop difficiles ?">
              <div className="split">
                <div className="b">
                  <h4>Mauvais signe</h4>
                  <p>
                    2 → 2 → 2 → 1 → impossible. Ou une deuxième rep lente, tu balances, tu cambres,
                    l’amplitude change.
                  </p>
                </div>
                <div className="a">
                  <h4>Bon signe</h4>
                  <p>
                    Tu termines chaque mini-série avec la sensation que tu aurais pu continuer
                    facilement.
                  </p>
                </div>
              </div>
            </Sec>

            <Sec id="s31" num="31" title="Le GTG doit respecter la récupération">
              <p>
                Même si chaque série est facile, le volume quotidien peut devenir énorme : 3 reps sur
                10 passages donnent 30 reps, très facile ; 3 reps sur 30 passages donnent 90 reps, ce
                n’est plus anodin. Il faut regarder le volume total quotidien, le volume hebdomadaire
                et les autres entraînements. Comme tu fais déjà des séances classiques, évite d’ajouter
                brutalement un énorme GTG par-dessus.
              </p>
            </Sec>

            <Sec id="s32" num="32" title="Le piège du « je ne vais pas à l’échec, donc j’en fais énormément »">
              <p>
                C’est faux. Ne pas aller à l’échec diminue la fatigue par série, mais ne la supprime
                pas. Si tu fais suffisamment de séries, la fatigue cumulée peut devenir importante —
                un programme doit prendre en compte le volume total.
              </p>
            </Sec>

            <Sec id="s33" num="33" title="Ton cas concret">
              <p>
                Avec un maximum de 9 et un entraînement en 4 × 5, je verrais ton GTG comme un
                complément, pas comme un remplacement. Conceptuellement : 2 tractions le matin, 2 en
                fin de matinée, 2 en début d’après-midi, 2 en milieu d’après-midi, 2 le soir — 10
                répétitions supplémentaires. Tu peux monter progressivement vers 2–3 reps par passage
                si cela ne dégrade pas ton entraînement normal.
              </p>
            </Sec>

            <Sec id="s34" num="34" title="Et le lest dans ton cas ?">
              <p>
                Là, sois plus conservateur : un GTG principal de 2–3 reps au poids du corps, avec
                éventuellement quelques séries séparées de 1–2 reps lestées légères. Pas besoin de
                transformer chaque passage GTG en traction lestée — ton objectif n’est pas seulement
                de déplacer davantage de poids, mais de devenir meilleur aux tractions au poids du
                corps.
              </p>
            </Sec>

            <Sec id="s35" num="35" title="Le meilleur indicateur : ton maximum">
              <p>
                Teste périodiquement ton maximum — semaine 0 : 9 — puis entraîne-toi, en évitant de
                tester tous les jours. Ce qui t’intéresse, c’est l’évolution de ton maximum propre au
                fil des semaines.
              </p>
            </Sec>

            <Sec id="s36" num="36" title="Pourquoi ne pas tester tous les jours ?">
              <p>
                Le test maximal est lui-même un entraînement très fatigant. Aller à l’échec tous les
                jours entraîne surtout ta capacité à te fatiguer, sans donner à ton corps les
                conditions optimales pour progresser. Le travail submaximal permet d’accumuler
                davantage de répétitions de qualité sans payer constamment le coût de l’échec.
              </p>
            </Sec>

            <Sec id="s37" num="37" title="La grande différence entre GTG et ton 4×5">
              <p>
                Ton 4×5 est une vraie séance structurée, avec un volume concentré et une fatigue
                progressive. Le GTG, réparti en petits passages, est une distribution du volume. Il
                ne faut pas forcément considérer l’un comme « meilleur » que l’autre : ils produisent
                des stimuli différents.
              </p>
            </Sec>

            <Sec id="s38" num="38" title="Le GTG est surtout un outil d’optimisation">
              <div className="mode-grid">
                <div>
                  <h4>Classique</h4>
                  <MiniBar stimulus={60} fatigue={40} />
                </div>
                <div>
                  <h4>GTG</h4>
                  <MiniBar stimulus={38} fatigue={8} />
                </div>
                <div>
                  <h4>Lourd</h4>
                  <MiniBar stimulus={55} fatigue={45} />
                </div>
                <div>
                  <h4>Test max</h4>
                  <MiniBar stimulus={65} fatigue={65} />
                </div>
              </div>
              <p>Un programme intelligent peut utiliser les quatre.</p>
            </Sec>

            <Sec id="s39" num="39" title="Le concept central à retenir">
              <p style={{ fontStyle: 'italic', color: 'var(--gtg-ink)', fontSize: '1.1rem' }}>
                Le GTG cherche à transformer un mouvement en compétence très bien maîtrisée grâce à
                une répétition fréquente, submaximale et de haute qualité. Le but n’est pas de te
                détruire, le but est de rendre le mouvement de plus en plus facile à produire.
              </p>
            </Sec>

            <Sec id="s40" num="40" title="Alors, GTG lesté : oui ou non ?">
              <p>
                <strong>Tractions</strong> — oui, potentiellement, en complément : poids du corps pour
                la spécificité et l’endurance, lest pour la force maximale. <strong>Pompes</strong> —
                même logique, mais le lest est moins indispensable pour juste augmenter le nombre.{' '}
                <strong>Dips</strong> — le lest est très intéressant pour la force, mais surveille la
                fatigue articulaire. <strong>Mouvements techniques</strong> — le lest est généralement
                moins intéressant, priorité à la qualité. <strong>Mouvements explosifs</strong> — le
                lest doit être utilisé avec prudence, une charge trop élevée peut altérer la vitesse.
              </p>
            </Sec>

            <Sec id="s41" num="41" title="La conclusion pour toi">
              <p>
                Avec un maximum de 9 et un 4 × 5 comme travail classique, je ne chercherais pas à
                faire un GTG de 5 reps. Commence plutôt autour de 2–3 tractions par passage, puis
                observe si ton entraînement normal reste aussi bon. Si tu veux introduire du lest : GTG
                au poids du corps en base, tractions lestées en complément de force — pas un GTG
                entièrement lesté.
              </p>
              <div className="flow">
                <div>Reps au poids du corps → qualité de pratique</div>
                <div>→ faible fatigue → meilleure maîtrise du mouvement</div>
                <div>Travail lesté → force maximale</div>
                <div>Séries classiques → tolérance aux séries longues</div>
                <div className="goal">→ objectif : dépasser 9 répétitions</div>
              </div>
            </Sec>

            <ChapterDivider
              num="V"
              title="La science"
              subtitle="Ce qui est démontré, ce qui est extrapolé"
            />

            <Sec id="s42" num="42" title="Ce que la science permet réellement de conclure">
              <div className="split">
                <div className="a">
                  <h4>Bien démontré</h4>
                  <p>
                    L’entraînement de résistance améliore la force ; les charges élevées sont
                    efficaces pour la force max ; l’échec n’est pas nécessaire pour progresser ;
                    l’hypertrophie tolère une large gamme de charges ; la fréquence, le volume et la
                    spécificité comptent.
                  </p>
                </div>
                <div className="b">
                  <h4>Moins démontré</h4>
                  <p>
                    Que le GTG plusieurs fois par jour bat une séance classique ; que le GTG lesté bat
                    le GTG classique ; que 2 reps soit « scientifiquement optimal » pour un max de 9.
                  </p>
                </div>
              </div>
              <p>
                Ces dernières propositions sont des applications pratiques du raisonnement issu de la
                littérature, pas des constantes biologiques universelles. Le lest peut très
                probablement compléter le GTG en apportant un stimulus de force que le GTG très léger
                ne fournit pas autant — mais il ne faut pas confondre « ajouter une qualité
                d’entraînement » avec « rendre toute la méthode automatiquement meilleure ».
              </p>
            </Sec>

            <footer className="proto-footer" id="sources">
              <h3 className="mono">SOURCES</h3>
              <ol>
                <li>
                  <em>Strength and Hypertrophy Adaptations Between Low- vs. High-Load Resistance Training</em>{' '}
                  — Schoenfeld et al., 2017
                </li>
                <li>
                  <em>Muscular adaptations in low- versus high-load resistance training: A meta-analysis</em>{' '}
                  — Schoenfeld et al., 2016
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
              </ol>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}
