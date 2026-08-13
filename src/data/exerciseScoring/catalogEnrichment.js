import { scoringEntry } from './catalogHelpers';

/** Entrées scoring ajoutées par generateExerciseBankEnrichment.mjs */
export const CATALOG_ENRICHMENT = [
  scoringEntry('Développé couché à la Smith machine', 'reps', 3, 0.95, {
    muscleGroup: 'Pectoraux',
    aliases: [
      'smith bench press',
      'dc smith',
      'développé smith'
    ]
  }),
  scoringEntry('Développé incliné à la Smith machine', 'reps', 4, 1.05, {
    muscleGroup: 'Pectoraux',
    aliases: [
      'incline smith press',
      'di smith',
      'smith incline bench'
    ]
  }),
  scoringEntry('Développé décliné à la Smith machine', 'reps', 3, 0.95, {
    muscleGroup: 'Pectoraux',
    aliases: [
      'decline smith press',
      'développé décliné smith',
      'smith decline bench'
    ]
  }),
  scoringEntry('Développé couché prise neutre haltères', 'reps', 3, 0.95, {
    muscleGroup: 'Pectoraux',
    aliases: [
      'neutral grip dumbbell press',
      'dc prise neutre',
      'hammer grip bench press'
    ]
  }),
  scoringEntry('Floor press haltères', 'reps', 3, 0.95, {
    muscleGroup: 'Pectoraux',
    aliases: [
      'dumbbell floor press',
      'floor press db',
      'développé au sol haltères'
    ]
  }),
  scoringEntry('Floor press barre', 'reps', 3, 1, {
    muscleGroup: 'Pectoraux',
    aliases: [
      'barbell floor press',
      'floor press barre',
      'développé barre au sol'
    ]
  }),
  scoringEntry('Svend press', 'reps', 2, 0.65, {
    muscleGroup: 'Pectoraux',
    aliases: [
      'svend press',
      'plate press',
      'squeeze press'
    ]
  }),
  scoringEntry('Pompes larges', 'reps', 2, 0.95, {
    muscleGroup: 'Pectoraux',
    aliases: [
      'wide push up',
      'pompes prise large',
      'wide grip push-ups'
    ]
  }),
  scoringEntry('Pompes sur un bras assistées', 'reps', 6, 1.85, {
    muscleGroup: 'Pectoraux',
    aliases: [
      'assisted one arm push up',
      'pompes un bras assistées',
      'archer push up assisté'
    ]
  }),
  scoringEntry('Pompes pieds très surélevés', 'reps', 4, 1.3, {
    muscleGroup: 'Pectoraux',
    aliases: [
      'decline push up high',
      'pompes pieds surélevés',
      'pike push up feet elevated'
    ]
  }),
  scoringEntry('Pompes explosives surélevées', 'reps', 5, 1.45, {
    muscleGroup: 'Pectoraux',
    aliases: [
      'explosive decline push up',
      'plyo push up elevated',
      'pompes claquées surélevées'
    ]
  }),
  scoringEntry('Tractions prise neutre', 'reps', 4, 1.3, {
    muscleGroup: 'Dorsaux',
    aliases: [
      'neutral grip pull up',
      'tractions neutres',
      'hammer grip pull up'
    ]
  }),
  scoringEntry('Tractions prise large', 'reps', 5, 1.4, {
    muscleGroup: 'Dorsaux',
    aliases: [
      'wide grip pull up',
      'tractions larges',
      'lat focused pull up'
    ]
  }),
  scoringEntry('Tractions prise serrée', 'reps', 4, 1.25, {
    muscleGroup: 'Dorsaux',
    aliases: [
      'close grip pull up',
      'tractions serrées',
      'narrow pull up'
    ]
  }),
  scoringEntry('Tractions lestées', 'reps', 6, 1.65, {
    muscleGroup: 'Dorsaux',
    aliases: [
      'weighted pull up',
      'tractions lestées',
      'pull up with weight'
    ]
  }),
  scoringEntry('Tractions assistées', 'reps', 3, 0.9, {
    muscleGroup: 'Dorsaux',
    aliases: [
      'assisted pull up',
      'tractions assistées machine',
      'band assisted pull up'
    ]
  }),
  scoringEntry('Tractions aux anneaux', 'reps', 5, 1.4, {
    muscleGroup: 'Dorsaux',
    aliases: [
      'ring pull up',
      'tractions anneaux',
      'gymnastic rings pull up'
    ]
  }),
  scoringEntry('Tractions supination serrées', 'reps', 4, 1.25, {
    muscleGroup: 'Dorsaux',
    aliases: [
      'close grip chin up',
      'tractions supination serrées',
      'narrow chin up'
    ]
  }),
  scoringEntry('Tirage vertical prise large', 'reps', 3, 0.95, {
    muscleGroup: 'Dorsaux',
    aliases: [
      'wide lat pulldown',
      'tirage vertical large',
      'wide grip pulldown'
    ]
  }),
  scoringEntry('Tirage vertical supination', 'reps', 3, 0.95, {
    muscleGroup: 'Dorsaux',
    aliases: [
      'underhand lat pulldown',
      'tirage supination',
      'reverse grip pulldown'
    ]
  }),
  scoringEntry('Tirage vertical unilatéral', 'reps', 3, 0.9, {
    muscleGroup: 'Dorsaux',
    aliases: [
      'single arm lat pulldown',
      'tirage unilatéral',
      'one arm pulldown'
    ]
  }),
  scoringEntry('Tirage vertical prise neutre large', 'reps', 3, 0.95, {
    muscleGroup: 'Dorsaux',
    aliases: [
      'neutral wide pulldown',
      'tirage neutre large',
      'v-bar wide pulldown'
    ]
  }),
  scoringEntry('Straight-arm pulldown', 'reps', 2, 0.7, {
    muscleGroup: 'Dorsaux',
    aliases: [
      'straight arm pulldown',
      'pulldown bras tendus',
      'lat isolation pulldown'
    ]
  }),
  scoringEntry('Rowing Pendlay', 'reps', 4, 1.1, {
    muscleGroup: 'Dorsaux',
    aliases: [
      'pendlay row',
      'rowing pendlay',
      'dead stop row'
    ]
  }),
  scoringEntry('Rowing poitrine appuyée haltères', 'reps', 2, 0.85, {
    muscleGroup: 'Dorsaux',
    aliases: [
      'chest supported dumbbell row',
      'rowing buste appuyé',
      'incline bench row'
    ]
  }),
  scoringEntry('Rowing T-bar poitrine appuyée', 'reps', 3, 0.95, {
    muscleGroup: 'Dorsaux',
    aliases: [
      'chest supported t-bar row',
      't-bar row appuyé',
      'machine t-bar row'
    ]
  }),
  scoringEntry('Rowing unilatéral poulie', 'reps', 2, 0.85, {
    muscleGroup: 'Dorsaux',
    aliases: [
      'single arm cable row',
      'rowing unilatéral poulie',
      'one arm seated row'
    ]
  }),
  scoringEntry('Rowing Meadows', 'reps', 4, 1.05, {
    muscleGroup: 'Dorsaux',
    aliases: [
      'meadows row',
      'landmine meadows row',
      'single arm landmine row'
    ]
  }),
  scoringEntry('Renegade row', 'reps', 4, 1.15, {
    muscleGroup: 'Dorsaux',
    aliases: [
      'renegade row',
      'plank row',
      'rowing en planche'
    ]
  }),
  scoringEntry('Rowing aux anneaux', 'reps', 3, 0.95, {
    muscleGroup: 'Dorsaux',
    aliases: [
      'ring row',
      'rowing anneaux',
      'inverted ring row'
    ]
  }),
  scoringEntry('Traction commando lestée', 'reps', 6, 1.55, {
    muscleGroup: 'Dorsaux',
    aliases: [
      'weighted commando pull up',
      'tractions commando lestées',
      'commando pull up weighted'
    ]
  }),
  scoringEntry('Muscle-up strict aux anneaux', 'reps', 8, 2.2, {
    muscleGroup: 'Dorsaux',
    aliases: [
      'strict ring muscle up',
      'muscle up anneaux',
      'ring muscle-up strict'
    ]
  }),
  scoringEntry('Développé épaules machine', 'reps', 2, 0.9, {
    muscleGroup: 'Épaules',
    aliases: [
      'shoulder press machine',
      'développé épaules machine',
      'machine overhead press'
    ]
  }),
  scoringEntry('Développé épaules haltères debout', 'reps', 4, 1, {
    muscleGroup: 'Épaules',
    aliases: [
      'standing dumbbell press',
      'ohp haltères debout',
      'développé debout haltères'
    ]
  }),
  scoringEntry('Développé haltères prise neutre', 'reps', 3, 0.9, {
    muscleGroup: 'Épaules',
    aliases: [
      'neutral grip shoulder press',
      'développé prise neutre',
      'hammer grip ohp'
    ]
  }),
  scoringEntry('Développé militaire à la Smith machine', 'reps', 3, 0.95, {
    muscleGroup: 'Épaules',
    aliases: [
      'smith shoulder press',
      'développé militaire smith',
      'smith ohp'
    ]
  }),
  scoringEntry('Push press', 'reps', 5, 1.2, {
    muscleGroup: 'Épaules',
    aliases: [
      'push press',
      'développé push',
      'barbell push press'
    ]
  }),
  scoringEntry('Push press haltères', 'reps', 5, 1.15, {
    muscleGroup: 'Épaules',
    aliases: [
      'dumbbell push press',
      'push press haltères',
      'db push press'
    ]
  }),
  scoringEntry('Élévation latérale à la machine', 'reps', 2, 0.65, {
    muscleGroup: 'Épaules',
    aliases: [
      'lateral raise machine',
      'élévation latérale machine',
      'machine side raise'
    ]
  }),
  scoringEntry('Élévation latérale assise', 'reps', 2, 0.65, {
    muscleGroup: 'Épaules',
    aliases: [
      'seated lateral raise',
      'élévation latérale assise',
      'side raise seated'
    ]
  }),
  scoringEntry('Élévation latérale penchée', 'reps', 2, 0.65, {
    muscleGroup: 'Épaules',
    aliases: [
      'leaning lateral raise',
      'élévation penchée',
      'cable y raise lateral'
    ]
  }),
  scoringEntry('Reverse pec deck', 'reps', 2, 0.7, {
    muscleGroup: 'Épaules',
    aliases: [
      'reverse pec deck',
      'rear delt machine',
      'oiseau machine'
    ]
  }),
  scoringEntry('High row poulie', 'reps', 3, 0.8, {
    muscleGroup: 'Épaules',
    aliases: [
      'high row cable',
      'face pull high row',
      'tirage haut poulie'
    ]
  }),
  scoringEntry('Face pull à la corde haute', 'reps', 2, 0.7, {
    muscleGroup: 'Épaules',
    aliases: [
      'face pull',
      'face pull corde',
      'cable face pull'
    ]
  }),
  scoringEntry('Handstand hold libre', 'seconds', 7, 1.45, {
    muscleGroup: 'Épaules',
    aliases: [
      'freestanding handstand hold',
      'équilibre sur les mains libre',
      'handstand hold free'
    ]
  }),
  scoringEntry('Pike push-up pieds surélevés', 'reps', 5, 1.3, {
    muscleGroup: 'Épaules',
    aliases: [
      'elevated pike push up',
      'pike push up feet up',
      'pompes pike surélevées'
    ]
  }),
  scoringEntry('Curl marteau croisé', 'reps', 2, 0.8, {
    muscleGroup: 'Biceps',
    aliases: [
      'cross body hammer curl',
      'curl marteau croisé',
      'hammer curl across body'
    ]
  }),
  scoringEntry('Curl Bayesian à la poulie', 'reps', 3, 0.85, {
    muscleGroup: 'Biceps',
    aliases: [
      'bayesian curl',
      'curl bayesian poulie',
      'behind body cable curl'
    ]
  }),
  scoringEntry('Curl câble derrière le corps', 'reps', 3, 0.85, {
    muscleGroup: 'Biceps',
    aliases: [
      'behind the back cable curl',
      'curl câble derrière',
      'rear cable curl'
    ]
  }),
  scoringEntry('Curl barre prise inversée', 'reps', 3, 0.8, {
    muscleGroup: 'Biceps',
    aliases: [
      'reverse barbell curl',
      'curl inversé barre',
      'pronated curl'
    ]
  }),
  scoringEntry('Curl inversé EZ', 'reps', 3, 0.8, {
    muscleGroup: 'Biceps',
    aliases: [
      'reverse ez curl',
      'curl inversé EZ',
      'ez reverse curl'
    ]
  }),
  scoringEntry('Curl araignée haltères', 'reps', 3, 0.85, {
    muscleGroup: 'Biceps',
    aliases: [
      'spider curl',
      'curl araignée',
      'prone incline curl'
    ]
  }),
  scoringEntry('Curl unilatéral pupitre', 'reps', 3, 0.8, {
    muscleGroup: 'Biceps',
    aliases: [
      'single arm preacher curl',
      'curl pupitre unilatéral',
      'unilateral preacher curl'
    ]
  }),
  scoringEntry('Curl drag', 'reps', 3, 0.85, {
    muscleGroup: 'Biceps',
    aliases: [
      'drag curl',
      'curl drag',
      'barbell drag curl'
    ]
  }),
  scoringEntry('Extension triceps au-dessus de la tête à la poulie', 'reps', 2, 0.75, {
    muscleGroup: 'Triceps',
    aliases: [
      'overhead cable triceps extension',
      'extension triceps poulie overhead',
      'cable overhead extension'
    ]
  }),
  scoringEntry('Extension triceps corde au-dessus de la tête', 'reps', 2, 0.75, {
    muscleGroup: 'Triceps',
    aliases: [
      'rope overhead extension',
      'extension corde overhead',
      'triceps rope overhead'
    ]
  }),
  scoringEntry('Extension triceps unilatérale au-dessus de la tête', 'reps', 3, 0.75, {
    muscleGroup: 'Triceps',
    aliases: [
      'single arm overhead extension',
      'extension triceps unilatérale overhead',
      'one arm triceps extension'
    ]
  }),
  scoringEntry('Pushdown barre', 'reps', 2, 0.7, {
    muscleGroup: 'Triceps',
    aliases: [
      'triceps pushdown bar',
      'pushdown barre',
      'straight bar pushdown'
    ]
  }),
  scoringEntry('Pushdown corde', 'reps', 2, 0.7, {
    muscleGroup: 'Triceps',
    aliases: [
      'rope pushdown',
      'pushdown corde',
      'triceps rope pushdown'
    ]
  }),
  scoringEntry('Pushdown unilatéral', 'reps', 2, 0.65, {
    muscleGroup: 'Triceps',
    aliases: [
      'single arm pushdown',
      'pushdown unilatéral',
      'one arm triceps pushdown'
    ]
  }),
  scoringEntry('Skull crusher haltères', 'reps', 3, 0.9, {
    muscleGroup: 'Triceps',
    aliases: [
      'dumbbell skull crusher',
      'barre au front haltères',
      'lying triceps extension db'
    ]
  }),
  scoringEntry('Tate press haltères', 'reps', 3, 0.8, {
    muscleGroup: 'Triceps',
    aliases: [
      'tate press',
      'tate press dumbbell',
      'flared triceps extension'
    ]
  }),
  scoringEntry('Extension triceps au poids du corps', 'reps', 4, 1.05, {
    muscleGroup: 'Triceps',
    aliases: [
      'bodyweight triceps extension',
      'bench dip',
      'extension triceps pdc'
    ]
  }),
  scoringEntry('Dips assistés', 'reps', 3, 0.9, {
    muscleGroup: 'Triceps',
    aliases: [
      'assisted dips',
      'dips assistés',
      'band assisted dips'
    ]
  }),
  scoringEntry('Reverse lunge', 'reps', 2, 0.9, {
    muscleGroup: 'Quadriceps',
    aliases: [
      'reverse lunge',
      'fente arrière',
      'backward lunge'
    ]
  }),
  scoringEntry('Fente latérale', 'reps', 3, 1, {
    muscleGroup: 'Quadriceps',
    aliases: [
      'lateral lunge',
      'fente latérale',
      'side lunge'
    ]
  }),
  scoringEntry('Fente avant pied surélevé', 'reps', 3, 1, {
    muscleGroup: 'Quadriceps',
    aliases: [
      'front foot elevated lunge',
      'fente avant surélevée',
      'deficit lunge'
    ]
  }),
  scoringEntry('Bulgarian split squat avant surélevé', 'reps', 5, 1.35, {
    muscleGroup: 'Quadriceps',
    aliases: [
      'elevated bulgarian split squat',
      'bss avant surélevé',
      'front foot up split squat'
    ]
  }),
  scoringEntry('Cyclist squat', 'reps', 3, 1, {
    muscleGroup: 'Quadriceps',
    aliases: [
      'cyclist squat',
      'squat cycliste',
      'narrow heel elevated squat'
    ]
  }),
  scoringEntry('Spanish squat', 'reps', 3, 0.85, {
    muscleGroup: 'Quadriceps',
    aliases: [
      'spanish squat',
      'squat espagnol',
      'band spanish squat'
    ]
  }),
  scoringEntry('Spanish squat isométrique', 'seconds', 3, 0.85, {
    muscleGroup: 'Quadriceps',
    aliases: [
      'spanish squat hold',
      'spanish squat iso',
      'isometric spanish squat'
    ]
  }),
  scoringEntry('Belt squat', 'reps', 3, 1, {
    muscleGroup: 'Quadriceps',
    aliases: [
      'belt squat',
      'squat ceinture',
      'hip belt squat'
    ]
  }),
  scoringEntry('Belt squat unilatéral', 'reps', 5, 1.2, {
    muscleGroup: 'Quadriceps',
    aliases: [
      'single leg belt squat',
      'belt squat unilatéral',
      'unilateral belt squat'
    ]
  }),
  scoringEntry('Hack squat à la machine pendulaire', 'reps', 4, 1.05, {
    muscleGroup: 'Quadriceps',
    aliases: [
      'pendulum hack squat',
      'hack squat pendulaire',
      'machine hack squat'
    ]
  }),
  scoringEntry('Reverse Nordic curl', 'reps', 5, 1.15, {
    muscleGroup: 'Quadriceps',
    aliases: [
      'reverse nordic',
      'reverse nordic curl',
      'kneeling quad extension'
    ]
  }),
  scoringEntry('Step-up haut', 'reps', 3, 0.95, {
    muscleGroup: 'Quadriceps',
    aliases: [
      'high step up',
      'step-up haut',
      'tall box step up'
    ]
  }),
  scoringEntry('Step-up lesté', 'reps', 4, 1.1, {
    muscleGroup: 'Quadriceps',
    aliases: [
      'weighted step up',
      'step-up lesté',
      'loaded step up'
    ]
  }),
  scoringEntry('Squat sur une jambe assisté', 'reps', 5, 1.3, {
    muscleGroup: 'Quadriceps',
    aliases: [
      'assisted single leg squat',
      'pistol squat assisté',
      'supported one leg squat'
    ]
  }),
  scoringEntry('Leg curl assis', 'reps', 2, 0.8, {
    muscleGroup: 'Ischio-jambiers',
    aliases: [
      'seated leg curl',
      'leg curl assis',
      'ischio machine assis'
    ]
  }),
  scoringEntry('Leg curl debout unilatéral', 'reps', 3, 0.85, {
    muscleGroup: 'Ischio-jambiers',
    aliases: [
      'standing single leg curl',
      'leg curl debout unilatéral',
      'one leg hamstring curl'
    ]
  }),
  scoringEntry('Nordic curl assisté', 'reps', 6, 1.45, {
    muscleGroup: 'Ischio-jambiers',
    aliases: [
      'assisted nordic curl',
      'nordic curl assisté',
      'band assisted nordic'
    ]
  }),
  scoringEntry('Nordic curl négatif', 'reps', 7, 1.65, {
    muscleGroup: 'Ischio-jambiers',
    aliases: [
      'nordic curl negative',
      'nordic négatif',
      'eccentric nordic curl'
    ]
  }),
  scoringEntry('Glute-ham raise', 'reps', 6, 1.4, {
    muscleGroup: 'Ischio-jambiers',
    aliases: [
      'ghr',
      'glute ham raise',
      'glute-ham developer'
    ]
  }),
  scoringEntry('Romanian deadlift barre', 'reps', 4, 1.1, {
    muscleGroup: 'Ischio-jambiers',
    aliases: [
      'romanian deadlift',
      'RDL barre',
      'soulevé roumain barre'
    ]
  }),
  scoringEntry('Romanian deadlift unilatéral', 'reps', 5, 1.2, {
    muscleGroup: 'Ischio-jambiers',
    aliases: [
      'single leg RDL',
      'RDL unilatéral',
      'one leg romanian deadlift'
    ]
  }),
  scoringEntry('Single-leg RDL haltères', 'reps', 4, 1.1, {
    muscleGroup: 'Ischio-jambiers',
    aliases: [
      'single leg dumbbell rdl',
      'RDL haltères un jambe',
      'one leg db rdl'
    ]
  }),
  scoringEntry('Good morning assis', 'reps', 3, 0.85, {
    muscleGroup: 'Ischio-jambiers',
    aliases: [
      'seated good morning',
      'good morning assis',
      'seated gm'
    ]
  }),
  scoringEntry('Reverse hyperextension', 'reps', 3, 0.85, {
    muscleGroup: 'Ischio-jambiers',
    aliases: [
      'reverse hyper',
      'reverse hyperextension',
      'reverse hyper machine'
    ]
  }),
  scoringEntry('Hip thrust à la Smith machine', 'reps', 3, 0.95, {
    muscleGroup: 'Fessiers',
    aliases: [
      'smith hip thrust',
      'hip thrust smith',
      'thrust fessier smith'
    ]
  }),
  scoringEntry('Hip thrust barre lesté', 'reps', 3, 1, {
    muscleGroup: 'Fessiers',
    aliases: [
      'barbell hip thrust',
      'hip thrust barre',
      'weighted hip thrust'
    ]
  }),
  scoringEntry('Abduction machine', 'reps', 2, 0.6, {
    muscleGroup: 'Fessiers',
    aliases: [
      'hip abduction machine',
      'abduction machine',
      'machine écartement hanche'
    ]
  }),
  scoringEntry('Abduction poulie', 'reps', 2, 0.55, {
    muscleGroup: 'Fessiers',
    aliases: [
      'cable hip abduction',
      'abduction poulie',
      'standing cable abduction'
    ]
  }),
  scoringEntry('Abduction allongée', 'reps', 1, 0.45, {
    muscleGroup: 'Fessiers',
    aliases: [
      'lying hip abduction',
      'abduction allongée',
      'side lying leg raise'
    ]
  }),
  scoringEntry('Kickback poulie', 'reps', 2, 0.6, {
    muscleGroup: 'Fessiers',
    aliases: [
      'cable kickback',
      'kickback poulie',
      'glute kickback cable'
    ]
  }),
  scoringEntry('Kickback machine', 'reps', 2, 0.6, {
    muscleGroup: 'Fessiers',
    aliases: [
      'glute kickback machine',
      'kickback machine',
      'machine fessier'
    ]
  }),
  scoringEntry('Hip airplane', 'reps', 6, 1.15, {
    muscleGroup: 'Fessiers',
    aliases: [
      'hip airplane',
      'single leg rdl rotation',
      'avion hanche'
    ]
  }),
  scoringEntry('Step-up haut fessier', 'reps', 3, 0.95, {
    muscleGroup: 'Fessiers',
    aliases: [
      'glute focused step up',
      'step-up fessier',
      'high box step up glute'
    ]
  }),
  scoringEntry('Lateral step-up', 'reps', 4, 1, {
    muscleGroup: 'Fessiers',
    aliases: [
      'lateral step up',
      'step-up latéral',
      'side step up'
    ]
  }),
  scoringEntry('Curtsy lunge', 'reps', 3, 0.9, {
    muscleGroup: 'Fessiers',
    aliases: [
      'curtsy lunge',
      'fente curtsy',
      'cross behind lunge'
    ]
  }),
  scoringEntry('Adduction machine', 'reps', 1, 0.5, {
    muscleGroup: 'Adducteurs',
    aliases: [
      'hip adduction machine',
      'adduction machine',
      'machine adducteurs'
    ]
  }),
  scoringEntry('Adduction poulie', 'reps', 2, 0.5, {
    muscleGroup: 'Adducteurs',
    aliases: [
      'cable hip adduction',
      'adduction poulie',
      'standing adduction cable'
    ]
  }),
  scoringEntry('Adduction allongée', 'reps', 1, 0.4, {
    muscleGroup: 'Adducteurs',
    aliases: [
      'lying hip adduction',
      'adduction allongée',
      'side lying adduction'
    ]
  }),
  scoringEntry('Copenhagen dynamique', 'reps', 5, 1, {
    muscleGroup: 'Adducteurs',
    aliases: [
      'dynamic copenhagen',
      'copenhagen dynamique',
      'copenhagen adduction dynamic'
    ]
  }),
  scoringEntry('Copenhagen hold', 'seconds', 5, 1.05, {
    muscleGroup: 'Adducteurs',
    aliases: [
      'copenhagen plank',
      'copenhagen hold',
      'copenhagen adduction hold'
    ]
  }),
  scoringEntry('Cossack squat profond', 'reps', 5, 1.15, {
    muscleGroup: 'Adducteurs',
    aliases: [
      'deep cossack squat',
      'cossack squat profond',
      'lateral squat deep'
    ]
  }),
  scoringEntry('Fente latérale profonde', 'reps', 4, 1.05, {
    muscleGroup: 'Adducteurs',
    aliases: [
      'deep lateral lunge',
      'fente latérale profonde',
      'side lunge deep'
    ]
  }),
  scoringEntry('Seated calf raise unilatéral', 'reps', 3, 0.8, {
    muscleGroup: 'Mollets',
    aliases: [
      'seated single leg calf raise',
      'mollet assis unilatéral',
      'one leg seated calf raise'
    ]
  }),
  scoringEntry('Mollet isométrique debout', 'seconds', 2, 0.75, {
    muscleGroup: 'Mollets',
    aliases: [
      'standing calf isometric',
      'mollet isométrique',
      'calf hold standing'
    ]
  }),
  scoringEntry('Mollet isométrique unilatéral', 'seconds', 4, 1, {
    muscleGroup: 'Mollets',
    aliases: [
      'single leg calf isometric',
      'mollet iso unilatéral',
      'one leg calf hold'
    ]
  }),
  scoringEntry('Tibialis raise debout libre', 'reps', 2, 0.55, {
    muscleGroup: 'Cheville / pied',
    aliases: [
      'tibialis raise standing',
      'tibialis raise libre',
      'toe raise standing'
    ]
  }),
  scoringEntry('Tibialis raise à la machine', 'reps', 2, 0.6, {
    muscleGroup: 'Cheville / pied',
    aliases: [
      'tibialis machine',
      'tibialis raise machine',
      'dorsiflexion machine'
    ]
  }),
  scoringEntry('Tibialis raise unilatéral', 'reps', 3, 0.7, {
    muscleGroup: 'Cheville / pied',
    aliases: [
      'single leg tibialis raise',
      'tibialis unilatéral',
      'one leg dorsiflexion'
    ]
  }),
  scoringEntry('Marche sur pointes', 'seconds', 2, 0.55, {
    muscleGroup: 'Mollets',
    aliases: [
      'toe walk',
      'marche sur pointes',
      'calf walk'
    ]
  }),
  scoringEntry('Marche sur talons', 'seconds', 2, 0.5, {
    muscleGroup: 'Cheville / pied',
    aliases: [
      'heel walk',
      'marche sur talons',
      'dorsiflexion walk'
    ]
  }),
  scoringEntry('Short foot', 'seconds', 2, 0.4, {
    muscleGroup: 'Cheville / pied',
    aliases: [
      'short foot exercise',
      'short foot',
      'pied court'
    ]
  }),
  scoringEntry('Cable crunch à genoux', 'reps', 3, 0.8, {
    muscleGroup: 'Abdominaux',
    aliases: [
      'kneeling cable crunch',
      'crunch poulie genoux',
      'cable ab crunch'
    ]
  }),
  scoringEntry('Ab wheel depuis les genoux lesté', 'reps', 7, 1.7, {
    muscleGroup: 'Abdominaux',
    aliases: [
      'weighted kneeling ab wheel',
      'roue abdominale genoux lesté',
      'ab wheel weighted knees'
    ]
  }),
  scoringEntry('Ab wheel depuis les pieds', 'reps', 8, 2, {
    muscleGroup: 'Abdominaux',
    aliases: [
      'standing ab wheel',
      'ab wheel from feet',
      'roue abdominale pieds'
    ]
  }),
  scoringEntry('Body saw', 'reps', 5, 1.15, {
    muscleGroup: 'Abdominaux',
    aliases: [
      'body saw',
      'plank saw',
      'scie corporelle'
    ]
  }),
  scoringEntry('RKC plank', 'seconds', 5, 1.15, {
    muscleGroup: 'Abdominaux',
    aliases: [
      'rkc plank',
      'planche rkc',
      'hardstyle plank'
    ]
  }),
  scoringEntry('Long lever plank', 'seconds', 5, 1.15, {
    muscleGroup: 'Abdominaux',
    aliases: [
      'long lever plank',
      'planche levier long',
      'extended arm plank'
    ]
  }),
  scoringEntry('Hollow body rocks', 'reps', 5, 1.1, {
    muscleGroup: 'Abdominaux',
    aliases: [
      'hollow body rocks',
      'hollow rocks',
      'oscillations hollow'
    ]
  }),
  scoringEntry('V-ups', 'reps', 5, 1.15, {
    muscleGroup: 'Abdominaux',
    aliases: [
      'v-ups',
      'v ups',
      'jackknife sit up'
    ]
  }),
  scoringEntry('Sit-up lesté', 'reps', 3, 0.8, {
    muscleGroup: 'Abdominaux',
    aliases: [
      'weighted sit up',
      'sit-up lesté',
      'loaded sit up'
    ]
  }),
  scoringEntry('Suitcase hold', 'seconds', 4, 0.95, {
    muscleGroup: 'Abdominaux',
    aliases: [
      'suitcase hold',
      'tenue valise',
      'unilateral hold'
    ]
  }),
  scoringEntry('Anti-rotation hold à la poulie', 'seconds', 3, 0.75, {
    muscleGroup: 'Abdominaux',
    aliases: [
      'anti rotation hold',
      'pallof hold',
      'tenue anti-rotation poulie'
    ]
  }),
  scoringEntry('Side bend poulie', 'reps', 2, 0.65, {
    muscleGroup: 'Abdominaux',
    aliases: [
      'cable side bend',
      'side bend poulie',
      'oblique cable bend'
    ]
  }),
  scoringEntry('Hanging knee raise lesté', 'reps', 5, 1.1, {
    muscleGroup: 'Abdominaux',
    aliases: [
      'weighted hanging knee raise',
      'relevé genoux lesté',
      'knee raise weighted'
    ]
  }),
  scoringEntry('Toes-to-bar strict', 'reps', 7, 1.7, {
    muscleGroup: 'Abdominaux',
    aliases: [
      'strict toes to bar',
      'toes to bar strict',
      'ttb strict'
    ]
  }),
  scoringEntry('Windshield wipers strictes', 'reps', 8, 1.9, {
    muscleGroup: 'Abdominaux',
    aliases: [
      'strict windshield wipers',
      'windshield wipers strict',
      'essuie-glaces strictes'
    ]
  }),
  scoringEntry('Dead hang', 'seconds', 3, 0.75, {
    muscleGroup: 'Avant-bras',
    aliases: [
      'dead hang',
      'suspension passive',
      'bar hang'
    ]
  }),
  scoringEntry('Dead hang lesté', 'seconds', 5, 1.05, {
    muscleGroup: 'Avant-bras',
    aliases: [
      'weighted dead hang',
      'dead hang lesté',
      'loaded hang'
    ]
  }),
  scoringEntry('Dead hang une main assisté', 'seconds', 5, 1.1, {
    muscleGroup: 'Avant-bras',
    aliases: [
      'assisted one arm hang',
      'dead hang un bras assisté',
      'one arm hang assisted'
    ]
  }),
  scoringEntry('Towel hang', 'seconds', 5, 1.15, {
    muscleGroup: 'Avant-bras',
    aliases: [
      'towel hang',
      'serviette hang',
      'towel grip hang'
    ]
  }),
  scoringEntry('Towel hang une main assisté', 'seconds', 7, 1.4, {
    muscleGroup: 'Avant-bras',
    aliases: [
      'assisted one arm towel hang',
      'towel hang un bras',
      'one arm towel hang'
    ]
  }),
  scoringEntry('Plate pinch hold', 'seconds', 4, 0.9, {
    muscleGroup: 'Avant-bras',
    aliases: [
      'plate pinch hold',
      'pinch grip hold',
      'tenue pinch disques'
    ]
  }),
  scoringEntry('Gripper', 'reps', 3, 0.65, {
    muscleGroup: 'Avant-bras',
    aliases: [
      'hand gripper',
      'gripper closes',
      'captains of crush'
    ]
  }),
  scoringEntry('Gripper hold', 'seconds', 4, 0.8, {
    muscleGroup: 'Avant-bras',
    aliases: [
      'gripper hold',
      'gripper isometric',
      'tenue gripper'
    ]
  }),
  scoringEntry('Fat grip hold', 'seconds', 4, 0.95, {
    muscleGroup: 'Avant-bras',
    aliases: [
      'fat grip hold',
      'thick bar hold',
      'tenue fat grip'
    ]
  }),
  scoringEntry('Farmer\'s carry', 'seconds', 3, 0.9, {
    muscleGroup: 'Carries',
    aliases: [
      'farmer\'s carry',
      'farmers walk',
      'marche du fermier'
    ]
  }),
  scoringEntry('Suitcase carry', 'seconds', 4, 1, {
    muscleGroup: 'Carries',
    aliases: [
      'suitcase carry',
      'single arm carry',
      'marche valise'
    ]
  }),
  scoringEntry('Waiter\'s carry', 'seconds', 4, 0.95, {
    muscleGroup: 'Carries',
    aliases: [
      'waiter\'s carry',
      'waiter walk',
      'overhead unilateral carry'
    ]
  }),
  scoringEntry('Overhead carry', 'seconds', 5, 1.1, {
    muscleGroup: 'Carries',
    aliases: [
      'overhead carry',
      'oh carry',
      'marche overhead'
    ]
  }),
  scoringEntry('Front rack carry', 'seconds', 4, 1, {
    muscleGroup: 'Carries',
    aliases: [
      'front rack carry',
      'front carry',
      'marche rack avant'
    ]
  }),
  scoringEntry('Bear hug carry', 'seconds', 4, 1, {
    muscleGroup: 'Carries',
    aliases: [
      'bear hug carry',
      'sandbag carry',
      'marche bear hug'
    ]
  }),
  scoringEntry('Zercher carry', 'seconds', 5, 1.15, {
    muscleGroup: 'Carries',
    aliases: [
      'zercher carry',
      'marche zercher',
      'zercher walk'
    ]
  }),
  scoringEntry('Broad jump', 'reps', 4, 1.25, {
    muscleGroup: 'Puissance',
    aliases: [
      'broad jump',
      'standing long jump',
      'saut en longueur'
    ]
  }),
  scoringEntry('Tuck jump', 'reps', 4, 1.15, {
    muscleGroup: 'Puissance',
    aliases: [
      'tuck jump',
      'saut groupé',
      'knee tuck jump'
    ]
  }),
  scoringEntry('Skater jump', 'reps', 3, 0.95, {
    muscleGroup: 'Puissance',
    aliases: [
      'skater jump',
      'lateral bound',
      'saut patineur'
    ]
  }),
  scoringEntry('Split jump', 'reps', 4, 1.1, {
    muscleGroup: 'Puissance',
    aliases: [
      'split jump',
      'jumping lunge',
      'fente sautée'
    ]
  }),
  scoringEntry('Depth jump', 'reps', 6, 1.5, {
    muscleGroup: 'Puissance',
    aliases: [
      'depth jump',
      'drop jump reactive',
      'saut profondeur'
    ]
  }),
  scoringEntry('Bounding', 'reps', 5, 1.2, {
    muscleGroup: 'Puissance',
    aliases: [
      'bounding',
      'power bounds',
      'foulées bondissantes'
    ]
  }),
  scoringEntry('Plyometric push-up', 'reps', 4, 1.3, {
    muscleGroup: 'Puissance',
    aliases: [
      'plyometric push up',
      'explosive push up',
      'pompes pliométriques'
    ]
  }),
  scoringEntry('Depth push-up', 'reps', 6, 1.55, {
    muscleGroup: 'Puissance',
    aliases: [
      'depth push up',
      'drop push up',
      'pompes profondeur'
    ]
  }),
  scoringEntry('Medicine ball slam', 'reps', 3, 1, {
    muscleGroup: 'Puissance',
    aliases: [
      'med ball slam',
      'medicine ball slam',
      'slam medecine ball'
    ]
  }),
  scoringEntry('Medicine ball chest throw', 'reps', 3, 0.95, {
    muscleGroup: 'Puissance',
    aliases: [
      'med ball chest throw',
      'chest pass med ball',
      'lancer poitrine med ball'
    ]
  }),
  scoringEntry('Medicine ball rotational throw', 'reps', 4, 1.05, {
    muscleGroup: 'Puissance',
    aliases: [
      'rotational med ball throw',
      'lancer rotatif med ball',
      'med ball side throw'
    ]
  }),
  scoringEntry('Medicine ball overhead throw', 'reps', 4, 1.05, {
    muscleGroup: 'Puissance',
    aliases: [
      'overhead med ball throw',
      'lancer overhead med ball',
      'backward med ball throw'
    ]
  }),
  scoringEntry('Power clean', 'reps', 7, 1.6, {
    muscleGroup: 'Haltérophilie',
    aliases: [
      'power clean',
      'épaulé-jeté power',
      'clean power'
    ]
  }),
  scoringEntry('Hang power clean', 'reps', 6, 1.45, {
    muscleGroup: 'Haltérophilie',
    aliases: [
      'hang power clean',
      'hang clean power',
      'épaulé hang power'
    ]
  }),
  scoringEntry('Clean', 'reps', 8, 1.8, {
    muscleGroup: 'Haltérophilie',
    aliases: [
      'squat clean',
      'clean',
      'épaulé complet'
    ]
  }),
  scoringEntry('Clean & jerk', 'reps', 8, 2, {
    muscleGroup: 'Haltérophilie',
    aliases: [
      'clean and jerk',
      'clean & jerk',
      'épaulé-jeté'
    ]
  }),
  scoringEntry('Power snatch', 'reps', 8, 1.8, {
    muscleGroup: 'Haltérophilie',
    aliases: [
      'power snatch',
      'arraché power',
      'snatch power'
    ]
  }),
  scoringEntry('Hang power snatch', 'reps', 7, 1.6, {
    muscleGroup: 'Haltérophilie',
    aliases: [
      'hang power snatch',
      'hang snatch power',
      'arraché hang power'
    ]
  }),
  scoringEntry('Snatch', 'reps', 8, 2, {
    muscleGroup: 'Haltérophilie',
    aliases: [
      'squat snatch',
      'snatch',
      'arraché complet'
    ]
  }),
  scoringEntry('Clean pull', 'reps', 5, 1.2, {
    muscleGroup: 'Haltérophilie',
    aliases: [
      'clean pull',
      'tirage épaulé',
      'pull clean'
    ]
  }),
  scoringEntry('Snatch pull', 'reps', 5, 1.2, {
    muscleGroup: 'Haltérophilie',
    aliases: [
      'snatch pull',
      'tirage arraché',
      'pull snatch'
    ]
  }),
  scoringEntry('High pull', 'reps', 5, 1.15, {
    muscleGroup: 'Haltérophilie',
    aliases: [
      'high pull',
      'tirage haut',
      'barbell high pull'
    ]
  }),
  scoringEntry('Thruster barre', 'reps', 5, 1.3, {
    muscleGroup: 'Haltérophilie',
    aliases: [
      'barbell thruster',
      'thruster barre',
      'thruster'
    ]
  }),
  scoringEntry('Thruster haltères', 'reps', 4, 1.2, {
    muscleGroup: 'Haltérophilie',
    aliases: [
      'dumbbell thruster',
      'thruster haltères',
      'db thruster'
    ]
  }),
  scoringEntry('Back extension', 'reps', 2, 0.75, {
    muscleGroup: 'Dorsaux',
    aliases: [
      'back extension',
      'hyperextension',
      'extension lombaire'
    ]
  }),
  scoringEntry('Back extension lestée', 'reps', 3, 0.9, {
    muscleGroup: 'Dorsaux',
    aliases: [
      'weighted back extension',
      'back extension lestée',
      'hyperextension lestée'
    ]
  }),
  scoringEntry('Jefferson curl', 'reps', 4, 0.75, {
    muscleGroup: 'Ischio-jambiers',
    aliases: [
      'jefferson curl',
      'curl jefferson',
      'flexion jefferson'
    ]
  }),
  scoringEntry('Good morning barre', 'reps', 4, 1, {
    muscleGroup: 'Ischio-jambiers',
    aliases: [
      'barbell good morning',
      'good morning barre',
      'gm barre'
    ]
  }),
  scoringEntry('Good morning haltères', 'reps', 3, 0.85, {
    muscleGroup: 'Ischio-jambiers',
    aliases: [
      'dumbbell good morning',
      'good morning haltères',
      'gm haltères'
    ]
  }),
  scoringEntry('Hip hinge élastique', 'reps', 1, 0.5, {
    muscleGroup: 'Ischio-jambiers',
    aliases: [
      'band hip hinge',
      'hip hinge élastique',
      'hinge bande'
    ]
  }),
  scoringEntry('Kettlebell clean', 'reps', 5, 1.1, {
    muscleGroup: 'Puissance',
    aliases: [
      'kb clean',
      'kettlebell clean',
      'clean kettlebell'
    ]
  }),
  scoringEntry('Kettlebell clean & press', 'reps', 6, 1.35, {
    muscleGroup: 'Puissance',
    aliases: [
      'kb clean and press',
      'kettlebell clean press',
      'clean & press kb'
    ]
  }),
  scoringEntry('Kettlebell snatch', 'reps', 7, 1.45, {
    muscleGroup: 'Puissance',
    aliases: [
      'kb snatch',
      'kettlebell snatch',
      'arraché kettlebell'
    ]
  })
];
