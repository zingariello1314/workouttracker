/**
 * Templates quiz historiques — métadonnées de sélection figées (calibration / non-régression).
 * Toujours inclus dans le pool fusionné ; jamais remplacés par l’inférence banque.
 */

export const QUIZ_LEGACY_EXERCISE_TEMPLATES = [
  { dbKey: 'pompes', group: 'upper', tier: 'classic', quizEquipment: ['bodyweight'], locations: ['home_minimal', 'outdoor', 'home_gym', 'commercial_gym'] },
  { dbKey: 'tractions pronation', group: 'upper', tier: 'classic', quizEquipment: ['pullup_bar', 'bodyweight'], locations: ['commercial_gym', 'home_gym', 'outdoor'] },
  { dbKey: 'tractions australiennes', group: 'upper', tier: 'classic', quizEquipment: ['bodyweight'], locations: ['outdoor', 'home_gym', 'commercial_gym'], needsLowBar: true },
  { dbKey: 'dips', group: 'upper', tier: 'classic', quizEquipment: ['dip_station', 'parallel_bars', 'bodyweight'], locations: ['commercial_gym', 'outdoor', 'home_gym'] },
  { dbKey: 'développé couché', group: 'upper', tier: 'standard', quizEquipment: ['barbell_plates', 'bench'], locations: ['commercial_gym', 'home_gym'] },
  { dbKey: 'rowing barre', group: 'upper', tier: 'standard', quizEquipment: ['barbell_plates'], locations: ['commercial_gym', 'home_gym'] },
  { dbKey: 'rowing haltère', group: 'upper', tier: 'standard', quizEquipment: ['dumbbells', 'bench'], locations: ['commercial_gym', 'home_gym', 'home_minimal'] },
  { dbKey: 'tirage vertical', group: 'upper', tier: 'standard', quizEquipment: ['cable_machine'], locations: ['commercial_gym'] },
  { dbKey: 'développé militaire', group: 'upper', tier: 'standard', quizEquipment: ['barbell_plates', 'dumbbells'], locations: ['commercial_gym', 'home_gym'] },
  { dbKey: 'squat', group: 'lower', tier: 'classic', quizEquipment: ['barbell_plates', 'squat_rack'], locations: ['commercial_gym', 'home_gym'] },
  { dbKey: 'squat gobelet', group: 'lower', tier: 'classic', quizEquipment: ['dumbbells', 'kettlebells', 'bodyweight'], locations: ['home_minimal', 'home_gym', 'commercial_gym'] },
  { dbKey: 'fentes', group: 'lower', tier: 'classic', quizEquipment: ['dumbbells', 'bodyweight'], locations: ['home_minimal', 'outdoor', 'home_gym', 'commercial_gym'] },
  { dbKey: 'soulevé de terre', group: 'lower', tier: 'standard', quizEquipment: ['barbell_plates'], locations: ['commercial_gym', 'home_gym'] },
  { dbKey: 'presse à cuisses', group: 'lower', tier: 'standard', quizEquipment: ['bench'], locations: ['commercial_gym'] },
  { dbKey: 'gainage', group: 'core', tier: 'classic', quizEquipment: ['bodyweight'], locations: ['home_minimal', 'outdoor', 'home_gym', 'commercial_gym', 'track'] },
  { dbKey: 'gainage latéral', group: 'core', tier: 'classic', quizEquipment: ['bodyweight'], locations: ['home_minimal', 'outdoor', 'home_gym', 'commercial_gym'] },
  { dbKey: 'course endurance fondamentale', group: 'cardio', tier: 'classic', quizEquipment: ['bodyweight'], locations: ['outdoor', 'track', 'commercial_gym'] },
  { dbKey: 'fractionné', group: 'cardio', tier: 'classic', quizEquipment: ['bodyweight'], locations: ['outdoor', 'track'] },
  { dbKey: 'fractionné 30/30', group: 'cardio', tier: 'classic', quizEquipment: ['bodyweight'], locations: ['outdoor', 'track'] },
  { dbKey: 'corde à sauter', group: 'cardio', tier: 'classic', quizEquipment: ['jump_rope'], locations: ['home_minimal', 'outdoor', 'home_gym', 'commercial_gym', 'track'] },
  { dbKey: 'burpees', group: 'cardio', tier: 'classic', quizEquipment: ['bodyweight'], locations: ['home_minimal', 'outdoor', 'home_gym', 'track'] },
  { dbKey: 'mountain climbers', group: 'cardio', tier: 'classic', quizEquipment: ['bodyweight'], locations: ['home_minimal', 'outdoor', 'home_gym', 'track'] }
];
