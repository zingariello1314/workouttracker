/**
 * Textes courts pour la fiche détail grade exercice.
 */

export const EXERCISE_GRADE_DESCRIPTIONS = {
  pullups_strict:
    'Tractions en suspension, prise pronation ou neutre, sans élan excessif. Mesure la force de tirage verticale et l’endurance du haut du dos / biceps.',
  pullups_australian:
    'Traction horizontale (rowing au poids du corps). Recrute dos moyen, rhombes et biceps avec un angle plus accessible que la barre fixe.',
  dips:
    'Poussée sur barres parallèles ou banc. Travaille triceps, bas de poitrine et deltoïdes antérieurs.',
  pushups:
    'Poussée au sol, corps gainé. Inclut les variantes du programme et les séances saisies dans Défis pompes (chaque session compte comme une coche et les reps saisies s’ajoutent au total).',
  muscle_up:
    'Enchaînement traction explosive + transition + dip. Indicateur de puissance en barre fixe.',
  bench_press:
    'Développé couché à la barre ou haltères. Référence force poitrine / triceps ; la charge max et le volume cumulé alimentent le grade.',
  barbell_squat:
    'Squat à la barre. Force globale jambe ; le ratio charge ÷ poids de corps est privilégié quand il est connu.',
  deadlift:
    'Soulevé de terre. Chaîne postérieure ; même logique de charge relative au poids.',
  overhead_press:
    'Développé militaire debout. Force d’épaules et stabilité du tronc.',
  dumbbell_curl:
    'Flexion biceps aux haltères. Grade basé sur la charge max par bras (série la plus lourde).',
  hammer_curl:
    'Curl prise neutre (marteau). Brachial et avant-bras.',
  bodyweight_squat:
    'Squat au poids du corps, amplitude contrôlée. Endurance et force relative des jambes.',
  crunches:
    'Flexion du tronc (crunchs / relevés). Volume en reps sur une série ou sur la journée.',
  gainage_static:
    'Maintien isométrique (planche classique). Durée max et temps cumulé comptent.',
  plank_straight_arm:
    'Planche bras tendus. Endurance anti-extension du tronc.',
  side_plank:
    'Gainage latéral. Stabilité obliques et hanche.',
  wall_sit:
    'Chaise murale isométrique. Endurance quadriceps.'
};

export function exerciseGradeDescription(benchmarkKey) {
  return EXERCISE_GRADE_DESCRIPTIONS[benchmarkKey] || null;
}
