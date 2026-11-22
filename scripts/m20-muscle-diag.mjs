import { inferMuscleGroupsForExercise } from '../src/utils/sport/recapMuscleInference.js';

const names = [
  'Élévations latérales',
  'Face pull',
  'Extension triceps debout avec haltère',
  'Kickbacks triceps',
  'Pompes pseudo-planche',
  'Développé Arnold'
];
for (const name of names) {
  console.log(name, '=>', inferMuscleGroupsForExercise({ name }));
}
