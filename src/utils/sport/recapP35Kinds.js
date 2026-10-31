/**
 * Identifiants P3.5 — fichier sans dépendances (évite cycles E0 ↔ métriques).
 * @module recapP35Kinds
 */

export const P35_KINDS = Object.freeze({
  GTG_COEXISTENCE: 'disc_p35_gtg_coexistence',
  GTG_MOVEMENT_SHARE: 'disc_p35_gtg_movement_share',
  GTG_OUTSIDE_CLASSIC: 'disc_p35_gtg_outside_classic',
  GAP_NATURE: 'disc_p35_gap_nature',
  FEEDBACK_DIFFICULTE: 'disc_p35_feedback_difficulte',
  CROSS_GTG_DIFFICULTE: 'disc_p35_cross_gtg_difficulte'
});

/**
 * Rivals sémantiques E0.
 * Hors horaires prévus (`disc_gtg_unplanned_*`) ≠ GTG sur journées sans séance classique
 * (`GTG_OUTSIDE_CLASSIC`) — ne pas les fusionner.
 * Coexistence (répartition des canaux) et outside (dénominateur sans classique) se
 * chevauchent assez pour rester rivaux entre eux uniquement.
 */
export const P35_RIVAL_GROUPS = Object.freeze([
  [
    P35_KINDS.GAP_NATURE,
    'disc_plan_follow_rate',
    'disc_plan_recurring_skip',
    'disc_offplan_pattern'
  ],
  [P35_KINDS.GTG_COEXISTENCE, P35_KINDS.GTG_OUTSIDE_CLASSIC]
]);
