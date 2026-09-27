/**
 * Manifeste appliqué : uniquement EXACT et HIGH_CONFIDENCE
 * sur des fiches déjà présentes (exercices ou étirements).
 * Aucune carte nouvelle.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { makeExercise, matchIndividual, mediaProfile } from './build-match-proposals.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const REPO = path.resolve(ROOT, '..');
const OUT = path.join(REPO, 'src/data/bankMediaManifest.json');

const APPLY = new Set(['EXACT', 'HIGH_CONFIDENCE']);

/** Vidéos laissées en probable ou sans lien, alors que la fiche existe déjà. */
const REVIEWED_EXISTING_VIDEOS = [
  ['videos muscles/Leg Curl allongé.mp4', 'db:leg curl allongé'],
  ['videos muscles/curl marteau.mp4', 'db:curl marteau'],
  ['videos muscles/good morning.mp4', 'db:good morning'],
  ['videos muscles/leg extension.mp4', 'db:leg extension'],
  ['videos muscles/pompes classiques.mp4', 'db:pompes'],
  ['videos muscles/pompes classiques 2.mp4', 'db:pompes'],
  ['videos muscles/pompes classiques 3.mp4', 'db:pompes'],
  ['videos muscles/soulevé de terre.mp4', 'db:soulevé de terre'],
  ['videos muscles/traction australienne prise pronation.mp4', 'db:tractions australiennes'],
  ['videos muscles/tirage vertical toutes les variantes.mp4', 'db:tirage vertical'],
  ['videos muscles/pecs a la poulie debout toutes les variantes.mp4', 'db:écarté poulie haute'],
  ['videos muscles/pecs a la poulie debout toutes les variantes.mp4', 'db:écarté poulie médiane'],
  ['videos muscles/pecs a la poulie debout toutes les variantes.mp4', 'db:écarté poulie basse'],
  ['videos muscles/pec fly a la poulie.mp4', 'db:écarté poulie médiane'],
  ['videos muscles/pec fly a la poulie.mp4', 'db:écarté poulie basse'],
  ['videos muscles/toutes les variantes de pec fly a la poulie 2.mp4', 'db:écarté poulie haute'],
  ['videos muscles/toutes les variantes de pec fly a la poulie 2.mp4', 'db:écarté poulie médiane'],
  ['videos muscles/toutes les variantes de pec fly a la poulie 2.mp4', 'db:écarté poulie basse'],
  ['videos muscles/pec fly poulie haute.mp4', 'db:écarté poulie haute'],
  ['videos muscles/curl concentration assis .mp4', 'db:curl concentration'],
  ['videos muscles/curl concentration assis.mp4', 'db:curl concentration'],
  ['videos muscles/developpé couché incliné a la barre .mp4', 'db:développé incliné'],
  ['videos muscles/fente avec halteres.mp4', 'db:fentes'],
  ['videos muscles/leg press 2.mp4', 'db:presse à cuisses'],
  ['videos muscles/leg press 3.mp4', 'db:presse à cuisses'],
  ['videos muscles/shrugs aux halteres.mp4', 'db:shrugs'],
  ['videos muscles/dips mains sur banc.mp4', 'db:dips triceps'],
  ['videos muscles/développé militaire barre droite debout .mp4', 'db:développé militaire'],
  ['videos muscles/extension triceps a la corde 2.mp4', 'db:extension poulie corde'],
  ['videos muscles/extension tricpes poulie.mp4', 'db:extension poulie'],
  ['videos muscles/oiseaux haltères 2.mp4', 'db:oiseau'],
  ['videos muscles/oiseaux haltères assis.mp4', 'db:oiseau'],
  ['videos muscles/rowing barre droite.mp4', 'db:rowing barre'],
  ['videos muscles/rowing bucheron en appui su rle banc.mp4', 'db:rowing haltère'],
  ['videos muscles/rowing bucheron main sur banc 2.mp4', 'db:rowing haltère'],
  ['videos muscles/curl pupitre barre ez .mp4', 'db:curl pupitre'],
  ['videos muscles/fentes bulgares poids du corps .mp4', 'db:fentes bulgares'],
  ['videos muscles/pec fly a la machine.mp4', 'db:pec deck'],
  ['videos muscles/Cable Straight-Arm Pulldown.mp4', 'db:pull-over poulie haute'],
  ['videos muscles/extension triceps avec une haltere assis.mp4', 'db:extension nuque haltère assis'],
  ['videos muscles/extension triceps debout avec deux haltères.mp4', 'db:extension triceps debout haltère'],
  ['videos muscles/squat haltère .mp4', 'db:squat gobelet'],
  ['videos muscles/hip thrust halteres.mp4', 'db:hip thrust'],
  ['videos muscles/Hip Thrust au poids du corps variantes .mp4', 'db:hip thrust'],
  ['videos muscles/one arm push up.mp4', 'db:one arm push-up'],
  ['videos muscles/extension mollet debout toutes les variantes.mp4', 'db:mollets unilatéraux'],
  ['videos muscles/extension mollets debout variantes.mp4', 'db:mollets unilatéraux'],
  ['videos muscles/extension mollet debout toutes les variantes.mp4', 'db:élévations de mollets pointes extérieur'],
  ['videos muscles/extension mollets debout variantes.mp4', 'db:élévations de mollets pointes extérieur'],
  ['videos muscles/extension mollet debout toutes les variantes.mp4', 'db:élévations de mollets pointes intérieur'],
  ['videos muscles/extension mollets debout variantes.mp4', 'db:élévations de mollets pointes intérieur'],
  ['videos muscles/squat machine.mp4', 'db:hack squat'],
  ['videos muscles/presse verticale.mp4', 'db:presse verticale'],
  ['videos muscles/développé couché smith machine.mp4', 'db:développé couché smith'],
  ['videos muscles/développé militaire smith machine.mp4', 'db:développé militaire smith'],
  ['videos muscles/squat smith machine.mp4', 'db:squat smith'],
  ['videos muscles/squat sumo.mp4', 'db:squat sumo'],
  ['videos muscles/squat sumo 2.mp4', 'db:squat sumo'],
  ['videos muscles/developpe militaire halteres.mp4', 'db:développé militaire haltères'],
  ['videos muscles/rowing haltère debout.mp4', 'db:rowing haltère debout'],
  ['videos muscles/kickback à la poulie.mp4', 'db:kickback triceps poulie'],
  ['videos muscles/rear delt fly à la machine.mp4', 'db:oiseau machine'],
  ['videos muscles/adductor et abductor press.mp4', 'db:presse adducteurs abducteurs'],
  ['videos muscles/extension triceps barre ez.mp4', 'db:extension triceps barre ez'],
  ['videos muscles/Reverse Hand Plank Lean.mp4', 'db:planche inversée penchée'],
  ['videos muscles/pompes classiques et bodyweight triceps extension.mp4', 'db:pompes et extension triceps'],
  ['videos muscles/curl biceps.mp4', 'db:curl haltères'],
  ['deuxieme dossier gif/0052.mp4', 'db:pec deck'],
  ['deuxieme dossier gif/0054.mp4', 'db:assault bike'],
  ['deuxieme dossier gif/0055.mp4', 'db:front squat'],
  ['deuxieme dossier gif/0056.mp4', 'db:fentes bulgares barre'],
  ['deuxieme dossier gif/0057.mp4', 'db:front squat'],
  ['deuxieme dossier gif/0058.mp4', 'db:développé couché'],
  ['deuxieme dossier gif/0059.mp4', 'db:fentes barre'],
  ['deuxieme dossier gif/0060.mp4', 'db:fentes'],
  ['deuxieme dossier gif/0061.mp4', 'db:soulevé de terre'],
  ['deuxieme dossier gif/0064.mp4', 'db:fentes bulgares'],
  ['deuxieme dossier gif/0065.mp4', 'db:squat gobelet'],
  ['deuxieme dossier gif/0066.mp4', 'db:soulevé de terre roumain haltères'],
  ['deuxieme dossier gif/0067.mp4', 'db:squat sauté haltères'],
  ['deuxieme dossier gif/0068.mp4', 'db:vélo elliptique'],
  ['deuxieme dossier gif/0069.mp4', 'db:hack squat'],
  ['deuxieme dossier gif/0070.mp4', 'db:abduction hanche machine assise'],
  ['deuxieme dossier gif/0072.mp4', 'db:kettlebell swings'],
  ['deuxieme dossier gif/0074.mp4', 'db:leg curl assis'],
  ['deuxieme dossier gif/0075.mp4', 'db:presse à cuisses'],
  ['deuxieme dossier gif/0076.mp4', 'db:leg curl allongé'],
  ['deuxieme dossier gif/0077.mp4', 'db:cordes ondulatoires'],
  ['deuxieme dossier gif/0078.mp4', 'db:rameur indoor'],
  ['deuxieme dossier gif/0080.mp4', 'db:leg extension'],
  ['deuxieme dossier gif/0081.mp4', 'db:développé militaire haltères assis'],
  ['deuxieme dossier gif/0082.mp4', 'db:step-up'],
  ['deuxieme dossier gif/0083.mp4', 'db:montée d\'escaliers'],
  ['deuxieme dossier gif/0084.mp4', 'db:vélo elliptique'],
  ['deuxieme dossier gif/0085.mp4', 'db:soulevé de terre'],
  ['deuxieme dossier gif/0086.mp4', 'db:extension poulie corde'],
  ['deuxieme dossier gif/0088.mp4', 'db:développé militaire haltères assis'],
  ['deuxieme dossier gif/0089.mp4', 'db:développé militaire'],
  ['deuxieme dossier gif/0090.mp4', 'db:tirage menton barre'],
  ['deuxieme dossier gif/0091.mp4', 'db:développé militaire haltères'],
  ['deuxieme dossier gif/0092.mp4', 'db:tirage menton haltères'],
  ['deuxieme dossier gif/0093.mp4', 'db:élévations frontales'],
  ['deuxieme dossier gif/0095.mp4', 'db:développé militaire kettlebell'],
  ['deuxieme dossier gif/0096.mp4', 'db:écarté poulie basse'],
  ['deuxieme dossier gif/0097.mp4', 'db:élévations latérales'],
  ['deuxieme dossier gif/0098.mp4', 'db:chest press debout machine'],
  ['deuxieme dossier gif/0099.mp4', 'db:développé militaire smith'],
  ['deuxieme dossier gif/0100.mp4', 'db:oiseau machine'],
  ['deuxieme dossier gif/0053.mp4', 'db:élévation frontale au disque'],
  ['deuxieme dossier gif/0062.mp4', 'db:kickback fessier à la poulie'],
  ['deuxieme dossier gif/0063.mp4', "db:vélo d'appartement HIIT"],
  ['deuxieme dossier gif/0079.mp4', 'db:course sur tapis'],
  ['deuxieme dossier gif/0087.mp4', 'db:marche sur tapis'],
  ['deuxieme dossier gif/0094.mp4', "db:élévation au disque jusqu'au-dessus de la tête"]
];
const REVIEWED_STRETCH_VIDEOS = [
  ['deuxieme dossier gif/0071.mp4', 'stretch:montee_genoux']
];

/** GIF dont le nom est la fiche, plus un équipement déjà accepté par cette fiche. */
const REVIEWED_EXISTING_GIFS = [
  ['troisieme dossier gif/biceps/barbell-preacher-curl.gif', 'db:curl pupitre'],
  ['troisieme dossier gif/biceps/dumbbell-preacher-curl.gif', 'db:curl pupitre'],
  ['troisieme dossier gif/calves/dumbbell-standing-calf-raise.gif', 'db:mollets debout'],
  ['troisieme dossier gif/calves/lever-standing-calf-raise.gif', 'db:mollets debout'],
  ['troisieme dossier gif/delts/band-y-raise.gif', 'db:y raise debout'],
  ['troisieme dossier gif/delts/dumbbell-cuban-press.gif', 'db:cuban press'],
  ['troisieme dossier gif/forearms/barbell-reverse-wrist-curl.gif', 'db:reverse wrist curl'],
  ['troisieme dossier gif/forearms/dumbbell-reverse-wrist-curl.gif', 'db:reverse wrist curl'],
  ['troisieme dossier gif/glutes/dumbbell-stiff-leg-deadlift.gif', 'db:soulevé de terre jambes tendues'],
  ['troisieme dossier gif/glutes/kettlebell-goblet-squat.gif', 'db:squat gobelet'],
  ['troisieme dossier gif/quads/dumbbell-goblet-squat.gif', 'db:squat gobelet'],
  ['troisieme dossier gif/lats/cable-straight-arm-pulldown.gif', 'db:pull-over poulie haute'],
  ['troisieme dossier gif/traps/barbell-shrug.gif', 'db:shrugs'],
  ['troisieme dossier gif/traps/dumbbell-shrug.gif', 'db:shrugs'],
  ['troisieme dossier gif/triceps/barbell-lying-triceps-extension.gif', 'db:barre au front'],
  ['troisieme dossier gif/upper-back/lever-t-bar-row.gif', 'db:t-bar row'],
  ['troisieme dossier gif/upper-back/barbell-bent-over-row.gif', 'db:rowing barre'],
  ['troisieme dossier gif/upper-back/dumbbell-one-arm-bent-over-row.gif', 'db:rowing haltère'],
  ['troisieme dossier gif/delts/barbell-upright-row-v-2.gif', 'db:tirage menton barre']
];

const CIRCUIT_OVERRIDES = {
  'videos muscles/routines/routine triceps.mp4': {
    title: 'Triceps Isolation — extension au-dessus de la tête + kickback + poulie',
    targetRounds: 3,
    restBetweenRoundsSec: 90,
    defaultTargetReps: 12,
    exerciseKeys: [
      'extension triceps debout haltère',
      'kickbacks triceps',
      'extension poulie'
    ],
    description: `Circuit — spécialisation triceps

Ordre de la vidéo :
1. Extension triceps au-dessus de la tête, debout, haltère
2. Kickback triceps, haltère
3. Extension triceps à la poulie

Niveau          Séries    Reps / exercice    Charge indicative    Repos entre tours
Débutant        2–3       12–15              2–8 kg               90–120 s
Intermédiaire   3         10–15              5–15 kg              75–120 s
Expérimenté     3–4       8–15               8–20 kg              60–120 s
Bodybuilder     3–4       8–15               10–25+ kg            60–90 s

Ces fourchettes sont volontairement larges. Le kickback se fait presque toujours plus léger que l’extension à la poulie et que l’extension au-dessus de la tête : le bras est déjà en arrière, le levier est long, et la technique casse avant le muscle si la charge est la même. Le bon poids, sur chaque exercice, est celui qui laisse finir la série avec environ 1 à 3 répétitions en réserve et une technique encore propre.

Utilité

Bloc entièrement consacré aux triceps. Les trois mouvements étendent le coude, donc le volume, les répétitions et la fatigue restent sur le même muscle au lieu de se disperser. Enchaîner trois variantes proches maintient la sollicitation quand la première série a déjà fatigué : la charge ou les reps peuvent baisser, le triceps continue de travailler.

Les positions du bras ne sont pas les mêmes. Au-dessus de la tête, l’épaule est fléchie et le chef long est étiré. Au kickback, le bras est en arrière et le triceps travaille en course courte, avec une charge forcément plus modeste. À la poulie, le coude est fixe le long du corps et la tension reste présente jusqu’en bas, là où l’haltère se repose. Le stimulus est donc moins monotone que trois fois le même geste, sans devenir un entraînement du haut du corps.

Utile pour prendre du volume sur les triceps, poser un bloc de spécialisation, ou finir une séance push. Les formats en 12–15 répétitions ajoutent de l’endurance musculaire locale. En revanche, la mécanique reste très proche d’un exercice à l’autre : peu de diversité musculaire, peu d’intérêt pour la force maximale. La logique est l’hypertrophie, le volume local et une fatigue contrôlée.

Lecture par niveau

Débutant : apprendre le coude fixe, garder de la marge, charges basses. L’échec n’est pas le but.
Intermédiaire : vrai bloc d’hypertrophie, assez de volume pour progresser, la technique reste prioritaire.
Expérimenté : séries plus proches de l’échec, charge ou volume qui montent. Le circuit peut servir de spécialisation.
Bodybuilder : volume ciblé, tempo tenu, amplitude stable, séries parfois très proches de l’échec. Ce volume se compte avec le reste de la séance et de la semaine, pas tout seul.

En résumé

Dominante : hypertrophie des triceps
Secondaire : endurance musculaire locale
Densité musculaire : très élevée
Diversité musculaire : faible
Force maximale : faible à modérée
Spécialisation : excellente
Circuit complet à lui seul : non
Meilleur contexte : séance bras, séance push, ou bloc de spécialisation triceps.`
  },
  'videos muscles/routines/routine 3 exercices qui remplacent des exercices sur machine .mp4': {
    title: 'Leg Unilateral — squat haltères + fentes + pistol haltère',
    targetRounds: 3,
    restBetweenRoundsSec: 150,
    defaultTargetReps: 10,
    exerciseKeys: [
      'squat haltères',
      'fentes',
      'pistol squat haltère'
    ],
    description: `Circuit — Leg Unilateral

Ordre de la vidéo :
1. Squat avec haltères
2. Fentes avec haltères
3. Pistol squat avec haltère

Niveau          Séries    Reps / exercice    Charge indicative*    Repos entre tours
Débutant        2–3       8–12               4–12 kg               120–180 s
Intermédiaire   3         8–12               8–20 kg               120–180 s
Expérimenté     3–4       8–12               12–30 kg              120–180 s
Bodybuilder     3–4       8–15               16–40+ kg             120–240 s

* Charge totale quand tu tiens deux haltères. Ce sont des repères, pas des standards. La technique, l’amplitude et le matériel font bouger la charge utile. Le pistol se charge en général bien plus léger que le squat : l’équilibre et la mobilité limitent souvent avant le muscle.

Équivalences salle

Squat avec haltères — charge libre, les deux jambes — proche du rôle d’un hack squat.
Fentes avec haltères — unilatéral libre — proche du rôle des fentes à la Smith.
Pistol squat avec haltère — unilatéral très exigeant — proche du rôle d’une presse à cuisses unilatérale.

Ces équivalences ne disent pas que les gestes sont les mêmes. Elles disent leur place dans la séance : une grosse sollicitation des jambes, avec une paire d’haltères, quand les machines ne sont pas là.

Utilité

Alternative haltères à une partie de séance jambes de salle. La logique ressemble à hack squat, puis fentes guidées, puis presse unilatérale, avec beaucoup moins de matériel.

Le squat haltères ouvre : les deux jambes, de la charge, du volume. Les fentes passent sur une jambe en mouvement, avec de la stabilité, et chaque jambe doit produire sa part. Le pistol ferme : force relative, équilibre, mobilité, contrôle. La progression est charge globale, puis unilatéral, puis contrôle.

Quadriceps et fessiers portent le circuit. Adducteurs, ischio-jambiers, mollets et stabilisateurs de hanche et de cheville suivent. Plus on avance, plus une jambe travaille seule, donc les écarts de force et de contrôle entre les deux côtés se voient.

Pourquoi ça remplace des machines

Avec une paire d’haltères, la séance reste exigeante sans hack squat, sans Smith et sans presse. Les haltères demandent plus de stabilisation. La charge maximale est en général plus basse. L’équilibre peut lâcher avant le muscle visé. Le pistol demande bien plus de mobilité et de contrôle qu’une presse unilatérale. Les machines, elles, laissent monter la charge plus simplement et plus haut.

Utile à la maison, en déplacement, ou dans une salle peu équipée. Utile aussi en salle, volontairement, pour ajouter du travail libre et unilatéral.

Lecture par niveau

Débutant : maîtriser les trois gestes, contrôler la descente, charger peu à peu. Le pistol peut s’aider d’un support ou d’une amplitude plus courte avant d’être libre.
Intermédiaire : la charge devient vraiment stimulante. Le circuit développe le volume des quadriceps et des fessiers, et le travail sur une jambe.
Expérimenté : plus de volume, plus de charge, plus près de l’échec. Le squat accumule la tension, les deux suivants continuent malgré la fatigue.
Bodybuilder : le squat et les fentes portent l’hypertrophie. Le pistol apporte surtout l’unilatéral et le contrôle. Le charger lourd n’est pas obligatoire : le geste est déjà dur.

Profil

Dominante : quadriceps + fessiers
Secondaire : adducteurs, ischio-jambiers, mollets, stabilisateurs
Force : élevée
Hypertrophie : élevée
Travail unilatéral : très élevé
Stabilité / équilibre : très élevé
Mobilité : importante
Endurance musculaire : modérée à élevée
Dépendance au matériel : faible
Alternative aux machines : excellente
Diversité musculaire : bonne, centrée sur les jambes
Meilleur contexte : maison, salle peu équipée, déplacement, ou séance jambes aux haltères.

En une phrase

Leg Unilateral remplace à peu près le hack squat, les fentes à la Smith et la presse unilatérale par trois mouvements aux haltères, avec plus de stabilisation, de contrôle et de travail sur une jambe.`
  },
  'videos muscles/routines/routine biceps.mp4': {
    title: 'Biceps Incline — spider + curl incliné + marteau incliné',
    targetRounds: 3,
    restBetweenRoundsSec: 90,
    defaultTargetReps: 10,
    exerciseKeys: [
      'curl spider',
      'curl incliné',
      'curl marteau incliné'
    ],
    description: `Circuit — Biceps Incline

Ordre de la vidéo :
1. Curl spider
2. Curl incliné
3. Curl marteau incliné

Niveau          Séries    Reps / exercice    Charge indicative*    Repos entre tours
Débutant        2–3       10–15              3–7 kg / haltère      90–120 s
Intermédiaire   3         8–12               5–10 kg / haltère     90–120 s
Expérimenté     3–4       8–12               7–14 kg / haltère     75–120 s
Bodybuilder     3–4       8–15               8–18+ kg / haltère    60–120 s

* Charges indicatives par haltère. Elles ne constituent pas une norme : le niveau réel, le banc, l’amplitude, la morphologie et surtout la qualité d’exécution peuvent modifier fortement la charge appropriée. Le spider se charge en général moins lourd que le curl marteau incliné.

Les trois mouvements

Curl spider — poitrine contre le dossier incliné, bras pendants vers le sol, ce qui limite fortement l’élan du buste.
Curl incliné — dos sur le banc, bras derrière le buste, supination complète, forte amplitude.
Curl marteau incliné — même banc, prise neutre : les fléchisseurs du coude continuent, avec plus de brachial et de brachio-radial.

Utilité

Biceps Incline cherche moins à multiplier les exercices qu’à exploiter trois configurations du curl, toutes sur banc incliné. Le volume reste sur les fléchisseurs du coude : dominante biceps, et une part nette pour le brachial et le brachio-radial.

Les trois gestes ne placent pas le bras de la même façon. Le curl incliné ouvre l’épaule : le bras part derrière le buste, l’amplitude est longue, la supination est complète. Le spider retourne la position, poitrine contre le dossier, et coupe une grande partie des compensations : la sollicitation reste ciblée quand la fatigue est déjà là. Le curl marteau incliné garde le banc, change la prise, et déplace un peu l’accent vers l’ensemble des fléchisseurs.

L’intérêt des trois positions, indépendamment de l’ordre filmé : amplitude importante, puis isolation stricte, puis prise neutre et développement global du bras.

Le circuit sert l’hypertrophie, le contrôle, le volume local et le travail des bras sous plusieurs positions. Il peut être le bloc principal d’une séance biceps courte, ou la finition après des tirages.

La limite est volontaire. Les trois exercices restent des variantes de curl : forte spécialisation, peu de diversité. Ça complète une séance dos ou pull. Ce n’est pas un entraînement du haut du corps.

Lecture par niveau

Débutant : apprentissage et construction de base. Le volume reste modéré. L’amplitude, le contrôle, et la capacité à faire les trois variantes sans élan passent avant la charge.
Intermédiaire : hypertrophie. Le circuit devient un vrai bloc de bras. Les trois positions accumulent du volume sans répéter exactement le même geste, et l’échec se rapproche peu à peu.
Expérimenté : spécialisation. Plus de volume, plus près de l’échec. Le spider sert surtout à garder une exécution stricte quand les deux autres ont déjà fatigué les bras.
Bodybuilder : hypertrophie ciblée. La qualité du volume compte plus que la charge maximale. Les séries peuvent aller très près de l’échec, amplitude tenue. Le curl marteau incliné complète l’épaisseur du bras.

Profil

Hypertrophie : ★★★★★
Spécialisation biceps : ★★★★★
Travail sous amplitude importante : ★★★★★
Contrôle / isolation : ★★★★★
Brachial / épaisseur du bras : ★★★★
Force maximale : ★★
Endurance musculaire locale : ★★★★
Diversité des prises : ★★★★
Diversité musculaire globale : ★★
Dépendance au matériel : faible
Meilleur contexte : séance bras, pull, ou spécialisation biceps

En une phrase

Biceps Incline combine un curl en position étirée, un spider particulièrement strict et un curl marteau incliné pour accumuler du volume sur les fléchisseurs du coude, avec une dominante biceps et une contribution nette à l’épaisseur du bras.`
  },
  'videos muscles/routines/routine abdos.mp4': {
    title: 'Wall Core & Glutes — crunch au mur + hip thrust au mur',
    targetRounds: 3,
    restBetweenRoundsSec: 90,
    defaultTargetReps: 15,
    exerciseKeys: [
      'crunch au mur',
      'crunch au mur haltère',
      'hip thrust pieds au mur',
      'crunch au mur pieds décollés'
    ],
    description: `Circuit — Wall Core & Glutes

Ordre de la vidéo :
1. Crunch au mur
2. Crunch au mur haltère
3. Hip thrust pieds au mur
4. Crunch au mur pieds décollés

Niveau          Séries    Reps / exercice    Charge indicative*    Repos entre tours
Débutant        2–3       12–20              0–5 kg                90–120 s
Intermédiaire   3         12–20              5–10 kg               90–120 s
Expérimenté     3–4       10–20              8–15 kg               75–120 s
Bodybuilder     3–4       10–20              10–25+ kg             60–120 s

* Charge indicative lorsqu’un haltère est utilisé. Pour les crunchs, l’haltère est tenu contre la poitrine ou au-dessus du torse. Pour le hip thrust, il est sur le bassin. Les charges ne se comparent donc pas d’un exercice à l’autre.

Les quatre mouvements

Crunch au mur — pieds contre le mur, jambes fléchies, flexion du tronc.
Crunch au mur haltère — le même geste, avec une charge pour durcir progressivement.
Hip thrust pieds au mur — extension de hanche, pieds en appui au mur, haltère sur le bassin.
Crunch au mur pieds décollés — les pieds quittent le mur à chaque répétition, avec l’haltère. Plus de contrôle du bassin et du tronc.

Utilité

Wall Core & Glutes développe le tronc et les fessiers avec très peu de matériel. Les quatre exercices tournent autour du mur, et la difficulté monte par la charge, le contrôle du bassin et la stabilité des jambes.

Ça commence par un crunch accessible, puis l’haltère. Le hip thrust change ensuite complètement de geste : l’extension de hanche. On revient ensuite à un crunch plus dur, où les pieds ne restent plus collés au mur.

Le circuit couvre plusieurs fonctions du complexe abdominaux, bassin et hanches : flexion du tronc, contrôle du bassin, stabilité du centre, extension de hanche. Le hip thrust porte la force et l’hypertrophie des fessiers. Les crunchs au mur portent le droit de l’abdomen et le contrôle du tronc.

Utile à la maison : peu de matériel, beaucoup de contrôle, et une progression sans machine. L’haltère sert quand le poids du corps devient trop facile.

Ça développe surtout l’endurance et l’hypertrophie locale des abdominaux, la force des fessiers et le contrôle lombo-pelvien. Ce n’est pas un circuit de force maximale, ni un développement complet de la chaîne postérieure : rien ici ne charge lourdement les ischio-jambiers.

Lecture par niveau

Débutant : contrôle du tronc et apprentissage. Le poids du corps suffit. Le bassin reste placé, le geste ne part pas de l’élan.
Intermédiaire : volume et résistance. L’haltère durcit le circuit. Ça devient un vrai complément de sangle et de fessiers.
Expérimenté : intensité locale. Volume et charge peuvent monter. Les pieds décollés demandent plus de contrôle. Le circuit peut être un bloc, pas seulement un finisher.
Bodybuilder : hypertrophie ciblée. On accumule de la tension sur les abdominaux et les fessiers. L’haltère surcharge. Les variantes sans appui durcissent le geste sans obliger à charger beaucoup plus.

Profil

Abdominaux : ★★★★★
Contrôle du bassin : ★★★★★
Fessiers : ★★★★
Hypertrophie locale : ★★★★
Endurance musculaire : ★★★★★
Stabilité du tronc : ★★★★
Force maximale : ★★
Chaîne postérieure complète : ★★
Travail à domicile : ★★★★★
Dépendance au matériel : très faible
Progression avec charge : bonne
Diversité musculaire : modérée
Meilleur contexte : core, abdos, séance bas du corps, ou finisher

En une phrase

Wall Core & Glutes demande très peu de matériel et combine un travail abdominal chargé, le contrôle du bassin et l’extension de hanche, des crunchs au mur jusqu’aux variantes lestées et sans appui des pieds.`
  },
  'videos muscles/routines/routine biceps 2 .mp4': {
    title: 'Biceps Isolation — incliné + pupitre unilatéral + dos calé',
    targetRounds: 3,
    restBetweenRoundsSec: 90,
    defaultTargetReps: 10,
    exerciseKeys: [
      'curl incliné',
      'curl pupitre unilatéral',
      'curl assis dos calé'
    ],
    description: `Circuit — Biceps Isolation

Ordre de la vidéo :
1. Curl incliné
2. Curl pupitre unilatéral
3. Curl assis dos calé

Niveau          Séries    Reps / exercice    Charge indicative*    Repos entre tours
Débutant        2–3       10–15              3–7 kg / haltère      90–120 s
Intermédiaire   3         8–12               5–10 kg / haltère     90–120 s
Expérimenté     3–4       8–12               7–14 kg / haltère     75–120 s
Bodybuilder     3–4       8–15               8–18+ kg / haltère    60–120 s

* Charge indicative par haltère. Le pupitre unilatéral et le curl dos calé se chargent en général moins lourd qu’un curl incliné, parce qu’il reste peu de place pour compenser.

Les trois mouvements

Curl incliné — dos contre le banc incliné, bras légèrement derrière le buste, forte amplitude.
Curl pupitre unilatéral — un bras stabilisé sur le pupitre, un côté après l’autre, très peu d’élan.
Curl assis dos calé — dos et épaules contre le dossier, pour empêcher le buste d’aider. Un mur rend le même service s’il n’y a pas de banc.

Utilité

Biceps Isolation vise la qualité du travail direct des biceps plus que la charge déplacée. Les trois exercices réduisent peu à peu les compensations, et le volume reste sur les fléchisseurs du coude.

Le curl incliné apporte l’amplitude, bras derrière le buste. Le pupitre unilatéral change la contrainte : le bras est calé, chaque côté travaille seul. Le curl assis, dos au dossier, impose une exécution très contrôlée en coupant l’élan du torse.

Le circuit combine amplitude, isolation, contrôle et travail unilatéral. Ce n’est pas un circuit pour faire monter vite les charges. C’est un moyen d’accumuler du volume propre, technique stricte.

Le pupitre unilatéral empêche aussi qu’un bras plus fort prenne le dessus. Utile pour l’hypertrophie des biceps, ou pour une spécialisation où la qualité compte plus que les kilos.

La limite est celle des circuits de spécialisation : les trois gestes visent les mêmes fonctions. Ça complète une séance pull ou bras. Ce n’est pas un entraînement du membre supérieur.

Lecture par niveau

Débutant : apprentissage et contrôle. Des haltères légers suffisent. La trajectoire reste propre, le buste ne prend pas le relais.
Intermédiaire : hypertrophie. Bloc de volume direct. Changer de position permet de continuer alors que la fatigue monte.
Expérimenté : spécialisation. On peut se rapprocher de l’échec sans lâcher la technique. Le unilatéral montre les écarts entre les deux bras.
Bodybuilder : isolation et volume de qualité. La charge passe après la tension, l’amplitude et le contrôle. Les dernières séries peuvent frôler l’échec sans charges très lourdes.

Profil

Hypertrophie biceps : ★★★★★
Isolation : ★★★★★
Contrôle technique : ★★★★★
Travail sous amplitude importante : ★★★★
Travail unilatéral : ★★★★
Endurance musculaire locale : ★★★★
Force maximale : ★★
Possibilité de tricher : faible
Progression en charge : modérée
Diversité musculaire : faible
Dépendance au matériel : faible à modérée
Meilleur contexte : séance bras, pull, ou spécialisation biceps

En une phrase

Biceps Isolation privilégie la qualité de la contraction et la maîtrise du geste, avec un curl en position étirée, une isolation unilatérale au pupitre et un curl strict dos calé.`
  },
  'videos muscles/routines/routine bas du corps cage a squat.mp4': {
    title: 'Smith Lower Body — hip thrust + bulgares + good morning + mollets',
    targetRounds: 3,
    restBetweenRoundsSec: 150,
    defaultTargetReps: 10,
    exerciseKeys: [
      'hip thrust smith',
      'fentes bulgares smith',
      'good morning smith',
      'mollets smith sur step'
    ],
    description: `Circuit — Smith Lower Body

Ordre de la vidéo :
1. Hip thrust Smith
2. Fentes bulgares Smith
3. Good morning Smith
4. Mollets Smith sur step

Niveau          Séries    Reps / exercice    Charge indicative*    Repos entre tours
Débutant        2–3       10–15              20–40 kg              120–180 s
Intermédiaire   3         8–12               35–70 kg              120–180 s
Expérimenté     3–4       8–12               60–110 kg             120–240 s
Bodybuilder     3–4       8–15               80–150+ kg            120–240 s

* Charge totale sur la barre. Les Smith n’ont pas toutes la même barre ni le même contrepoids : les kilos affichés ne se comparent pas d’une machine à l’autre. Sur les mollets, une charge bien plus basse suffit souvent.

Les quatre mouvements

Hip thrust Smith — extension de hanche vers les fessiers, trajectoire guidée, facile à charger.
Fentes bulgares Smith — unilatéral quadriceps et fessiers, plus stable que la version libre.
Good morning Smith — charnière de hanche : ischio-jambiers, fessiers, érecteurs.
Mollets Smith sur step — triceps sural en grande amplitude, le step augmente la dorsiflexion.

Utilité

Smith Lower Body couvre le bas du corps plus largement que les circuits d’un seul pattern. Quatre fonctions : extension de hanche, unilatéral, charnière, flexion plantaire.

Le hip thrust ouvre, stable et chargeable, beaucoup de tension sur les fessiers. Les bulgares passent sur une jambe : chaque côté produit sa part, la stabilité demandée monte. Le good morning change de dominante : plus une charnière, avec un étirement de la chaîne postérieure, donc les ischio-jambiers entrent vraiment. Les mollets sur step ferment sur le bas de jambe, en amplitude.

La logique : fessiers, puis jambes unilatérales, puis chaîne postérieure, puis mollets. Quatre exercices, une grande partie du membre inférieur, sans répéter quatre fois le même geste.

Ce que le circuit exploite particulièrement bien

Hypertrophie globale des jambes
Fessiers fortement sollicités
Quadriceps, surtout via les bulgares
Ischio-jambiers et chaîne postérieure
Travail unilatéral
Force et stabilité du membre inférieur
Mollets en grande amplitude
Progression de charge facilitée
Trajectoire stable pour suivre les perfs

La Smith retire une partie de la stabilisation de la barre. L’effort se concentre davantage sur les muscles visés, et la charge progresse plus simplement. Cette stabilité est aussi la limite : ce n’est pas le squat libre, le soulevé libre, ni des fentes libres. Très bon pour le muscle, moins représentatif de la force en charge libre.

Lecture par niveau

Débutant : construction de la base. Le volume reste modéré. On apprend les quatre gestes et une charge contrôlée, sans chercher l’échec à chaque série. Le good morning monte plus prudemment que le hip thrust : la charnière et le tronc passent avant la charge.
Intermédiaire : développement musculaire. Trois séries suffisent déjà à un vrai entraînement bas du corps, entre quadriceps, fessiers, ischio-jambiers et mollets. On ajoute de la charge quand le haut des répétitions est propre.
Expérimenté : volume et surcharge progressive. Quatre séries, plus près de l’échec, surtout au hip thrust, aux bulgares et aux mollets. La fatigue des premiers gestes pèse sur le good morning : le repos compte.
Bodybuilder : hypertrophie du bas du corps. Trajectoire stable, tension forte. Le hip thrust se charge, les bulgares portent le volume quadriceps et fessiers, le good morning complète la chaîne postérieure, les mollets gardent l’amplitude. Ce n’est pas un test de force maximale.

Profil

Hypertrophie globale jambes : ★★★★★
Fessiers : ★★★★★
Quadriceps : ★★★★
Ischio-jambiers : ★★★★
Mollets : ★★★★
Chaîne postérieure : ★★★★
Travail unilatéral : ★★★★
Stabilité / contrôle : ★★★★
Force : ★★★★
Progression en charge : ★★★★★
Endurance musculaire : ★★★★
Diversité musculaire : ★★★★★
Besoin de matériel : élevé
Meilleur contexte : séance jambes, ou hypertrophie du bas du corps

Équivalences salle

Ces rôles sont fonctionnels. Les gestes ne sont pas identiques.

Mouvement                Fonction                              Alternative
Hip thrust Smith         Extension de hanche, fessiers         Hip thrust machine, hip thrust libre
Fentes bulgares Smith    Unilatéral quadriceps et fessiers     Presse unilatérale, fentes guidées
Good morning Smith       Charnière, chaîne postérieure         RDL, good morning libre
Mollets Smith sur step   Flexion plantaire                     Machine à mollets debout

En une phrase

Smith Lower Body est un circuit bas du corps complet, orienté hypertrophie, qui utilise la Smith pour enchaîner fessiers, quadriceps, chaîne postérieure et mollets, en bilatéral, en unilatéral et en charnière.`
  },
  'videos muscles/routines/routine triceps 2.mp4': {
    title: 'Triceps Extension — barre au front + overhead + kickback',
    targetRounds: 3,
    restBetweenRoundsSec: 90,
    defaultTargetReps: 10,
    exerciseKeys: [
      'barre au front',
      'extension triceps debout haltère',
      'kickbacks triceps'
    ],
    description: `Circuit — Triceps Extension

Ordre de la vidéo :
1. Barre au front
2. Extension triceps au-dessus de la tête, un haltère
3. Kickback triceps

Niveau          Séries    Reps / exercice    Charge indicative*    Repos entre tours
Débutant        2–3       10–15              5–15 kg               90–120 s
Intermédiaire   3         8–12               10–25 kg              90–120 s
Expérimenté     3–4       8–12               15–35 kg              75–120 s
Bodybuilder     3–4       8–15               20–45+ kg             60–120 s

* Barre au front : charge totale sur la barre. Extension au-dessus de la tête : charge de l’haltère. Le kickback se fait presque toujours beaucoup plus léger. L’amplitude et la technique font bouger ces repères.

Les trois mouvements

Barre au front — allongé, la barre descend vers le front. C’est en général le geste qui déplace le plus de charge.
Extension au-dessus de la tête — un haltère, bras au-dessus de la tête, assis ou debout. L’épaule est fléchie, le chef long est étiré.
Kickback — buste penché, charge légère, le coude reste fixe. La finition est dans le contrôle, pas dans les kilos.

Utilité

Triceps Extension spécialise les triceps avec trois extensions du coude assez différentes pour se compléter, tout en gardant le volume sur le même muscle.

La barre pose la tension et le volume. L’haltère au-dessus de la tête change la position du bras. Le kickback ferme, léger, sur la trajectoire et la contraction.

La logique : tension importante, puis travail au-dessus de la tête, puis isolation. Beaucoup de travail direct, sans multiplier les poussées. Utile en hypertrophie, en séance bras, ou en finition après des développés ou des dips.

La diversité reste limitée : les trois gestes étendent le coude. Le circuit ne cherche pas plusieurs groupes. Il change de configuration pour garder du volume sur les triceps.

Ce que le circuit exploite particulièrement bien

Hypertrophie directe des triceps
Accumulation de volume local
Tension mécanique avec la barre
Travail bras au-dessus de la tête
Isolation et contrôle en fin de circuit
Progression de charge sur le premier geste
Proche de l’échec sur les variantes légères
Peu de machines spécialisées

On commence par le geste qui accepte le plus de charge, puis on va vers des exercices où la contraction compte plus que les kilos. La fatigue se gère dans ce sens.

Lecture par niveau

Débutant : apprentissage et base musculaire. Charges modestes, coude stable, pas d’échec sur chaque exercice. L’extension au-dessus de la tête et le kickback apprennent à isoler sans charger lourd.
Intermédiaire : hypertrophie. Trois séries font déjà un volume réel. On se rapproche de l’échec en gardant l’amplitude. La barre surcharge. Les deux suivants complètent plus léger.
Expérimenté : spécialisation. Plus près de l’échec, et les écarts de charge entre les trois gestes sont voulus. Le but n’est pas la même performance partout : continuer à stimuler le muscle malgré la fatigue.
Bodybuilder : hypertrophie ciblée. Lourd et stable d’abord, au-dessus de la tête ensuite, isolation pour finir. Le kickback n’a pas besoin d’être lourd : contraction, amplitude, contrôle.

Profil

Hypertrophie triceps : ★★★★★
Isolation : ★★★★★
Tension mécanique : ★★★★
Travail bras au-dessus de la tête : ★★★★
Contrôle / qualité d’exécution : ★★★★★
Endurance musculaire locale : ★★★★
Force maximale : ★★
Progression en charge : ★★★★
Diversité musculaire : ★★
Spécialisation triceps : ★★★★★
Besoin de matériel : faible à modéré
Meilleur contexte : séance bras, push, ou spécialisation triceps

En une phrase

Triceps Extension enchaîne une extension lourde à la barre, une extension au-dessus de la tête et un kickback pour accumuler du volume sur les triceps, de la tension mécanique vers une isolation plus stricte.`
  }
};

/** Lien nom-à-nom faux : « air bike » du dossier abdos est un Russian twist, pas l'assault bike. */
const BLOCKED_LINKS = new Set([
  'db:assault bike|troisieme dossier gif/abs/air-bike.gif',
  'db:assault bike|quatrieme dossier gif/videos/0003-1ZFqTDN.gif',

  'db:hip thrust|troisieme dossier gif/glutes/barbell-glute-bridge.gif',
  'db:hip thrust unilatéral|troisieme dossier gif/glutes/barbell-glute-bridge.gif',
  'db:pompes|troisieme dossier gif/pectorals/push-up-wall.gif',
  'db:écarté poulie|videos muscles/pec fly a la poulie.mp4',
  'db:écarté poulie|videos muscles/toutes les variantes de pec fly a la poulie 2.mp4',
  'db:écarté poulie|videos muscles/pec fly poulie haute.mp4'
]);

const RUN_GIF = 'troisieme dossier gif/cardio/run.gif';
const SHARED_GIFS = [
  [RUN_GIF, [
    'db:course endurance fondamentale',
    'db:course récupération active',
    'db:course sortie longue',
    'db:course vitesse',
    'db:course tempo',
    'db:course seuil',
    'db:course fartlek',
    'db:course compétition',
    'db:course trail',
    'db:fractionné',
    'db:fractionné 30/30',
    'db:fractionné long VMA',
    'db:sprints en côte',
    'cardio:cardio_run_easy',
    'cardio:cardio_run_long',
    'cardio:cardio_run_endurance',
    'cardio:cardio_run_fartlek',
    'cardio:cardio_run_interval',
    'cardio:cardio_run_threshold',
    'cardio:cardio_run_tempo',
    'cardio:cardio_run_sprint',
    'cardio:cardio_run_speed',
    'cardio:cardio_run_recovery',
    'cardio:cardio_run_race',
    'cardio:cardio_run_trail',
    'cardio:cardio_run_hill'
  ]],
  ['troisieme dossier gif/cardio/jump-rope.gif', [
    'db:double under corde à sauter',
    'cardio:cardio_jumprope'
  ]],
  ['troisieme dossier gif/cardio/cycle-cross-trainer.gif', ['db:assault bike']],
  ['troisieme dossier gif/cardio/walk-elliptical-cross-trainer.gif', ['db:vélo elliptique']],
  ['troisieme dossier gif/cardio/stationary-bike-run-v-3.gif', ['db:vélo d\'appartement HIIT']],
  ['troisieme dossier gif/cardio/walking-on-stepmill.gif', ['db:montée d\'escaliers']],
  ['troisieme dossier gif/triceps/ski-ergometer.gif', ['db:ski erg']],
  ['troisieme dossier gif/lats/wide-grip-pull-up.gif', ['db:tractions explosives poitrine barre']],
  ['troisieme dossier gif/triceps/cable-pushdown.gif', ['db:extension poulie pronation']],
  ['troisieme dossier gif/triceps/cable-pushdown-with-rope-attachment.gif', ['db:extension poulie corde']],
  ['troisieme dossier gif/triceps/cable-reverse-grip-pushdown.gif', ['db:extension poulie supination']],
  ['troisieme dossier gif/triceps/cable-one-arm-tricep-pushdown.gif', ['db:extension unilatérale à la poulie']],
  ['troisieme dossier gif/triceps/dumbbell-standing-triceps-extension.gif', ['db:extension triceps']],
  ['troisieme dossier gif/triceps/dumbbell-seated-triceps-extension.gif', ['db:extension nuque haltère assis']],
  ['troisieme dossier gif/pectorals/push-up.gif', [
    'db:pompes',
    'db:pompes lestées',
    'db:pompes sur poignées',
    'db:pompes en tension continue',
    'db:pompes décalées'
  ]],
  ['troisieme dossier gif/pectorals/chest-dip.gif', ['db:dips', 'db:dips lestés']],
  ['troisieme dossier gif/pectorals/chest-dip-on-straight-bar.gif', ['db:dips barre droite']],
  ['troisieme dossier gif/triceps/bench-dip-on-floor.gif', ['db:dips triceps']],
  ['troisieme dossier gif/pectorals/modified-hindu-push-up-male.gif', ['db:pompes hindu']],
  ['troisieme dossier gif/pectorals/lever-seated-fly.gif', ['db:pec deck']],
  ['troisieme dossier gif/pectorals/cable-standing-fly.gif', ['db:écarté poulie haute']],
  ['troisieme dossier gif/pectorals/dumbbell-bench-press.gif', ['db:développé couché haltères pause bas']],
  ['troisieme dossier gif/pectorals/dumbbell-incline-bench-press.gif', ['db:développé incliné haltères pause bas']],
  ['troisieme dossier gif/pectorals/dumbbell-decline-bench-press.gif', ['db:développé décliné haltères pause bas']],
  ['troisieme dossier gif/biceps/barbell-curl.gif', ['db:curl 21']],
  ['troisieme dossier gif/biceps/ez-barbell-curl.gif', ['db:curl barre ez']],
  ['troisieme dossier gif/biceps/ez-barbell-spider-curl.gif', ['db:curl spider']],
  ['troisieme dossier gif/lats/weighted-close-grip-chin-up-on-dip-cage.gif', ['db:chin-ups lestées']],
  ['troisieme dossier gif/lats/cable-pulldown.gif', ['db:tirage vertical']],
  ['troisieme dossier gif/lats/cable-lateral-pulldown-with-v-bar.gif', ['db:tirage poulie haute prise neutre serrée']],
  ['troisieme dossier gif/upper-back/cable-seated-row.gif', ['db:tirage horizontal poulie']],
  ['troisieme dossier gif/upper-back/cable-seated-one-arm-alternate-row.gif', ['db:tirage unilatéral poulie basse']],
  ['troisieme dossier gif/upper-back/lever-seated-row.gif', ['db:tirage horizontal machine convergente']],
  ['troisieme dossier gif/upper-back/inverted-row.gif', [
    'db:tractions australiennes prise serrée pronation',
    'db:tractions australiennes prise large pronation',
    'db:tractions australiennes prise large supination',
    'db:tractions australiennes prise serrée supination',
    'db:tractions australiennes prise neutre',
    'db:rowing australien pieds surélevés'
  ]],
  ['troisieme dossier gif/abs/front-lever.gif', ['db:front lever tuck isométrique', 'db:front lever raises']],
  ['troisieme dossier gif/upper-back/back-lever.gif', ['db:back lever tuck']],
  ['troisieme dossier gif/abs/crunch-floor.gif', ['db:crunchs']],
  ['troisieme dossier gif/abs/air-bike.gif', ['db:crunch bicyclettes']],
  ['troisieme dossier gif/abs/weighted-front-plank.gif', ['db:gainage', 'db:gainage dynamique']],
  ['troisieme dossier gif/abs/bodyweight-incline-side-plank.gif', ['db:gainage latéral', 'db:gainage latéral dynamique']],
  ['troisieme dossier gif/abs/hanging-leg-raise.gif', ['db:relevé de jambes']],
  ['troisieme dossier gif/abs/assisted-hanging-knee-raise.gif', ['db:relevés de genoux']],
  ['troisieme dossier gif/abs/lying-leg-raise-flat-bench.gif', ['db:jambes tendues rétroversées']],
  ['troisieme dossier gif/abs/vertical-leg-raise-on-parallel-bars.gif', ['db:relevés de genoux aux parallèles']],
  ['troisieme dossier gif/abs/cable-kneeling-crunch.gif', ['db:crunch poulie haute']],
  ['troisieme dossier gif/abs/band-horizontal-pallof-press.gif', ['db:pallof press']],
  ['troisieme dossier gif/abs/wheel-rollerout.gif', ['db:ab wheel rollout']],
  ['troisieme dossier gif/delts/barbell-standing-close-grip-military-press.gif', ['db:développé militaire']],
  ['troisieme dossier gif/delts/dumbbell-reverse-fly.gif', ['db:oiseaux penché']],
  ['troisieme dossier gif/delts/cable-lateral-raise.gif', ['db:élévations latérales poulie']],
  ['troisieme dossier gif/delts/cable-standing-cross-over-high-reverse-fly.gif', ['db:oiseau poulie']],
  ['troisieme dossier gif/triceps/handstand-push-up.gif', ['db:handstand push-ups assistées mur', 'db:handstand push-ups libres']],
  ['troisieme dossier gif/triceps/dumbbell-kickback.gif', ['db:kickbacks triceps']],
  ['troisieme dossier gif/glutes/sled-45-leg-press.gif', ['db:presse à cuisses']],
  ['troisieme dossier gif/glutes/sled-45-degrees-one-leg-press.gif', ['db:leg press unilatérale']],
  ['troisieme dossier gif/glutes/sled-hack-squat.gif', ['db:hack squat']],
  ['troisieme dossier gif/glutes/single-leg-squat-pistol-male.gif', ['db:pistol squat']],
  ['troisieme dossier gif/glutes/dumbbell-step-up.gif', ['db:step-up']],
  ['troisieme dossier gif/glutes/dumbbell-romanian-deadlift.gif', ['db:soulevé de terre roumain haltères']],
  ['troisieme dossier gif/glutes/weighted-cossack-squats-male.gif', ['db:squat cosaque']],
  ['troisieme dossier gif/hamstrings/lever-lying-leg-curl.gif', ['db:leg curl']],
  ['troisieme dossier gif/hamstrings/self-assisted-inverse-leg-curl.gif', ['db:curl nordique']],
  ['troisieme dossier gif/calves/sled-calf-press-on-leg-press.gif', ['db:mollets presse']],
  ['troisieme dossier gif/calves/hack-one-leg-calf-raise.gif', ['db:mollets debout unilatéral machine']],
  ['troisieme dossier gif/calves/dumbbell-single-leg-calf-raise.gif', ['db:mollets unilatéraux']],
  ['troisieme dossier gif/quads/lever-leg-extension.gif', ['db:extension quadriceps unilatérale machine']],
  ['troisieme dossier gif/glutes/low-glute-bridge-on-floor.gif', ['db:glute bridge', 'db:glute bridge unilatéral']],
  ['troisieme dossier gif/upper-back/dumbbell-incline-y-raise.gif', ['db:prone y raise']],
  ['troisieme dossier gif/quads/dumbbell-single-leg-split-squat.gif', ['db:fentes bulgares']],
  ['troisieme dossier gif/abs/lean-planche.gif', ['db:inclinaison pseudo-planche statique', 'db:pompes pseudo-planche']],
  ['troisieme dossier gif/glutes/march-sit-wall.gif', ['db:wall sit']],
  ['troisieme dossier gif/abs/frog-planche.gif', ['db:tuck planche hold']],
  ['troisieme dossier gif/adductors/side-plank-hip-adduction.gif', ['db:copenhagen plank']],
  ['troisieme dossier gif/lats/one-arm-chin-up.gif', ['db:negative one arm pull-up']],
  ['troisieme dossier gif/lats/muscle-up.gif', ['db:assisted muscle-up élastique']],
  ['troisieme dossier gif/glutes/barbell-deadlift.gif', ['db:soulevé de terre déficit']],
  ['troisieme dossier gif/pectorals/clap-push-up.gif', ['db:pompes triple claquées']],
  ['troisieme dossier gif/delts/cable-standing-shoulder-external-rotation.gif', ['db:rotation externe poulie']],
  ['troisieme dossier gif/adductors/cable-hip-adduction.gif', ['db:adduction hanche poulie']],
  ['troisieme dossier gif/pectorals/smith-bench-press.gif', ['db:développé couché smith']],
  ['troisieme dossier gif/delts/smith-shoulder-press.gif', ['db:développé militaire smith']],
  ['troisieme dossier gif/glutes/smith-squat.gif', ['db:squat smith']],
  ['troisieme dossier gif/delts/dumbbell-standing-overhead-press.gif', ['db:développé militaire haltères']],
  ['troisieme dossier gif/triceps/cable-kickback.gif', ['db:kickback triceps poulie']],
  ['troisieme dossier gif/delts/lever-seated-reverse-fly.gif', ['db:oiseau machine']],
  ['troisieme dossier gif/triceps/ez-bar-lying-close-grip-triceps-extension-behind-head.gif', ['db:extension triceps barre ez']],
  ['troisieme dossier gif/abductors/lever-seated-hip-abduction.gif', ['db:abduction hanche machine assise']],
  ['troisieme dossier gif/abductors/resistance-band-seated-hip-abduction.gif', ['db:abduction hanche assise élastique']],
  ['troisieme dossier gif/abductors/side-bridge-hip-abduction.gif', ['db:abduction hanche gainage latéral']],
  ['troisieme dossier gif/abductors/side-hip-abduction.gif', ['db:abduction hanche allongée']],
  ['troisieme dossier gif/abductors/straight-leg-outer-hip-abductor.gif', ['db:abduction hanche debout jambe tendue']],
  ['troisieme dossier gif/abs/sit-up-v-2.gif', ['db:sit-up']],
  ['troisieme dossier gif/abs/decline-sit-up.gif', ['db:sit-up décliné']],
  ['troisieme dossier gif/abs/barbell-press-sit-up.gif', ['db:sit-up press barre']],
  ['troisieme dossier gif/abs/crunch-on-stability-ball.gif', ['db:crunch sur swiss ball']],
  ['troisieme dossier gif/abs/pull-in-on-stability-ball.gif', ['db:rentrée de genoux sur swiss ball']],
  ['troisieme dossier gif/abs/oblique-crunches-floor.gif', ['db:crunch oblique']],
  ['troisieme dossier gif/abs/45-side-bend.gif', ['db:inclinaison latérale']],
  ['troisieme dossier gif/abs/dumbbell-side-bend.gif', ['db:inclinaison latérale haltères']],
  ['troisieme dossier gif/abs/barbell-side-bent-v-2.gif', ['db:inclinaison latérale barre']],
  ['troisieme dossier gif/abs/cable-side-bend.gif', ['db:inclinaison latérale poulie']],
  ['troisieme dossier gif/abs/l-sit-on-floor.gif', ['db:l-sit au sol']],
  ['troisieme dossier gif/abs/v-sit-on-floor.gif', ['db:v-sit au sol']],
  ['troisieme dossier gif/abs/flag.gif', ['db:drapeau humain']],
  ['troisieme dossier gif/abs/inchworm.gif', ['db:inchworm']],
  ['troisieme dossier gif/abs/push-up-to-side-plank.gif', ['db:pompes vers gainage latéral']],
  ['troisieme dossier gif/abs/power-point-plank.gif', ['db:gainage jambe levée']],
  ['troisieme dossier gif/abs/reverse-plank-with-leg-lift.gif', ['db:planche inversée jambe levée']],
  ['troisieme dossier gif/abs/pelvic-tilt.gif', ['db:bascule du bassin']],
  ['troisieme dossier gif/abs/seated-leg-raise.gif', ['db:relevé de jambes assis']],
  ['troisieme dossier gif/abs/incline-leg-hip-raise-leg-straight.gif', ['db:relevé de jambes banc décliné']],
  ['troisieme dossier gif/abs/twisted-leg-raise.gif', ['db:relevé de jambes en torsion']],
  ['troisieme dossier gif/abs/hanging-oblique-knee-raise.gif', ['db:relevé de genoux oblique suspendu']],
  ['troisieme dossier gif/abs/side-hip-on-parallel-bars.gif', ['db:relevé de hanche latéral aux parallèles']],
  ['troisieme dossier gif/abs/jackknife-sit-up.gif', ['db:jackknife']],
  ['troisieme dossier gif/abs/band-v-up.gif', ['db:v-up élastique']],
  ['troisieme dossier gif/abs/band-standing-crunch.gif', ['db:crunch élastique debout']],
  ['troisieme dossier gif/abs/band-standing-twisting-crunch.gif', ['db:crunch élastique en rotation']],
  ['troisieme dossier gif/abs/cable-reverse-crunch.gif', ['db:crunch inversé à la poulie']],
  ['troisieme dossier gif/abs/lever-seated-crunch.gif', ['db:crunch machine assis']],
  ['troisieme dossier gif/abs/lever-kneeling-twist.gif', ['db:rotation machine à genoux']],
  ['troisieme dossier gif/abs/barbell-rollerout.gif', ['db:rollout abdominal à la barre']],
  ['troisieme dossier gif/abs/spell-caster.gif', ['db:rotation haltères buste penché']],
  ['troisieme dossier gif/abs/kettlebell-windmill.gif', ['db:windmill kettlebell']],
  ['troisieme dossier gif/abs/kettlebell-figure-8.gif', ['db:figure 8 kettlebell']],
  ['troisieme dossier gif/abs/sledge-hammer.gif', ['db:swing de masse']],
  ['troisieme dossier gif/abs/one-arm-slam-with-medicine-ball.gif', ['db:slam médecine ball un bras']],
  ['troisieme dossier gif/abs/landmine-180.gif', ['db:rotation landmine']],
  ['troisieme dossier gif/abs/front-plank-with-twist.gif', ['db:gainage avec rotation']],
  ['troisieme dossier gif/abs/suspended-abdominal-fallout.gif', ['db:fallout en suspension']],
  ['troisieme dossier gif/abs/suspended-reverse-crunch.gif', ['db:crunch inversé en suspension']],
  ['troisieme dossier gif/abs/prone-twist-on-stability-ball.gif', ['db:rotation ventrale sur swiss ball']],
  ['troisieme dossier gif/abs/full-planche.gif', ['db:planche complète']],
  ['troisieme dossier gif/abs/full-maltese.gif', ['db:maltese']],
  ['troisieme dossier gif/abs/straddle-maltese.gif', ['db:maltese straddle']],
  ['troisieme dossier gif/abs/kettlebell-bent-press.gif', ['db:bent press kettlebell']],
  ['troisieme dossier gif/adductors/lever-seated-hip-adduction.gif', ['db:adduction hanche machine assise']],
  ['troisieme dossier gif/adductors/side-lying-hip-adduction-male.gif', ['db:adduction hanche allongée']],
  ['troisieme dossier gif/biceps/barbell-drag-curl.gif', ['db:curl drag barre']],
  ['troisieme dossier gif/biceps/cable-drag-curl.gif', ['db:curl drag poulie']],
  ['troisieme dossier gif/biceps/barbell-reverse-curl.gif', ['db:curl inversé barre']],
  ['troisieme dossier gif/biceps/ez-barbell-reverse-grip-curl.gif', ['db:curl inversé barre ez']],
  ['troisieme dossier gif/biceps/dumbbell-revers-grip-biceps-curl.gif', ['db:curl inversé haltères']],
  ['troisieme dossier gif/biceps/cable-reverse-curl.gif', ['db:curl inversé poulie']],
  ['troisieme dossier gif/biceps/barbell-reverse-preacher-curl.gif', ['db:curl pupitre inversé']],
  ['troisieme dossier gif/biceps/cable-reverse-preacher-curl.gif', ['db:curl pupitre inversé poulie']],
  ['troisieme dossier gif/biceps/lever-reverse-grip-preacher-curl.gif', ['db:curl pupitre inversé machine']],
  ['troisieme dossier gif/biceps/dumbbell-cross-body-hammer-curl.gif', ['db:curl marteau croisé']],
  ['troisieme dossier gif/biceps/cable-hammer-curl-with-rope.gif', ['db:curl marteau poulie']],
  ['troisieme dossier gif/biceps/dumbbell-peacher-hammer-curl.gif', ['db:curl marteau pupitre']],
  ['troisieme dossier gif/biceps/cable-two-arm-curl-on-incline-bench.gif', ['db:curl incliné poulie']],
  ['troisieme dossier gif/biceps/dumbbell-lying-supine-biceps-curl.gif', ['db:curl allongé haltères']],
  ['troisieme dossier gif/biceps/cable-lying-bicep-curl.gif', ['db:curl allongé poulie']],
  ['troisieme dossier gif/biceps/cable-overhead-curl.gif', ['db:curl poulie haute']],
  ['troisieme dossier gif/biceps/band-concentration-curl.gif', ['db:curl concentration élastique']],
  ['troisieme dossier gif/biceps/cable-concentration-curl.gif', ['db:curl concentration poulie']],
  ['troisieme dossier gif/biceps/resistance-band-seated-biceps-curl.gif', ['db:curl élastique']],
  ['troisieme dossier gif/biceps/cable-preacher-curl.gif', ['db:curl pupitre poulie']],
  ['troisieme dossier gif/biceps/smith-machine-bicep-curl.gif', ['db:curl smith']],
  ['troisieme dossier gif/biceps/dumbbell-high-curl.gif', ['db:curl haut']],
  ['troisieme dossier gif/biceps/dumbbell-waiter-biceps-curl.gif', ['db:curl waiter']],
  ['troisieme dossier gif/biceps/bodyweight-side-lying-biceps-curl.gif', ['db:curl biceps allongé côté']],
  ['troisieme dossier gif/biceps/dumbbell-lunge-with-bicep-curl.gif', ['db:fente et curl haltères']],
  ['troisieme dossier gif/biceps/dumbbell-biceps-curl-squat.gif', ['db:squat et curl haltères']],
  ['troisieme dossier gif/biceps/dumbbell-seated-biceps-curl-to-shoulder-press.gif', ['db:curl et développé haltères']],
  ['troisieme dossier gif/biceps/dumbbell-standing-alternate-hammer-curl-and-press.gif', ['db:curl marteau et développé']],
  ['troisieme dossier gif/biceps/dumbbell-step-up-single-leg-balance-with-bicep-curl.gif', ['db:step-up équilibre et curl']],
  ['troisieme dossier gif/calves/donkey-calf-raise.gif', ['db:mollets donkey']],
  ['troisieme dossier gif/calves/smith-reverse-calf-raises.gif', ['db:mollets inversés smith']],
  ['troisieme dossier gif/calves/band-single-leg-reverse-calf-raise.gif', ['db:tibialis élastique']],
  ['troisieme dossier gif/calves/lever-rotary-calf.gif', ['db:mollets rotatifs machine']],
  ['troisieme dossier gif/calves/barbell-standing-rocking-leg-calf-raise.gif', ['db:mollets debout balancé']],
  ['troisieme dossier gif/delts/band-shoulder-press.gif', ['db:développé militaire élastique']],
  ['troisieme dossier gif/delts/kettlebell-two-arm-military-press.gif', ['db:développé militaire kettlebell']],
  ['troisieme dossier gif/delts/lever-military-press.gif', ['db:développé épaules machine']],
  ['troisieme dossier gif/delts/cable-shoulder-press.gif', ['db:développé épaules poulie']],
  ['troisieme dossier gif/delts/barbell-seated-behind-head-military-press.gif', ['db:développé nuque']],
  ['troisieme dossier gif/delts/barbell-standing-bradford-press.gif', ['db:bradford press']],
  ['troisieme dossier gif/delts/dumbbell-push-press.gif', ['db:push press haltères']],
  ['troisieme dossier gif/delts/kettlebell-one-arm-push-press.gif', ['db:push press kettlebell']],
  ['troisieme dossier gif/delts/barbell-thruster.gif', ['db:thruster barre']],
  ['troisieme dossier gif/delts/kettlebell-thruster.gif', ['db:thruster kettlebell']],
  ['troisieme dossier gif/delts/dumbbell-upright-row.gif', ['db:tirage menton haltères']],
  ['troisieme dossier gif/delts/cable-upright-row.gif', ['db:tirage menton poulie']],
  ['troisieme dossier gif/delts/smith-upright-row.gif', ['db:tirage menton smith']],
  ['troisieme dossier gif/delts/smith-rear-delt-row.gif', ['db:oiseau smith']],
  ['troisieme dossier gif/delts/band-reverse-fly.gif', ['db:oiseau élastique']],
  ['troisieme dossier gif/delts/lever-lateral-raise.gif', ['db:élévation latérale machine']],
  ['troisieme dossier gif/delts/landmine-lateral-raise.gif', ['db:élévation latérale landmine']],
  ['troisieme dossier gif/delts/barbell-front-raise.gif', ['db:élévations frontales barre']],
  ['troisieme dossier gif/delts/cable-front-raise.gif', ['db:élévations frontales poulie']],
  ['troisieme dossier gif/delts/band-front-raise.gif', ['db:élévations frontales élastique']],
  ['troisieme dossier gif/delts/dumbbell-lying-external-shoulder-rotation.gif', ['db:rotation externe haltères']],
  ['troisieme dossier gif/delts/cable-seated-shoulder-internal-rotation.gif', ['db:rotation interne poulie']],
  ['troisieme dossier gif/delts/dumbbell-alternate-side-press.gif', ['db:développé latéral haltère']],
  ['troisieme dossier gif/delts/dumbbell-standing-around-world.gif', ['db:around the world haltères']],
  ['troisieme dossier gif/delts/dumbbell-single-arm-overhead-carry.gif', ['db:porté haltère bras tendu']],
  ['troisieme dossier gif/delts/battling-ropes.gif', ['db:cordes ondulatoires']],
  ['troisieme dossier gif/forearms/cable-wrist-curl.gif', ['db:curl poignet poulie']],
  ['troisieme dossier gif/forearms/cable-reverse-wrist-curl.gif', ['db:curl poignet inversé poulie']],
  ['troisieme dossier gif/forearms/band-wrist-curl.gif', ['db:curl poignet élastique']],
  ['troisieme dossier gif/forearms/band-reverse-wrist-curl.gif', ['db:curl poignet inversé élastique']],
  ['troisieme dossier gif/forearms/finger-curls.gif', ['db:curl des doigts']],
  ['troisieme dossier gif/forearms/lever-gripper-hands.gif', ['db:gripper']],
  ['troisieme dossier gif/forearms/dumbbell-lying-pronation.gif', ['db:rotation avant-bras']],
  ['troisieme dossier gif/forearms/wrist-rollerer.gif', ['db:wrist roller']],
  // ghl-batch
  ["troisieme dossier gif/glutes/barbell-glute-bridge.gif", ["db:glute bridge barre"]],
  ["troisieme dossier gif/glutes/band-hip-lift.gif", ["db:glute bridge élastique"]],
  ["troisieme dossier gif/glutes/barbell-glute-bridge-two-legs-on-bench-male.gif", ["db:glute bridge barre pieds surélevés"]],
  ["troisieme dossier gif/glutes/resistance-band-hip-thrusts-on-knees-female.gif", ["db:hip thrust genoux élastique"]],
  ["troisieme dossier gif/glutes/cable-standing-hip-extension.gif", ["db:extension de hanche poulie"]],
  ["troisieme dossier gif/glutes/band-bent-over-hip-extension.gif", ["db:extension de hanche élastique penché"]],
  ["troisieme dossier gif/glutes/lever-hip-extension-v-2.gif", ["db:kickback fessier machine"]],
  ["troisieme dossier gif/glutes/band-pull-through.gif", ["db:pull-through élastique"]],
  ["troisieme dossier gif/glutes/cable-pull-through-with-rope.gif", ["db:pull-through poulie"]],
  ["troisieme dossier gif/glutes/lever-reverse-hyperextension.gif", ["db:reverse hyperextension"]],
  ["troisieme dossier gif/glutes/reverse-hyper-on-flat-bench.gif", ["db:reverse hyperextension"]],
  ["troisieme dossier gif/glutes/reverse-hyper-extension-on-stability-ball.gif", ["db:reverse hyperextension"]],
  ["troisieme dossier gif/glutes/barbell-hack-squat.gif", ["db:hack squat barre"]],
  ["troisieme dossier gif/glutes/barbell-jefferson-squat.gif", ["db:squat jefferson"]],
  ["troisieme dossier gif/glutes/barbell-jump-squat.gif", ["db:squat sauté barre"]],
  ["troisieme dossier gif/glutes/dumbbell-plyo-squat.gif", ["db:squat sauté haltères"]],
  ["troisieme dossier gif/glutes/barbell-lateral-lunge.gif", ["db:fente latérale barre"]],
  ["troisieme dossier gif/glutes/curtsey-squat.gif", ["db:fente révérence"]],
  ["troisieme dossier gif/glutes/band-squat.gif", ["db:squat élastique"]],
  ["troisieme dossier gif/glutes/dumbbell-squat.gif", ["db:squat haltères"]],
  ["troisieme dossier gif/glutes/dumbbell-bench-squat.gif", ["db:squat haltères"]],
  ["troisieme dossier gif/glutes/kettlebell-front-squat.gif", ["db:front squat kettlebell"]],
  ["troisieme dossier gif/glutes/smith-front-squat-clean-grip.gif", ["db:front squat smith"]],
  ["troisieme dossier gif/glutes/smith-hack-squat.gif", ["db:hack squat smith"]],
  ["troisieme dossier gif/glutes/weighted-squat.gif", ["db:squat ceinture"]],
  ["troisieme dossier gif/glutes/sled-lying-squat.gif", ["db:presse à cuisses horizontale"]],
  ["troisieme dossier gif/glutes/tire-flip.gif", ["db:retournement de pneu"]],
  ["troisieme dossier gif/glutes/trap-bar-deadlift.gif", ["db:soulevé de terre trap bar"]],
  ["troisieme dossier gif/glutes/dumbbell-deadlift.gif", ["db:soulevé de terre haltères"]],
  ["troisieme dossier gif/glutes/smith-deadlift.gif", ["db:soulevé de terre smith"]],
  ["troisieme dossier gif/glutes/cable-deadlift.gif", ["db:soulevé de terre poulie"]],
  ["troisieme dossier gif/glutes/lever-deadlift.gif", ["db:soulevé de terre machine"]],
  ["troisieme dossier gif/glutes/barbell-rack-pull.gif", ["db:rack pull"]],
  ["troisieme dossier gif/glutes/barbell-one-arm-side-deadlift.gif", ["db:soulevé latéral un bras"]],
  ["troisieme dossier gif/glutes/barbell-single-leg-deadlift.gif", ["db:soulevé de terre unilatéral barre"]],
  ["troisieme dossier gif/glutes/dumbbell-single-leg-deadlift.gif", ["db:soulevé de terre unilatéral haltères"]],
  ["troisieme dossier gif/glutes/dumbbell-single-leg-deadlift-with-stepbox-support.gif", ["db:soulevé de terre unilatéral haltères"]],
  ["troisieme dossier gif/glutes/band-stiff-leg-deadlift.gif", ["db:soulevé de terre jambes tendues élastique"]],
  ["troisieme dossier gif/glutes/band-straight-back-stiff-leg-deadlift.gif", ["db:soulevé de terre jambes tendues élastique"]],
  ["troisieme dossier gif/glutes/barbell-seated-good-morning.gif", ["db:good morning assis"]],
  ["troisieme dossier gif/glutes/lever-seated-good-morning.gif", ["db:good morning assis machine"]],
  ["troisieme dossier gif/glutes/smith-bent-knee-good-morning.gif", ["db:good morning smith"]],
  ["troisieme dossier gif/hamstrings/glute-ham-raise.gif", ["db:glute ham raise"]],
  ["troisieme dossier gif/hamstrings/lever-seated-leg-curl.gif", ["db:leg curl assis"]],
  ["troisieme dossier gif/hamstrings/lever-kneeling-leg-curl.gif", ["db:leg curl à genoux"]],
  ["troisieme dossier gif/hamstrings/dumbbell-lying-femoral.gif", ["db:leg curl haltère"]],
  ["troisieme dossier gif/hamstrings/standing-single-leg-curl.gif", ["db:leg curl debout"]],
  ["troisieme dossier gif/hamstrings/single-leg-platform-slide.gif", ["db:leg curl glissière"]],
  ["troisieme dossier gif/glutes/exercise-ball-one-legged-diagonal-kick-hamstring-curl.gif", ["db:leg curl swiss ball"]],
  ["troisieme dossier gif/lats/barbell-pullover.gif", ["db:pull-over barre"]],
  ["troisieme dossier gif/lats/barbell-bent-arm-pullover.gif", ["db:pull-over barre"]],
  ["troisieme dossier gif/lats/barbell-decline-bent-arm-pullover.gif", ["db:pull-over barre"]],
  ["troisieme dossier gif/lats/barbell-decline-wide-grip-pullover.gif", ["db:pull-over barre"]],
  ["troisieme dossier gif/lats/ez-bar-lying-bent-arms-pullover.gif", ["db:pull-over barre"]],
  ["troisieme dossier gif/lats/lever-pullover.gif", ["db:pull-over machine"]],
  ["troisieme dossier gif/lats/cable-underhand-pulldown.gif", ["db:tirage vertical supination"]],
  ["troisieme dossier gif/lats/reverse-grip-machine-lat-pulldown.gif", ["db:tirage vertical supination"]],
  ["troisieme dossier gif/lats/lever-reverse-grip-lateral-pulldown.gif", ["db:tirage vertical supination"]],
  ["troisieme dossier gif/lats/band-close-grip-pulldown.gif", ["db:tirage vertical élastique"]],
  ["troisieme dossier gif/lats/band-fixed-back-close-grip-pulldown.gif", ["db:tirage vertical élastique"]],
  ["troisieme dossier gif/lats/band-fixed-back-underhand-pulldown.gif", ["db:tirage vertical élastique"]],
  ["troisieme dossier gif/lats/band-underhand-pulldown.gif", ["db:tirage vertical élastique"]],
  ["troisieme dossier gif/lats/band-kneeling-one-arm-pulldown.gif", ["db:tirage vertical élastique"]],
  ["troisieme dossier gif/lats/cable-one-arm-pulldown.gif", ["db:tirage unilatéral poulie haute"]],
  ["troisieme dossier gif/lats/lever-one-arm-lateral-wide-pulldown.gif", ["db:tirage unilatéral machine"]],
  ["troisieme dossier gif/lats/lever-front-pulldown.gif", ["db:tirage vertical machine"]],
  ["troisieme dossier gif/lats/cable-wide-grip-rear-pulldown-behind-neck.gif", ["db:tirage vertical nuque"]],
  ["troisieme dossier gif/lats/wide-grip-rear-pull-up.gif", ["db:tractions nuque"]],
  ["troisieme dossier gif/lats/rear-pull-up.gif", ["db:tractions nuque"]],
  ["troisieme dossier gif/lats/pull-up-neutral-grip.gif", ["db:tractions prise neutre"]],
  ["troisieme dossier gif/lats/mixed-grip-chin-up.gif", ["db:tractions prise mixte"]],
  ["troisieme dossier gif/lats/gironda-sternum-chin.gif", ["db:tractions sternum"]],
  ["troisieme dossier gif/lats/assisted-pull-up.gif", ["db:tractions assistées"]],
  ["troisieme dossier gif/lats/assisted-parallel-close-grip-pull-up.gif", ["db:tractions assistées"]],
  ["troisieme dossier gif/lats/assisted-standing-chin-up.gif", ["db:tractions assistées"]],
  ["troisieme dossier gif/lats/assisted-standing-pull-up.gif", ["db:tractions assistées"]],
  ["troisieme dossier gif/lats/band-assisted-pull-up.gif", ["db:tractions assistées"]],
  ["troisieme dossier gif/lats/lever-assisted-chin-up.gif", ["db:tractions assistées"]],
  ["troisieme dossier gif/lats/bench-pull-ups.gif", ["db:tractions assistées"]],
  ["troisieme dossier gif/lats/kipping-muscle-up.gif", ["db:muscle-up aux anneaux"]],
  ["troisieme dossier gif/lats/cable-seated-high-row-v-bar.gif", ["db:rowing poulie haute"]],
  ["troisieme dossier gif/lats/cable-twisting-pull.gif", ["db:tirage rotatif poulie"]],
  ["troisieme dossier gif/lats/cable-thibaudeau-kayak-row.gif", ["db:rowing kayak poulie"]],
  ["troisieme dossier gif/glutes/barbell-lying-lifting-on-hip.gif", ["db:hip thrust"]],
  ["troisieme dossier gif/glutes/barbell-full-squat.gif", ["db:squat"]],
  ["troisieme dossier gif/glutes/barbell-full-squat-back-pov.gif", ["db:squat"]],
  ["troisieme dossier gif/glutes/barbell-full-squat-side-pov.gif", ["db:squat"]],
  ["troisieme dossier gif/glutes/barbell-high-bar-squat.gif", ["db:squat"]],
  ["troisieme dossier gif/glutes/barbell-low-bar-squat.gif", ["db:squat"]],
  ["troisieme dossier gif/glutes/barbell-narrow-stance-squat.gif", ["db:squat"]],
  ["troisieme dossier gif/glutes/barbell-speed-squat.gif", ["db:squat"]],
  ["troisieme dossier gif/glutes/smith-full-squat.gif", ["db:squat smith"]],
  ["troisieme dossier gif/glutes/smith-low-bar-squat.gif", ["db:squat smith"]],
  ["troisieme dossier gif/glutes/smith-sumo-squat.gif", ["db:squat smith"]],
  ["troisieme dossier gif/glutes/barbell-clean-grip-front-squat.gif", ["db:front squat"]],
  ["troisieme dossier gif/glutes/barbell-front-chest-squat.gif", ["db:front squat"]],
  ["troisieme dossier gif/glutes/barbell-full-zercher-squat.gif", ["db:squat zercher"]],
  ["troisieme dossier gif/glutes/barbell-lunge.gif", ["db:fentes"]],
  ["troisieme dossier gif/glutes/barbell-rear-lunge.gif", ["db:fentes"]],
  ["troisieme dossier gif/glutes/barbell-rear-lunge-v-2.gif", ["db:fentes"]],
  ["troisieme dossier gif/glutes/dumbbell-lunge.gif", ["db:fentes"]],
  ["troisieme dossier gif/glutes/dumbbell-rear-lunge.gif", ["db:fentes"]],
  ["troisieme dossier gif/glutes/dumbbell-contralateral-forward-lunge.gif", ["db:fentes"]],
  ["troisieme dossier gif/glutes/forward-lunge-male.gif", ["db:fentes"]],
  ["troisieme dossier gif/glutes/one-leg-squat.gif", ["db:fentes bulgares"]],
  ["troisieme dossier gif/glutes/barbell-step-up.gif", ["db:step-up"]],
  ["troisieme dossier gif/glutes/band-step-up.gif", ["db:step-up"]],
  ["troisieme dossier gif/glutes/jump-squat-v-2.gif", ["db:squat sauté"]],
  ["troisieme dossier gif/glutes/kettlebell-pistol-squat.gif", ["db:pistol squat"]],
  ["troisieme dossier gif/glutes/sled-45-leg-press-back-pov.gif", ["db:presse à cuisses"]],
  ["troisieme dossier gif/glutes/sled-45-leg-press-side-pov.gif", ["db:presse à cuisses"]],
  ["troisieme dossier gif/glutes/sled-45-leg-wide-press.gif", ["db:presse à cuisses"]],
  ["troisieme dossier gif/glutes/sled-closer-hack-squat.gif", ["db:hack squat"]],
  ["troisieme dossier gif/glutes/lever-horizontal-one-leg-press.gif", ["db:leg press unilatérale"]],
  ["troisieme dossier gif/glutes/smith-leg-press.gif", ["db:presse verticale"]],
  ["troisieme dossier gif/glutes/barbell-stiff-leg-good-morning.gif", ["db:good morning"]],
  ["troisieme dossier gif/glutes/dumbbell-straight-leg-deadlift.gif", ["db:soulevé de terre jambes tendues"]],
  ["troisieme dossier gif/hamstrings/barbell-straight-leg-deadlift.gif", ["db:soulevé de terre jambes tendues"]],
  ["troisieme dossier gif/glutes/glute-bridge-march.gif", ["db:glute bridge"]],
  ["troisieme dossier gif/glutes/glute-bridge-two-legs-on-bench-male.gif", ["db:glute bridge"]],
  ["troisieme dossier gif/glutes/single-leg-bridge-with-outstretched-leg.gif", ["db:glute bridge unilatéral"]],
  ["troisieme dossier gif/hamstrings/cable-assisted-inverse-leg-curl.gif", ["db:curl nordique"]],
  ["troisieme dossier gif/hamstrings/inverse-leg-curl-bench-support.gif", ["db:curl nordique"]],
  ["troisieme dossier gif/hamstrings/inverse-leg-curl-on-pull-up-cable-machine.gif", ["db:curl nordique"]],
  ["troisieme dossier gif/hamstrings/self-assisted-inverse-leg-curl-1766.gif", ["db:curl nordique"]],
  ["troisieme dossier gif/hamstrings/self-assisted-inverse-leg-curl-on-floor.gif", ["db:curl nordique"]],
  ["troisieme dossier gif/hamstrings/lever-lying-two-one-leg-curl.gif", ["db:leg curl allongé"]],
  ["troisieme dossier gif/lats/alternate-lateral-pulldown.gif", ["db:tirage vertical"]],
  ["troisieme dossier gif/lats/cable-bar-lateral-pulldown.gif", ["db:tirage vertical"]],
  ["troisieme dossier gif/lats/cable-cross-over-lateral-pulldown.gif", ["db:tirage vertical"]],
  ["troisieme dossier gif/lats/cable-lat-pulldown-full-range-of-motion.gif", ["db:tirage vertical"]],
  ["troisieme dossier gif/lats/cable-lateral-pulldown-with-rope-attachment.gif", ["db:tirage vertical"]],
  ["troisieme dossier gif/lats/cable-pulldown-pro-lat-bar.gif", ["db:tirage vertical"]],
  ["troisieme dossier gif/lats/cable-rear-pulldown.gif", ["db:tirage vertical"]],
  ["troisieme dossier gif/lats/pull-up.gif", ["db:tractions pronation"]],
  ["troisieme dossier gif/lats/weighted-pull-up.gif", ["db:tractions pronation"]],
  ["troisieme dossier gif/lats/shoulder-grip-pull-up.gif", ["db:tractions pronation"]],
  ["troisieme dossier gif/lats/rocky-pull-up-pulldown.gif", ["db:tractions pronation"]],
  ["troisieme dossier gif/lats/chin-up.gif", ["db:tractions supination"]],
  ["troisieme dossier gif/lats/reverse-grip-pull-up.gif", ["db:tractions supination"]],
  ["troisieme dossier gif/lats/side-to-side-chin.gif", ["db:tractions typewriter"]],
  ["troisieme dossier gif/lats/twin-handle-parallel-grip-lat-pulldown.gif", ["db:tirage poulie haute prise neutre serrée"]],
  ["troisieme dossier gif/lats/cable-straight-arm-pulldown-with-rope.gif", ["db:pull-over poulie haute"]],
  ["troisieme dossier gif/lats/cable-pushdown-straight-arm-v-2.gif", ["db:pull-over poulie haute"]],
  ["troisieme dossier gif/lats/cable-lying-extension-pullover-with-rope-attachment.gif", ["db:pull-over poulie haute"]],
  ["troisieme dossier gif/lats/cable-incline-pushdown.gif", ["db:pull-over poulie haute"]],
  ["troisieme dossier gif/lats/muscle-up-on-vertical-bar.gif", ["db:muscle up strict"]],
  ["troisieme dossier gif/lats/weighted-muscle-up.gif", ["db:muscle up strict"]],
  ["troisieme dossier gif/lats/weighted-muscle-up-on-bar.gif", ["db:muscle up strict"]],
  ["troisieme dossier gif/lats/weighted-one-hand-pull-up.gif", ["db:negative one arm pull-up"]],
  // lpqs-batch
  ["troisieme dossier gif/pectorals/push-up-wall-v-2.gif", ["db:pompes au mur"]],
  ["troisieme dossier gif/pectorals/push-up-wall.gif", ["db:pompes au mur"]],
  ["troisieme dossier gif/pectorals/shoulder-tap-push-up.gif", ["db:pompes shoulder tap"]],
  ["troisieme dossier gif/pectorals/chest-tap-push-up-male.gif", ["db:pompes shoulder tap"]],
  ["troisieme dossier gif/pectorals/clock-push-up.gif", ["db:pompes horloge"]],
  ["troisieme dossier gif/pectorals/superman-push-up.gif", ["db:pompes superman"]],
  ["troisieme dossier gif/pectorals/suspended-push-up.gif", ["db:pompes suspendues"]],
  ["troisieme dossier gif/pectorals/push-up-on-bosu-ball.gif", ["db:pompes surface instable"]],
  ["troisieme dossier gif/pectorals/push-up-bosu-ball.gif", ["db:pompes surface instable"]],
  ["troisieme dossier gif/pectorals/push-up-medicine-ball.gif", ["db:pompes surface instable"]],
  ["troisieme dossier gif/pectorals/push-up-on-stability-ball.gif", ["db:pompes surface instable"]],
  ["troisieme dossier gif/pectorals/push-up-on-stability-ball-0656.gif", ["db:pompes surface instable"]],
  ["troisieme dossier gif/pectorals/full-planche-push-up.gif", ["db:pompes horizontales"]],
  ["troisieme dossier gif/pectorals/isometric-wipers.gif", ["db:tenue pectoraux bras écartés"]],
  ["troisieme dossier gif/pectorals/floor-fly-with-barbell.gif", ["db:écarté au sol barre"]],
  ["troisieme dossier gif/pectorals/assisted-chest-dip-kneeling.gif", ["db:dips assistés"]],
  ["troisieme dossier gif/pectorals/assisted-wide-grip-chest-dip-kneeling.gif", ["db:dips assistés"]],
  ["troisieme dossier gif/pectorals/barbell-guillotine-bench-press.gif", ["db:développé guillotine"]],
  ["troisieme dossier gif/pectorals/barbell-wide-reverse-grip-bench-press.gif", ["db:développé couché prise inversée"]],
  ["troisieme dossier gif/pectorals/dumbbell-reverse-bench-press.gif", ["db:développé haltères prise inversée"]],
  ["troisieme dossier gif/pectorals/dumbbell-one-arm-reverse-grip-press.gif", ["db:développé haltères prise inversée"]],
  ["troisieme dossier gif/pectorals/cable-bench-press.gif", ["db:développé couché poulie"]],
  ["troisieme dossier gif/pectorals/cable-press-on-exercise-ball.gif", ["db:développé couché poulie"]],
  ["troisieme dossier gif/pectorals/cable-one-arm-press-on-exercise-ball.gif", ["db:développé couché poulie"]],
  ["troisieme dossier gif/pectorals/cable-incline-bench-press.gif", ["db:développé incliné poulie"]],
  ["troisieme dossier gif/pectorals/cable-one-arm-incline-press.gif", ["db:développé incliné poulie"]],
  ["troisieme dossier gif/pectorals/cable-one-arm-incline-press-on-exercise-ball.gif", ["db:développé incliné poulie"]],
  ["troisieme dossier gif/pectorals/cable-decline-press.gif", ["db:développé décliné poulie"]],
  ["troisieme dossier gif/pectorals/cable-decline-one-arm-press.gif", ["db:développé décliné poulie"]],
  ["troisieme dossier gif/pectorals/cable-seated-chest-press.gif", ["db:développé assis poulie"]],
  ["troisieme dossier gif/pectorals/band-bench-press.gif", ["db:développé couché élastique"]],
  ["troisieme dossier gif/pectorals/resistance-band-seated-chest-press.gif", ["db:développé assis élastique"]],
  ["troisieme dossier gif/pectorals/band-one-arm-twisting-chest-press.gif", ["db:développé rotatif élastique"]],
  ["troisieme dossier gif/pectorals/smith-decline-bench-press.gif", ["db:développé décliné smith"]],
  ["troisieme dossier gif/pectorals/smith-wide-grip-decline-bench-press.gif", ["db:développé décliné smith"]],
  ["troisieme dossier gif/pectorals/smith-decline-reverse-grip-press.gif", ["db:développé décliné smith"]],
  ["troisieme dossier gif/pectorals/smith-machine-reverse-decline-close-grip-bench-press.gif", ["db:développé décliné smith"]],
  ["troisieme dossier gif/pectorals/smith-incline-bench-press.gif", ["db:développé incliné smith"]],
  ["troisieme dossier gif/pectorals/smith-incline-reverse-grip-press.gif", ["db:développé incliné smith"]],
  ["troisieme dossier gif/serratus-anterior/smith-incline-shoulder-raises.gif", ["db:développé incliné smith"]],
  ["troisieme dossier gif/pectorals/dumbbell-decline-fly.gif", ["db:écarté décliné haltères"]],
  ["troisieme dossier gif/pectorals/dumbbell-decline-one-arm-fly.gif", ["db:écarté décliné haltères"]],
  ["troisieme dossier gif/pectorals/dumbbell-decline-twist-fly.gif", ["db:écarté décliné haltères"]],
  ["troisieme dossier gif/pectorals/cable-one-arm-lateral-bent-over.gif", ["db:écarté unilatéral poulie"]],
  ["troisieme dossier gif/pectorals/cable-one-arm-decline-chest-fly.gif", ["db:écarté unilatéral poulie"]],
  ["troisieme dossier gif/pectorals/cable-one-arm-fly-on-exercise-ball.gif", ["db:écarté unilatéral poulie"]],
  ["troisieme dossier gif/pectorals/cable-one-arm-incline-fly-on-exercise-ball.gif", ["db:écarté unilatéral poulie"]],
  ["troisieme dossier gif/pectorals/kettlebell-one-arm-floor-press.gif", ["db:floor press kettlebell"]],
  ["troisieme dossier gif/pectorals/kettlebell-alternating-press-on-floor.gif", ["db:floor press kettlebell"]],
  ["troisieme dossier gif/pectorals/kettlebell-extended-range-one-arm-press-on-floor.gif", ["db:floor press kettlebell"]],
  ["troisieme dossier gif/pectorals/weighted-svend-press.gif", ["db:svend press"]],
  ["troisieme dossier gif/pectorals/isometric-chest-squeeze.gif", ["db:svend press"]],
  ["troisieme dossier gif/pectorals/lever-decline-chest-press.gif", ["db:chest press décliné machine"]],
  ["troisieme dossier gif/pectorals/lever-incline-chest-press.gif", ["db:chest press incliné machine"]],
  ["troisieme dossier gif/pectorals/lever-incline-chest-press-v-2.gif", ["db:chest press incliné machine"]],
  ["troisieme dossier gif/pectorals/lever-standing-chest-press.gif", ["db:chest press debout machine"]],
  ["troisieme dossier gif/quads/barbell-one-leg-squat.gif", ["db:fentes bulgares barre"]],
  ["troisieme dossier gif/quads/barbell-single-leg-split-squat.gif", ["db:fentes bulgares barre"]],
  ["troisieme dossier gif/quads/smith-single-leg-split-squat.gif", ["db:fentes bulgares smith"]],
  ["troisieme dossier gif/quads/band-single-leg-split-squat.gif", ["db:fentes bulgares élastique"]],
  ["troisieme dossier gif/quads/band-one-arm-single-leg-split-squat.gif", ["db:fentes bulgares élastique"]],
  ["troisieme dossier gif/quads/suspended-split-squat.gif", ["db:fente bulgare suspendue"]],
  ["troisieme dossier gif/quads/resistance-band-leg-extension.gif", ["db:leg extension élastique"]],
  ["troisieme dossier gif/quads/barbell-overhead-squat.gif", ["db:squat overhead"]],
  ["troisieme dossier gif/quads/barbell-squat-on-knees.gif", ["db:squat à genoux barre"]],
  ["troisieme dossier gif/quads/squat-on-bosu-ball.gif", ["db:squat bosu"]],
  ["troisieme dossier gif/pectorals/barbell-wide-bench-press.gif", ["db:développé couché"]],
  ["troisieme dossier gif/pectorals/barbell-decline-wide-grip-press.gif", ["db:développé décliné barre"]],
  ["troisieme dossier gif/pectorals/barbell-reverse-grip-decline-bench-press.gif", ["db:développé décliné barre"]],
  ["troisieme dossier gif/pectorals/barbell-reverse-grip-incline-bench-press.gif", ["db:développé incliné"]],
  ["troisieme dossier gif/pectorals/barbell-decline-pullover.gif", ["db:pull-over barre"]],
  ["troisieme dossier gif/pectorals/smith-wide-grip-bench-press.gif", ["db:développé couché smith"]],
  ["troisieme dossier gif/pectorals/smith-reverse-grip-press.gif", ["db:développé couché smith"]],
  ["troisieme dossier gif/pectorals/cable-low-fly.gif", ["db:écarté poulie basse"]],
  ["troisieme dossier gif/pectorals/cable-middle-fly.gif", ["db:écarté poulie médiane"]],
  ["troisieme dossier gif/pectorals/dumbbell-decline-hammer-press.gif", ["db:développé décliné haltères"]],
  ["troisieme dossier gif/pectorals/dumbbell-one-arm-decline-chest-press.gif", ["db:développé décliné haltères"]],
  ["troisieme dossier gif/pectorals/dumbbell-incline-alternate-press.gif", ["db:développé incliné haltères"]],
  ["troisieme dossier gif/pectorals/dumbbell-incline-hammer-press.gif", ["db:développé incliné haltères"]],
  ["troisieme dossier gif/pectorals/dumbbell-incline-palm-in-press.gif", ["db:développé incliné haltères"]],
  ["troisieme dossier gif/pectorals/dumbbell-incline-press-on-exercise-ball.gif", ["db:développé incliné haltères"]],
  ["troisieme dossier gif/pectorals/dumbbell-incline-one-arm-press.gif", ["db:développé incliné haltères"]],
  ["troisieme dossier gif/pectorals/dumbbell-one-arm-incline-chest-press.gif", ["db:développé incliné haltères"]],
  ["troisieme dossier gif/pectorals/dumbbell-incline-one-arm-press-on-exercise-ball.gif", ["db:développé incliné haltères"]],
  ["troisieme dossier gif/pectorals/dumbbell-lying-hammer-press.gif", ["db:développé haltères plat"]],
  ["troisieme dossier gif/pectorals/dumbbell-lying-one-arm-press.gif", ["db:développé haltères plat"]],
  ["troisieme dossier gif/pectorals/dumbbell-lying-one-arm-press-v-2.gif", ["db:développé haltères plat"]],
  ["troisieme dossier gif/pectorals/dumbbell-one-arm-press-on-exercise-ball.gif", ["db:développé haltères plat"]],
  ["troisieme dossier gif/pectorals/dumbbell-press-on-exercise-ball.gif", ["db:développé haltères plat"]],
  ["troisieme dossier gif/pectorals/dumbbell-fly-on-exercise-ball.gif", ["db:écarté haltères"]],
  ["troisieme dossier gif/pectorals/dumbbell-one-arm-bench-fly.gif", ["db:écarté haltères"]],
  ["troisieme dossier gif/pectorals/dumbbell-one-arm-chest-fly-on-exercise-ball.gif", ["db:écarté haltères"]],
  ["troisieme dossier gif/pectorals/dumbbell-one-arm-fly-on-exercise-ball.gif", ["db:écarté haltères"]],
  ["troisieme dossier gif/pectorals/dumbbell-one-leg-fly-on-exercise-ball.gif", ["db:écarté haltères"]],
  ["troisieme dossier gif/pectorals/hyght-dumbbell-fly.gif", ["db:écarté incliné"]],
  ["troisieme dossier gif/pectorals/dumbbell-incline-breeding.gif", ["db:écarté incliné"]],
  ["troisieme dossier gif/pectorals/dumbbell-incline-fly-on-exercise-ball.gif", ["db:écarté incliné"]],
  ["troisieme dossier gif/pectorals/dumbbell-incline-one-arm-fly.gif", ["db:écarté incliné"]],
  ["troisieme dossier gif/pectorals/dumbbell-incline-one-arm-fly-on-exercise-ball.gif", ["db:écarté incliné"]],
  ["troisieme dossier gif/pectorals/dumbbell-incline-twisted-flyes.gif", ["db:écarté incliné"]],
  ["troisieme dossier gif/pectorals/dumbbell-around-pullover.gif", ["db:pull-over haltère"]],
  ["troisieme dossier gif/pectorals/dumbbell-straight-arm-pullover.gif", ["db:pull-over haltère"]],
  ["troisieme dossier gif/pectorals/dumbbell-pullover-on-exercise-ball.gif", ["db:pull-over haltère"]],
  ["troisieme dossier gif/pectorals/dumbbell-lying-pullover-on-exercise-ball.gif", ["db:pull-over haltère"]],
  ["troisieme dossier gif/pectorals/dumbbell-one-arm-pullover-on-exercise-ball.gif", ["db:pull-over haltère"]],
  ["troisieme dossier gif/pectorals/chest-dip-on-dip-pull-up-cage.gif", ["db:dips"]],
  ["troisieme dossier gif/pectorals/wide-grip-chest-dip-on-high-parallel-bars.gif", ["db:dips"]],
  ["troisieme dossier gif/pectorals/weighted-straight-bar-dip.gif", ["db:dips barre droite"]],
  ["troisieme dossier gif/pectorals/deep-push-up.gif", ["db:pompes"]],
  ["troisieme dossier gif/pectorals/kneeling-push-up-male.gif", ["db:pompes"]],
  ["troisieme dossier gif/pectorals/wide-hand-push-up.gif", ["db:pompes"]],
  ["troisieme dossier gif/pectorals/drop-push-up.gif", ["db:pompes claquées"]],
  ["troisieme dossier gif/pectorals/weighted-drop-push-up.gif", ["db:pompes claquées"]],
  ["troisieme dossier gif/pectorals/plyo-push-up.gif", ["db:pompes claquées"]],
  ["troisieme dossier gif/pectorals/kettlebell-plyo-push-up.gif", ["db:pompes claquées"]],
  ["troisieme dossier gif/pectorals/incline-push-up-on-box.gif", ["db:pompes inclinées"]],
  ["troisieme dossier gif/pectorals/incline-reverse-grip-push-up.gif", ["db:pompes inclinées"]],
  ["troisieme dossier gif/pectorals/exercise-ball-pike-push-up.gif", ["db:pike push-ups"]],
  ["troisieme dossier gif/pectorals/raise-single-arm-push-up.gif", ["db:one arm push-up"]],
  ["troisieme dossier gif/pectorals/lever-chest-press-0577.gif", ["db:chest press machine"]],
  ["troisieme dossier gif/pectorals/machine-inner-chest-press.gif", ["db:chest press machine"]],
  ["troisieme dossier gif/serratus-anterior/barbell-incline-shoulder-raise.gif", ["db:développé incliné"]],
  ["troisieme dossier gif/serratus-anterior/dumbbell-incline-shoulder-raise.gif", ["db:développé incliné haltères"]],
  ["troisieme dossier gif/serratus-anterior/scapula-push-up.gif", ["db:pompes scapulaires"]],
  ["troisieme dossier gif/serratus-anterior/incline-scapula-push-up.gif", ["db:pompes scapulaires"]],
  ["troisieme dossier gif/quads/barbell-bench-front-squat.gif", ["db:front squat"]],
  ["troisieme dossier gif/quads/barbell-wide-squat.gif", ["db:squat"]],
  ["troisieme dossier gif/quads/barbell-split-squat-v-2.gif", ["db:fentes"]],
  ["troisieme dossier gif/quads/barbell-side-split-squat.gif", ["db:fente latérale barre"]],
  ["troisieme dossier gif/quads/barbell-side-split-squat-v-2.gif", ["db:fente latérale barre"]],
  ["troisieme dossier gif/quads/dumbbell-step-up-split-squat.gif", ["db:fentes bulgares"]],
  ["troisieme dossier gif/quads/smith-chair-squat.gif", ["db:squat smith"]],
  ["troisieme dossier gif/quads/lever-alternate-leg-press.gif", ["db:presse à cuisses"]],
  ["troisieme dossier gif/quads/weighted-sissy-squat.gif", ["db:sissy squat"]],
  // sttu-batch
  ["troisieme dossier gif/spine/hyperextension.gif", ["db:hyperextension"]],
  ["troisieme dossier gif/spine/hyperextension-on-bench.gif", ["db:hyperextension"]],
  ["troisieme dossier gif/spine/back-extension-on-exercise-ball.gif", ["db:hyperextension"]],
  ["troisieme dossier gif/spine/exercise-ball-back-extension-with-arms-extended.gif", ["db:hyperextension"]],
  ["troisieme dossier gif/spine/exercise-ball-back-extension-with-hands-behind-head.gif", ["db:hyperextension"]],
  ["troisieme dossier gif/spine/exercise-ball-back-extension-with-knees-off-ground.gif", ["db:hyperextension"]],
  ["troisieme dossier gif/spine/exercise-ball-back-extension-with-rotation.gif", ["db:hyperextension"]],
  ["troisieme dossier gif/spine/weighted-hyperextension-on-stability-ball.gif", ["db:hyperextension"]],
  ["troisieme dossier gif/spine/lever-back-extension.gif", ["db:extension lombaire assise"]],
  ["troisieme dossier gif/traps/band-shrug.gif", ["db:shrugs élastique"]],
  ["troisieme dossier gif/traps/cable-shrug.gif", ["db:shrugs poulie"]],
  ["troisieme dossier gif/traps/lever-shrug.gif", ["db:shrugs machine"]],
  ["troisieme dossier gif/traps/lever-gripless-shrug.gif", ["db:shrugs machine"]],
  ["troisieme dossier gif/traps/lever-gripless-shrug-v-2.gif", ["db:shrugs machine"]],
  ["troisieme dossier gif/traps/smith-shrug.gif", ["db:shrugs smith"]],
  ["troisieme dossier gif/traps/smith-back-shrug.gif", ["db:shrugs smith"]],
  ["troisieme dossier gif/traps/scapula-dips.gif", ["db:dépression scapulaire au banc"]],
  ["troisieme dossier gif/triceps/barbell-standing-overhead-triceps-extension.gif", ["db:extension nuque barre"]],
  ["troisieme dossier gif/triceps/barbell-seated-overhead-triceps-extension.gif", ["db:extension nuque barre"]],
  ["troisieme dossier gif/triceps/barbell-seated-close-grip-behind-neck-triceps-extension.gif", ["db:extension nuque barre"]],
  ["troisieme dossier gif/triceps/smith-machine-incline-tricep-extension.gif", ["db:extension nuque barre"]],
  ["troisieme dossier gif/triceps/ez-bar-standing-french-press.gif", ["db:extension nuque barre ez"]],
  ["troisieme dossier gif/triceps/ez-barbell-seated-triceps-extension.gif", ["db:extension nuque barre ez"]],
  ["troisieme dossier gif/triceps/ez-barbell-incline-triceps-extension.gif", ["db:extension nuque barre ez"]],
  ["troisieme dossier gif/triceps/cable-overhead-triceps-extension-rope-attachment.gif", ["db:extension nuque poulie"]],
  ["troisieme dossier gif/triceps/cable-high-pulley-overhead-tricep-extension.gif", ["db:extension nuque poulie"]],
  ["troisieme dossier gif/triceps/cable-rope-high-pulley-overhead-tricep-extension.gif", ["db:extension nuque poulie"]],
  ["troisieme dossier gif/triceps/cable-rope-incline-tricep-extension.gif", ["db:extension nuque poulie"]],
  ["troisieme dossier gif/triceps/cable-incline-triceps-extension.gif", ["db:extension nuque poulie"]],
  ["troisieme dossier gif/triceps/cable-standing-reverse-grip-one-arm-overhead-tricep-extension.gif", ["db:extension nuque poulie"]],
  ["troisieme dossier gif/triceps/cable-lying-triceps-extension-v-2.gif", ["db:extension allongée poulie"]],
  ["troisieme dossier gif/triceps/cable-rope-lying-on-floor-tricep-extension.gif", ["db:extension allongée poulie"]],
  ["troisieme dossier gif/triceps/band-side-triceps-extension.gif", ["db:extension triceps élastique"]],
  ["troisieme dossier gif/triceps/bodyweight-kneeling-triceps-extension.gif", ["db:extension triceps au sol"]],
  ["troisieme dossier gif/triceps/lever-triceps-extension.gif", ["db:extension triceps machine"]],
  ["troisieme dossier gif/triceps/lever-seated-dip.gif", ["db:dips machine"]],
  ["troisieme dossier gif/triceps/lever-overhand-triceps-dip.gif", ["db:dips machine"]],
  ["troisieme dossier gif/triceps/barbell-pin-presses.gif", ["db:pin press"]],
  ["troisieme dossier gif/triceps/body-up.gif", ["db:montée avant-bras"]],
  ["troisieme dossier gif/triceps/push-up-on-lower-arms.gif", ["db:montée avant-bras"]],
  ["troisieme dossier gif/triceps/one-arm-dip.gif", ["db:dips triceps un bras"]],
  ["troisieme dossier gif/triceps/stalder-press.gif", ["db:stalder press"]],
  ["troisieme dossier gif/triceps/barbell-one-arm-floor-press.gif", ["db:floor press barre"]],
  ["troisieme dossier gif/upper-back/barbell-pendlay-row.gif", ["db:rowing pendlay"]],
  ["troisieme dossier gif/upper-back/smith-bent-over-row.gif", ["db:rowing smith"]],
  ["troisieme dossier gif/upper-back/smith-narrow-row.gif", ["db:rowing smith"]],
  ["troisieme dossier gif/upper-back/smith-one-arm-row.gif", ["db:rowing smith"]],
  ["troisieme dossier gif/upper-back/smith-reverse-grip-bent-over-row.gif", ["db:rowing smith"]],
  ["troisieme dossier gif/upper-back/kettlebell-one-arm-row.gif", ["db:rowing kettlebell"]],
  ["troisieme dossier gif/upper-back/kettlebell-alternating-row.gif", ["db:rowing kettlebell"]],
  ["troisieme dossier gif/upper-back/kettlebell-two-arm-row.gif", ["db:rowing kettlebell"]],
  ["troisieme dossier gif/upper-back/kettlebell-alternating-renegade-row.gif", ["db:renegade row"]],
  ["troisieme dossier gif/upper-back/resistance-band-seated-straight-back-row.gif", ["db:tirage horizontal élastique"]],
  ["troisieme dossier gif/upper-back/band-one-arm-standing-low-row.gif", ["db:tirage horizontal élastique"]],
  ["troisieme dossier gif/upper-back/band-one-arm-twisting-seated-row.gif", ["db:tirage horizontal élastique"]],
  ["troisieme dossier gif/upper-back/suspended-row.gif", ["db:rowing suspendu"]],
  ["troisieme dossier gif/upper-back/inverted-row-with-straps.gif", ["db:rowing suspendu"]],
  ["troisieme dossier gif/upper-back/rope-climb.gif", ["db:montée de corde"]],
  ["troisieme dossier gif/upper-back/lever-high-row.gif", ["db:rowing haut machine"]],
  ["troisieme dossier gif/upper-back/lever-one-arm-lateral-high-row.gif", ["db:rowing haut machine"]],
  ["troisieme dossier gif/upper-back/bodyweight-standing-row-with-towel.gif", ["db:rowing serviette"]],
  ["troisieme dossier gif/upper-back/bodyweight-standing-row.gif", ["db:rowing serviette"]],
  ["troisieme dossier gif/upper-back/bodyweight-standing-one-arm-row.gif", ["db:rowing serviette"]],
  ["troisieme dossier gif/upper-back/bodyweight-standing-one-arm-row-with-towel.gif", ["db:rowing serviette"]],
  ["troisieme dossier gif/upper-back/bodyweight-standing-close-grip-row.gif", ["db:rowing serviette"]],
  ["troisieme dossier gif/upper-back/bodyweight-standing-close-grip-one-arm-row.gif", ["db:rowing serviette"]],
  ["troisieme dossier gif/upper-back/bodyweight-squatting-row.gif", ["db:rowing serviette"]],
  ["troisieme dossier gif/upper-back/bodyweight-squatting-row-with-towel.gif", ["db:rowing serviette"]],
  ["troisieme dossier gif/upper-back/one-arm-towel-row.gif", ["db:rowing serviette"]],
  ["troisieme dossier gif/upper-back/medicine-ball-overhead-slam.gif", ["db:slam médecine ball"]],
  ["troisieme dossier gif/spine/band-straight-leg-deadlift.gif", ["db:soulevé de terre jambes tendues élastique"]],
  ["troisieme dossier gif/spine/exercise-ball-prone-leg-raise.gif", ["db:reverse hyperextension"]],
  ["troisieme dossier gif/spine/lower-back-curl.gif", ["db:arch hold"]],
  ["troisieme dossier gif/traps/dumbbell-decline-shrug.gif", ["db:shrugs"]],
  ["troisieme dossier gif/traps/dumbbell-decline-shrug-v-2.gif", ["db:shrugs"]],
  ["troisieme dossier gif/traps/dumbbell-incline-shrug.gif", ["db:shrugs"]],
  ["troisieme dossier gif/triceps/assisted-triceps-dip-kneeling.gif", ["db:dips assistés"]],
  ["troisieme dossier gif/triceps/band-close-grip-push-up.gif", ["db:pompes serrées"]],
  ["troisieme dossier gif/triceps/barbell-decline-close-grip-to-skull-press.gif", ["db:barre au front"]],
  ["troisieme dossier gif/triceps/barbell-lying-back-of-the-head-tricep-extension.gif", ["db:barre au front"]],
  ["troisieme dossier gif/triceps/barbell-lying-close-grip-triceps-extension.gif", ["db:barre au front"]],
  ["troisieme dossier gif/triceps/barbell-lying-extension.gif", ["db:barre au front"]],
  ["troisieme dossier gif/triceps/barbell-lying-triceps-extension-skull-crusher.gif", ["db:barre au front"]],
  ["troisieme dossier gif/triceps/barbell-reverse-grip-skullcrusher.gif", ["db:barre au front"]],
  ["troisieme dossier gif/triceps/olympic-barbell-triceps-extension.gif", ["db:barre au front"]],
  ["troisieme dossier gif/triceps/ez-barbell-decline-triceps-extension.gif", ["db:barre au front"]],
  ["troisieme dossier gif/triceps/ez-bar-french-press-on-exercise-ball.gif", ["db:extension triceps barre ez"]],
  ["troisieme dossier gif/triceps/barbell-lying-close-grip-press.gif", ["db:développé couché prise serrée"]],
  ["troisieme dossier gif/triceps/barbell-incline-close-grip-bench-press.gif", ["db:développé incliné"]],
  ["troisieme dossier gif/triceps/barbell-incline-reverse-grip-press.gif", ["db:développé incliné"]],
  ["troisieme dossier gif/triceps/ez-bar-close-grip-bench-press.gif", ["db:développé couché prise serrée"]],
  ["troisieme dossier gif/triceps/barbell-reverse-close-grip-bench-press.gif", ["db:développé couché prise inversée"]],
  ["troisieme dossier gif/triceps/smith-close-grip-bench-press.gif", ["db:développé couché smith"]],
  ["troisieme dossier gif/triceps/smith-machine-decline-close-grip-bench-press.gif", ["db:développé décliné smith"]],
  ["troisieme dossier gif/triceps/dumbbell-close-grip-press.gif", ["db:développé haltères plat"]],
  ["troisieme dossier gif/triceps/dumbbell-close-grip-press-1731.gif", ["db:développé haltères plat"]],
  ["troisieme dossier gif/triceps/dumbbell-neutral-grip-bench-press.gif", ["db:développé haltères plat"]],
  ["troisieme dossier gif/triceps/dumbbell-one-arm-hammer-press-on-exercise-ball.gif", ["db:développé haltères plat"]],
  ["troisieme dossier gif/triceps/dumbbell-twisting-bench-press.gif", ["db:développé haltères plat"]],
  ["troisieme dossier gif/triceps/dumbbell-decline-one-arm-hammer-press.gif", ["db:développé décliné haltères"]],
  ["troisieme dossier gif/triceps/dumbbell-incline-hammer-press-on-exercise-ball.gif", ["db:développé incliné haltères"]],
  ["troisieme dossier gif/triceps/dumbbell-incline-one-arm-hammer-press-on-exercise-ball.gif", ["db:développé incliné haltères"]],
  ["troisieme dossier gif/triceps/dumbbell-incline-one-arm-hammer-press.gif", ["db:développé incliné haltères"]],
  ["troisieme dossier gif/triceps/dumbbell-palms-in-incline-bench-press.gif", ["db:développé incliné haltères"]],
  ["troisieme dossier gif/triceps/cable-alternate-triceps-extension.gif", ["db:extension poulie"]],
  ["troisieme dossier gif/triceps/cable-kneeling-triceps-extension.gif", ["db:extension poulie"]],
  ["troisieme dossier gif/triceps/cable-triceps-pushdown-v-bar.gif", ["db:extension poulie"]],
  ["troisieme dossier gif/triceps/cable-triceps-pushdown-v-bar-with-arm-blaster.gif", ["db:extension poulie"]],
  ["troisieme dossier gif/triceps/cable-reverse-grip-triceps-pushdown-sz-bar-with-arm-blaster.gif", ["db:extension poulie supination"]],
  ["troisieme dossier gif/triceps/cable-concentration-extension-on-knee.gif", ["db:extension unilatérale à la poulie"]],
  ["troisieme dossier gif/triceps/cable-standing-one-arm-triceps-extension.gif", ["db:extension unilatérale à la poulie"]],
  ["troisieme dossier gif/triceps/cable-rear-drive.gif", ["db:kickback triceps poulie"]],
  ["troisieme dossier gif/triceps/cable-two-arm-tricep-kickback.gif", ["db:kickback triceps poulie"]],
  ["troisieme dossier gif/triceps/dumbbell-kickbacks-on-exercise-ball.gif", ["db:kickbacks triceps"]],
  ["troisieme dossier gif/triceps/dumbbell-one-arm-kickback.gif", ["db:kickbacks triceps"]],
  ["troisieme dossier gif/triceps/dumbbell-seated-kickback.gif", ["db:kickbacks triceps"]],
  ["troisieme dossier gif/triceps/dumbbell-seated-one-arm-kickback.gif", ["db:kickbacks triceps"]],
  ["troisieme dossier gif/triceps/dumbbell-seated-bent-over-alternate-kickback.gif", ["db:kickbacks triceps"]],
  ["troisieme dossier gif/triceps/dumbbell-seated-bent-over-triceps-extension.gif", ["db:kickbacks triceps"]],
  ["troisieme dossier gif/triceps/dumbbell-standing-kickback.gif", ["db:kickbacks triceps"]],
  ["troisieme dossier gif/triceps/dumbbell-standing-alternating-tricep-kickback.gif", ["db:kickbacks triceps"]],
  ["troisieme dossier gif/triceps/dumbbell-standing-bent-over-one-arm-triceps-extension.gif", ["db:kickbacks triceps"]],
  ["troisieme dossier gif/triceps/dumbbell-standing-bent-over-two-arm-triceps-extension.gif", ["db:kickbacks triceps"]],
  ["troisieme dossier gif/triceps/dumbbell-tricep-kickback-with-stork-stance.gif", ["db:kickbacks triceps"]],
  ["troisieme dossier gif/triceps/close-grip-push-up-on-knees.gif", ["db:pompes serrées"]],
  ["troisieme dossier gif/triceps/diamond-push-up.gif", ["db:pompes serrées"]],
  ["troisieme dossier gif/triceps/incline-close-grip-push-up.gif", ["db:pompes serrées"]],
  ["troisieme dossier gif/triceps/medicine-ball-close-grip-push-up.gif", ["db:pompes serrées"]],
  ["troisieme dossier gif/triceps/narrow-push-up-on-exercise-ball.gif", ["db:pompes serrées"]],
  ["troisieme dossier gif/triceps/push-up-close-grip-off-dumbbell.gif", ["db:pompes serrées"]],
  ["troisieme dossier gif/triceps/side-push-up.gif", ["db:pompes"]],
  ["troisieme dossier gif/triceps/bench-dip-knees-bent.gif", ["db:dips triceps"]],
  ["troisieme dossier gif/triceps/exercise-ball-dip.gif", ["db:dips triceps"]],
  ["troisieme dossier gif/triceps/elbow-dips.gif", ["db:dips triceps"]],
  ["troisieme dossier gif/triceps/three-bench-dip.gif", ["db:dips triceps"]],
  ["troisieme dossier gif/triceps/triceps-dip-bench-leg.gif", ["db:dips triceps"]],
  ["troisieme dossier gif/triceps/triceps-dip-between-benches.gif", ["db:dips triceps"]],
  ["troisieme dossier gif/triceps/triceps-dips-floor.gif", ["db:dips triceps"]],
  ["troisieme dossier gif/triceps/weighted-bench-dip.gif", ["db:dips triceps"]],
  ["troisieme dossier gif/triceps/weighted-three-bench-dips.gif", ["db:dips triceps"]],
  ["troisieme dossier gif/triceps/reverse-dip.gif", ["db:dips triceps"]],
  ["troisieme dossier gif/triceps/triceps-dip.gif", ["db:dips"]],
  ["troisieme dossier gif/triceps/impossible-dips.gif", ["db:dips"]],
  ["troisieme dossier gif/triceps/weighted-tricep-dips.gif", ["db:dips lestés"]],
  ["troisieme dossier gif/triceps/weighted-triceps-dip-on-high-parallel-bars.gif", ["db:dips lestés"]],
  ["troisieme dossier gif/triceps/triceps-press.gif", ["db:dips barre droite"]],
  ["troisieme dossier gif/triceps/dumbbell-lying-alternate-extension.gif", ["db:extensions triceps allongé"]],
  ["troisieme dossier gif/triceps/dumbbell-lying-extension-across-face.gif", ["db:extensions triceps allongé"]],
  ["troisieme dossier gif/triceps/dumbbell-lying-single-extension.gif", ["db:extensions triceps allongé"]],
  ["troisieme dossier gif/triceps/dumbbell-decline-triceps-extension.gif", ["db:extensions triceps allongé"]],
  ["troisieme dossier gif/triceps/exercise-ball-supine-triceps-extension.gif", ["db:extensions triceps allongé"]],
  ["troisieme dossier gif/triceps/dumbbell-lying-one-arm-pronated-triceps-extension.gif", ["db:extensions triceps unilatérales"]],
  ["troisieme dossier gif/triceps/dumbbell-lying-one-arm-supinated-triceps-extension.gif", ["db:extensions triceps unilatérales"]],
  ["troisieme dossier gif/triceps/dumbbell-lying-elbow-press.gif", ["db:tate press"]],
  ["troisieme dossier gif/triceps/ez-barbell-decline-close-grip-face-press.gif", ["db:jm press"]],
  ["troisieme dossier gif/triceps/ez-barbell-jm-bench-press.gif", ["db:jm press"]],
  ["troisieme dossier gif/triceps/dumbbell-incline-triceps-extension.gif", ["db:extension nuque haltère assis"]],
  ["troisieme dossier gif/triceps/dumbbell-incline-two-arm-extension.gif", ["db:extension nuque haltère assis"]],
  ["troisieme dossier gif/triceps/dumbbell-one-arm-french-press-on-exercise-ball.gif", ["db:extension nuque haltère assis"]],
  ["troisieme dossier gif/triceps/dumbbell-pronate-grip-triceps-extension.gif", ["db:extension nuque haltère assis"]],
  ["troisieme dossier gif/triceps/dumbbell-seated-bench-extension.gif", ["db:extension nuque haltère assis"]],
  ["troisieme dossier gif/triceps/dumbbell-seated-reverse-grip-one-arm-overhead-tricep-extension.gif", ["db:extension nuque haltère assis"]],
  ["troisieme dossier gif/triceps/dumbbells-seated-triceps-extension.gif", ["db:extension nuque haltère assis"]],
  ["troisieme dossier gif/triceps/dumbbell-standing-one-arm-extension.gif", ["db:extension triceps debout haltère"]],
  ["troisieme dossier gif/upper-back/barbell-incline-row.gif", ["db:seal row banc"]],
  ["troisieme dossier gif/upper-back/barbell-reverse-grip-incline-bench-row.gif", ["db:seal row banc"]],
  ["troisieme dossier gif/upper-back/cambered-bar-lying-row.gif", ["db:seal row banc"]],
  ["troisieme dossier gif/upper-back/dumbbell-incline-row.gif", ["db:seal row banc"]],
  ["troisieme dossier gif/upper-back/dumbbell-reverse-grip-incline-bench-one-arm-row.gif", ["db:seal row banc"]],
  ["troisieme dossier gif/upper-back/dumbbell-reverse-grip-incline-bench-two-arm-row.gif", ["db:seal row banc"]],
  ["troisieme dossier gif/upper-back/cable-incline-bench-row.gif", ["db:seal row banc"]],
  ["troisieme dossier gif/upper-back/barbell-one-arm-bent-over-row.gif", ["db:rowing barre"]],
  ["troisieme dossier gif/upper-back/barbell-reverse-grip-bent-over-row.gif", ["db:rowing barre"]],
  ["troisieme dossier gif/upper-back/ez-bar-reverse-grip-bent-over-row.gif", ["db:rowing barre"]],
  ["troisieme dossier gif/upper-back/dumbbell-bent-over-row.gif", ["db:rowing haltère debout"]],
  ["troisieme dossier gif/upper-back/dumbbell-reverse-grip-row-female.gif", ["db:rowing haltère debout"]],
  ["troisieme dossier gif/upper-back/dumbbell-palm-rotational-bent-over-row.gif", ["db:rowing haltère"]],
  ["troisieme dossier gif/upper-back/dumbbell-lying-rear-delt-row.gif", ["db:oiseaux penché"]],
  ["troisieme dossier gif/upper-back/cable-decline-seated-wide-grip-row.gif", ["db:tirage horizontal poulie"]],
  ["troisieme dossier gif/upper-back/cable-floor-seated-wide-grip-row.gif", ["db:tirage horizontal poulie"]],
  ["troisieme dossier gif/upper-back/cable-low-seated-row.gif", ["db:tirage horizontal poulie"]],
  ["troisieme dossier gif/upper-back/cable-palm-rotational-row.gif", ["db:tirage horizontal poulie"]],
  ["troisieme dossier gif/upper-back/cable-rope-crossover-seated-row.gif", ["db:tirage horizontal poulie"]],
  ["troisieme dossier gif/upper-back/cable-rope-elevated-seated-row.gif", ["db:tirage horizontal poulie"]],
  ["troisieme dossier gif/upper-back/cable-rope-extension-incline-bench-row.gif", ["db:tirage horizontal poulie"]],
  ["troisieme dossier gif/upper-back/cable-rope-seated-row.gif", ["db:tirage horizontal poulie"]],
  ["troisieme dossier gif/upper-back/cable-standing-row-v-bar.gif", ["db:tirage horizontal poulie"]],
  ["troisieme dossier gif/upper-back/cable-straight-back-seated-row.gif", ["db:tirage horizontal poulie"]],
  ["troisieme dossier gif/upper-back/cable-seated-wide-grip-row.gif", ["db:tirage horizontal poulie"]],
  ["troisieme dossier gif/upper-back/cable-one-arm-bent-over-row.gif", ["db:tirage unilatéral poulie basse"]],
  ["troisieme dossier gif/upper-back/cable-standing-twist-row-v-bar.gif", ["db:tirage rotatif poulie"]],
  ["troisieme dossier gif/upper-back/cable-high-row-kneeling.gif", ["db:rowing poulie haute"]],
  ["troisieme dossier gif/upper-back/cable-one-arm-straight-back-high-row-kneeling.gif", ["db:rowing poulie haute"]],
  ["troisieme dossier gif/upper-back/cable-reverse-grip-straight-back-seated-high-row.gif", ["db:rowing poulie haute"]],
  ["troisieme dossier gif/upper-back/cable-upper-row.gif", ["db:rowing poulie haute"]],
  ["troisieme dossier gif/upper-back/inverted-row-bent-knees.gif", ["db:tractions australiennes"]],
  ["troisieme dossier gif/upper-back/inverted-row-on-bench.gif", ["db:tractions australiennes"]],
  ["troisieme dossier gif/upper-back/inverted-row-v-2.gif", ["db:tractions australiennes"]],
  ["troisieme dossier gif/upper-back/chin-ups-narrow-parallel-grip.gif", ["db:tractions prise neutre"]],
  ["troisieme dossier gif/upper-back/front-lever-reps.gif", ["db:front lever raises"]],
  ["troisieme dossier gif/upper-back/elevator.gif", ["db:skin the cat"]],
  ["troisieme dossier gif/upper-back/lever-alternating-narrow-grip-seated-row.gif", ["db:tirage horizontal machine convergente"]],
  ["troisieme dossier gif/upper-back/lever-narrow-grip-seated-row.gif", ["db:tirage horizontal machine convergente"]],
  ["troisieme dossier gif/upper-back/lever-bent-over-row.gif", ["db:machine row poitrine appuyée"]],
  ["troisieme dossier gif/upper-back/lever-bent-over-row-with-v-bar.gif", ["db:machine row poitrine appuyée"]],
  ["troisieme dossier gif/upper-back/lever-one-arm-bent-over-row.gif", ["db:tirage unilatéral machine"]],
  ["troisieme dossier gif/upper-back/lever-unilateral-row.gif", ["db:tirage unilatéral machine"]],
  ["troisieme dossier gif/upper-back/lever-reverse-t-bar-row.gif", ["db:t-bar row"]],
  ["troisieme dossier gif/upper-back/lever-t-bar-reverse-grip-row.gif", ["db:t-bar row"]],
  ["troisieme dossier gif/upper-back/lever-reverse-grip-vertical-row.gif", ["db:tirage vertical supination"]],
  ['troisieme dossier gif/forearms/barbell-wrist-curl.gif', ['db:wrist curl', 'score:wrist curl']],
  // derniers-gifs
  ['lesderniersgifs/bird dog.gif', ['db:bird dog']],
  ['lesderniersgifs/boxing.gif', ['db:boxe']],
  ['lesderniersgifs/cablewood chop.gif', ['db:cable wood chop']],
  ['lesderniersgifs/commando-pull-up.gif', ['db:tractions commando']],
  ['lesderniersgifs/Dragon_Flag.gif', ['db:dragon flag']],
  ['lesderniersgifs/FacePull.gif', ['db:face pull']],
  ['lesderniersgifs/frog stand.gif', ['db:frog stand']],
  ['lesderniersgifs/Hanging-Windshield-Wiper a la barre.gif', ['db:windshield wipers barre']],
  ['lesderniersgifs/hollow-rock.gif', ['db:hollow hold']],
  ['lesderniersgifs/kakasana-posture-du-corbeau.gif', ['db:pose corbeau']],
  ['lesderniersgifs/l sit barre de traction.gif', ['db:l-sit barre de traction']],
  ['lesderniersgifs/Landmine-Press.gif', ['db:landmine press']],
  ['lesderniersgifs/Landmine-Row.gif', ['db:landmine row']],
  ['lesderniersgifs/Landmine-Squat.gif', ['db:landmine squat']],
  ['lesderniersgifs/marche active.gif', ['db:marche active']],
  ['lesderniersgifs/marche sur les mains.gif', ['db:déplacements équilibre sur les mains']],
  ['lesderniersgifs/one arm dead hang.gif', ['db:one arm dead hang']],
  ['lesderniersgifs/planche inversée penché.gif', ['db:planche inversée penchée']],
  ['lesderniersgifs/plate pinch .gif', ['db:plate pinch']],
  ['lesderniersgifs/rameur.gif', ['db:rameur indoor']],
  ['lesderniersgifs/Riding-Outdoor-Bicycle.gif', ['db:vélo de route']],
  ['lesderniersgifs/shadow-boxing-workout.gif', ['db:shadow boxing']],
  ['lesderniersgifs/shrimp-squats.gif', ['db:shrimp squat']],
  ['lesderniersgifs/spiderman pompes.gif', ['db:pompes spiderman']],
  ['lesderniersgifs/swimming.gif', ['db:natation']],
  ['lesderniersgifs/The-Box-Jump.gif', ['db:saut sur box']],
  ['lesderniersgifs/tibialis raises.gif', ['db:tibialis raises mur']],
  ['lesderniersgifs/toes to bar.gif', ['db:toes to bar']],
  ['lesderniersgifs/tractions inversées aux anneaux.gif', ['db:tractions inversées aux anneaux']],
  ['lesderniersgifs/vacuum.gif', ['db:vacuum']],
  ['lesderniersgifs/seal-row- au banc.gif', ['db:seal row banc']],
  ['lesderniersgifs/rowing haltere debout.gif', ['db:rowing haltère debout']],
  ['lesderniersgifs/hipthrust unilateral.gif', ['db:hip thrust unilatéral']],
  ['lesderniersgifs/extension-mollets.gif', [
    'db:élévations de mollets pointes extérieur',
    'db:élévations de mollets pointes intérieur',
    'db:descente excentrique mollet'
  ]],
  ['lesderniersgifs/squat sumo.gif', ['db:squat sumo']],
  ['lesderniersgifs/handstand on wall.gif', ['db:tenue équilibre sur les mains mur']],
  ['lesderniersgifs/abductions hanches debout.gif', ['db:abduction hanche debout poulie']]
];
const PREFERRED_CARD = new Map([
  ['db:seal row banc', 'lesderniersgifs/seal-row- au banc.gif'],
  ['db:rowing haltère debout', 'lesderniersgifs/rowing haltere debout.gif'],
  ['db:hip thrust unilatéral', 'lesderniersgifs/hipthrust unilateral.gif']
]);
const CARD_PREF = ['troisieme dossier gif', 'quatrieme dossier gif', 'gifs'];

function readJsonl(file) {
  return fs.readFileSync(file, 'utf8').trim().split(/\n/).filter(Boolean).map((line) => JSON.parse(line));
}

function emptyBucket() {
  return { gifs: [], videos: [] };
}

function pushUnique(list, item, keyFn) {
  if (list.some((row) => keyFn(row) === keyFn(item))) return;
  list.push(item);
}

function mediaItem(rec) {
  return {
    mediaId: rec.mediaId,
    sourcePath: rec.sourcePath,
    sourceCollection: rec.sourceCollection,
    sha256: rec.sha256
  };
}

function chooseCard(gifs) {
  if (!gifs.length) return null;
  const ranked = [...gifs].sort((a, b) => {
    const ia = CARD_PREF.indexOf(a.sourceCollection);
    const ib = CARD_PREF.indexOf(b.sourceCollection);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
  return ranked[0];
}

function finalize(bucket, exerciseId) {
  const preferredPath = PREFERRED_CARD.get(exerciseId);
  const preferred = preferredPath ? bucket.gifs.find((gif) => gif.sourcePath === preferredPath) : null;
  const card = preferred || chooseCard(bucket.gifs);
  if (!card && bucket.videos.length === 0) return null;
  return {
    card,
    gif: card,
    videos: bucket.videos
  };
}

function parseStretches(file) {
  const text = fs.readFileSync(file, 'utf8');
  const entries = [];
  let current = null;
  let inVariations = false;
  let variationBuf = '';
  for (const line of text.split('\n')) {
    const keyMatch = line.match(/^  ([a-z0-9_]+): \{$/);
    if (keyMatch) {
      if (current?.name) entries.push(current);
      current = { key: keyMatch[1], variations: [], primaryMuscles: [], equipment: '' };
      inVariations = false;
      continue;
    }
    if (!current) continue;
    const nameMatch = line.match(/^    name: "([^"]+)"/);
    if (nameMatch) current.name = nameMatch[1];
    const eqMatch = line.match(/^    equipment: "([^"]+)"/);
    if (eqMatch) current.equipment = eqMatch[1];
    const muscleMatch = line.match(/^    primaryMuscles: \[([^\]]*)\]/);
    if (muscleMatch) {
      current.primaryMuscles = [...muscleMatch[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
    }
    if (/^    variations: \[/.test(line)) {
      if (line.includes(']')) {
        current.variations = [...line.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
      } else {
        inVariations = true;
        variationBuf = line;
      }
      continue;
    }
    if (inVariations) {
      variationBuf += `\n${line}`;
      if (line.includes(']')) {
        current.variations = [...variationBuf.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
        inVariations = false;
      }
    }
  }
  if (current?.name) entries.push(current);
  return entries;
}

function loadStretches() {
  const files = [
    path.join(REPO, 'src/data/stretchDatabase.js'),
    path.join(REPO, 'src/data/mobilityStretchCatalog.js'),
    path.join(REPO, 'src/data/stretchDrillsCatalog.js')
  ];
  const seen = new Set();
  const exercises = [];
  for (const file of files) {
    for (const raw of parseStretches(file)) {
      if (seen.has(raw.key)) continue;
      seen.add(raw.key);
      exercises.push(makeExercise({
        exerciseId: `stretch:${raw.key}`,
        name: raw.name,
        source: 'stretch',
        equipment: raw.equipment,
        primaryMuscles: raw.primaryMuscles,
        aliases: raw.variations
      }));
    }
  }
  return exercises;
}

function main() {
  const proposals = readJsonl(path.join(__dirname, 'match-proposals.jsonl'));
  const index = readJsonl(path.join(__dirname, 'media-index.jsonl'));
  const byPath = new Map(index.map((row) => [row.relativePath, row]));
  const stretches = loadStretches();
  const exerciseBuckets = new Map();
  const stretchBuckets = new Map();

  let exerciseLinked = 0;
  let stretchLinked = 0;
  let stretchTried = 0;

  for (const rec of proposals) {
    if (rec.role === 'routine') continue;
    const stretchRecord = rec.matchType === 'not_individual'
      && (rec.reasons || []).some((reason) => reason.includes('étirement'));
    if (stretchRecord) {
      stretchTried += 1;
      const meta = byPath.get(rec.sourcePath)?.metadata || {};
      const name = meta.name;
      if (!name) continue;
      const profile = mediaProfile(name, meta.equipment || (meta.equipments || []).join(' '), meta.muscle || meta.target || (meta.targetMuscles || []).join(' '));
      const found = matchIndividual(profile, stretches);
      if (!APPLY.has(found.confidence) || !found.candidates[0]) continue;
      const stretchId = found.candidates[0].exerciseId;
      if (!stretchBuckets.has(stretchId)) stretchBuckets.set(stretchId, emptyBucket());
      if (rec.role === 'card_media') {
        pushUnique(stretchBuckets.get(stretchId).gifs, mediaItem(rec), (row) => row.sha256);
        stretchLinked += 1;
      }
      continue;
    }

    if (!APPLY.has(rec.confidence)) continue;
    if (rec.matchType === 'numeric_hint' || rec.matchType === 'not_individual') continue;
    if (!rec.candidateExerciseIds?.length) continue;

    const asVideo = rec.role === 'pedagogical_video' || rec.matchType === 'family_all_variants';
    const asGif = rec.role === 'card_media' && rec.matchType !== 'family_all_variants';
    for (const candidate of rec.candidateExerciseIds) {
      if (BLOCKED_LINKS.has(`${candidate.exerciseId}|${rec.sourcePath}`)) continue;
      if (!exerciseBuckets.has(candidate.exerciseId)) exerciseBuckets.set(candidate.exerciseId, emptyBucket());
      const bucket = exerciseBuckets.get(candidate.exerciseId);
      if (asVideo) pushUnique(bucket.videos, mediaItem(rec), (row) => row.sha256);
      if (asGif) pushUnique(bucket.gifs, mediaItem(rec), (row) => row.sha256);
      exerciseLinked += 1;
    }
  }

  let reviewedAttached = 0;
  for (const [sourcePath, exerciseId] of REVIEWED_EXISTING_VIDEOS) {
    const rec = byPath.get(sourcePath);
    if (!rec) {
      console.warn('vidéo revue introuvable', sourcePath);
      continue;
    }
    if (!exerciseBuckets.has(exerciseId)) exerciseBuckets.set(exerciseId, emptyBucket());
    const before = exerciseBuckets.get(exerciseId).videos.length;
    pushUnique(exerciseBuckets.get(exerciseId).videos, {
      mediaId: rec.mediaId,
      sourcePath: rec.relativePath,
      sourceCollection: rec.sourceCollection,
      sha256: rec.sha256
    }, (row) => row.sha256);
    if (exerciseBuckets.get(exerciseId).videos.length > before) reviewedAttached += 1;
  }

  for (const [sourcePath, stretchId] of REVIEWED_STRETCH_VIDEOS) {
    const rec = byPath.get(sourcePath);
    if (!rec) {
      console.warn('vidéo étirement introuvable', sourcePath);
      continue;
    }
    if (!stretchBuckets.has(stretchId)) stretchBuckets.set(stretchId, emptyBucket());
    pushUnique(stretchBuckets.get(stretchId).videos, {
      mediaId: rec.mediaId,
      sourcePath: rec.relativePath,
      sourceCollection: rec.sourceCollection,
      sha256: rec.sha256
    }, (row) => row.sha256);
  }

  let reviewedGifs = 0;
  for (const [sourcePath, exerciseId] of REVIEWED_EXISTING_GIFS) {
    const rec = byPath.get(sourcePath);
    if (!rec) {
      console.warn('gif revu introuvable', sourcePath);
      continue;
    }
    if (!exerciseBuckets.has(exerciseId)) exerciseBuckets.set(exerciseId, emptyBucket());
    const before = exerciseBuckets.get(exerciseId).gifs.length;
    pushUnique(exerciseBuckets.get(exerciseId).gifs, {
      mediaId: rec.mediaId,
      sourcePath: rec.relativePath,
      sourceCollection: rec.sourceCollection,
      sha256: rec.sha256
    }, (row) => row.sha256);
    if (exerciseBuckets.get(exerciseId).gifs.length > before) reviewedGifs += 1;
  }

  for (const [sourcePath, exerciseIds] of SHARED_GIFS) {
    const rec = byPath.get(sourcePath);
    if (!rec) {
      console.warn('gif partagé introuvable', sourcePath);
      continue;
    }
    for (const exerciseId of exerciseIds) {
      if (!exerciseBuckets.has(exerciseId)) exerciseBuckets.set(exerciseId, emptyBucket());
      const before = exerciseBuckets.get(exerciseId).gifs.length;
      pushUnique(exerciseBuckets.get(exerciseId).gifs, {
        mediaId: rec.mediaId,
        sourcePath: rec.relativePath,
        sourceCollection: rec.sourceCollection,
        sha256: rec.sha256
      }, (row) => row.sha256);
      if (exerciseBuckets.get(exerciseId).gifs.length > before) reviewedGifs += 1;
    }
  }

  const exercises = {};
  for (const [id, bucket] of exerciseBuckets) {
    const packed = finalize(bucket, id);
    if (packed) exercises[id] = packed;
  }
  const scoringTwins = [
    ['score:wrist curl', 'db:wrist curl'],
    ['score:handstand push ups libres', 'db:handstand push-ups libres'],
    ['score:pompes scapulaires', 'db:pompes scapulaires'],
    ['score:pompe a un bras', 'db:one arm push-up'],
    ['score:pompes decalees', 'db:pompes décalées']
  ];
  for (const [scoreId, dbId] of scoringTwins) {
    if (!exercises[dbId]) continue;
    const videos = [...(exercises[dbId].videos || [])];
    for (const video of exercises[scoreId]?.videos || []) {
      if (!videos.some((row) => row.sha256 === video.sha256)) videos.push(video);
    }
    exercises[scoreId] = { ...exercises[dbId], videos };
  }
  const stretchOut = {};
  for (const [id, bucket] of stretchBuckets) {
    const packed = finalize(bucket);
    if (packed) stretchOut[id] = packed;
  }

  const circuits = [];
  const seenHash = new Map();
  const excludedCircuits = new Set([
    'videos muscles/routines/roulette abdos.mp4',
    'videos muscles/routines/routine biceps 3.mp4'
  ]);
  for (const rec of proposals.filter((row) => row.role === 'routine')) {
    if (excludedCircuits.has(rec.sourcePath)) continue;
    const override = CIRCUIT_OVERRIDES[rec.sourcePath] || {};
    const entry = {
      mediaId: rec.mediaId,
      sourcePath: rec.sourcePath,
      title: rec.filename.replace(/\.mp4$/i, '').replace(/\s+/g, ' ').trim(),
      description: '',
      exerciseKeys: [],
      ...override
    };
    if (seenHash.has(rec.sha256)) {
      if (rec.sourcePath.endsWith('routines/routine abdos.mp4')) {
        circuits[seenHash.get(rec.sha256)] = entry;
      }
      continue;
    }
    seenHash.set(rec.sha256, circuits.length);
    circuits.push(entry);
  }

  const filledFirst = (row) => ((row.exerciseKeys || []).length > 0 || (row.description || '').trim() ? 0 : 1);
  circuits.sort((a, b) => filledFirst(a) - filledFirst(b));

  const manifest = {
    generatedAt: new Date().toISOString(),
    rule: 'EXACT, HIGH_CONFIDENCE, et vidéos revues sur des fiches déjà présentes. Aucune carte créée.',
    exercises,
    stretches: stretchOut,
    circuits
  };
  fs.writeFileSync(OUT, JSON.stringify(manifest));
  console.log(JSON.stringify({
    exerciseCardsWithMedia: Object.keys(exercises).length,
    exerciseLinks: exerciseLinked,
    withCardGif: Object.values(exercises).filter((row) => row.card).length,
    withVideo: Object.values(exercises).filter((row) => row.videos.length).length,
    stretchTried,
    stretchesWithGif: Object.keys(stretchOut).length,
    stretchLinks: stretchLinked,
    reviewedVideosAttached: reviewedAttached,
    reviewedGifsAttached: reviewedGifs,
    circuits: circuits.length,
    stretchCatalog: stretches.length
  }, null, 2));
}

main();
