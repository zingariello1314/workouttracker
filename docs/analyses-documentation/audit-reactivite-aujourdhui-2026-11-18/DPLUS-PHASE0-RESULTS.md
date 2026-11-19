# Phase 0 — résultats isolés

18 novembre 2026. Machine : Node v24.11.1, Windows. Aucune base Momentum lue ou écrite. Aucun chiffre ci-dessous n’est une estimation. Ce qui n’a pas été exécuté est marqué **non mesuré**.

La sonde `scripts/dplus/dplusPhase0Probe.js` n’est importée par aucun écran. Le chemin de sauvegarde de production n’a pas reçu de marque de performance.

---

## Ce qui a été exécuté

### Boucle de signature, hors moteur XP

`node scripts/dplus/phase0-isolated.mjs`. Sept passages, médiane. La fonction parcourt les clés cochées caractère par caractère. Ce n’est pas `calculateSportXP`. Les clés sont synthétiques. Une clé sur trois n’est pas cochée.

| Jeu | Jours × exercices | Clés cochées | JSON de l’historique | Tranche d’un jour | Médiane signature | Médiane `JSON.stringify` des cochés |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| S | 30 × 8 | 150 | 8 872 octets | 116 octets | 0,11 ms (min 0,09, max 0,37) | 0,03 ms |
| M | 400 × 12 | 3 200 | 183 222 octets | 187 octets | 1,05 ms (min 0,69, max 1,44) | 0,38 ms |
| L | 2 000 × 12 | 16 000 | 916 022 octets | 187 octets | 4,41 ms (min 4,10, max 7,54) | 2,68 ms |

La tranche d’un jour reste sous 200 octets pendant que l’historique complet dépasse 900 Ko. La boucle de signature, seule, ne produit pas une attente de plusieurs secondes sur 16 000 clés.

### Moteur XP réel

`node node_modules/vitest/vitest.mjs run scripts/dplus/phase0-xp-engine.test.js`. Environnement vitest `jsdom`, pas le thread React de l’application, pas un historique personnel. Toutes les clés sont cochées, forme `YYYY-MM-DD_index`, répétitions `"10"`. `calculateSportXP` est la fonction de production. Les `totalXP` sont ceux du moteur sur ce jeu ; ils ne décrivent pas un utilisateur.

| Jeu | Clés cochées | Passages | Durée | totalXP |
| --- | ---: | ---: | --- | ---: |
| S | 240 | 5 | médiane 10,85 ms (min 8,34, max 25,35) | 6 192 |
| M | 4 800 | 3 | médiane 781,61 ms (min 756,87, max 783,76) | 123 840 |
| L | 24 000 | 1 | 24 636,03 ms, un seul passage | 619 200 |

Le détail est dans `scripts/dplus/phase0-xp-results.json`. L n’a pas de médiane : une seule exécution. L’import du module (1,83 s dans le rapport vitest) est hors de ces durées.

Conséquence mesurée : le coût qui grandit avec l’historique est le moteur complet, pas la boucle de signature. À 4 800 clés, trois passages restent autour de 0,8 s. À 24 000 clés, un passage dépasse 24 s dans ce jsdom. Cela ne mesure pas la peinture, ni la transaction IndexedDB, ni le nombre de rendus React.

### Politique de fusion

Même script Node, et `threeWayMerge.test.js` : 11 tests verts (vitest 4.0.15, 18 novembre 2026, durée de fichier négligeable, de l’ordre de la milliseconde par test).

- Clé partagée simulée : `{ tractions: false, dips: true }`, `tractionsLost: true`.
- Deux enregistrements séparés : tractions et dips conservés.
- Cas indépendants : `{ tractions: 12, dips: 15 }`.
- Même clé 12 contre 15 : `conflict`, candidat canonique 15, brouillon conservé.
- 10 → 12 des deux côtés : `ok`, une valeur.
- Tombeau contre 15 : `conflict`.
- Deux suppressions : clé absente, `ok`.
- Objet `serie` modifié des deux côtés sur des champs différents : `conflict` sur la clé entière.
- Génération 4 confirmée : l’enregistrement 5 reste.
- Ids `ah_1` et `ah_2` : deux entrées. Même id et même corps : une entrée.

---

## Non mesuré

| Mesure demandée | Pourquoi |
| --- | --- |
| Clic → coche peinte | Il faudrait brancher la sonde dans `TodayTab.jsx` et lancer un navigateur sur un jeu synthétique. Non fait, pour ne pas toucher au chemin de clic de production. |
| Clic → pourcentage peint | Même raison. Le `useMemo` de séance dépend encore de `data`. |
| Clic → XP affichée | Le moteur a été chronométré hors React. Le délai de deux `requestAnimationFrame`, de `startTransition` et de la signature dans `useSportXP` n’a pas été chronométré à l’écran. |
| Préparation de sauvegarde, files, transaction IndexedDB, relecture | Aucune transaction n’a été ouverte, ni sur la base réelle, ni en fake-indexeddb. |
| Rendus React, long tasks | Pas de session navigateur. |
| Volume écrit par le chemin actuel | Non instrumenté. Le JSON synthétique ci-dessus n’est pas le buffer IndexedDB. |
| Temps jusqu’à confirmation | Non mesuré. |
| Comparaison instrumenté / non instrumenté | La sonde n’est pas branchée, donc pas de delta. |

Un essai `vite-node` sur un script qui importait `calculateSportXP` directement n’a rien affiché en 90 secondes et a été interrompu. Ce script n’est pas conservé. Le chiffre XP retenu est celui de vitest.

---

## Protocole exécutable pour les mesures encore ouvertes

À lancer seulement après accord de brancher la sonde. La sonde reste inactive tant que `import.meta.env.DEV` est faux ou que `globalThis.__MOMENTUM_DPLUS_PHASE0` n’est pas `true`.

1. Importer `dplusMark` depuis `scripts/dplus/dplusPhase0Probe.js` aux sites suivants, et nulle part ailleurs :
   - début du gestionnaire de coche, et juste après le `setState` optimiste ;
   - `useLayoutEffect` du contrôle coché, marque « peint » ;
   - calcul du pourcentage, début et fin ;
   - appel affiché de `calculateSportXP`, début et fin ;
   - ouverture et fin de transaction dans une copie de test du gateway, pas dans une base de profil.
2. Jeu de données : les constructeurs de `phase0-isolated.mjs` (signature) et de `phase0-xp-engine.test.js` (XP), chargés dans une base IndexedDB de test créée par le test, détruite à la fin. Jamais le profil ouvert dans le navigateur quotidien.
3. Lire `performance.getEntriesByName('dplus:…')`. Médiane sur 7 clics, après un clic de chauffe non compté.
4. Répéter une fois avec le drapeau éteint. Si la médiane bouge de plus de 5 %, la sonde est trop lourde et on la retire.
5. Ne pas envoyer les mesures. Les écrire dans un JSON local sous `scripts/dplus/`.

Playwright peut couvrir T1 (deux contextes) et T18 (fermeture d’onglet). Il ne démontre pas une coupure électrique. Un timeout simulé ne démontre pas un commit disque.

---

## Lecture pour la suite

Le pourcentage et la coche peuvent devenir immédiats sans attendre l’XP : leur donnée est la mémoire du jour, et la tranche JSON d’un jour synthétique est sous 200 octets. L’XP affichée, si elle appelle `calculateSportXP` sur tout l’historique à chaque coche, coûte déjà ~0,8 s à 4 800 clés dans ce test, et ~25 s à 24 000. La garder exacte impose de la calculer après la peinture et d’abandonner un résultat périmé, pas de la recalculer dans le gestionnaire de clic. Un worker n’est pas dans la première étape. Un raccourci de calcul ne l’est pas non plus, tant que T16 n’a pas montré l’égalité avec `calculateSportXP`.
