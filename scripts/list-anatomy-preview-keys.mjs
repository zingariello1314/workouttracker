/**
 * Liste les clés fichier .webp nécessaires pour la grille banque (aperçus raster).
 *
 * Usage : npm run anatomy:preview-keys
 * Sortie JSON sur stdout pour enchaînement (jq, script de rendu Playwright…).
 */

import { buildAnatomyPreviewManifest } from './anatomyPreviewManifest.mjs';

console.log(JSON.stringify(buildAnatomyPreviewManifest(), null, 2));
