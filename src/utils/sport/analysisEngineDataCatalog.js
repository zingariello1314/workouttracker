/**
 * Catalogue des sources réellement consommées (ou inspectées) par le pipeline Recap.
 * Chaque entrée pointe vers l’onglet / sous-onglet Momentum où l’utilisateur saisit la donnée.
 * Pas de simulation : les compteurs viennent du snapshot / Garmin / enrichment du run.
 */

function countKeys(obj) {
  return obj && typeof obj === 'object' ? Object.keys(obj).length : 0;
}

function countArray(arr) {
  return Array.isArray(arr) ? arr.length : 0;
}

function statusFromN(n, { okAt = 1, sparseAt = 1 } = {}) {
  if (n == null) return 'not_instrumented';
  if (n >= okAt) return 'ok';
  if (n >= sparseAt && n > 0) return 'sparse';
  if (n > 0) return 'sparse';
  return 'missing';
}

function keysInWindow(mapLike, window) {
  if (!mapLike || typeof mapLike !== 'object') return 0;
  if (!window?.start || !window?.end) return countKeys(mapLike);
  let n = 0;
  for (const key of Object.keys(mapLike)) {
    const m = String(key).match(/(\d{4}-\d{2}-\d{2})/);
    const ymd = m ? m[1] : null;
    if (!ymd) {
      n += 1;
      continue;
    }
    if (ymd >= window.start && ymd <= window.end) n += 1;
  }
  return n;
}

/**
 * @param {object} opts
 * @returns {{ items: object[], byTab: object[], short: object[], totals: object }}
 */
export function buildAnalysisEngineDataCatalog(opts = {}) {
  const {
    snapshot = {},
    enrichment = null,
    garminData = null,
    garminPartial = null,
    window = null,
    assessment = null,
    activeProgram = null,
    programs = [],
    profileQuestionnaireRaw = null
  } = opts;

  const repsKeys = countKeys(snapshot?.reps);
  const checkedKeys = countKeys(snapshot?.checkedExercises);
  const stretchKeys = countKeys(snapshot?.checkedStretches);
  // Les charges vivent dans exerciseWeights / exerciseSetWeights — pas snapshot.weights
  const exerciseWeightsMap = snapshot?.exerciseWeights || {};
  const exerciseSetWeightsMap = snapshot?.exerciseSetWeights || {};
  const weightsKeys =
    countKeys(exerciseWeightsMap) +
    countKeys(exerciseSetWeightsMap) +
    countKeys(snapshot?.weights); // legacy éventuel
  const gtgDays = countKeys(snapshot?.enduranceData?.gtg?.days);
  const endoSessions = countKeys(snapshot?.enduranceData?.sessions);
  const manualWalk = countKeys(snapshot?.enduranceData?.manualDailyWalkByDate);
  const manualSleep = countKeys(snapshot?.manualSleepByDate);
  const progressAll = countArray(snapshot?.progressEntries);
  const weightEntries = (snapshot?.progressEntries || []).filter(
    (e) => e?.type === 'metrics' || e?.type === 'impedance'
  ).length;
  const feedbacks = countKeys(snapshot?.sessionFeedbacks);
  const justifications = countKeys(snapshot?.dayJustifications);
  const circuitsProg = countKeys(snapshot?.circuitProgress);
  const circuitsDef = countKeys(snapshot?.circuitDefinitions);
  const garminDm =
    countKeys(garminPartial?.dailyMetrics) || countKeys(garminData?.dailyMetrics);
  const act = garminData?.activities || {};
  const garminCardio = countArray(act.cardio);
  const garminSwim = countArray(act.swimming);
  const garminJump = countArray(act.jumpRope);
  const garminActivitiesTotal = garminCardio + garminSwim + garminJump;
  const sleepSeries = countArray(enrichment?.sleepDaily);
  const qqRaw = profileQuestionnaireRaw?.answers || profileQuestionnaireRaw;
  const qqAnswers = countKeys(qqRaw && typeof qqRaw === 'object' ? qqRaw : null);
  const programsN = Array.isArray(programs) ? programs.length : 0;
  const hasProgram = Boolean(activeProgram?.schedule || activeProgram?.days);

  const items = [
    {
      id: 'checked_exercises',
      label: 'Exercices cochés (séances force)',
      tab: 'Sport',
      subtab: 'Aujourd’hui · Historique',
      originPath: 'snapshot.checkedExercises',
      usedBy: ['assessment', 'enrichment', 'discoveries', 'adaptive'],
      status: statusFromN(checkedKeys),
      n: checkedKeys,
      nInPeriod: keysInWindow(snapshot?.checkedExercises, window),
      fields: ['clé date_exerciceId', 'bool'],
      detail: 'Cases cochées après une série / exercice réalisé.'
    },
    {
      id: 'reps',
      label: 'Répétitions & perfs saisies',
      tab: 'Sport',
      subtab: 'Aujourd’hui · Historique',
      originPath: 'snapshot.reps',
      usedBy: ['assessment', 'enrichment', 'progression', 'adaptive'],
      status: statusFromN(repsKeys),
      n: repsKeys,
      nInPeriod: keysInWindow(snapshot?.reps, window),
      fields: ['clé date_exerciceId', 'reps / hold'],
      detail: 'Valeurs de performance liées aux exercices cochés.'
    },
    {
      id: 'weights',
      label: 'Charges (kg) par exercice',
      tab: 'Sport',
      subtab: 'Aujourd’hui · Historique',
      originPath: 'snapshot.exerciseWeights (+ exerciseSetWeights)',
      usedBy: ['assessment', 'benchmark', 'progression', 'tonnage'],
      status: statusFromN(weightsKeys),
      n: weightsKeys,
      nInPeriod:
        keysInWindow(exerciseWeightsMap, window) + keysInWindow(exerciseSetWeightsMap, window),
      fields: ['exerciseWeights[date_exId]', 'exerciseSetWeights[date_exId][]'],
      detail: `${countKeys(exerciseWeightsMap)} charges simples · ${countKeys(exerciseSetWeightsMap)} profils par série.`,
      absenceKind: weightsKeys === 0 ? 'user_empty_or_bodyweight' : null,
      fixHint:
        weightsKeys === 0
          ? 'Saisir des kg sur les séries (Aujourd’hui). Si tu ne fais que du poids du corps, l’absence est normale.'
          : null
    },
    {
      id: 'stretches',
      label: 'Étirements cochés',
      tab: 'Sport',
      subtab: 'Aujourd’hui · Banque étirements',
      originPath: 'snapshot.checkedStretches',
      usedBy: ['enrichment.stretchZones', 'discoveries mobility'],
      status: statusFromN(stretchKeys),
      n: stretchKeys,
      nInPeriod: keysInWindow(snapshot?.checkedStretches, window),
      fields: ['clé date_stretch', 'bool'],
      detail: 'Mobilité / stretching réalisé.'
    },
    {
      id: 'circuits',
      label: 'Circuits (définitions + progression)',
      tab: 'Sport',
      subtab: 'Banque circuits · Aujourd’hui',
      originPath: 'snapshot.circuitDefinitions + circuitProgress',
      usedBy: ['enrichment.circuits'],
      status: statusFromN(circuitsDef + circuitsProg, { okAt: 1 }),
      n: circuitsDef + circuitsProg,
      fields: ['circuitId', 'progress'],
      detail: `${circuitsDef} définitions · ${circuitsProg} progressions.`
    },
    {
      id: 'active_program',
      label: 'Programme actif (planifié)',
      tab: 'Sport',
      subtab: 'Programmes / Mon programme',
      originPath: 'activeProgram',
      usedBy: ['assessment', 'enrichment.completion', 'coach structure'],
      status: hasProgram ? 'ok' : 'missing',
      n: hasProgram ? 1 : 0,
      fields: ['schedule', 'days', 'exercises'],
      detail: hasProgram
        ? `Programme « ${activeProgram?.name || activeProgram?.id || 'actif'} »`
        : 'Aucun programme avec planning détecté.'
    },
    {
      id: 'programs_library',
      label: 'Bibliothèque de programmes',
      tab: 'Sport',
      subtab: 'Programmes',
      originPath: 'programs[]',
      usedBy: ['enrichment', 'stretch zones', 'coach'],
      status: statusFromN(programsN),
      n: programsN,
      fields: ['id', 'schedule'],
      detail: 'Programmes disponibles pour contexte / étirements planifiés.'
    },
    {
      id: 'completion',
      label: 'Complétion du programme (dérivée)',
      tab: 'Sport',
      subtab: 'Récapitulatif → Analyse (calcul)',
      originPath: 'enrichment.completion',
      usedBy: ['discoveries adherence', 'adaptive'],
      status: enrichment?.completion ? 'ok' : 'sparse',
      n: enrichment?.completion?.activeTrainingDays ?? null,
      fields: ['activeTrainingDays', 'rates'],
      detail: 'Calculé à partir du programme + séances réalisées.'
    },
    {
      id: 'day_of_week',
      label: 'Assiduité par jour de semaine',
      tab: 'Sport',
      subtab: 'Récapitulatif → Analyse (calcul)',
      originPath: 'enrichment.dayOfWeek',
      usedBy: ['discoveries rhythm', 'adaptive'],
      status: (enrichment?.dayOfWeek || []).some((d) => d.plannedDays > 0) ? 'ok' : 'sparse',
      n: (enrichment?.dayOfWeek || []).filter((d) => (d.plannedDays || 0) > 0).length,
      fields: ['plannedDays', 'doneDays'],
      detail: 'Jours planifiés vs réalisés.'
    },
    {
      id: 'session_feedback',
      label: 'Feedback de séance (RPE / ressenti)',
      tab: 'Sport',
      subtab: 'Aujourd’hui · fin de séance / modal feedback',
      originPath: 'snapshot.sessionFeedbacks',
      usedBy: ['enrichment.feedback', 'sleep×RPE', 'span stories'],
      status: statusFromN(feedbacks),
      n: feedbacks,
      nInPeriod: keysInWindow(snapshot?.sessionFeedbacks, window),
      fields: ['date', 'difficulty', 'notes'],
      detail: 'Ressenti après séance (utile aux corrélations effort).',
      absenceKind: feedbacks === 0 ? 'user_empty' : null,
      fixHint:
        feedbacks === 0
          ? 'Remplir le feedback de séance (difficulté RPE) après un workout — sinon sleep×RPE et span effort restent pauvres.'
          : null
    },
    {
      id: 'day_justifications',
      label: 'Justifications de jours manqués',
      tab: 'Sport',
      subtab: 'Aujourd’hui · Calendrier',
      originPath: 'snapshot.dayJustifications',
      usedBy: ['enrichment.justifications'],
      status: statusFromN(justifications),
      n: justifications,
      fields: ['date', 'reason'],
      detail: 'Motifs saisis quand une séance prévue n’a pas eu lieu.'
    },
    {
      id: 'gtg',
      label: 'GTG (Grease the Groove)',
      tab: 'Sport',
      subtab: 'Endurance / GTG',
      originPath: 'snapshot.enduranceData.gtg',
      usedBy: ['adaptive KPIs', 'discoveries gtg'],
      status: statusFromN(gtgDays),
      n: gtgDays,
      fields: ['days', 'config', 'reps'],
      detail: 'Jours avec volume GTG enregistré.'
    },
    {
      id: 'endurance_sessions',
      label: 'Séances endurance (course, etc.)',
      tab: 'Sport',
      subtab: 'Endurance · Historique cardio',
      originPath: 'snapshot.enduranceData.sessions',
      usedBy: ['endurance digest', 'benchmark running'],
      status: statusFromN(endoSessions),
      n: endoSessions,
      fields: ['date', 'type', 'distance'],
      detail: 'Sessions d’endurance stockées côté Momentum.'
    },
    {
      id: 'manual_walk',
      label: 'Marche manuelle (pas / distance)',
      tab: 'Sport',
      subtab: 'Endurance · marche manuelle / Calendrier',
      originPath: 'snapshot.enduranceData.manualDailyWalkByDate',
      usedBy: ['garminPartial merge', 'cross-coach', 'XP pas'],
      status: statusFromN(manualWalk),
      n: manualWalk,
      fields: ['date', 'steps', 'distance'],
      detail: 'Complète Garmin quand les pas sont saisis à la main.',
      absenceKind:
        manualWalk === 0 && garminDm > 0
          ? 'optional_when_garmin'
          : manualWalk === 0
            ? 'user_empty'
            : null,
      fixHint:
        manualWalk === 0 && garminDm > 0
          ? 'Optionnel : Garmin fournit déjà des pas. Saisie manuelle utile seulement les jours sans sync.'
          : manualWalk === 0
            ? 'Saisir la marche dans Endurance / Calendrier, ou synchroniser Garmin.'
            : null
    },
    {
      id: 'manual_sleep',
      label: 'Sommeil saisi manuellement',
      tab: 'Sport',
      subtab: 'Calendrier · éditeur sommeil manuel',
      originPath: 'snapshot.manualSleepByDate',
      usedBy: ['garminPartial merge', 'sleep correlations'],
      status: statusFromN(manualSleep),
      n: manualSleep,
      fields: ['date', 'hours', 'quality'],
      detail: 'Nuits sans montre, saisies dans l’app.',
      absenceKind:
        manualSleep === 0 && (sleepSeries > 0 || garminDm > 0)
          ? 'optional_when_garmin'
          : manualSleep === 0
            ? 'user_empty'
            : null,
      fixHint:
        manualSleep === 0 && (sleepSeries > 0 || garminDm > 0)
          ? 'Optionnel : le sommeil Garmin est déjà présent. Saisie manuelle pour les nuits hors montre.'
          : manualSleep === 0
            ? 'Saisir le sommeil dans le calendrier, ou sync Garmin sommeil.'
            : null
    },
    {
      id: 'body_metrics',
      label: 'Poids, IMC, mensurations',
      tab: 'Sport',
      subtab: 'Suivi corporel / Body tracking',
      originPath: 'snapshot.progressEntries',
      usedBy: ['enrichment.weight', 'discoveries body'],
      status: statusFromN(weightEntries, { okAt: 2, sparseAt: 1 }),
      n: weightEntries,
      fields: ['type metrics|impedance', 'weight', 'date'],
      detail: `${weightEntries} mesures utiles sur ${progressAll} entrées progress.`
    },
    {
      id: 'garmin_daily',
      label: 'Garmin — métriques quotidiennes',
      tab: 'Sport',
      subtab: 'Garmin',
      originPath: 'garmin.dailyMetrics / garminPartial',
      usedBy: ['sleep', 'steps', 'cross-coach', 'discoveries'],
      status: statusFromN(garminDm, { okAt: 8, sparseAt: 1 }),
      n: garminDm,
      fields: ['sleep', 'steps', 'stress', 'bodyBattery', 'hr'],
      detail:
        garminPartial?.status === 'ready'
          ? `Partial prêt · ${garminPartial.daysWithStepsData ?? '—'} j. avec pas`
          : garminDm > 0
            ? 'Bundle Garmin chargé'
            : 'Pas de dailyMetrics Garmin sur ce run'
    },
    {
      id: 'garmin_sleep',
      label: 'Garmin — sommeil (série journalière)',
      tab: 'Sport',
      subtab: 'Garmin → Sommeil',
      originPath: 'enrichment.sleepDaily ← garminPartial',
      usedBy: ['publishSleepCandidates', 'discoveries sleep'],
      status: statusFromN(sleepSeries || garminDm, { okAt: 8, sparseAt: 1 }),
      n: sleepSeries || garminDm,
      fields: ['date', 'duration', 'scores'],
      detail: sleepSeries
        ? `${sleepSeries} nuits dans la série enrichissement`
        : 'Série sommeil non construite / vide'
    },
    {
      id: 'garmin_cardio',
      label: 'Garmin — activités (cardio / natation / corde)',
      tab: 'Sport',
      subtab: 'Garmin → Activités',
      originPath: 'garminData.activities.{cardio,swimming,jumpRope}',
      usedBy: ['running PRs', 'benchmark', 'cardio×sleep'],
      status: statusFromN(garminActivitiesTotal),
      n: garminActivitiesTotal,
      fields: ['activityId', 'type', 'distance', 'pace'],
      detail: `${garminCardio} cardio · ${garminSwim} natation · ${garminJump} corde.`,
      absenceKind:
        garminActivitiesTotal === 0 && garminDm > 0
          ? 'sync_gap_or_empty'
          : garminActivitiesTotal === 0
            ? 'not_synced'
            : null,
      fixHint:
        garminActivitiesTotal === 0 && garminDm > 0
          ? 'Daily metrics OK mais 0 activité typée : relancer une sync Garmin (activités), vérifier que les sorties sont bien importées (pas seulement les pas/sommeil).'
          : garminActivitiesTotal === 0
            ? 'Synchroniser Garmin depuis l’onglet Garmin (plage large).'
            : null
    },
    {
      id: 'profile_quiz',
      label: 'Questionnaire de profil sportif',
      tab: 'Paramètres / Onboarding',
      subtab: 'Questionnaire profil',
      originPath: 'currentUser.profileQuestionnaire',
      usedBy: ['assessment', 'coach structure', 'attendance expectations'],
      status: statusFromN(qqAnswers, { okAt: 3, sparseAt: 1 }),
      n: qqAnswers,
      fields: ['answers.*'],
      detail: qqAnswers
        ? `${qqAnswers} réponses profil disponibles`
        : 'Questionnaire absent ou non branché sur ce run',
      absenceKind: qqAnswers === 0 ? 'not_wired_or_empty' : null,
      fixHint:
        qqAnswers === 0
          ? 'Compléter le questionnaire profil (onboarding / Paramètres). La console doit recevoir currentUser.profileQuestionnaire.'
          : null
    },
    {
      id: 'assessment_bundle',
      label: 'Assessment Recap (agrégat)',
      tab: 'Sport',
      subtab: 'Récapitulatif → Analyse (calcul)',
      originPath: 'computeRecapUserAssessment',
      usedBy: ['adaptive', 'coach'],
      status: assessment ? 'ok' : 'missing',
      n: assessment ? 1 : 0,
      fields: ['kpis', 'insights', 'adherence'],
      detail: 'Couche dérivée : ne remplace pas les sources brutes ci-dessus.'
    },
    {
      id: 'analysis_window',
      label: 'Fenêtre temporelle du run',
      tab: 'Sport',
      subtab: 'Récapitulatif (sélecteur de période)',
      originPath: 'recap window',
      usedBy: ['tout le pipeline'],
      status: window?.start && window?.end ? 'ok' : 'missing',
      n: window?.start && window?.end ? 1 : 0,
      fields: ['start', 'end'],
      detail: window ? `${window.start} → ${window.end}` : 'Fenêtre absente',
      coverage: window ? `${window.start} → ${window.end}` : null
    }
  ];

  const byTabMap = new Map();
  items.forEach((it) => {
    const key = it.tab;
    if (!byTabMap.has(key)) byTabMap.set(key, []);
    byTabMap.get(key).push(it);
  });
  const byTab = [...byTabMap.entries()].map(([tab, list]) => ({
    tab,
    items: list,
    ok: list.filter((i) => i.status === 'ok').length,
    sparse: list.filter((i) => i.status === 'sparse').length,
    missing: list.filter((i) => i.status === 'missing').length
  }));

  const short = items
    .filter((i) => i.id !== 'assessment_bundle')
    .map((i) => ({
      id: i.id,
      label: i.label,
      origin: `${i.tab} › ${i.subtab}`,
      status: i.status,
      n: i.n
    }));

  const totals = {
    sources: items.length,
    ok: items.filter((i) => i.status === 'ok').length,
    sparse: items.filter((i) => i.status === 'sparse').length,
    missing: items.filter((i) => i.status === 'missing').length
  };

  const ABSENCE_KIND_META = {
    false_path: {
      label: 'Fausse alerte (mauvais chemin)',
      severity: 'bug'
    },
    not_wired_or_empty: {
      label: 'Non branché ou non rempli',
      severity: 'action'
    },
    user_empty: {
      label: 'Jamais saisi (utilisateur)',
      severity: 'action'
    },
    user_empty_or_bodyweight: {
      label: 'Pas de charges / poids du corps',
      severity: 'info'
    },
    optional_when_garmin: {
      label: 'Optionnel (Garmin couvre déjà)',
      severity: 'info'
    },
    sync_gap_or_empty: {
      label: 'Trou de sync ou aucune activité',
      severity: 'action'
    },
    not_synced: {
      label: 'Non synchronisé',
      severity: 'action'
    }
  };

  const absences = items
    .filter((i) => i.status === 'missing' || i.status === 'sparse')
    .map((i) => ({
      id: i.id,
      label: i.label,
      status: i.status,
      n: i.n,
      origin: `${i.tab} › ${i.subtab}`,
      originPath: i.originPath,
      absenceKind: i.absenceKind || (i.status === 'sparse' ? 'sparse_coverage' : 'unknown'),
      kindLabel:
        ABSENCE_KIND_META[i.absenceKind]?.label ||
        (i.status === 'sparse' ? 'Couverture faible' : 'À diagnostiquer'),
      severity: ABSENCE_KIND_META[i.absenceKind]?.severity || 'info',
      fixHint: i.fixHint || null,
      usedBy: i.usedBy || []
    }));

  return { items, byTab, short, totals, absences, absenceKindMeta: ABSENCE_KIND_META };
}
