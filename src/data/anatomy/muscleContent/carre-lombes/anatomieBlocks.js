import { h3, p, ul, takeaway, callout, trajet } from './blocks.js';

export default [
  p(
    'Le carré des lombes est un muscle profond de forme globalement quadrangulaire. Il existe un carré des lombes à droite et un à gauche. Les deux côtés peuvent agir ensemble ou séparément selon la tâche. Il forme une véritable liaison musculaire entre le bassin, la dernière côte et la colonne lombaire. Le muscle peut agir sur chacun de ces éléments selon lequel est relativement fixe au moment de la contraction.'
  ),
  h3('Origines'),
  p(
    'Il prend principalement naissance sur la partie postérieure de la crête iliaque et le ligament ilio-lombaire. Cette origine basse l’ancre directement au bassin.'
  ),
  h3('Insertions'),
  p(
    'Il se termine principalement sur le bord inférieur de la 12e côte et les processus transverses des vertèbres lombaires L1 à L4. Cette disposition explique une grande partie de ses fonctions : il peut agir sur la colonne, le bassin ou la 12e côte.'
  ),
  trajet('crête iliaque / ligament ilio-lombaire → L1–L4 et 12e côte'),
  h3('Organisation en plusieurs faisceaux'),
  p(
    'Le carré des lombes n’est pas constitué de fibres toutes orientées exactement de la même manière. Cette organisation permet au muscle d’avoir plusieurs fonctions selon la position du corps et la direction de la force.'
  ),
  ul([
    'fibres ilio-costales : entre la crête iliaque et la 12e côte',
    'fibres ilio-lombaires : entre le bassin et les processus transverses lombaires',
    'fibres costo-lombaires : entre la 12e côte et les vertèbres lombaires'
  ]),
  callout(
    'À retenir',
    'Pont musculaire bassin–colonne–12e côte, de forme quadrangulaire, avec plusieurs faisceaux. Un muscle de chaque côté, capable d’agir ensemble ou séparément.'
  ),
  takeaway(
    'Ses attaches multiples expliquent qu’il puisse incliner le tronc, stabiliser le bassin, contrôler la colonne lombaire et influencer la 12e côte selon ce qui est fixe et ce qui est mobile.'
  )
];
