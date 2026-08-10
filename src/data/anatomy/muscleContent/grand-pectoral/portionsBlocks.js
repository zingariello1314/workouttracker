import { p, h3, ul, figure } from './blocks.js';

export default [
  p(
    'Le grand pectoral est un seul muscle, mais il est organisé en plusieurs faisceaux. Cette organisation explique pourquoi certains exercices donnent davantage de sensation dans certaines zones — sans qu’une portion puisse être totalement isolée des autres.'
  ),
  h3('Faisceau claviculaire — Le haut des pectoraux'),
  p(
    'Le faisceau claviculaire correspond à la partie supérieure du grand pectoral. Ses fibres prennent naissance au niveau de la clavicule et descendent légèrement vers l’humérus.'
  ),
  p(
    'Son orientation lui permet de participer davantage aux mouvements où le bras monte devant le corps. C’est cette portion qui contribue à donner un aspect de poitrine « pleine » sous les clavicules.'
  ),
  p(
    'Chez beaucoup de pratiquants, cette zone paraît moins développée car les mouvements classiques comme le développé couché horizontal sollicitent davantage les fibres sternales. Pour accentuer son développement, il faut généralement utiliser des mouvements où le bras pousse légèrement vers le haut.'
  ),
  ul(['Développé incliné', 'Pompes pieds surélevés', 'Écartés inclinés']),
  figure(
    'developpe-incline-halteres.jpg',
    'Poussée inclinée : le bras monte devant le corps — la portion claviculaire est davantage sollicitée, sans couper le muscle du reste du grand pectoral.'
  ),
  h3('Faisceau sterno-costal — Le volume principal de la poitrine'),
  p(
    'Il représente la majorité de la masse du grand pectoral. Ses fibres prennent naissance au niveau du sternum et des cartilages costaux.'
  ),
  p(
    'C’est la partie la plus sollicitée lors des mouvements de poussée horizontale. Elle intervient énormément dans le développé couché, les pompes classiques et les dips contrôlés. C’est généralement cette portion qui donne l’épaisseur générale de la poitrine.'
  ),
  ul(['Développé couché', 'Pompes classiques', 'Dips contrôlés']),
  figure(
    'pompes.jpg',
    'Poussée horizontale au poids du corps : le faisceau sterno-costal participe fortement, avec triceps et deltoïde antérieur — pas une « isolation » du milieu de poitrine.'
  ),
  h3('Faisceau abdominal — La partie inférieure'),
  p(
    'Cette portion est souvent appelée « bas des pectoraux ». Ses fibres prennent naissance au niveau de la gaine du muscle droit de l’abdomen.'
  ),
  p(
    'Elle participe davantage aux mouvements où le bras descend ou revient depuis une position haute.'
  ),
  ul(['Dips penchés en avant', 'Développé décliné', 'Cross-over de haut vers le bas']),
  figure(
    'dips.jpg',
    'Dips buste penché : trajectoire vers le bas et adduction — zone inférieure et poitrine globale ; la scapula doit rester contrôlée (voir aussi fiche petit pectoral).'
  )
];
