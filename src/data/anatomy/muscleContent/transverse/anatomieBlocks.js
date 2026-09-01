import { h3, p, ul, takeaway, callout, trajet } from './blocks.js';

export default [
  p(
    'Le transverse constitue la couche la plus profonde des trois muscles larges de l’abdomen : oblique externe, oblique interne, puis transverse. Il se trouve sous les deux obliques et en profondeur par rapport au grand droit. Ses fibres sont principalement orientées horizontalement, ce qui lui donne son aspect de ceinture entourant le tronc.'
  ),
  h3('Origines'),
  p(
    'Le transverse possède plusieurs zones d’origine, ce qui lui permet de relier la cage thoracique, la colonne lombaire et le bassin. Il ne s’agit donc pas d’un simple muscle situé autour du nombril : il forme une grande partie de la paroi abdominale profonde.'
  ),
  ul([
    'faces internes des cartilages costaux des côtes inférieures, principalement 7 à 12',
    'fascia thoracolombaire',
    'partie antérieure de la crête iliaque',
    'une partie du ligament inguinal'
  ]),
  h3('Insertions'),
  p(
    'Ses fibres se dirigent principalement horizontalement vers l’avant et se terminent dans une large aponévrose qui rejoint la ligne blanche. Cette aponévrose participe à la formation de la gaine du muscle grand droit et contribue ainsi à l’organisation mécanique de toute la paroi abdominale antérieure.'
  ),
  p(
    'Le transverse ne forme donc pas une boucle musculaire complètement fermée. Il s’agit plutôt d’un système musculaire et aponévrotique qui entoure et relie les différentes parties de la paroi abdominale.'
  ),
  trajet('côtes 7–12 / fascia thoracolombaire / crête iliaque / ligament inguinal → aponévrose → ligne blanche'),
  h3('Fibres horizontales'),
  p(
    'Cette orientation donne une indication importante sur la fonction du muscle. Le transverse n’est pas particulièrement adapté à la production d’une grande flexion ou rotation. En revanche, sa contraction peut augmenter la tension de la paroi et exercer une force de compression autour de la cavité abdominale.'
  ),
  callout(
    'À retenir',
    'Couche la plus profonde des muscles larges, fibres horizontales, origines multiples (côtes, fascia, bassin) et insertion via l’aponévrose vers la ligne blanche.'
  ),
  takeaway(
    'Le transverse n’est pas une boucle fermée autour du nombril. C’est un système musculo-aponévrotique qui relie cage thoracique, colonne, bassin et paroi antérieure.'
  )
];
