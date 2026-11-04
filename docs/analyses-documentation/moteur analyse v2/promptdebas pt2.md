# 5. INTELLIGENCE TEMPORELLE ADAPTATIVE POUR LES HUIT PÉRIODES

C'est une priorité fonctionnelle majeure.

Je veux que Momentum choisisse intelligemment **comment analyser une période**, pas simplement quelles données récupérer.

Périodes :

- Aujourd'hui ;
- 7 jours ;
- 30 jours ;
- 3 mois ;
- 6 mois ;
- 1 an ;
- 2 ans ;
- Toujours.

## 5.1 Intentions différentes selon l'horizon

### Aujourd'hui

Chercher :

- événements de la journée ;
- séances ;
- structure des séries ;
- écarts au programme ;
- performances significatives ;
- records ;
- retour d'un exercice ;
- comparaison pertinente au niveau habituel.

Ne pas présenter comme nouveauté une performance vieille de six jours.

### 7 jours

Chercher :

- nouveautés récentes ;
- rythme ;
- jours actifs ;
- reprises ;
- évolutions sur plusieurs séances ;
- changements de fréquence ;
- performances ponctuelles importantes ;
- consolidation récente ;
- différence avec la semaine précédente lorsque pertinente.

Ne pas recycler chaque jour les mêmes événements sans évolution.

### 30 jours

Chercher :

- trajectoires par exercice ;
- fréquence vs volume par séance ;
- changements de structure ;
- interruptions et reprises ;
- régularité ;
- évolution début/fin ;
- répartition du volume ;
- événements qui expliquent le mois.

### 3 mois

Chercher :

- phases ;
- tendances ;
- ruptures ;
- premières et dernières séances ;
- blocs comparables ;
- changements de programme ;
- consolidation ;
- évolution du répertoire.

### 6 mois

Chercher activement les stratégies suivantes lorsqu'elles sont pertinentes :

- premier trimestre vs deuxième trimestre ;
- premier mois vs dernier mois ;
- premier tiers vs dernier tiers ;
- début / milieu / fin ;
- avant vs après une interruption ;
- avant vs après un changement de programme ;
- premières séances vs dernières séances ;
- meilleure phase vs niveau actuel ;
- trajectoire complète ;
- comparaison globale et par exercice.

Ne pas publier mécaniquement toutes ces lectures.

Le moteur doit choisir celles qui expliquent réellement ce qui s'est passé.

### 1 an, 2 ans et Toujours

Chercher :

- grandes phases ;
- changements durables ;
- niveau historique ;
- meilleurs résultats ;
- transformations du répertoire ;
- cycles démontrables ;
- continuités ;
- ruptures ;
- évolution du volume, de la fréquence et des performances ;
- rapport entre anciennes capacités et niveau actuel.

Ne jamais inventer de saisonnalité ni de tendance longue avec un historique insuffisant.

## 5.2 Moteur de stratégies temporelles

Vérifie les fonctions existantes.

Complète-les pour permettre à un phénomène de proposer plusieurs plans de comparaison.

Chaque plan doit déclarer :

- question analytique ;
- découpage ;
- raison du découpage ;
- population ;
- couverture ;
- métriques ;
- limites ;
- robustesse ;
- conclusion potentielle.

Le moteur doit pouvoir comparer plusieurs plans et retenir les lectures les plus justes et les plus informatives.

## 5.3 Éviter les comparaisons opportunistes

Ne choisis jamais un découpage uniquement parce qu'il produit le plus gros pourcentage.

Vérifie :

- effectifs ;
- représentativité ;
- périodes complètes ;
- granularité ;
- variabilité ;
- valeurs atypiques ;
- robustesse des bornes ;
- comparabilité des exercices ;
- événements intermédiaires ;
- nombre d'hypothèses testées.

Les changements détectés doivent être significatifs relativement au phénomène, pas seulement numériquement élevés.

## 5.4 Relier les niveaux

Une analyse semestrielle doit pouvoir aller du global au particulier :

volume total → fréquence → volume par séance → exercices contributeurs → séries et trajectoires.

Elle doit aussi pouvoir faire l'inverse :

évolutions d'exercices → contribution aux transformations globales.

Une même période peut justifier plusieurs cartes à des granularités différentes si elles apportent des enseignements complémentaires.

---

# 6. LA PROFONDEUR ANALYTIQUE DOIT DEVENIR UNE CAPACITÉ GÉNÉRALE

Ne te contente pas d'améliorer quelques exercices témoins.

Je veux que les principes de raisonnement puissent servir à toutes les familles pertinentes.

## 6.1 Trajectoires

Préserver et améliorer :

- early / late ;
- dernière performance ;
- creux ;
- rebond ;
- récupération ;
- plateau ;
- hausse durable ;
- baisse durable ;
- outliers ;
- variabilité ;
- interruptions ;
- consolidation.

Distinguer :

- meilleur résultat ;
- niveau habituel ;
- dernière performance ;
- performance reproductible ;
- performance ponctuelle.

Ne pas conclure à un niveau consolidé sur une seule bonne séance.

## 6.2 Séries

Utiliser les séries comme niveau analytique réel.

Analyser, lorsque les données sont fiables :

- nombre de séries ;
- répétitions par série ;
- total ;
- première série ;
- dernière série ;
- évolution des séries ;
- dispersion ;
- stabilité du format ;
- progression par ajout de séries ;
- progression des répétitions à séries constantes ;
- charge ;
- variantes.

Ne pas inférer automatiquement une fatigue physiologique à partir d'une baisse des répétitions entre séries.

Les séries estimées ou reconstruites ne doivent pas être présentées comme des observations directes.

## 6.3 Mécanismes de variation

Décomposer correctement :

- fréquence ;
- volume par séance ;
- exercices pratiqués ;
- séries ;
- répétitions par série ;
- charges ;
- changements de programme ;
- composition des séances.

Attention : les variations relatives multiplicatives ne s'additionnent pas directement.

Toute attribution quantitative doit être mathématiquement cohérente et préciser ses conventions.

## 6.4 Hypothèses concurrentes

Lorsqu'un phénomène admet plusieurs explications possibles, le moteur doit pouvoir distinguer :

- explication mesurée ;
- hypothèse plausible ;
- hypothèse contredite ;
- hypothèse non testable ;
- incertitude résiduelle.

Ne pas transformer une corrélation sommeil/performance en causalité.

Ne pas remplacer une vraie conclusion par des précautions vagues si les données suffisent.

## 6.5 Implications

Les implications doivent découler de l'historique réel.

Pas de conseils génériques.

Pas d'objectif arbitraire.

Pas de recommandation forcée sur toutes les cartes.

Une conclusion purement analytique peut parfaitement être la meilleure fin d'une découverte.

---

# 7. GARANTIR UN NIVEAU ÉLEVÉ POUR TOUTES LES ANALYSES PUBLIABLES

Je veux distinguer clairement deux problèmes :

**Est-ce une bonne analyse ?**

**Faut-il la montrer maintenant ?**

Ces décisions ne doivent plus être mélangées.

## 7.1 Qualification intrinsèque

Chaque candidat enrichi doit passer une évaluation portant sur :

- vérité des faits ;
- exactitude numérique ;
- identité ;
- référentiels ;
- preuves ;
- cohérence ;
- profondeur adaptée ;
- clarté ;
- valeur informative ;
- absence de causalité injustifiée ;
- pertinence du phénomène ;
- qualité de rédaction.

Les signaux bruts peuvent être faibles.

En revanche, le statut « publiable » doit exiger un véritable niveau de qualité.

## 7.2 Statuts distincts

Prévoir des états explicites :

- signal ;
- hypothèse ;
- en enrichissement ;
- non publiable ;
- publiable ;
- publiable non sélectionnée ;
- publiée ;
- actualisée ;
- consolidée ;
- archivée ;
- invalidée.

Adapte ces états aux contrats existants plutôt que de les multiplier inutilement.

Ne confonds pas :

- analyse mauvaise ;
- analyse insuffisamment prouvée ;
- analyse solide mais redondante dans le pack ;
- analyse solide déjà communiquée ;
- analyse solide moins prioritaire aujourd'hui.

## 7.3 Réserve publiable

Les analyses intrinsèquement solides qui ne sont pas sélectionnées doivent rester réévaluables.

Ne conserve pas obligatoirement tous les textes générés pour toujours.

Préserve surtout :

- phénomène ;
- preuves ;
- version des données ;
- statut ;
- dernière interprétation ;
- historique éditorial ;
- raison de non-sélection.

Le texte peut être régénéré si les preuves sont toujours disponibles.

Si une analyse a été invalidée par des données corrigées, elle ne doit pas être republiée telle quelle.

---

# 8. CYCLE DE VIE, ROTATION ET NON-PERSISTANCE ARTIFICIELLE

C'est une autre priorité majeure.

## 8.1 Cas de référence : 112 répétitions

Scénario fictif :

J1 : 112 répétitions de pompes inclinées.

J2 à J6 : aucune nouvelle séance de cet exercice.

Une analyse peut être pertinente à J1.

Elle ne doit pas occuper automatiquement une place pendant six jours simplement parce que l'événement reste dans la fenêtre de sept jours.

Le moteur doit distinguer :

- fait toujours vrai ;
- fait toujours intéressant ;
- information déjà communiquée ;
- nouvelle preuve ;
- nouvelle interprétation ;
- nouvelle pertinence dans une autre période.

## 8.2 Cycle de vie

Pour chaque phénomène :

- première détection ;
- premier état publiable ;
- première publication ;
- dernière publication ;
- dernière modification des preuves ;
- dernière modification significative de l'interprétation ;
- nombre de fois montré ;
- périodes concernées ;
- conclusion déjà communiquée ;
- état actuel.

Ne pas ajouter un simple TTL uniforme de 48 ou 72 heures.

La pertinence dépend du phénomène et de l'horizon consulté.

## 8.3 Réapparition intelligente

Une découverte peut redevenir pertinente si :

- une nouvelle séance confirme la tendance ;
- un nouveau résultat la contredit ;
- un record est dépassé ;
- une interruption devient une reprise consolidée ;
- une période plus longue révèle une nouvelle interprétation ;
- le niveau actuel s'éloigne fortement d'un ancien niveau ;
- la découverte devient centrale pour un bilan historique.

Une simple reformulation de titre ne constitue pas une nouveauté.

## 8.4 Rotation raisonnée

La rotation n'est pas une obligation de changer les cartes à chaque ouverture.

Elle doit servir à publier les découvertes ayant la meilleure valeur actuelle.

Une grande analyse semestrielle peut rester pertinente plusieurs jours.

Une statistique ponctuelle banale ne doit pas être recyclée en permanence.

Le système doit savoir garder une carte, la remplacer, la fusionner, la réactualiser ou la retirer.

## 8.5 Scénarios temporels obligatoires

Tester :

- J1 record ;
- J2 à J6 sans nouveauté ;
- nouvelle séance proche du record ;
- nouveau record ;
- consolidation après plusieurs séances ;
- baisse après consolidation ;
- consultation à 30 jours ;
- consultation à six mois ;
- consultation de Toujours ;
- correction rétroactive d'une séance ancienne.

Vérifier que la conclusion et la publication évoluent correctement.

## 8.6 Historique éditorial

Auditer précisément `insightHistory`.

Expliquer les différences observées entre les runs où l'historique est absent et ceux où il contient 180 entrées.

L'historique ne doit ni provoquer un recyclage infini, ni éliminer les meilleures analyses sans compensation intelligente.

Il doit aider à décider ce qui reste réellement nouveau.

---

# 9. UNE SÉLECTION ÉDITORIALE QUI PRIVILÉGIE LA MEILLEURE INTERPRÉTATION

Le cas `span_volume_vs_frequency` contre `disc_volume_shape` est un scénario prioritaire permanent.

Le moteur a calculé une explication du volume plus approfondie, puis publié une version descriptive moins instructive.

Cette erreur de hiérarchisation doit devenir un test de non-régression.

## 9.1 Séparer qualité et priorité

La qualité intrinsèque détermine l'éligibilité.

La priorité contextuelle détermine la publication.

La sélection doit examiner :

- importance ;
- précision ;
- information nouvelle ;
- contexte historique ;
- profondeur ;
- pertinence temporelle ;
- actualité ;
- complémentarité ;
- redondance ;
- historique éditorial ;
- preuves ;
- intérêt réel pour l'utilisateur.

## 9.2 Supériorité analytique

Lorsque deux candidats expliquent essentiellement le même phénomène :

- identifier les faits communs ;
- identifier les informations supplémentaires ;
- mesurer les différences de preuves ;
- vérifier si l'analyse plus profonde est réellement correcte ;
- privilégier l'interprétation qui apporte une compréhension supplémentaire démontrée.

Ne pas imposer que le texte le plus long gagne.

Ne pas imposer que F4 gagne.

Ne pas imposer que le plus récent gagne.

## 9.3 Valeur marginale

Une carte doit être évaluée en fonction de ce que les cartes déjà sélectionnées expliquent.

Exemple :

Quatre cartes différentes sur des curls peuvent être justifiées si elles racontent quatre trajectoires distinctes.

Elles ne doivent pas automatiquement être affichées si elles répètent le même constat « format repris ».

À l'inverse, ne pas supprimer une seconde analyse sur le même exercice lorsqu'elle apporte un autre phénomène important.

## 9.4 Nombre dynamique de cartes

Je refuse :

- les quotas fixes arbitraires ;
- les plafonds éditoriaux rigides ;
- les planchers qui obligent à publier des cartes médiocres ;
- les quotas artificiels par famille ;
- les suppressions fondées uniquement sur le nombre déjà affiché.

Je veux un système capable d'afficher 3, 12, 20, 30 ou davantage d'analyses si leur valeur intrinsèque et marginale le justifie.

Les contraintes de performance et d'ergonomie doivent être traitées au niveau de la présentation, de la pagination, de la virtualisation ou de la navigation.

Ne pas confondre limite d'interface et limite de qualité éditoriale.

Si un plafond de sécurité technique est indispensable, le documenter, le rendre distinct du classement analytique et mesurer les bonnes analyses exclues.

## 9.5 Couverture

Ne pas optimiser uniquement le taux de cartes sans défaut.

Mesurer également les découvertes importantes non publiées.

Un moteur qui affiche trois cartes irréprochables mais laisse vingt découvertes majeures invisibles n'a pas atteint l'objectif.

---

# 10. QUALITÉ GRAMMATICALE ET RÉDACTIONNELLE EXIGEANTE

L'intégralité de la rédaction destinée à l'utilisateur doit être irréprochable.

Je ne veux plus revoir :

- « un mouvement » alors que le nom est disponible ;
- « Exercice 504 » ;
- « Ces 7 jours sont plus dense » ;
- « 36,8 % de ta tronc » ;
- « Relevés de genoux aux parallèles revient » ;
- « tu viens de » pour un événement ancien ;
- titres abstraits ;
- formulations techniques internes ;
- textes tronqués ;
- accords incorrects ;
- chiffres sans unité ;
- contradictions entre titre et corps ;
- conclusions arbitraires ;
- phrases génériques produites en série.

## 10.1 Grammaire fondée sur le sujet

Ne déduis pas naïvement l'accord verbal du dernier mot du nom de l'exercice.

Le sujet réel de la phrase doit être connu.

Par exemple :

« Les relevés de genoux aux parallèles reviennent… »

Ou reformulation :

« Le travail de relevés de genoux aux parallèles reprend… »

Préférer une reformulation naturellement correcte à un bricolage grammatical.

## 10.2 Contrôle du texte final

Contrôler :

- titre ;
- corps ;
- footer ;
- badges textuels ;
- chiffres ;
- unités ;
- dates ;
- sujet ;
- verbes ;
- adjectifs ;
- références historiques ;
- implication.

La validation ne doit pas s'arrêter au template initial.

Elle doit porter sur ce qui est effectivement publié.

## 10.3 Précision temporelle

Distinguer :

- aujourd'hui ;
- hier ;
- cette semaine ;
- dans la période ;
- il y a plusieurs semaines ;
- avant la période ;
- historiquement ;
- dernière séance ;
- meilleur résultat observé.

Ne pas qualifier de « nouveau » un événement déjà présent dans l'historique.

## 10.4 Profondeur adaptée

Une observation simple peut être concise.

Une trajectoire complexe doit recevoir un traitement plus développé.

Conserver le principe :

**Constat → mécanisme → portée → implication.**

Sans forcer quatre phrases artificielles.

Chaque texte doit donner la meilleure explication que les données autorisent.

---

# 11. ANTICIPER TOUTES LES GRANDES FAMILLES DE DÉFAUTS

L'inventaire de nos discussions contient plus de 140 situations problématiques potentielles.

Il ne faut pas les traduire en 140 exceptions indépendantes.

Il faut les transformer en garanties structurelles et en tests.

Le registre documentaire doit couvrir systématiquement les familles suivantes.

### Données

Doublons, omissions, cache, identités, variantes, sources, GTG, Garmin, séries, charges, unités, jours actifs, séances, programmes historiques, données manquantes.

### Temporalité

Fenêtres glissantes, périodes partielles, comparaison début/fin, blocs, trimestres, phases, interruptions, programmes, dates locales, granularités, représentativité.

### Fraîcheur

Analyses persistantes, cartes répétées, phénomènes déjà vus, nouvelles preuves, mises à jour, archivage, republication, pertinence par horizon.

### Trajectoires

Plateaux, creux, rebonds, records, outliers, récupération, variabilité, stabilité, progression, déclin, performance reproductible, changement de format.

### Raisonnement

Décomposition, hypothèses concurrentes, mécanismes mesurables, causalité, implications, contradictions, explications alternatives, conclusions insuffisantes.

### Pertinence

Ampleur, rareté, importance, nouveauté, valeur informative, utilité, couverture, diversité, saturation, hiérarchisation.

### Redondance

Même épisode, mêmes phénomènes, analyses complémentaires, faux doublons, contradictions entre cartes, synthèses.

### Contexte

GTG, adhérence, séances partielles, programmes, changements de pratique, endurance, exercices alternatifs, variantes et historique.

### Corrélations

Sommeil, volume, effort, Garmin, décalages temporels, petits échantillons, biais, comparaisons multiples, interprétations abusives.

### Rédaction

Grammaire, dates, noms, quantificateurs, registre, clarté, précision, longueur, cohérence, absence d'artefacts.

### Publication

Diagnostic vs DOM, run, signatures, filtres, historique, exports, états de chargement, race conditions, performances.

### Régressions

Anciennes erreurs revenues, interactions entre correctifs, règles locales contradictoires, tests incomplets, fixtures irréalistes, défauts visibles uniquement sur données réelles.

Pour chaque famille, documenter les invariants garantis et les cas restant non couverts.

---

# 12. CRÉER UN VÉRITABLE BANC DE TESTS ANALYTIQUES

Les tests unitaires actuels ne suffisent pas.

Je veux des scénarios sportifs complets, avec des résultats attendus et des conclusions interdites.

## Scénarios obligatoires

### A. Volume et attribution

- 4 502 vs 3 731 avec couverture de l'export live.
- 4 889 vs 3 731 avec couverture de l'autre snapshot.
- Fréquence stable et volume par séance en hausse.
- Fréquence en hausse et volume par séance stable.
- Fréquence en baisse et volume par séance en hausse.
- Variation totale issue de deux facteurs opposés.

### B. Trajectoires

- Progression régulière.
- Déclin progressif.
- Plateau.
- Creux puis rebond.
- Récupération partielle.
- Retour isolé non consolidé.
- Dernière séance exceptionnelle.
- Forte variabilité.

### C. Séries

- `3×12 → 4×12`.
- `4×10` vs `16+12+8+4`.
- `5×10` annoncé à tort alors que le total est de 36.
- Séries manquantes ou inférées.
- Charge modifiée.
- Variante modifiée.

### D. Historique

- Retour après interruption.
- Même exercice avec deux identités historiques.
- Deux épisodes distincts.
- Exercice renommé.
- Programme révisé.
- Historique incomplet.

### E. Temporalité

- Sept jours sans signal nouveau.
- Trente jours avec reprise récente.
- Trois mois avec progression puis plateau.
- Six mois avec hausse, rupture et rebond.
- Premier trimestre vs deuxième trimestre.
- Premier mois vs dernier mois.
- Première vs dernière phase d'un exercice irrégulier.
- Comparaison opportuniste trompeuse.
- Année avec données partielles.

### F. Publication

- Record à J1 puis aucune nouveauté jusqu'à J6.
- Nouvelle séance à J7.
- Confirmation à J15.
- Déclin à J45.
- Consultation semestrielle à J180.
- Analyse publiable non retenue puis redevenue pertinente.
- Même analyse reformulée sans fait nouveau.
- Même phénomène interprété différemment selon la période.

### G. Sélection

- Lecture profonde vs constat descriptif sur le même phénomène.
- Plusieurs curls avec conclusions identiques.
- Plusieurs cartes distinctes sur le même exercice.
- 30 découvertes réellement complémentaires sur 7 jours.
- Période avec seulement deux découvertes valables.
- Une famille fortement représentée mais réellement informative.
- Une famille pauvre en données.

### H. Rédaction

- Sujets singuliers et pluriels.
- Noms d'exercices composés.
- Titres au pluriel.
- Dates anciennes.
- Changements de période.
- Variations positives et négatives.
- Référentiels différents.
- Chiffres contradictoires.
- Expressions interdites.
- Artefacts de concaténation.

Chaque scénario doit préciser :

- entrées ;
- faits attendus ;
- phénomène attendu ;
- interprétation attendue ;
- interprétations interdites ;
- niveau de preuve ;
- décision de publication attendue ;
- texte ou propriétés textuelles attendus.

Évite des tests qui ne vérifient que la présence d'un mot-clé.

Un test peut vérifier une propriété sémantique sans figer chaque phrase exacte.

Conserve les scénarios de régression anciens déjà valides.

---

# 13. CONSOLE D'INVESTIGATION : RENDRE VISIBLE LA VRAIE QUALITÉ

Je veux pouvoir comprendre pourquoi une analyse est bonne, pourquoi elle n'est pas montrée et pourquoi une autre gagne sa place.

Conserver la console existante, notamment :

- comparaison A/B ;
- registre ;
- conservation ;
- dossier JSON ;
- problèmes ;
- export Markdown ;
- capture DOM.

Ne la reconstruis pas inutilement.

Complète son modèle lorsque nécessaire.

## 13.1 Statuts intelligibles

Distinguer :

- signal détecté ;
- candidat enrichi ;
- non publiable ;
- publiable non sélectionné ;
- sélectionné ;
- publié dans le DOM ;
- déjà communiqué ;
- actualisé ;
- archivé ;
- invalidé.

## 13.2 Pourquoi cette analyse ?

Pour chaque candidat, afficher :

- phénomène ;
- événements ;
- métriques ;
- référentiels ;
- preuves ;
- interprétation ;
- mécanismes ;
- incertitudes ;
- qualité intrinsèque ;
- nouveauté ;
- pertinence temporelle ;
- concurrent principal ;
- raison de décision ;
- état de publication ;
- historique éditorial.

## 13.3 Pourquoi ce candidat a-t-il perdu ?

Afficher le candidat gagnant et la comparaison réelle.

Cas obligatoire :

`span_volume_vs_frequency` vs `disc_volume_shape`.

Je veux connaître le mécanisme exact qui permet à une analyse descriptive de battre une explication approfondie.

Corrige la cause plutôt que de créer un bonus spécial pour ce titre.

## 13.4 Réserve

Afficher les découvertes publiables non sélectionnées.

Permettre d'inspecter :

- leur valeur ;
- leur validité ;
- les preuves ;
- leur date ;
- leur dernière publication ;
- leur condition de réapparition ;
- leur concurrence actuelle.

## 13.5 Comparabilité

Corriger les situations où :

- une capture DOM vide est indiquée comparable ;
- les signatures sont absentes ;
- les données diffèrent ;
- l'historique éditorial diffère ;
- le run diagnostic n'est pas identique au run de publication.

Ne jamais présenter une comparaison non fiable comme une régression démontrée.

---

# 14. PERFORMANCE ET PASSAGE À L'ÉCHELLE

Je veux un moteur riche, pas un moteur qui devient inutilisable lorsqu'il examine deux ans d'historique.

Préserver :

- Worker ;
- calcul asynchrone ;
- cache ;
- signatures ;
- stratégies incrémentales ;
- mécanismes de performance existants.

Mesurer :

- chargement ;
- reconstruction ;
- enrichissement ;
- génération ;
- comparaison temporelle ;
- qualification ;
- sélection ;
- narration ;
- transfert Worker ;
- publication DOM.

Ne pas générer des milliers de textes finalisés si quelques centaines de faits ou phénomènes structurés suffisent.

L'exploration temporelle doit être raisonnablement bornée par des critères analytiques, pas par des quotas éditoriaux arbitraires.

Réutiliser les agrégats lorsque leur provenance est fiable.

Ne pas calculer toutes les comparaisons imaginables à chaque ouverture.

Privilégier les hypothèses pertinentes puis approfondir les plus prometteuses.

Tester les huit périodes à froid, à chaud et lors de navigations rapides.

La console ne doit pas ralentir inutilement l'onglet Analyse.

---

# 15. MÉTHODE D'EXÉCUTION

Ne transforme pas cette mission en une interminable succession de sous-projets sans intégration.

Travaille dans cet ordre logique.

## Étape A — État réel

- Auditer les capacités existantes.
- Vérifier leurs appels.
- Identifier les chemins de publication.
- Reproduire les défauts confirmés.
- Documenter les écarts.
- Initialiser les documents persistants.

## Étape B — Vérité commune

- Unifier les définitions de métriques.
- Réconcilier les référentiels.
- Stabiliser les identités.
- Corriger les incohérences de données.
- Garantir la provenance.

## Étape C — Phénomènes et intelligence temporelle

- Réutiliser les modules composés.
- Harmoniser les preuves.
- Relier les observations.
- Étendre les plans de comparaison pertinents.
- Valider les interprétations.

## Étape D — Qualité, sélection et cycle de vie

- Définir les analyses intrinsèquement publiables.
- Corriger les arbitrages défaillants.
- Mettre en place ou compléter la réserve dynamique.
- Gérer la persistance.
- Gérer la republication.
- Supprimer les quotas arbitraires.
- Préserver la complémentarité.

## Étape E — Rédaction et publication

- Fiabiliser le français.
- Vérifier les affirmations finales.
- Garantir la correspondance diagnostic/DOM.
- Améliorer la console selon les besoins.

## Étape F — Recette

- Exécuter les scénarios.
- Examiner les huit périodes.
- Comparer les résultats avant/après.
- Vérifier les régressions.
- Mesurer la performance.
- Mettre à jour tous les documents.
- Produire le rapport final.

**À chaque étape, démontrer la conformité des corrections existantes et ne pas casser les étapes déjà validées.**

Privilégier les modifications cohérentes et réversibles.

Ne pas accumuler des règles ad hoc pour faire passer un scénario particulier.

Si une solution ne généralise pas à d'autres exercices ou périodes, réexaminer sa pertinence architecturale.

---

# 16. CRITÈRES DE RÉUSSITE

Je considérerai cette mission comme réellement avancée lorsque les garanties suivantes seront démontrées.

### Vérité

Les métriques sont traçables, comparables et cohérentes.

### Profondeur

Les analyses exploitent les trajectoires, séries, événements et mécanismes disponibles lorsque cela apporte de la valeur.

### Temporalité

Chaque période reçoit des interprétations adaptées, avec des stratégies de comparaison justifiées.

### Qualité

Une analyse déclarée publiable possède une vraie valeur intrinsèque.

### Sélection

Les meilleures interprétations gagnent contre les observations moins instructives du même phénomène.

### Diversité

Des analyses différentes peuvent coexister lorsqu'elles apportent des enseignements complémentaires.

### Quantité

Le nombre de cartes correspond aux découvertes valables, sans quotas fixes arbitraires.

### Mémoire

Les événements déjà expliqués ne sont pas présentés artificiellement comme nouveaux.

### Réapparition

Les phénomènes peuvent être réévalués et republiés lorsque les données ou le contexte le justifient.

### Cohérence

Deux cartes ne racontent pas des histoires incompatibles sur le même événement sans distinction explicite.

### Grammaire

Les textes publiés sont naturels, précis et grammaticalement corrects.

### Fiabilité

Une correction ne fait pas réapparaître silencieusement les anciens défauts.

### Observabilité

La console permet d'expliquer les décisions et de vérifier les cartes réellement affichées.

### Performance

L'ensemble reste utilisable sur toutes les périodes.

---

# 17. RAPPORT FINAL ET DOCUMENTATION À CONSERVER

À la fin du travail, fournis un rapport précis.

Je veux :

1. Les capacités avancées déjà présentes et conservées.
2. Les causes racines confirmées.
3. Les défauts corrigés.
4. Les mécanismes effectivement unifiés.
5. Les stratégies temporelles fonctionnelles.
6. Le cycle de vie éditorial réellement implémenté.
7. Les critères de qualification des analyses.
8. Les modifications apportées à la sélection.
9. Les règles de qualité grammaticale.
10. Les scénarios de référence réussis.
11. Les scénarios encore problématiques.
12. Le nombre d'analyses produites, publiables, sélectionnées et affichées sur chacune des huit périodes.
13. Des exemples complets de cartes, avec leur provenance.
14. Les différences de qualité avant/après.
15. Les mesures de performance.
16. Les fichiers modifiés.
17. Les documents Markdown créés ou mis à jour.
18. Les limites et risques résiduels.

Pour chaque résultat, indiquer :

- corrigé et vérifié en navigateur ;
- corrigé et vérifié par tests ;
- implémenté mais non validé ;
- défaut restant ;
- bloqué ;
- non applicable.

Ne pas confondre « tests verts » et « qualité démontrée ».

Ne pas déclarer une perfection absolue.

Si une famille d'analyses reste faible, le signaler honnêtement.

Si une fonctionnalité est déjà satisfaisante, la préserver et documenter sa validation.

Si des travaux ne peuvent pas être achevés dans l'exécution courante, laisser dans `IMPLEMENTATION_PROGRESS.md` un état exact permettant une reprise sans nouvel audit général.

Ne pas ouvrir une nouvelle phase de développement fonctionnel sans rapport avec cette mission.

Aucun commit Git.

---

# PRINCIPES FINAUX À NE JAMAIS PERDRE

**1. Le moteur ne doit pas seulement produire des faits : il doit interpréter des phénomènes.**

**2. Il ne doit pas seulement analyser une période : il doit choisir intelligemment comment l'analyser.**

**3. Il ne doit pas seulement produire de bonnes cartes : il doit garantir la qualité de toutes les analyses qu'il considère publiables.**

**4. Il ne doit pas seulement sélectionner les cartes les mieux notées : il doit sélectionner celles qui apportent le plus de compréhension à cet instant.**

**5. Il ne doit pas oublier les découvertes solides non publiées, ni republier artificiellement des informations déjà communiquées.**

**6. Il ne doit pas réduire artificiellement le nombre de découvertes. La richesse doit être proportionnelle à la richesse réelle des données.**

**7. Il ne doit jamais sacrifier la vérité des chiffres, la cohérence, les nuances temporelles ou la grammaire au profit d'un texte séduisant.**

**8. Chaque correction doit renforcer durablement le système et ses garanties, pas ajouter une nouvelle exception fragile.**

**9. Les documents Markdown constituent une mémoire durable des exigences et des décisions. Ils doivent évoluer avec le code.**

**10. La réussite se mesure à ce que l'utilisateur comprend réellement de son entraînement, et pas au nombre de détecteurs, de tests ou de cartes générées.**

L'objectif final est que Momentum Sport puisse observer une journée, une semaine, un mois, un semestre ou plusieurs années d'entraînement, comprendre les évolutions les plus significatives, construire les meilleures analyses démontrables et présenter toutes celles qui méritent réellement d'être lues — avec intelligence, précision, profondeur et cohérence.