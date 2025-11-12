/**
 * PropTypes pour usePaginatedActivities (documentation uniquement, pas de validation runtime).
 * 
 * Ce fichier sert de documentation pour les types attendus par le hook.
 * Pour une validation runtime, utiliser PropTypes ou TypeScript.
 */

/**
 * @typedef {Object} UsePaginatedActivitiesParams
 * @property {Array} allActivities - Toutes les activités à paginer
 * @property {number} [itemsPerPage=10] - Nombre d'items par page
 * @property {boolean} [enableVirtualization=true] - Activer la virtualisation pour listes >100 items
 * @property {number} [virtualizationThreshold=100] - Seuil pour activer la virtualisation
 */

/**
 * @typedef {Object} UsePaginatedActivitiesReturn
 * @property {Array} paginatedActivities - Activités paginées ou toutes les activités (si virtualisé)
 * @property {Array} allActivities - Toutes les activités
 * @property {number} currentPage - Page actuelle
 * @property {number} totalPages - Nombre total de pages
 * @property {number} itemsPerPage - Nombre d'items par page
 * @property {Object} paginationInfo - Informations d'affichage (startIndex, endIndex, total, etc.)
 * @property {boolean} shouldVirtualize - Si true, mode virtualisation activé
 * @property {Function} goToPage - Fonction pour aller à une page spécifique
 * @property {Function} goToNextPage - Fonction pour aller à la page suivante
 * @property {Function} goToPreviousPage - Fonction pour aller à la page précédente
 * @property {Function} goToFirstPage - Fonction pour aller à la première page
 * @property {Function} goToLastPage - Fonction pour aller à la dernière page
 * @property {Function} setCurrentPage - Fonction pour définir la page actuelle
 */

export default {};


