import { h3, p, ul, takeaway, callout, trajet } from './blocks.js';

export default [
  p(
    'L’oblique interne forme une grande partie de la paroi abdominale latérale, entre la crête iliaque, le fascia thoracolombaire et les côtes. Comme l’oblique externe, il ne fonctionne pas comme un simple petit muscle localisé sur le côté du ventre. C’est une large nappe musculaire qui relie le bassin, les côtes et la ligne médiane de l’abdomen.'
  ),
  h3('Origines'),
  p(
    'Il prend principalement naissance sur la crête iliaque, notamment sa partie antérieure ; le fascia thoracolombaire ; et une partie du ligament inguinal. Ses fibres se dirigent ensuite vers le haut, vers l’avant ou vers le bas selon leur région.'
  ),
  ul([
    'crête iliaque, notamment sa partie antérieure',
    'fascia thoracolombaire',
    'une partie du ligament inguinal'
  ]),
  h3('Insertions'),
  p(
    'Ses fibres se terminent notamment sur les bords inférieurs des côtes 10 à 12, la ligne blanche par l’intermédiaire de son aponévrose, et la région pubienne via certaines expansions aponévrotiques.'
  ),
  trajet('crête iliaque / fascia thoracolombaire / ligament inguinal → côtes 10–12, ligne blanche, pubis'),
  h3('Couches croisées avec l’oblique externe'),
  p(
    'Les fibres de l’oblique externe descendent globalement vers l’avant, tandis que celles de l’oblique interne prennent globalement une direction opposée dans leur partie principale. Cette organisation en couches croisées permet à la paroi abdominale de produire une force dans plusieurs directions, et explique le fonctionnement croisé en rotation : oblique interne d’un côté + oblique externe du côté opposé.'
  ),
  callout(
    'À retenir',
    'Large nappe du bassin vers les côtes et la ligne blanche, sous l’oblique externe, fibres globalement croisées. Le muscle relie bassin, cage thoracique et paroi médiane.'
  ),
  takeaway(
    'L’oblique interne n’est pas un « petit muscle du flanc ». C’est une couche profonde de la paroi, complémentaire de l’oblique externe par l’orientation de ses fibres.'
  )
];
