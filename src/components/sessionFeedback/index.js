/**
 * Contrat composants Feedback réutilisables (PC + Momentum Mobile).
 *
 * - Les libellés / options viennent de `sessionFeedbackCatalog.js` (pas de doublons UI).
 * - L’état est une cellule `{ state, value }` (ANSWER_STATES).
 * - La persistance passe par `commitCatalogFeedback` + patch sparse (`catalogDraft`).
 * - Aucune contrainte de largeur/hauteur PC dans les utils métier.
 * - `SessionFeedbackSummaryBar` + `buildSessionFeedbackSummary` pour le bandeau séance.
 * - Les questions conditionnelles (point 4) ne sont pas déclenchées ici.
 */

export { default as FeedbackScaleControl } from './FeedbackScaleControl.jsx';
export { default as FeedbackSegmentControl } from './FeedbackSegmentControl.jsx';
export { default as FeedbackMultiSelect } from './FeedbackMultiSelect.jsx';
export { default as FeedbackCollapsibleSection } from './FeedbackCollapsibleSection.jsx';
export { default as SessionFeedbackSummaryBar } from './SessionFeedbackSummaryBar.jsx';
