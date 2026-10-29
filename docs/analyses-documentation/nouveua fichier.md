# MISSION MAJEURE — TRANSFORMER LE MOTEUR D'ANALYSE DE MOMENTUM SPORT EN UN SYSTÈME D'ANALYSE SPORTIVE APPROFONDI, TRANSVERSAL ET INTELLIGENT

## 1. Objectif général

Tu dois faire évoluer le moteur d'analyse de Momentum Sport pour qu'il soit capable d'exploiter réellement l'ensemble des données disponibles dans l'application, de rapprocher les informations pertinentes, de détecter des relations, de construire des interprétations solides et de produire des conclusions concrètes, personnalisées et utiles à l'utilisateur.

Le moteur actuel possède déjà des calculs, des modules d'analyse et des données. Le problème n'est pas uniquement le manque de données ni la qualité des phrases : c'est aussi la manière dont les informations sont exploitées, reliées, interprétées, sélectionnées et présentées.

Je ne veux pas seulement un système qui décrit des statistiques avec de meilleures formulations. Je veux un système qui analyse le journal sportif dans sa globalité, remarque ce qui mérite de l'être, explique ce que les observations signifient et détermine quelles conséquences on peut raisonnablement en tirer.

**La priorité est la profondeur du raisonnement, puis la qualité de sa restitution. La rédaction ne doit jamais servir à masquer une analyse insuffisante.**

Tu es responsable de l'audit, de la conception, de l'implémentation et de la validation du travail. Tu dois travailler de façon autonome, prendre les décisions techniques raisonnables sans me solliciter continuellement et aller jusqu'à l'implémentation et aux tests. Ne te contente pas de me remettre un rapport ou une architecture théorique.

Tu disposes du code du projet. Base tes décisions sur son fonctionnement réel, et non sur des suppositions concernant son architecture.

---

## 2. Le défaut fondamental à corriger : les analyses s'arrêtent trop tôt

Plusieurs analyses actuelles illustrent un problème récurrent.

### Exemple A — Le moteur décrit une opération au lieu de présenter son résultat

Une formulation comme :

« Pour comprendre leur contribution à ta progression, Momentum doit rapprocher ces passages des exercices concernés, de leur fréquence et de l'évolution des performances. »

est inacceptable comme analyse destinée à l'utilisateur.

Cette phrase explique ce que le moteur devrait faire, mais ne donne aucun résultat issu de ce travail.

Le moteur doit :
1. Identifier les passages concernés dans les données.
2. Les associer aux exercices réellement effectués.
3. Distinguer les exercices prévus des exercices accomplis.
4. Relier les répétitions et les charges à leur séance et à leur date.
5. Calculer la fréquence, le volume et l'évolution des performances.
6. Comparer les résultats à des références pertinentes.
7. Déterminer ce que ces informations permettent de conclure.
8. Rédiger directement cette conclusion.

L'utilisateur doit recevoir le résultat de l'analyse, jamais une description des calculs qu'il faudrait encore effectuer.

### Exemple B — Le moteur décrit une évolution sans expliquer ce qu'elle implique

Une formulation comme :

« Tu retrouves donc, dès cette séance, ton volume habituel sur la variante aux parallèles, tout en ajoutant un volume conséquent sur une seconde variante. Cela montre que tu as repris le mouvement avec une quantité de travail déjà significative. »

commence correctement, mais s'arrête trop tôt.

Le moteur doit examiner les données complémentaires disponibles pour déterminer si cette séance :
- Correspond à un retour ponctuel à un niveau déjà connu.
- Constitue une hausse du volume total par rapport aux séances comparables.
- S'inscrit dans une progression déjà amorcée.
- Confirme une tendance observée sur plusieurs séances.
- Établit un nouveau niveau de référence.
- Ou reste trop isolée pour démontrer une évolution durable.

Il doit ensuite expliquer la signification de ce constat pour l'entraînement et les objectifs de l'utilisateur.

Il ne doit pas conclure automatiquement à une progression de force ou d'hypertrophie sur la seule base d'une hausse du volume. Il doit exploiter les indicateurs disponibles pour préciser ce qui progresse réellement : volume de travail, performance sur un exercice, capacité à répéter un effort, régularité ou autre dimension mesurable.

### Exemple C — Les analyses se dérobent au lieu de conclure

Les formulations suivantes sont à éviter lorsqu'elles remplacent une analyse possible :

- « Il faudra examiner les performances pour comprendre la situation. »
- « Si le volume baisse ensuite, il faudra examiner la difficulté et la récupération. »
- « La suite permettra de distinguer une reprise ponctuelle d'une véritable stabilisation. »
- « Pour savoir si la hausse du volume s'accompagne d'une progression sportive, il faut également examiner les performances. »

Ces phrases reportent le raisonnement à plus tard alors que le moteur doit d'abord exploiter les données déjà disponibles.

Si les séances suivantes existent, compare-les immédiatement. Si les données de difficulté sont renseignées, utilise-les. Si la récupération n'est pas renseignée, ne l'invente pas. Si plusieurs séances comparables confirment une tendance, annonce cette tendance. Si les données montrent une évolution ponctuelle, explique précisément ce qui est établi et ce qui ne l'est pas.

Une réserve est légitime lorsqu'elle correspond à une véritable limite des données. Une réserve générique qui remplace le raisonnement est un défaut.

**Règle fondamentale : dès qu'une relation pertinente peut être calculée avec les données existantes, le moteur doit la calculer et exploiter son résultat avant de rédiger l'analyse.**

---

## 3. Auditer intégralement le moteur avant de choisir les modifications

Commence par parcourir les véritables chemins d'exécution de l'application.

Inspecte notamment, s'ils sont effectivement utilisés :
- `recapAdaptiveInsights.js`
- `recapProgramCoachAnalysis.js`
- `recapDenseAnalytics.js`
- `recapCrossCoachInsights.js`
- `volumeProgressionEngine.js`

Ne présume pas que cette liste est exhaustive ni que ces modules contiennent toute la logique. Recherche également les autres générateurs, sélecteurs, agrégateurs, systèmes de scoring, fonctions de rédaction et transformations qui contribuent aux analyses affichées.

Reconstitue le pipeline complet :

1. Données sources.
2. Normalisation et agrégation.
3. Calculs sportifs.
4. Détection des constats.
5. Corrélations et interprétations existantes.
6. Génération des analyses candidates.
7. Classement et déduplication.
8. Sélection finale.
9. Construction du texte, des titres, catégories et badges.
10. Affichage dans l'interface.

Identifie précisément :
- Les données déjà disponibles mais insuffisamment exploitées.
- Les calculs qui existent déjà et pourraient être réutilisés.
- Les relations qui ne sont pas calculées.
- Les générateurs qui fonctionnent isolément.
- Les conclusions perdues entre la génération et la sélection.
- Les limites artificielles de la fenêtre temporelle.
- Les doublons techniques et sémantiques.
- Les analyses qui occupent de la place sans apporter d'information.
- Les règles qui confondent absence de données, absence de saisie et absence d'activité.
- Les informations perdues lors des changements de programme.
- Les différences entre séances prévues, commencées, partiellement exécutées et terminées.

Ne réalise pas une refonte aveugle. Identifie les défauts réels et utilise-les pour déterminer les changements nécessaires.

---

## 4. Créer une couche de raisonnement transversal

Le moteur doit pouvoir rapprocher les informations provenant de plusieurs modules sans que chaque générateur ait besoin de reconstruire seul une partie de l'historique.

Conçois cette couche en fonction de l'architecture existante. Elle peut prendre la forme d'un contexte analytique commun, de détecteurs de relations, de constats structurés ou d'une autre organisation si celle-ci est plus appropriée.

L'objectif fonctionnel est le suivant :

### A. Construire un contexte fiable

Centralise ou rends accessibles les informations pertinentes :
- Historique des séances et de leurs dates.
- Programme prévu pour chaque date.
- Exercices réellement réalisés.
- Séries, répétitions, charges, durées et autres métriques disponibles.
- Variantes des exercices.
- Fréquence et régularité de pratique.
- Historique des performances comparables.
- Exercices partiellement réalisés ou non terminés.
- Données de récupération, sommeil ou difficulté lorsqu'elles existent.
- Objectifs de l'utilisateur.
- Données corporelles et évolution de ces mesures.
- Historique des modifications de programme, lorsqu'il est disponible.

Ne recopie pas toutes les données dans un objet gigantesque si cela rend le système inutilement complexe. Réutilise les structures existantes ou construis une représentation analytique adaptée.

### B. Calculer des constats réutilisables

Un constat doit représenter un fait calculé et vérifiable : hausse du volume sur un exercice, augmentation de la fréquence, baisse du taux d'exécution d'une séance, changement durable du poids, amélioration d'une performance comparable, etc.

Il doit conserver autant que nécessaire :
- Sa métrique et sa valeur.
- Sa période et les dates pertinentes.
- Sa référence de comparaison.
- Les données sources qui l'étayent.
- Sa fiabilité et ses limites.
- Le sujet concerné : exercice, séance, groupe musculaire ou mesure corporelle.

### C. Relier les constats entre eux

Le moteur doit pouvoir exploiter un constat dans plusieurs analyses distinctes.

Par exemple, une séance peut alimenter :
- Une analyse de progression d'un exercice.
- Une analyse de volume musculaire.
- Une analyse de régularité.
- Une analyse de respect du programme.

Ces analyses ne sont pas automatiquement redondantes. Elles le deviennent lorsqu'elles communiquent essentiellement la même conclusion.

### D. Éviter les architectures excessives

Ne crée pas systématiquement un modèle complexe de preuves, de claims, de graphe ou de composition si une solution plus simple répond au besoin.

Sépare raisonnablement :
- La production des faits.
- Leur interprétation.
- La rédaction.
- La sélection et la déduplication.

Choisis les abstractions en fonction des problèmes observés. Ne multiplie pas les couches intermédiaires sans valeur concrète.

---

## 5. Corrélations sportives et progression

Développe la capacité du moteur à relier les indicateurs sportifs disponibles pour comprendre les évolutions plutôt que les décrire séparément.

### A. Volume et performance

Pour chaque exercice ou variante pertinente, exploite si possible :
- Nombre de séries.
- Nombre de répétitions.
- Volume de répétitions.
- Charge externe.
- Volume chargé lorsque ce calcul a un sens.
- Performance par série et par séance.
- Fréquence de pratique.
- Comparaison avec des séances comparables.
- Évolution sur plusieurs séances.
- Difficulté ressentie ou récupération lorsqu'elles sont renseignées.

Le moteur doit distinguer une hausse du volume d'une hausse de performance. Il doit aussi identifier les situations où les deux évoluent ensemble ou en sens opposés.

Pour les exercices au poids du corps, ne traite pas toutes les répétitions comme équivalentes si les variantes, l'amplitude ou les conditions d'exécution diffèrent de manière significative.

Ne compare pas aveuglément une série légère à une série lestée, une variante aux parallèles à une variante au sol, ou deux séances dont la structure est différente.

### B. Progression durable et événements ponctuels

Détermine si les observations représentent :
- Un record isolé.
- Une amélioration répétée.
- Une augmentation du volume sans amélioration démontrée de la performance.
- Une progression confirmée sur plusieurs séances comparables.
- Une stabilisation à un niveau supérieur.
- Une baisse temporaire.
- Une régression suffisamment étayée.
- Une situation impossible à interpréter faute de données comparables.

Utilise des critères adaptés au nombre d'observations et à la nature de l'exercice. N'impose pas un nombre universel de séances si les données et la logique sportive justifient un autre seuil.

### C. Relations entre exercices et groupes musculaires

Lorsque les données le permettent, relie les exercices aux groupes musculaires sollicités et aux objectifs déclarés par l'utilisateur.

Évalue :
- La fréquence de sollicitation de chaque groupe.
- Le volume réellement effectué.
- Les changements de répartition du travail.
- Les groupes régulièrement sous-entraînés par rapport au programme prévu.
- Les relations entre l'évolution de plusieurs exercices.
- La cohérence entre le programme, son exécution et l'objectif recherché.

Prends en compte les limites de ces rapprochements : deux exercices qui sollicitent un même muscle ne constituent pas nécessairement des équivalents, et un volume de répétitions ne mesure pas directement l'hypertrophie.

### D. Conséquences pour la progression

Ne t'arrête pas à « le volume augmente » ou « la régularité est bonne ».

Détermine ce que les données indiquent sur le niveau de référence de l'utilisateur, sa capacité à accumuler du travail, la progression mesurable de ses performances et les éléments de son programme qui méritent une attention particulière.

Lorsque les informations le permettent, formule une conséquence concrète : une qualité qui se développe, un déséquilibre dans le travail réellement accompli, une progression confirmée ou une limite précise qui empêche encore d'établir une conclusion.

---

## 6. Créer une véritable famille d'analyses d'assiduité et d'exécution du programme

Cette famille doit être développée en complément des analyses sportives existantes.

L'objectif est de comprendre non seulement ce que l'utilisateur réalise, mais aussi quelles parties de son programme il suit réellement et de manière régulière.

### A. Calculs nécessaires

Pour chaque séance prévue, jour de la semaine ou occurrence de programme pertinente, calcule autant que possible :
- Nombre d'occurrences attendues.
- Nombre de séances commencées.
- Nombre de séances terminées.
- Nombre de séances partiellement exécutées.
- Nombre d'occurrences réellement manquées.
- Taux de complétion.
- Proportion d'exercices réalisés.
- Proportion de travail réalisé lorsque cette métrique est calculable.
- Évolution de l'assiduité entre périodes.
- Régularité des séances et groupes musculaires concernés.

Distingue impérativement une séance absente, une séance non renseignée, une séance annulée et une séance partiellement réalisée lorsque les données permettent de les différencier.

Respecte la logique existante du programme, les dates de référence et les changements de programme. Ne compte pas une occurrence qui n'était pas prévue.

### B. Comparer les séances entre elles

Une analyse doit pouvoir constater que deux séances similaires sont exécutées avec des niveaux d'assiduité différents.

Elle doit ensuite expliquer ce que cette différence signifie dans le programme réel.

Exemple de structure attendue :

« Tes séances du lundi et du vendredi sont les plus régulières : tu as réalisé les quatre occurrences prévues de chaque séance au cours des 30 derniers jours. Le mercredi est nettement moins suivi, avec une seule séance validée sur quatre et une exécution moyenne de 65 %. Comme cette séance cible notamment les épaules et les triceps, une partie du travail prévu pour ces groupes musculaires n'est pas réalisée avec la même régularité que le reste du programme. »

Ce texte est un exemple de structure, pas une formulation à reproduire systématiquement. Les chiffres doivent être calculés à partir du journal réel.

### C. Exploiter les conséquences

Le moteur doit aller plus loin en reliant l'assiduité aux performances, aux groupes musculaires, au volume réel et aux objectifs de l'utilisateur.

Il doit pouvoir déterminer :
- Si les séances les moins exécutées correspondent aux groupes musculaires les moins travaillés.
- Si le volume prévu est très différent du volume effectivement accompli.
- Si une amélioration de l'assiduité s'accompagne d'une évolution mesurable.
- Si une séance est régulièrement interrompue ou sous-exécutée.
- Si le programme est bien suivi dans son ensemble ou seulement sur certaines parties.

Ne prétends pas qu'une séance manquée a causé une stagnation sans données suffisantes. En revanche, si le journal démontre un déficit d'exécution, annonce clairement ce déficit et son incidence sur la réalisation du programme.

### D. Préserver les règles spécifiques de Momentum

Examine notamment les règles concernant les GTG, les séances sur plusieurs jours, les occurrences d'un même exercice à des jours différents et les exercices cochés partiellement.

Ne compte pas deux fois les répétitions, les exercices ou les occurrences. Distingue les séances planifiées des pratiques libres. Respecte les règles actuelles de comptabilisation, sauf si tu démontres un défaut précis.

---

## 7. Ajouter des analyses du poids et des données corporelles

Le moteur doit exploiter les données corporelles déjà présentes ou ajoutées par l'utilisateur, sans imposer la saisie de nouvelles informations.

Cette famille doit être intégrée à l'écosystème des analyses et non traitée comme une fonctionnalité isolée.

### A. Données prioritaires

Commence par vérifier les structures réellement disponibles pour :
- Poids.
- Taille.
- IMC calculable à partir du poids et de la taille.
- Masse grasse.
- Masse maigre et autres paramètres de composition corporelle, si disponibles.
- Dates, historique et fréquence des mesures.

Ne suppose pas que tous ces paramètres existent déjà. Identifie ceux qui sont effectivement stockés, ceux que l'interface permet de saisir et ceux qui peuvent être calculés de manière fiable.

### B. Analyses à produire selon les données disponibles

Une saisie peut déclencher plusieurs analyses complémentaires si chacune apporte une information distincte.

Exemples :
- Évolution du poids entre deux dates.
- Tendance sur plusieurs semaines.
- Rythme de variation du poids.
- Stabilité ou fluctuations importantes.
- Évolution de l'IMC.
- Évolution des mesures de composition corporelle.
- Comparaison entre différentes périodes.
- Relation temporelle entre l'évolution corporelle et l'activité sportive.
- Cohérence entre plusieurs mesures disponibles.

Avec une seule mesure, ne prétends pas détecter une tendance. Avec peu de mesures ou des intervalles irréguliers, adapte le niveau de certitude.

### C. Précautions d'interprétation

L'IMC est un indicateur calculé à partir du poids et de la taille. Il ne mesure pas directement la masse grasse et doit être interprété avec ses limites, notamment chez les personnes musclées.

Une hausse de poids ne prouve pas une hausse de masse musculaire. Une baisse ne prouve pas une perte de graisse. Les liens entre entraînement et évolution corporelle doivent être présentés comme des associations observées, sauf si les données permettent une conclusion plus solide.

Lorsque des mesures répétées de composition corporelle existent, exploite-les directement plutôt que de déduire une composition corporelle à partir du poids seul.

### D. Ajout sans régression

Ces analyses doivent s'ajouter aux analyses sportives existantes.

L'ajout d'une mesure de poids ne doit pas supprimer une analyse de progression sportive, de régularité ou de programme. Une même saisie peut enrichir plusieurs analyses, à condition que celles-ci restent distinctes et pertinentes.

Si les structures de stockage ou les interfaces de saisie nécessitent une adaptation, fais-la de manière compatible avec les données existantes, sans migration destructive et sans introduire de dépendance externe inutile.

---

## 8. Généraliser les analyses à toutes les données pertinentes

Ne limite pas l'amélioration aux exemples ci-dessus.

Inventorie les données effectivement disponibles dans Momentum Sport et construis une matrice reliant :

- Les sources de données.
- Les métriques calculables.
- Les relations pertinentes entre métriques.
- Les constats possibles.
- Les familles d'analyses concernées.
- Les conditions minimales de validité.
- Les cas où l'analyse ne doit pas être générée.

Examine en particulier les possibilités offertes par :
- Le journal d'entraînement.
- Le programme et son historique.
- L'assiduité.
- Le volume et les performances.
- Les exercices et leurs variantes.
- Les données de récupération et de sommeil.
- Les mesures corporelles.
- Les objectifs déclarés.
- Les historiques et les comparaisons temporelles.

Pour chaque relation candidate, détermine si elle peut être calculée avec les données réellement disponibles. Implémente celles qui ont une valeur analytique démontrable et qui peuvent être validées.

Ne crée pas des corrélations artificielles uniquement parce que deux données sont disponibles. Ne confonds pas corrélation temporelle et causalité.

Ne laisse pas non plus des données utiles inexploitées simplement parce qu'aucun générateur existant ne sait encore les utiliser.

---

## 9. Mettre en place un système d'analyses complémentaires, jamais un remplacement aveugle

C'est une contrainte centrale du projet.

L'objectif est d'augmenter la richesse et la diversité des analyses pertinentes, pas de remplacer les anciennes par les nouvelles.

### A. Distinguer les analyses par leur sens

Chaque analyse candidate doit pouvoir être identifiée selon sa famille, son sujet, sa période, les faits qui la justifient et la conclusion qu'elle apporte.

Une analyse de progression, une analyse d'assiduité et une analyse de poids peuvent toutes être conservées si elles apportent des informations distinctes.

### B. Déduplication sémantique

Évite les doublons qui disent la même chose avec des formulations différentes.

Mais ne supprime pas deux analyses uniquement parce qu'elles utilisent la même donnée ou concernent le même exercice.

La déduplication doit examiner la conclusion et l'information apportée, pas seulement le titre, l'identifiant ou les mots employés.

### C. Sélection équilibrée

Examine si le système de sélection actuel favorise excessivement certaines catégories ou élimine des analyses utiles avant qu'elles puissent apparaître.

Préserve les analyses existantes qui restent pertinentes. Intègre les nouvelles familles sans leur donner automatiquement la priorité sur les autres.

Si une limite de nombre de cartes existe, améliore la sélection de manière à représenter plusieurs dimensions utiles de l'historique. Une catégorie ne doit pas monopoliser l'ensemble des résultats simplement parce qu'elle génère beaucoup de candidats.

### D. Traçabilité

Lorsqu'une analyse est écartée, conserve suffisamment d'informations dans les outils de diagnostic pour comprendre si elle a été jugée redondante, trop peu fiable, peu pertinente ou simplement moins prioritaire.

Ne supprime pas définitivement un constat sous prétexte qu'il ne mérite pas une carte à un instant donné.

### E. Historique et stabilité

Vérifie si les analyses sont recalculées, persistées ou mises en cache. Assure-toi que les modifications n'introduisent pas de résultats incohérents selon l'ordre d'exécution ou la fenêtre affichée.

Une analyse nouvelle doit pouvoir apparaître sans effacer inutilement les autres analyses toujours valides.

---

## 10. Temporalité, fenêtres et comparaisons

La période d'affichage ne doit pas être confondue avec la date réelle d'un événement.

Pour chaque analyse, distingue autant que possible :
- La période sélectionnée.
- La date de l'événement.
- La date de début de la tendance.
- Sa durée.
- Sa récence.
- La période de référence utilisée pour la comparaison.
- Les éventuelles données postérieures qui permettent de confirmer une évolution.

Examine le fonctionnement des fenêtres Aujourd'hui, 7 jours, 30 jours, 3 mois, 6 mois, 1 an, 2 ans et Toujours.

Vérifie les bornes de période, les fuseaux horaires, les dates manquantes et les différences entre dates prévues et dates réelles.

Une tendance apparue il y a trois semaines n'est pas nécessairement une tendance qui vient de commencer simplement parce qu'elle apparaît dans la fenêtre de 30 jours.

Les formulations doivent refléter l'ancienneté réelle des faits. Ne bannis pas les expressions temporelles, mais fonde leur usage sur les dates calculées.

Lorsqu'une comparaison est nécessaire, utilise une référence pertinente : même exercice, même variante, séances comparables, période précédente de durée équivalente ou autre référence justifiée.

Ne compare pas des périodes différentes sans le signaler. N'interprète pas une absence d'enregistrement comme une absence certaine d'activité.

---

## 11. Repenser le pipeline de rédaction

La qualité rédactionnelle doit être améliorée à partir des conclusions calculées.

### A. Produire d'abord une analyse structurée

Avant de rédiger, chaque candidat devrait disposer, selon le besoin, des éléments suivants :

- Constat principal.
- Données et dates qui le justifient.
- Comparaison pertinente.
- Relations découvertes.
- Interprétation.
- Conséquence concrète.
- Niveau de certitude.
- Limites réelles.
- Sujet et famille de l'analyse.

Ne force pas chaque analyse à remplir tous ces champs si certains sont inutiles. En revanche, aucune analyse ne doit être publiée sans contenu informatif suffisant.

### B. Écrire une conclusion, pas une liste de chiffres

Le texte final doit relier les données à leur signification.

Une bonne analyse explique ce qui évolue, pourquoi les observations sont pertinentes et ce qu'elles impliquent pour l'utilisateur.

Évite :
- La répétition de chiffres sans interprétation.
- Les paraphrases de graphiques.
- Les phrases qui annoncent des calculs à effectuer.
- Les recommandations génériques.
- Les conclusions qui n'ajoutent rien au paragraphe précédent.
- Les précautions abstraites répétées.
- Les conclusions trop prudentes alors que les faits sont établis.
- Les affirmations catégoriques qui dépassent les données.

### C. Des conclusions adaptées au degré de certitude

Si une tendance est solidement établie, exprime-la clairement.

Si un fait est certain mais que son explication reste incertaine, distingue les deux.

Si les données ne permettent pas de conclure, raccourcis l'analyse ou choisis un angle qui reste utile.

Ne termine pas systématiquement les analyses par une prédiction, une question ou une phrase sur ce qu'il faudrait surveiller.

### D. Une rédaction naturelle et variée

Évite les formulations mécaniques répétées d'une carte à l'autre. Ne force pas une structure uniforme si elle rend les analyses artificielles.

Les titres doivent annoncer une conclusion ou un constat pertinent, pas simplement une catégorie statistique.

Les analyses peuvent être longues lorsqu'elles présentent plusieurs relations utiles, mais elles ne doivent jamais être longues uniquement pour paraître approfondies.

### E. Un contrôle qualité explicite

Ajoute un contrôle de qualité avant publication, adapté au système actuel.

Il doit notamment détecter :
- Les formulations qui décrivent une tâche du moteur au lieu de présenter son résultat.
- Les conclusions qui n'apportent rien au constat.
- Les répétitions inutiles.
- Les affirmations non étayées.
- Les contradictions entre les chiffres et le texte.
- Les références temporelles incorrectes.
- Les analyses qui pourraient être enrichies par une relation disponible mais non calculée.

Privilégie des règles déterministes et des tests. N'ajoute pas de modèle d'IA externe, de service payant ou de dépendance réseau sans nécessité démontrée.

---

## 12. Construire une base de référence et tester la profondeur des analyses

Ne te contente pas de vérifier que le code compile.

Avant les modifications, constitue une base reproductible à partir des 14 analyses déjà examinées et d'autres scénarios représentatifs.

Inclue notamment :
- Des historiques courts et longs.
- Des séances régulières et irrégulières.
- Des reprises et des interruptions.
- Des performances en hausse, en baisse ou stables.
- Des exercices pratiqués sous plusieurs variantes.
- Des séances prévues, réalisées et partiellement exécutées.
- Des changements de programme.
- Des données corporelles avec une ou plusieurs mesures.
- Des données incomplètes.
- Des cas où plusieurs analyses distinctes sont justifiées par une même saisie.
- Des cas où plusieurs candidats sont redondants.
- Des cas où les données ne permettent pas une conclusion supplémentaire.

Pour chaque scénario, conserve les résultats avant/après, les données de justification et les décisions de sélection.

### Évalue spécifiquement la qualité du raisonnement

Pour chaque analyse, vérifie :

1. Le constat est-il correct ?
2. Les données pertinentes ont-elles été rapprochées ?
3. Une comparaison utile a-t-elle été effectuée ?
4. La conclusion va-t-elle au-delà de la simple reformulation des chiffres ?
5. La conséquence annoncée est-elle justifiée ?
6. Les limites sont-elles réelles et correctement exprimées ?
7. Le texte apporte-t-il une information distincte des autres analyses ?
8. Les données disponibles permettent-elles d'aller encore plus loin ?

Ce dernier point est essentiel : si une relation pertinente peut être calculée mais ne l'est pas, identifie le manque et améliore le moteur.

Les tests automatisés peuvent vérifier les calculs, les dates, la déduplication et la stabilité. Pour les conclusions rédactionnelles, utilise aussi des cas de référence explicites et une comparaison avant/après documentée.

N'affirme pas qu'une amélioration est validée si tu n'as vérifié que le build ou les tests techniques.

---

## 13. Méthode d'implémentation : autonomie maximale

Travaille par étapes cohérentes, mais ne m'impose pas une validation manuelle après chacune d'elles.

### Phase 1 — Audit et diagnostic

- Inspecte l'ensemble du pipeline.
- Identifie les données disponibles et les relations déjà calculées.
- Constitue les scénarios de référence.
- Détermine les défauts structurels, analytiques et rédactionnels.
- Identifie les modifications les plus utiles.

### Phase 2 — Fondation analytique

- Améliore le partage des données entre modules.
- Évite les calculs dupliqués.
- Implémente les constats et relations transversales nécessaires.
- Assure la traçabilité des résultats.
- Préserve les règles et données existantes.

### Phase 3 — Nouvelles capacités d'analyse

- Corrélations sportives et progression.
- Assiduité et exécution réelle du programme.
- Relations entre séances, exercices et groupes musculaires.
- Analyses corporelles fondées sur les mesures disponibles.
- Exploitation des autres données utiles détectées pendant l'audit.

### Phase 4 — Sélection et rédaction

- Préserve les analyses existantes pertinentes.
- Réduit les doublons sémantiques.
- Améliore la diversité des analyses affichées.
- Renforce les conclusions.
- Corrige les formulations temporelles et les textes qui se dérobent.
- Ajoute des contrôles qualité appropriés.

### Phase 5 — Validation et corrections

- Rejoue la base de référence.
- Compare les résultats avant/après.
- Vérifie les analyses supprimées, ajoutées ou modifiées.
- Corrige les régressions.
- Exécute les tests, vérifications de types, lint et build disponibles.
- Vérifie les effets sur les données existantes et les autres modules.

Ne t'arrête pas après avoir produit un plan. Ne t'arrête pas non plus après les premières corrections si des défauts importants et démontrables restent à traiter.

Poursuis tant que tu peux implémenter et valider raisonnablement des améliorations pertinentes. Si une partie est bloquée par une limitation réelle des données ou de l'environnement, documente-la et continue sur les autres parties.

---

## 14. Contraintes de sécurité et de compatibilité

- Ne supprime ni ne réinitialise de données utilisateur.
- Ne modifie pas les données sources pour faciliter les tests.
- Ne fais pas de migration destructive.
- Ne réécris pas les calculs fondamentaux sans défaut identifié.
- Ne modifie pas les fonctionnalités sans rapport avec le moteur.
- Ne fais pas de refonte esthétique de l'interface.
- Ne remplace pas arbitrairement les générateurs existants.
- Ne supprime pas une famille d'analyses simplement parce qu'une nouvelle famille est plus riche.
- N'introduis pas de service payant ou de dépendance externe sans nécessité démontrée.
- Ne crée pas de scores complexes sans preuve de leur utilité.
- Ne modifie pas les changements préexistants de l'utilisateur et ne les écrase pas.
- Ne fais pas de commit, de push ou de déploiement sans demande explicite.

Utilise les conventions et les outils du projet. Favorise les changements ciblés, lisibles et réversibles.

Si une décision est techniquement incertaine, choisis la solution la plus prudente et documente-la. Ne me sollicite que si une préférence métier indispensable ne peut pas être déduite ou si continuer risque de provoquer une perte de données ou un changement difficilement réversible.

---

## 15. Critères de réussite

Le travail sera considéré comme réussi lorsque les résultats démontreront que :

- Les analyses exploitent réellement les relations entre les données.
- Le moteur ne se contente plus de décrire les calculs qu'il devrait effectuer.
- Les conclusions expliquent la signification des observations pour la progression.
- Les analyses de séances distinguent correctement la programmation de l'exécution réelle.
- Les données corporelles génèrent des analyses pertinentes lorsqu'elles sont disponibles.
- Les analyses supplémentaires enrichissent l'ensemble sans supprimer arbitrairement les autres.
- Les doublons sont réduits sans effacer des informations distinctes.
- Les références temporelles sont exactes.
- Les textes sont plus précis, plus naturels et plus affirmatifs lorsque les faits le permettent.
- Les conclusions restent proportionnées aux preuves.
- Les tests démontrent les améliorations et ne vérifient pas uniquement l'absence d'erreurs techniques.
- Les changements restent compatibles avec les données existantes et maintenables.

## 16. Compte rendu final obligatoire

À la fin du travail, présente :

1. Les défauts structurels et analytiques découverts.
2. Les sources de données et les relations effectivement exploitées.
3. Les nouveaux types d'analyses implémentés.
4. Les améliorations du raisonnement et de la rédaction.
5. Les changements de sélection et de déduplication.
6. Plusieurs exemples réels issus des tests, avec les résultats avant/après.
7. Les tests réellement exécutés et leurs résultats.
8. Les régressions éventuelles et les problèmes non résolus.
9. Les limites dues aux données ou à l'environnement.
10. Les améliorations restantes les plus importantes, si elles existent.

Distingue clairement ce qui est implémenté, ce qui est testé et ce qui reste une proposition.

**Consigne finale : prends en charge cette évolution de bout en bout. Je veux un moteur d'analyse nettement plus intelligent, qui relie les données, découvre des constats pertinents, en tire des conclusions concrètes et les communique avec précision. Je ne veux ni une simple refonte rédactionnelle, ni une architecture théorique, ni une accumulation de statistiques. Je veux que le raisonnement réel de Momentum Sport progresse et que cela se voie dans les analyses produites.**