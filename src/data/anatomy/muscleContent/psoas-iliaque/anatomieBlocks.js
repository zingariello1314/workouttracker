import { h3, p, takeaway, callout, trajet } from './blocks.js';

export default [
  p(
    'Le psoas-iliaque relie le bassin et la région lombaire au fémur. Le psoas majeur et l’iliaque se rejoignent avant leur insertion et agissent ensemble comme un puissant fléchisseur de hanche. Cette architecture explique son rôle majeur dans la flexion de hanche et son influence possible sur la relation entre colonne, bassin et cuisse.'
  ),
  h3('Psoas majeur'),
  p(
    'Le psoas majeur est un muscle profond situé de chaque côté de la colonne lombaire. Il prend notamment naissance sur les corps vertébraux et disques intervertébraux de la région T12–L5, ainsi que sur les processus transverses des vertèbres lombaires. Ses fibres descendent vers le bassin puis passent en avant de l’articulation de la hanche avant de rejoindre le fémur.'
  ),
  h3('Iliaque'),
  p(
    'Le muscle iliaque occupe principalement la fosse iliaque, à l’intérieur du bassin. Il prend naissance sur une large surface de la face interne de l’ilium, notamment au niveau de la fosse iliaque. Ses fibres convergent vers le bas et rejoignent celles du psoas majeur.'
  ),
  h3('Insertion commune'),
  p(
    'Le psoas majeur et l’iliaque se rejoignent pour former le muscle iliopsoas, qui s’insère principalement sur le petit trochanter du fémur par l’intermédiaire d’un tendon commun. Contrairement à de nombreux fléchisseurs de hanche, le psoas majeur possède donc des attaches directement liées à la colonne lombaire.'
  ),
  trajet('T12–L5 / fosse iliaque → tendon commun → petit trochanter'),
  callout(
    'À retenir',
    'Deux muscles, une insertion : psoas majeur (colonne lombaire) + iliaque (fosse iliaque) → petit trochanter. Continuum mécanique colonne → bassin → hanche → fémur.'
  ),
  takeaway(
    'C’est cette continuité qui explique à la fois la flexion de hanche et l’influence possible du psoas sur le bassin et la colonne lorsque les jambes bougent.'
  )
];
