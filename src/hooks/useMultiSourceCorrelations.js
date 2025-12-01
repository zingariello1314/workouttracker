/**
 * useMultiSourceCorrelations.js
 *
 * Hook React pour analyser les patterns et corrélations multi-sources
 * à partir de toutes les analyses déjà calculées :
 * - Programme / Entraînement (programAnalysis)
 * - Justifications (justificationAnalysis)
 * - Garmin (garminAnalysis, garminCorrelations)
 * - Nutrition (nutritionAnalysis, nutritionCorrelations)
 * - Body Tracking (bodyTrackingAnalysis, bodyTrackingCorrelations)
 * - Session Feedbacks (sessionFeedbackAnalysis, sessionFeedbackCorrelations)
 *
 * Objectif : détecter des patterns "croisés" à haute valeur ajoutée
 * sans recalculer de lourdes statistiques, en se basant uniquement
 * sur les résultats déjà mémorisés dans les autres hooks.
 *
 * Optimisations :
 * - Utilise useMemo pour éviter les recalculs
 * - Ne fait aucun accès IndexedDB directement
 * - Ne crée aucun nouveau champ persistant (purement dérivé)
 */

import { useMemo } from 'react';

export function useMultiSourceCorrelations({
  programAnalysis,
  justificationAnalysis,
  garminAnalysis,
  garminCorrelations,
  nutritionAnalysis,
  nutritionCorrelations,
  bodyTrackingAnalysis,
  bodyTrackingCorrelations,
  sessionFeedbackAnalysis,
  sessionFeedbackCorrelations,
}) {
  return useMemo(() => {
    const riskPatterns = [];
    const favorablePatterns = [];
    const neutralPatterns = [];

    // Sécurité : si aucune analyse n'est disponible, retourner résultat vide
    const hasAnyAnalysis =
      programAnalysis ||
      justificationAnalysis ||
      garminAnalysis ||
      nutritionAnalysis ||
      bodyTrackingAnalysis ||
      sessionFeedbackAnalysis;

    if (!hasAnyAnalysis) {
      return {
        riskPatterns,
        favorablePatterns,
        neutralPatterns,
      };
    }

    // Pattern 1 : Surcharge / mauvaise récupération
    if (
      garminAnalysis?.bodyBattery &&
      garminAnalysis.bodyBattery.lowDaysPercent > 30 &&
      programAnalysis?.frequency?.current &&
      programAnalysis.frequency.current > (programAnalysis.frequency.optimal || 4)
    ) {
      riskPatterns.push({
        id: 'multi_overtraining_recovery',
        severity: 'high',
        sources: ['garmin', 'workout'],
        label: 'Charge élevée avec récupération insuffisante',
        description:
          'De nombreux jours avec Body Battery bas combinés à une fréquence d’entraînement supérieure à l’optimal. Risque de surmenage.',
        recommendation:
          'Réduire légèrement la fréquence et l’intensité, augmenter les jours de repos et surveiller le sommeil/stress.',
        data: {
          lowBodyBatteryPercent: garminAnalysis.bodyBattery.lowDaysPercent,
          sessionsPerWeek: programAnalysis.frequency.current,
          optimalFrequency: programAnalysis.frequency.optimal,
        },
      });
    }

    // Pattern 2 : Justifications "Maladie" + mauvais sommeil / stress haut
    if (
      justificationAnalysis?.byReason?.maladie > 0 &&
      (garminAnalysis?.sleep?.avgDuration !== null ||
        garminAnalysis?.stress?.stats?.avg !== null)
    ) {
      const illnessDays = justificationAnalysis.byReason.maladie;
      const avgSleep = garminAnalysis?.sleep?.avgDuration ?? null;
      const avgStress = garminAnalysis?.stress?.stats?.avg ?? null;

      if (
        (avgSleep !== null && avgSleep < 6.5) ||
        (avgStress !== null && avgStress > 50)
      ) {
        riskPatterns.push({
          id: 'multi_illness_sleep_stress',
          severity: 'medium',
          sources: ['justification', 'garmin'],
          label: 'Maladies fréquentes + mauvais sommeil / stress élevé',
          description:
            'Des jours justifiés pour maladie coïncident avec un sommeil insuffisant ou un stress élevé. Cela peut indiquer une récupération globale insuffisante.',
          recommendation:
            'Améliorer la qualité du sommeil, réduire le stress et ajuster la charge d’entraînement pendant les périodes sensibles.',
          data: {
            illnessDays,
            avgSleep,
            avgStress,
          },
        });
      }
    }

    // Pattern 3 : Déficit calorique important + baisse de poids / masse musculaire
    if (
      nutritionCorrelations?.deficitWorkout?.intensityDifference !== null &&
      bodyTrackingAnalysis &&
      bodyTrackingAnalysis.weight &&
      bodyTrackingAnalysis.weight.variation &&
      bodyTrackingAnalysis.weight.variation.percentChange < -2
    ) {
      riskPatterns.push({
        id: 'multi_deficit_weight_loss',
        severity: 'medium',
        sources: ['nutrition', 'bodyTracking'],
        label: 'Déficit calorique + perte de poids notable',
        description:
          'Un déficit calorique fréquent combiné à une perte de poids significative peut indiquer un risque de sous‑alimentation.',
        recommendation:
          'Réduire légèrement le déficit calorique, surveiller l\'évolution du poids et de la masse musculaire, et adapter l\'entraînement si nécessaire.',
        data: {
          intensityDifference: nutritionCorrelations.deficitWorkout.intensityDifference,
          weightVariation: bodyTrackingAnalysis.weight.variation,
        },
      });
    }

    // Pré-calcul sécurisé du ressenti moyen (peut être null si pas de données)
    const feelingAvgSafe =
      sessionFeedbackAnalysis?.evaluations?.ressenti?.avg ?? null;

    // Pré-calcul sécurisé de la conformité nutritionnelle globale (peut être null si pas de données)
    const nutritionComplianceSafe =
      nutritionAnalysis?.programCompliance?.overall ?? null;

    // Pattern 4 : Masse grasse élevée + faible conformité nutrition
    if (
      bodyTrackingAnalysis &&
      bodyTrackingAnalysis.composition &&
      bodyTrackingAnalysis.composition.bodyFat &&
      bodyTrackingAnalysis.composition.bodyFat.avg !== null &&
      bodyTrackingAnalysis.composition.bodyFat.avg > 25 &&
      nutritionComplianceSafe !== null &&
      nutritionComplianceSafe < 60
    ) {
      riskPatterns.push({
        id: 'multi_bodyfat_low_nutrition_compliance',
        severity: 'medium',
        sources: ['bodyTracking', 'nutrition'],
        label: 'Masse grasse élevée + faible conformité nutrition',
        description:
          'Une masse grasse moyenne élevée combinée à une faible conformité nutritionnelle réduit fortement l’efficacité du programme.',
        recommendation:
          'Améliorer progressivement la qualité de la nutrition (calories, macros) pour favoriser une recomposition corporelle positive.',
        data: {
          bodyFatAvg: bodyTrackingAnalysis.composition.bodyFat.avg,
          nutritionCompliance: nutritionComplianceSafe,
        },
      });
    }

    // Pattern 5 : Motivation / ressenti faibles + régularité OK → optimiser l’expérience
    if (
      feelingAvgSafe !== null &&
      feelingAvgSafe < 6 &&
      programAnalysis?.frequency?.current &&
      programAnalysis.frequency.current >= (programAnalysis.frequency.optimal || 3)
    ) {
      neutralPatterns.push({
        id: 'multi_good_adherence_low_feeling',
        severity: 'low',
        sources: ['sessionFeedback', 'workout'],
        label: 'Bonne régularité mais ressenti moyen',
        description:
          'Tu es régulier dans tes séances mais ton ressenti moyen reste faible. Il y a un potentiel d’optimisation de l’expérience.',
        recommendation:
          'Varier les types de séances, ajuster les objectifs à court terme et adapter l’environnement (musique, lieu, horaire).',
        data: {
          avgFeeling: feelingAvgSafe,
          sessionsPerWeek: programAnalysis.frequency.current,
        },
      });
    }

    // Pattern 6 : Alignement positif multi-sources (tout au vert)
    const highWorkoutScore = programAnalysis?.consistency?.score >= 75;
    const goodNutrition =
      nutritionComplianceSafe !== null && nutritionComplianceSafe >= 70;

    // Pré-calculs sécurisés pour Garmin (peuvent être null si pas de données)
    const bodyBatteryAvgSafe =
      garminAnalysis?.bodyBattery?.stats?.avg ?? null;
    const sleepAvgSafe =
      garminAnalysis?.sleep?.avgDuration ?? null;

    const goodRecovery =
      bodyBatteryAvgSafe !== null &&
      bodyBatteryAvgSafe >= 60 &&
      sleepAvgSafe !== null &&
      sleepAvgSafe >= 7;
    const goodFeeling =
      feelingAvgSafe !== null && feelingAvgSafe >= 7;

    if (highWorkoutScore && goodNutrition && goodRecovery && goodFeeling) {
      favorablePatterns.push({
        id: 'multi_all_green',
        severity: 'info',
        sources: ['workout', 'nutrition', 'garmin', 'sessionFeedback'],
        label: 'Excellent alignement global',
        description:
          'Ta régularité, ta nutrition, ta récupération et ton ressenti sont tous bien alignés. Tu es dans une zone optimale pour progresser.',
        recommendation:
          'Continuer sur cette dynamique, en gardant un œil sur les signaux de fatigue pour éviter le surmenage.',
        data: {
          workoutScore: programAnalysis.consistency.score,
          nutritionCompliance: nutritionComplianceSafe,
          bodyBatteryAvg: bodyBatteryAvgSafe,
          sleepAvg: sleepAvgSafe,
          feelingAvg: feelingAvgSafe,
        },
      });
    }

    return {
      riskPatterns,
      favorablePatterns,
      neutralPatterns,
    };
  }, [
    programAnalysis,
    justificationAnalysis,
    garminAnalysis,
    garminCorrelations,
    nutritionAnalysis,
    nutritionCorrelations,
    bodyTrackingAnalysis,
    bodyTrackingCorrelations,
    sessionFeedbackAnalysis,
    sessionFeedbackCorrelations,
  ]);
}


