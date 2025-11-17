/**
 * sharing/shareLinks/index.js
 * 
 * Barrel exports pour les Share Links CRUD
 * 
 * @module services/nutrition/sharing/shareLinks
 */

export {
  saveShareLink,
  getShareLink,
  getAllShareLinks,
  deleteShareLink,
  lockShareLink,
  updateShareLinkAccess,
  detectSuspiciousBehavior,
  cleanupExpiredLinks,
  cleanupRevokedLinks
} from './shareLinksCRUD';


