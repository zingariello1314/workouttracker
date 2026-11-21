/**
 * Découvertes structurelles programme (Mission 7–8).
 * Raisonnement avant rédaction : composition, redistribution, complémentarité.
 */

import {
  buildProgramSessionGraph,
  compareSessionPairComposition,
  describeFamilyMuscleProfile,
  extractSessionTemplates
} from './sessionStructureGraph';
import {
  adherenceVectorFromAssessment,
  contextualizeOmissionsAcrossDays,
  describeOmissionRecurrence
} from './multidimensionalAdherence';

function voiceNature(voiceKey) {
  if (voiceKey === 'today' || voiceKey === 'week') return 'now';
  if (voiceKey === 'month' || voiceKey === 'quarter') return 'trajectory';
  return 'journey';
}

function displayMove(key) {
  if (!key) return '?';
  if (key.startsWith('name:')) return key.slice(5);
  return key.replace(/^id:/, '#');
}

function certaintyPhrase(certainty) {
  if (certainty === 'high') return 'fortement apparentées';
  if (certainty === 'medium') return 'apparentées';
  return 'possiblement liées';
}

/**
 * Construit un raisonnement développé pour une paire de séances.
 */
export function reasonAboutSessionFamily(composition, rel, { voiceKey = 'week' } = {}) {
  if (!composition || !rel) return null;
  const { left, right, sharedMoves, onlyLeft, onlyRight, redistribution, sharedVolume, complementarity } =
    composition;
  const sharedCount = sharedMoves?.length || 0;
  const parts = [];

  parts.push(
    `Les créneaux « ${left.name} » et « ${right.name} » sont ${certaintyPhrase(rel.certainty)} : elles partagent ${sharedCount} mouvement${sharedCount > 1 ? 's' : ''} documenté${sharedCount > 1 ? 's' : ''} sur un socle commun.`
  );

  if (complementarity === 'socle_commun_avec_variantes') {
    const leftOnly = onlyLeft.slice(0, 3).map(displayMove);
    const rightOnly = onlyRight.slice(0, 3).map(displayMove);
    parts.push(
      [
        leftOnly.length
          ? `« ${left.name} » ajoute ${leftOnly.join(', ')}${onlyLeft.length > 3 ? '…' : ''}`
          : null,
        rightOnly.length
          ? `« ${right.name} » ajoute ${rightOnly.join(', ')}${onlyRight.length > 3 ? '…' : ''}`
          : null
      ]
        .filter(Boolean)
        .join(' ; ') + '.'
    );
  }

  if (left.plannedReps > 0 || right.plannedReps > 0) {
    parts.push(
      `Le volume prescrit diffère : ${left.plannedReps} répétitions prévues sur « ${left.name} » contre ${right.plannedReps} sur « ${right.name} » (${left.plannedSets || '?'} vs ${right.plannedSets || '?'} séries).`
    );
  }

  if (redistribution?.length) {
    const examples = redistribution.slice(0, 3).map((r) => {
      if (r.leftReps > 0 && r.rightReps > 0 && r.leftReps !== r.rightReps) {
        return `${r.move} (${r.leftSeries || r.leftReps + ' reps'} → ${r.rightSeries || r.rightReps + ' reps'})`;
      }
      if (r.leftReps > 0 && !r.rightReps) return `${r.move} présent seulement sur « ${left.name} »`;
      if (r.rightReps > 0 && !r.leftReps) return `${r.move} présent seulement sur « ${right.name} »`;
      return null;
    }).filter(Boolean);
    if (examples.length) {
      parts.push(
        `Sur le socle commun, la prescription n'est pas identique : ${examples.join(' ; ')}. Les deux séances conservent une structure apparentée tout en redistribuant le travail prévu.`
      );
    }
  }

  if (sharedVolume && (sharedVolume.left || sharedVolume.right) && sharedCount >= 2) {
    const sum = sharedVolume.left + sharedVolume.right;
    if (sum > 0) {
      const shareLeft = Math.round((sharedVolume.left / sum) * 1000) / 10;
      parts.push(
        `Sur les mouvements communs seuls, le volume prescrit se répartit environ ${shareLeft} % / ${Math.round((1000 - shareLeft * 10) / 10)} % entre les deux créneaux.`
      );
    }
  }

  parts.push(
    voiceKey === 'today' || voiceKey === 'week'
      ? `Cette lecture décrit la structure programmée actuelle, pas encore sa réalisation sur la période.`
      : `Sans versions historiques documentées, on ne peut pas affirmer que cette organisation était déjà celle des phases antérieures.`
  );

  const title =
    complementarity === 'presque_identiques'
      ? `Deux séances du programme sont quasi interchangeables`
      : `Deux séances apparentées redistribuent un socle commun`;

  return {
    title,
    body: parts.filter(Boolean).join(' '),
    observedValues: [
      { id: 'sharedMoves', value: sharedCount, unit: 'count' },
      { id: 'plannedRepsLeft', value: left.plannedReps, unit: 'reps' },
      { id: 'plannedRepsRight', value: right.plannedReps, unit: 'reps' },
      { id: 'onlyLeft', value: onlyLeft.length, unit: 'count' },
      { id: 'onlyRight', value: onlyRight.length, unit: 'count' },
      {
        id: 'redistributions',
        value: redistribution?.length || 0,
        unit: 'count'
      }
    ]
  };
}

/**
 * Vue d’ensemble de toutes les familles (pas seulement la première paire).
 */
export function reasonAboutProgramFamilies(graph, templatesByDay) {
  const multi = (graph.families || []).filter((f) => f.size >= 2);
  if (!multi.length) return null;
  const familyProfiles = multi.map((f) => {
    const tpls = f.members.map((d) => templatesByDay.get(d)).filter(Boolean);
    const profile = describeFamilyMuscleProfile(tpls);
    const slotLabels = f.members.map((d) => templatesByDay.get(d)?.name || d);
    return {
      familyId: f.familyId,
      members: f.members,
      size: f.size,
      slotLabels,
      profile,
      // Intitulés libres = repères secondaires uniquement
      prose: profile.prose
    };
  });
  const lines = familyProfiles.map((row, index) => {
    const slots = row.slotLabels.join(' / ');
    return `famille ${index + 1} (${row.prose} ; créneaux repères « ${slots} »)`;
  });
  return {
    title: `Ton programme s'organise en ${multi.length} famille${multi.length > 1 ? 's' : ''} de séances apparentées`,
    body: [
      `Le contenu réel des exercices — métadonnées musculaires de la banque, pas les intitulés libres des séances — fait apparaître ${multi.length} famille${multi.length > 1 ? 's' : ''} : ${lines.join(' ; ')}.`,
      `Chaque famille partage un socle de mouvements, avec des variantes de volume ou de composition d'un créneau à l'autre.`,
      `En pratique, une variation de répétitions sur un mouvement commun peut venir du passage entre deux variantes de la même famille, pas d'un changement de capacité.`,
      `Les lectures d'adhérence, de reprise ou de progression doivent donc comparer des créneaux compatibles avant de conclure.`,
      `Ressemblance ≠ identité : les volumes et les exercices exclusifs distinguent les variantes.`
    ].join(' '),
    familyCount: multi.length,
    families: multi,
    familyProfiles
  };
}

/**
 * @returns {object[]} découvertes prêtes pour discovery()
 */
export function composeStructuralProgramDiscoveries({
  activeProgram = null,
  voiceKey = 'week',
  assessments = [],
  window = null
} = {}) {
  const out = [];
  const nature = voiceNature(voiceKey);
  const graph = buildProgramSessionGraph(activeProgram);
  const templates = extractSessionTemplates(activeProgram);
  const templatesByDay = new Map(templates.map((t) => [t.dayKey, t]));

  if (graph.available && graph.families.some((f) => f.size >= 2)) {
    const overview = reasonAboutProgramFamilies(graph, templatesByDay);
    const multiFamilies = graph.families.filter((f) => f.size >= 2);

    // Carte d’ensemble si plusieurs familles — une seule
    if (overview && overview.familyCount >= 2) {
      out.push({
        kind: 'disc_session_family_structure',
        nature: voiceKey === 'today' ? 'trajectory' : nature,
        family: 'program_structure',
        title: overview.title,
        body: overview.body,
        evidence: overview.families.map((f) => f.members.join('+')).join(' · '),
        weights: {
          importance: 0.93,
          reliability: 0.9,
          novelty: 0.91,
          fit: voiceKey === 'week' || voiceKey === 'month' || voiceKey === 'today' ? 1 : 0.86
        },
        metrics: {
          producer: 'sessionStructureGraph',
          familyCount: overview.familyCount,
          families: overview.families,
          windowStart: window?.start || null,
          windowEnd: window?.end || null,
          population: 'programmed_structure',
          observedValues: [
            { id: 'familyCount', value: overview.familyCount, unit: 'count' },
            {
              id: 'relatedSlots',
              value: overview.families.reduce((s, f) => s + f.size, 0),
              unit: 'count'
            }
          ],
          conclusionKey: `session_families_overview|${overview.familyCount}`,
          descriptiveConsequences: [
            'La pratique se lit mieux par familles de séances que par jours isolés'
          ],
          followUpIndicators: ['réalisation par famille', 'omissions concentrées sur une variante']
        }
      });
    }

    // Une carte développée : la famille au plus grand delta de volume (ou la première)
    const rankedPairs = multiFamilies
      .map((family) => {
        const rel = graph.relations.find(
          (r) =>
            family.members.includes(r.left.dayKey) &&
            family.members.includes(r.right.dayKey) &&
            (r.type === 'similar_session' || r.type === 'session_variant')
        );
        if (!rel) return null;
        const leftTpl = templatesByDay.get(rel.left.dayKey);
        const rightTpl = templatesByDay.get(rel.right.dayKey);
        const composition = compareSessionPairComposition(leftTpl, rightTpl);
        const reasoned = reasonAboutSessionFamily(composition, rel, { voiceKey });
        if (!reasoned) return null;
        const delta = Math.abs((composition?.left?.plannedReps || 0) - (composition?.right?.plannedReps || 0));
        return { family, rel, composition, reasoned, delta };
      })
      .filter(Boolean)
      .sort((a, b) => b.delta - a.delta || b.reasoned.observedValues[0].value - a.reasoned.observedValues[0].value);

    const pick = rankedPairs[0];
    // Si overview déjà publié et multi-familles : la paire devient approfondissement (nature journey) seulement sur week/month
    // Sinon (une seule famille) : c’est LA carte principale développée
    if (pick && (overview?.familyCount === 1 || !overview || voiceKey === 'week' || voiceKey === 'month')) {
      const { family, rel, composition, reasoned } = pick;
      // Éviter deux cartes quasi identiques : si overview mono-famille, une seule carte = développée
      if (overview?.familyCount === 1) out.length = 0;
      else if (overview?.familyCount >= 2 && voiceKey !== 'week' && voiceKey !== 'month') {
        // horizons longs : garder l’overview, pas la micro-paire
      } else if (overview?.familyCount >= 2) {
        // week/month : overview + une paire illustrant la redistribution
      }
      if (!(overview?.familyCount >= 2 && voiceKey !== 'week' && voiceKey !== 'month' && voiceKey !== 'today')) {
        out.push({
          kind: overview?.familyCount >= 2 ? 'disc_session_family_variant' : 'disc_session_family_structure',
          nature: voiceKey === 'today' ? 'trajectory' : nature,
          family: 'program_structure',
          title: reasoned.title,
          body: reasoned.body,
          evidence: `${rel.left.dayKey}/${rel.right.dayKey} · ${composition?.complementarity || rel.type}`,
          weights: {
            importance: overview?.familyCount >= 2 ? 0.88 : 0.92,
            reliability: 0.9,
            novelty: 0.89,
            fit: voiceKey === 'week' || voiceKey === 'month' ? 1 : 0.84
          },
          metrics: {
            producer: 'sessionStructureGraph',
            relationType: rel.type,
            certainty: rel.certainty,
            familyId: family.familyId,
            familyMembers: family.members,
            composition,
            sharedMoves: composition?.sharedMoves || rel.proof?.sharedMoves,
            volumeDelta: rel.proof?.volumeDelta,
            windowStart: window?.start || null,
            windowEnd: window?.end || null,
            population: 'programmed_structure',
            documentaryOnly: false,
            observedValues: reasoned.observedValues,
            conclusionKey: `session_family|${family.familyId}|${rel.left.dayKey}|${rel.right.dayKey}`,
            descriptiveConsequences: [
              'Deux variantes d’une même famille ne doivent pas être lues comme deux programmes indépendants'
            ],
            followUpIndicators: ['adhérence par variante', 'volume réalisé sur le socle commun']
          }
        });
      }
    }
  }

  // Adhérence multidimensionnelle
  const callable = (assessments || []).filter((a) => a && !a.abstained);
  const latest = callable[callable.length - 1] || null;
  if (latest) {
    const vector = adherenceVectorFromAssessment(latest);
    if (!vector.abstained && vector.pattern?.id === 'targeted_omission') {
      const reps = vector.dimensions.reps;
      const groups = vector.dimensions.muscleGroupsFullyCovered;
      const omissionCtx = contextualizeOmissionsAcrossDays(callable);
      const groupRow = omissionCtx.byGroup?.find((r) => r.group === vector.pattern.group) || null;
      const recurring = groupRow && groupRow.count >= 2 ? groupRow : null;
      const conservedNow = (latest.muscleCoverage || [])
        .filter((g) => g.status === 'completed' && g.group !== vector.pattern.group)
        .map((g) => g.group);
      const bodyParts = [vector.conclusion];
      if (groupRow && omissionCtx.opportunities >= 2) {
        bodyParts.push(describeOmissionRecurrence(groupRow, omissionCtx.opportunities, conservedNow));
        if (groupRow.recurrence === 'recurrent') {
          bodyParts.push('La couverture effective du cycle s’écarte alors de la composition prévue.');
        }
      } else {
        bodyParts.push(
          `Une seule séance comparable documentée : l'omission de ${vector.pattern.group} ne peut pas encore être qualifiée de récurrente ou d'exceptionnelle.${
            conservedNow.length ? ` Composantes conservées : ${conservedNow.slice(0, 5).join(', ')}.` : ''
          }`
        );
      }
      bodyParts.push(omissionCtx.limit);
      out.push({
        kind: 'disc_adherence_targeted_omission',
        nature: voiceKey === 'today' ? 'now' : 'trajectory',
        family: 'program_adherence',
        title: `L'écart au programme se concentre sur ${vector.pattern.group}`,
        body: bodyParts.filter(Boolean).join(' '),
        evidence: `reps ${reps?.numerator}/${reps?.denominator} · groupes ${groups?.numerator}/${groups?.denominator}`,
        weights: { importance: 0.93, reliability: 0.9, novelty: 0.9, fit: 0.96 },
        metrics: {
          producer: 'multidimensionalAdherence',
          pattern: vector.pattern,
          dimensions: vector.dimensions,
          recurring: recurring || null,
          recurrence: groupRow?.recurrence || 'single_observation',
          omissionDates: groupRow?.days || [],
          opportunityDates: omissionCtx.opportunityDates || [],
          opportunities: omissionCtx.opportunities,
          omissionCount: groupRow?.count || 0,
          missingComponent: vector.pattern.group,
          conservedComponents: conservedNow,
          date: latest.date,
          observedValues: [
            { id: 'repsAdherence', value: reps?.value, unit: 'ratio' },
            { id: 'groupsFullyCovered', value: groups?.value, unit: 'ratio' },
            {
              id: 'omittedGroupPlanned',
              value: vector.dimensions.omissionConcentration?.byGroup?.[0]?.planned,
              unit: 'reps'
            }
          ],
          comparisonMethod: 'multidimensional_adherence_vector',
          conclusionKey: `adherence_targeted|${latest.date}|${vector.pattern.group}`,
          descriptiveConsequences: [
            'La couverture effective du programme diverge de sa composition prévue sur une composante ciblée'
          ],
          conditionalConsequences: recurring?.count >= 3
            ? ['Si la récurrence se maintient, la répartition réelle du cycle s’écarte durablement du plan']
            : [],
          followUpIndicators: ['présence de la composante sur les prochaines séances de la famille']
        }
      });
    }
  }

  const omissionCtx = contextualizeOmissionsAcrossDays(callable);
  if (omissionCtx.recurring?.length) {
    const top = [...omissionCtx.recurring].sort((a, b) => b.count - a.count)[0];
    if (!out.some((d) => d.kind === 'disc_adherence_targeted_omission' && d.metrics?.pattern?.group === top.group)) {
      out.push({
        kind: 'disc_adherence_recurring_omission',
        nature: 'trajectory',
        family: 'program_adherence',
        title: `Omission récurrente documentée : ${top.group}`,
        body: [
          describeOmissionRecurrence(top, omissionCtx.opportunities),
          top.count >= 3
            ? `Cette composante absente modifie la couverture effective du programme par rapport à sa composition prévue.`
            : `La répétition reste limitée : les données ne permettent pas encore d'y voir une modification durable.`,
          omissionCtx.limit
        ].join(' '),
        evidence: `${top.count}/${omissionCtx.opportunities} · ${(top.days || []).join(',')}`,
        weights: { importance: 0.92, reliability: 0.88, novelty: 0.9, fit: 0.93 },
        metrics: {
          producer: 'multidimensionalAdherence',
          recurring: top,
          recurrence: top.recurrence,
          missingComponent: top.group,
          conservedComponents: (top.conservedComponents || []).map((c) => c.group),
          opportunities: omissionCtx.opportunities,
          opportunityDates: omissionCtx.opportunityDates || [],
          dates: top.days,
          observedValues: [
            { id: 'omissionCount', value: top.count, unit: 'sessions' },
            { id: 'opportunities', value: omissionCtx.opportunities, unit: 'sessions' }
          ],
          conclusionKey: `adherence_recurring|${top.group}|${top.count}`,
          descriptiveConsequences: [
            'La répartition effective du cycle s’écarte de la composition prévue'
          ],
          followUpIndicators: [`réalisation de ${top.group} sur les prochaines séances comparables`]
        }
      });
    }
  }

  return { discoveries: out, graph, omissionCtx };
}
