import grandPectoral from './muscleContent/grand-pectoral';
import petitPectoral from './muscleContent/petit-pectoral';
import deloide from './muscleContent/deloide';
import coiffeRotateurs from './muscleContent/coiffe-rotateurs';
import grandDorsal from './muscleContent/grand-dorsal';
import grandRond from './muscleContent/grand-rond';
import trapezes from './muscleContent/trapezes';
import rhomboides from './muscleContent/rhomboides';
import denteleAnterieur from './muscleContent/dentele-anterieur';
import petitRond from './muscleContent/petit-rond';
import erecteursRachis from './muscleContent/erecteurs-rachis';
import multifides from './muscleContent/multifides';
import bicepsBrachial from './muscleContent/biceps-brachial';
import brachial from './muscleContent/brachial';
import brachioRadial from './muscleContent/brachio-radial';
import tricepsBrachial from './muscleContent/triceps-brachial';
import avantBrasEnsemble from './muscleContent/avant-bras-ensemble';
import grandDroit from './muscleContent/grand-droit';
import obliqueExterne from './muscleContent/oblique-externe';
import obliqueInterne from './muscleContent/oblique-interne';
import transverse from './muscleContent/transverse';
import pyramidal from './muscleContent/pyramidal';
import carreLombes from './muscleContent/carre-lombes';
import quadricepsFemoral from './muscleContent/quadriceps-femoral';
import ischioJambiers from './muscleContent/ischio-jambiers';
import adducteursEnsemble from './muscleContent/adducteurs-ensemble';
import grandFessier from './muscleContent/grand-fessier';
import moyenFessier from './muscleContent/moyen-fessier';
import petitFessier from './muscleContent/petit-fessier';
import gastrocnemien from './muscleContent/gastrocnemien';
import soleaire from './muscleContent/soleaire';
import tibialAnterieur from './muscleContent/tibial-anterieur';
import sternoCleidoMastoidien from './muscleContent/sterno-cleido-mastoidien';
import splenius from './muscleContent/splenius';
import elevateurScapula from './muscleContent/elevateur-scapula';
import psoasIliaque from './muscleContent/psoas-iliaque';

/** @type {Record<string, { sections: { id: string, title: string, blocks: object[] }[] }>} */
const MUSCLE_CONTENT = {
  'grand-pectoral': grandPectoral,
  'petit-pectoral': petitPectoral,
  deltoide: deloide,
  'coiffe-rotateurs': coiffeRotateurs,
  'grand-dorsal': grandDorsal,
  'grand-rond': grandRond,
  trapezes,
  rhomboides,
  'dentele-anterieur': denteleAnterieur,
  'petit-rond': petitRond,
  'erecteurs-rachis': erecteursRachis,
  multifides,
  'biceps-brachial': bicepsBrachial,
  brachial,
  'brachio-radial': brachioRadial,
  'triceps-brachial': tricepsBrachial,
  'avant-bras-ensemble': avantBrasEnsemble,
  'grand-droit': grandDroit,
  'oblique-externe': obliqueExterne,
  'oblique-interne': obliqueInterne,
  transverse,
  pyramidal,
  'carre-lombes': carreLombes,
  'psoas-iliaque': psoasIliaque,
  'quadriceps-femoral': quadricepsFemoral,
  'ischio-jambiers': ischioJambiers,
  'adducteurs-ensemble': adducteursEnsemble,
  'grand-fessier': grandFessier,
  'moyen-fessier': moyenFessier,
  'petit-fessier': petitFessier,
  gastrocnemien,
  soleaire,
  'tibial-anterieur': tibialAnterieur,
  'sterno-cleido-mastoidien': sternoCleidoMastoidien,
  splenius,
  'elevateur-scapula': elevateurScapula
};

export function getMuscleContent(muscleId) {
  return MUSCLE_CONTENT[muscleId] || null;
}

export function hasMuscleContent(muscleId) {
  return Boolean(MUSCLE_CONTENT[muscleId]);
}
