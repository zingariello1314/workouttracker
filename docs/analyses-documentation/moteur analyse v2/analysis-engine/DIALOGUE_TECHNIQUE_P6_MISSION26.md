# DIALOGUE TECHNIQUE P6 — Mission 26

## 1. Pourquoi des cartes du même exercice deviennent-elles des trajectoires distinctes ?

Parce que le cluster parallèle opérait sur **titres de cartes**, pas sur **identités de stockage**.  
Deux producteurs (`emergence`, `exercise_progress`) du même `ex:504` passaient le filtre dès que le titre matchait. Preuve audit v24 : `ex:504 · ex:504`.

## 2. Composition analytique ou regroupement éditorial ?

En v24 : **essentiellement éditorial** — annonce du regroupement, peu de valeurs sportives, `sourceEvents` vides, sujet `period_activity`.  
v25 : composition informative (volumes, Δ, séances, preuves, sujet `parallel:…`) **uniquement** si ≥2 stockages distincts.

## 3. Référentiels concurrents

- Collectif / ledger : `prevReps` = dernière séance avant interruption.  
- Certains enfants : niveau habituel / médiane.  
v25 nomme explicitement le premier et signale l’écart au second si `habitualReps` est fourni. Pas d’arbitrage silencieux.

## 4. Sommeil (Porte D — ouvert)

Non traité en profondeur dans cette mission (priorité A/B/C). Les critères d’éligibilité divergent encore entre abstention historique et carte « deux zones » — à traiter après rejeu v25.

## 5. Réconciliation dérivée des identités ?

**Oui, faisable sans refonte.** Remplacer le filtre titre par des sets d’ids publiés / accessibles / fused. Implémenté en `finalCatalogReconciliation.v3` (`method: identity_sets`).

## 6. Autorité mémoire sur 8 horizons ?

L’autorité nominale est le **freeze campagne** (`__momentumEightPeriodMemoryFreeze`).  
En v24 la sortie n’était **pas écrite** dans le store profil → rechargement = phénomènes absents.  
v25 : merge + `saveAnalyticalMemory` en fin de campagne. L’exposition ne doit toujours pas écraser les phénomènes (merge M24 conservé).

## 7. Où le moteur comprend-il une transformation sportive ?

Là où un **référentiel nommé** + une **preuve de changement** (gap, Δ volume, confirmation) produisent une thèse.  
Détecter une variation de compteur sans référentiel ≠ transformation. Les faux parallèles et les « niveau antérieur » ambigus en sont l’illustration.

## 8. Que centraliser pour éviter une 27e mission sur les mêmes défauts ?

1. Contrat d’identité : carte ≠ exercice ≠ créneau ≠ phénomène.  
2. Toute composition post-wrap doit déclarer les sujets qu’elle compte.  
3. Réconciliation = sets d’ids, jamais titres.  
4. Mémoire : freeze → calcul → **persist** obligatoire.  
5. Validation sémantique (sujets dupliqués dans un parallèle) au même titre que l’intégrité claims.

## 9. Exigences P6 réellement closes ?

- Intégrité technique publication / claims (M25) : **close mécaniquement**.  
- Faux parallèle même sujet (M26 A1) : **close en code + UT**.  
- Référentiels collectifs / ancres hiérarchie / persist mémoire / reconcil ids : **close en code + UT**.  
- ASPECT qualitatif live, DOM, aveugle, généralisation A–F, sommeil/horizons (D) : **non closes**.

## 10. Recommandation indépendante

1. Rejouer les 8 horizons sous v25 sur le même profil ; comparer à la baseline AUDIT-v24 (surtout absence du parent `ex:504·ex:504`).  
2. Ne pas ouvrir de nouveau moteur parallèle.  
3. Porte D seulement après ce rejeu.  
4. Toujours NO-GO P7 tant que DOM/aveugle/ASPECT ouverts.

### Hypothèse ChatGPT éventuellement contredite

« Deux ids de stockage distincts = toujours deux créneaux historiquement démontrés » — **non**. Des ids distincts peuvent être des alias / migrations ; v25 exige similarité de trajectoire **et** sujets distincts, et refuse le même calendrier de dates. La preuve d’un créneau historique reste à renforcer (nameMap / prescription) — non inventée ici.
