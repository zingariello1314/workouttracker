📝 BRIEF DÉTAILLÉ POUR IA - PROJET MOMENTUM + GARMIN FORERUNNER 55
🎯 OBJECTIF DU PROJET
Je souhaite intégrer un nouvel onglet "Garmin" dans mon application web Momentum  pour synchroniser et afficher toutes les données disponibles depuis ma montre Garmin Forerunner 55 connectée à l'application Garmin Connect sur mon téléphone.

📊 DONNÉES À RÉCUPÉRER (SPÉCIFICATIONS DÉTAILLÉES)

Catégorie 1 : Activités Sportives
Je veux récupérer toutes mes séances d'entraînement enregistrées par ma montre :

**1. NATATION (Métriques Complètes)**

Métriques de nage :
- Nombre de mouvements (stroke count)
- Fréquence de mouvement moyenne (strokes per minute)
- Nombre moyen de mouvements par longueur
- Allure moyenne (temps par 100m)
- Allure moyenne de déplacement
- Meilleure allure (best pace)
- Vitesse moyenne
- Vitesse moyenne de déplacement
- Vitesse maximale
- SWOLF moyen (score efficacité natation)

Métriques temporelles :
- Temps total de la séance
- Temps de déplacement actif
- Temps écoulé (total time)

Métriques physiologiques :
- Fréquence cardiaque moyenne
- Fréquence cardiaque maximale
- Calories au repos (durant l'exercice)
- Calories actives (durant l'exercice)
- Calories dépensées au total

Intensité :
- Minutes intensives modérées
- Minutes intensives soutenues
- Total minutes intensives

Métriques de base :
- Distance parcourue (en mètres/km)
- Nombre de longueurs
- Type de nage (si disponible)

**2. CORDE À SAUTER (JumpJump Pro / Connect IQ)**

Métriques de base :
- Temps total
- Durée (format mm:ss)
- Nombre de sauts (jumps)
- Vitesse (sauts par minute)

Métriques physiologiques :
- Fréquence cardiaque moyenne (pendant l'exercice)
- Fréquence cardiaque maximale
- Calories au repos (durant l'exercice)
- Calories actives (durant l'exercice)
- Calories dépensées au total
- Estimation de la transpiration (ml)

Métriques de performance :
- Interruptions (nombre)
- Max de sauts en continu (max continuous count)

**3. CARDIO / AUTRES ACTIVITÉS**

Pour chaque activité cardio/jour :
- Nombre d'activités par jour
- Durée de chaque activité

Métriques par activité :
- Temps total
- Fréquence cardiaque moyenne
- Fréquence cardiaque maximale
- Calories au repos (durant l'exercice)
- Calories actives (durant l'exercice)
- Total des calories brûlées
- Estimation de la transpiration (ml)

Intensité :
- Minutes intensives modérées
- Minutes intensives soutenues (x2 multiplier)
- Total minutes intensives

Métriques générales :
- Distance (si applicable)
- Type d'activité

Catégorie 2 : Métriques de Santé Quotidiennes

**1. FRÉQUENCE CARDIAQUE**

- Données toute la journée (seconde par seconde si possible)
- Fréquence cardiaque au repos
- Fréquence cardiaque maximale (quotidienne)
- Fréquence cardiaque moyenne (quotidienne)
- Zones cardiaques
- Historique horaire (time series)

**2. ACTIVITÉ QUOTIDIENNE**

- Nombre de pas quotidiens
- **Distance parcourue (en km) - OBLIGATOIRE pour chaque jour**
- Étages montés
- Minutes d'intensité modérée
- Minutes d'intensité soutenue
- Total minutes intensives

**3. CALORIES QUOTIDIENNES**

- **Calories actives (liées à l'exercice) - OBLIGATOIRE pour chaque jour**
- **Calories au repos (métabolisme de base) - OBLIGATOIRE pour chaque jour**
- Calories totales brûlées dans la journée

**4. SOMMEIL (OBLIGATOIRE pour chaque jour)**

- Durée totale du sommeil
- Qualité du sommeil (score)
- Phases de sommeil (léger, profond, REM si disponible)
- Heure de coucher
- Heure de lever

**5. RESPIRATION (OBLIGATOIRE)**

Respirations par minute :
- **Le plus bas (minimum) - Éveillé**
- **Le plus haut (maximum) - Éveillé**
- **Moyenne - Éveillé**
- **Le plus bas (minimum) - Pendant le sommeil**
- **Le plus haut (maximum) - Pendant le sommeil**
- **Moyenne - Pendant le sommeil**

**6. AUTRES MÉTRIQUES**

- Body Battery (niveau d'énergie)
- Stress (niveau de stress quotidien)
- SpO2 (saturation en oxygène)
- Hydratation (si suivie)
- Estimation de la transpiration (quotidienne si disponible)

Catégorie 3 : Composition Corporelle (si balance connectée)

Poids
Pourcentage de masse grasse
Masse musculaire
Eau corporelle
Densité osseuse


⏱️ EXIGENCE TEMPORELLE
JE VEUX CES DONNÉES EN TEMPS RÉEL ou quasi temps-réel :

• Synchronisation automatique: toutes les 1 heure (par défaut). C’est suffisant et robuste.
• Synchronisation manuelle: bouton « Synchroniser » dans l’onglet Garmin pour forcer un import immédiat.
• Objectif utilisateur: quand la montre se synchronise avec Garmin Connect, les données doivent apparaître dans Momentum dans l’heure (ou tout de suite via la sync manuelle).


🚫 CONTRAINTES IDENTIFIÉES
Problème avec l'API Garmin Officielle

API Garmin Connect payante : 5 000$ de frais d'accès
Réservée aux entreprises : Refus systématique des projets personnels
Non accessible gratuitement pour un développeur indépendant
❌ Cette solution est exclue pour mon projet

Alternative Strava Inadaptée

Strava ne synchronise que les activités d'entraînement (course, vélo)
NE synchronise PAS :

Les métriques de santé (FC 24/7, sommeil, stress, Body Battery)
Les pas quotidiens
Les calories passives
La natation en piscine (dans mon cas)
La corde à sauter


❌ Strava est donc inadapté à mes besoins


✅ SOLUTION RETENUE : python-garminconnect
Description de la Solution
Nous avons identifié une bibliothèque Python non-officielle appelée python-garminconnect qui permet de se connecter à Garmin Connect en simulant une connexion utilisateur normale et de récupérer TOUTES les données disponibles.
Caractéristiques :

✅ 100% gratuite
✅ Accès à plus de 100 méthodes API couvrant toutes les catégories de données Garmin
✅ Compatible avec tous les comptes Garmin Connect
✅ Pas besoin d'approbation de Garmin
✅ Fonctionne avec tous les appareils Garmin (dont ma Forerunner 55)
✅ Accès aux données historiques et actuelles

Données Accessibles via python-garminconnect
Catégories disponibles (11 catégories, 100+ méthodes) :

Santé quotidienne et activité : pas, calories, distance, étages, FC, respiration
Métriques de santé avancées : sommeil, stress, Body Battery, SpO2, HRV
Données historiques : tendances sur plusieurs jours/semaines/mois
Activités et entraînements : natation, course, vélo, corde à sauter, toutes activités
Composition corporelle : poids, masse grasse, masse musculaire, IMC
Objectifs et accomplissements : badges, records, défis
Dispositif et technique : infos sur la montre, paramètres
Équipement : vélo, chaussures connectées
Hydratation : consommation d'eau
Bien-être : humeur, énergie
Performances : VO2 max, seuils, temps de récupération


🏗️ ARCHITECTURE DE LA SOLUTION
Vue d'ensemble du système
[Garmin Forerunner 55] 
         ↓ (Bluetooth)
[Garmin Connect Mobile App] 
         ↓ (Internet)
[Serveurs Garmin Connect] 
         ↓ (Script Python + python-garminconnect)
[Serveur Node.js Local] 
         ↓ (API REST)
[Application React Momentum] 
         ↓ (IndexedDB)
[Stockage Local Navigateur]

Notes d’architecture essentielles
• Séparer strictement les données Garmin des données Momentum « manuelles »: nouvelle base IndexedDB dédiée (GarminDataDB).
• Le serveur Node fait la normalisation (unités/formatage) AVANT d’envoyer au front. Le front affiche et persiste sans retraiter.
• Gestion de volume: time-series (FC, respiration) conservées 90 jours max + downsampling 5 min (si la granularité entrante <5min).
Composants Techniques
1. Script Python (fetch_garmin_data.py)

Rôle : Se connecter à Garmin Connect et récupérer les données
Technologie : Python 3 + bibliothèque garminconnect
Fonctionnement :

• Authentification via identifiants Garmin Connect.
• Persistance des cookies/session dans un fichier (ex: session.json) pour éviter le relogin systématique.
• Détection 401/403: purge session + relogin propre.
• Appels API pour récupérer LES DONNÉES DU JOUR (paramétrable) et/ou backfill sur plage.
• Export JSON structuré et stable (schéma contractuel pour Node).
• Gestion des erreurs et retry exponentiel (ex: 3 tentatives, backoff 5/15/30s).



2. Serveur Node.js (garmin-server.js)

Rôle : Faire le pont entre le script Python et mon application React
Technologie : Node.js + Express + CORS
Fonctionnement :

• API REST locale (http://localhost:3001)
  - POST /api/garmin/sync: déclenche la collecte Python (jour en cours ou plage) et retourne les données normalisées.
  - GET  /api/garmin/status: dernière synchronisation, dernière erreur, volumes.
• Normalisation côté Node (obligatoire):
  - Unités: distance en km (float), natation en mètres + allure 100m en secondes, calories en kcal, FC int.
  - Timezones: timestamps côté serveur en ISO UTC (toISOString). Côté front: conversion locale pour affichage.
  - Déduplication: éliminer doublons via clé unique (activityId Garmin si dispo; sinon hash(date,type,duration,distance)).
• Downsampling time-series (si trop denses): agrégation à 5 min pour FC/respiration.



3. Composant React GarminTab.jsx

Rôle : Interface utilisateur dans Momentum pour afficher et gérer les données Garmin
Fonctionnement :

• UI: Bouton « Synchroniser », indicateur « Dernière synchronisation », cartes Daily, activités du jour, graphiques.
• Auto-sync: timer côté front désactivable; par défaut 1h (configurable). La sync manuelle reste prioritaire.
• Import automatique: mapping direct vers enduranceData.sessions.swimming/jumprope/cardio, marqué source: "garmin".
• Persistance: GarminDataDB dédiée; MomentumData (manuel) inchangée.
• Affichage resilient: si Node/Python down, l’UI montre la dernière sync + message erreur explicite.



4. Système d'automatisation

Rôle : Synchroniser les données régulièrement sans intervention
Options :

Cron Job (Mac/Linux) : Tâche planifiée toutes les heures
Task Scheduler (Windows) : Planificateur de tâches Windows
setInterval JavaScript : Timer dans l'application React


Fonctionnement : Appel automatique de l'endpoint /api/garmin/sync toutes les 1h (par défaut). C’est suffisant.
• Windows: Planificateur des tâches.
• macOS/Linux: cron.
• Option alternative: setInterval dans Node plutôt que dans le front pour éviter dépendance à l’onglet ouvert.


🔄 WORKFLOW COMPLET
Scénario d'utilisation type
Étape 1 : Enregistrement de l'activité

Je fais ma séance de natation avec ma Forerunner 55
La montre enregistre : distance, durée, FC, calories
Je termine ma séance

Étape 2 : Synchronisation Garmin

Ma montre se synchronise avec Garmin Connect Mobile (Bluetooth, automatique)
Les données sont uploadées sur les serveurs Garmin (quelques minutes)

Étape 3 : Récupération par le script Python

Automatique : le cron (ou timer Node) déclenche la collecte Python (toutes les 1h)
Manuel : Je clique sur « Synchroniser » dans l’onglet Garmin de Momentum
Le script Python :

Se connecte à Garmin Connect avec mes identifiants
Appelle client.get_activities_by_date(today, today) pour récupérer les activités
Appelle client.get_heart_rates(today) pour la FC
Appelle client.get_steps_data(today) pour les pas
Appelle client.get_stats(today) pour les calories
Appelle client.get_body_battery(today) pour la Body Battery
Appelle client.get_sleep_data(today) pour le sommeil
... et toutes les autres métriques
Génère garmin_data_today.json avec toutes les données



Étape 4 : Traitement par le serveur Node.js

Le serveur lit le JSON généré
Formate les données pour Momentum (normalisation unités, UTC, clés uniques, downsampling time-series):

javascript  {
    swimming: [{
      date: "2025-10-30T14:30:00",
      distance: 1.5, // km
      duration: 3600, // secondes
      avgHR: 145,
      maxHR: 172,
      calories: 450
    }],
    jumpRope: [...],
    dailyStats: {
      steps: 8543,
      calories: 2340,
      activeCalories: 540,
      restingHR: 58,
      bodyBattery: 67,
      sleep: {
        duration: 7.5,
        quality: 82
      },
      stress: 32
    },
    heartRateTimeSeries: [
      { time: "00:00", bpm: 55 },
      { time: "01:00", bpm: 52 },
      // ... toutes les heures
    ]
  }
Étape 5 : Affichage dans Momentum

Mon application React reçoit les données
Affiche les statistiques dans l'onglet Garmin :

Cartes statistiques : Pas, Calories, FC repos, Sommeil
Section Activités : Liste des activités du jour (natation, corde à sauter)
Graphiques : Évolution de la FC sur 24h, Body Battery, etc.


Import automatique dans mon système Endurance existant :

Les séances de natation vont dans enduranceData.sessions.swimming
Les séances de corde à sauter vont dans enduranceData.sessions.jumprope


Sauvegarde dans IndexedDB pour persistance

Étape 6 : Intégration avec les autres onglets

Les activités importées sont automatiquement disponibles dans :

Onglet Endurance : Historique et statistiques
Onglet Charts : Graphiques de performance
Onglet Calendar : Marqueurs visuels sur le calendrier
Onglet Stats : Calculs de streaks et records




📦 STRUCTURE DES DONNÉES
Format de stockage dans IndexedDB (GarminDataDB dédiée)
javascript// Nouvelle database : GarminDataDB
{
  // Activités par type
  activities: {
    swimming: [
      {
        id: timestamp,
        date: "2025-10-30",
        time: "14:30",
        distance: 1.5,
        duration: 3600,
        laps: 60,
        avgHR: 145,
        maxHR: 172,
        calories: 450,
        avgPace: 140, // secondes par 100m
        source: "garmin"
      }
    ],
    jumpRope: [...],
    cardio: [...]
  },
  
  // Métriques quotidiennes (par date)
  dailyMetrics: {
    "2025-10-30": {
      steps: 8543,
      distance: 6.2, // km
      floors: 12,
      calories: {
        total: 2340,
        active: 540,
        resting: 1800
      },
      intensityMinutes: {
        moderate: 45,
        vigorous: 20
      },
      heartRate: {
        resting: 58,
        max: 172,
        avg: 78,
        timeSeries: [
          { timestamp: "2025-10-30T00:00:00", bpm: 55 },
          { timestamp: "2025-10-30T00:05:00", bpm: 54 },
          // ... toutes les 5 minutes (downsampling appliqué si source plus dense)
        ]
      },
      sleep: {
        duration: 7.5, // heures
        quality: 82, // score
        deepSleep: 1.2,
        lightSleep: 5.0,
        remSleep: 1.3,
        bedTime: "23:15",
        wakeTime: "06:45"
      },
      stress: {
        average: 32,
        max: 65,
        restTime: 120 // minutes
      },
      bodyBattery: {
        current: 67,
        max: 95,
        min: 12
      },
      respiration: {
        average: 14, // respirations par minute
        max: 22,
        min: 11
      },
      spo2: {
        average: 97,
        min: 94
      }
    }
  },
  
  // Composition corporelle (si balance)
  bodyComposition: [
    {
      date: "2025-10-30",
      weight: 75.2,
      bodyFat: 15.3,
      muscleMass: 61.8,
      bodyWater: 58.2,
      boneMass: 3.1,
      bmi: 23.4
    }
  ]
}
```

---

## 🎨 INTERFACE UTILISATEUR (GarminTab)

### Layout de l'onglet

**Header :**
```
⌚ Garmin Forerunner 55                    [🔄 Synchroniser]
Dernière synchronisation : Il y a 23 minutes | Statut: OK/Erreur (message)
```

**Section 1 : Dashboard Quotidien (Grille de cartes)**
```
┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐
│ 👟 PAS     │ │ 🔥 CALORIES│ │ ❤️ FC REPOS│ │ 🌙 SOMMEIL │
│            │ │            │ │            │ │            │
│   8,543    │ │  2,340 kcal│ │   58 bpm   │ │   7.5h    │
│            │ │            │ │            │ │            │
│  +12% ↗️   │ │  +5% ↗️    │ │  Normal ✓  │ │  82/100   │
└────────────┘ └────────────┘ └────────────┘ └────────────┘

┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐
│ ⚡ BODY    │ │ 😌 STRESS  │ │ 🫁 SPO2    │ │ 📊 INTENSITÉ│
│   BATTERY  │ │            │ │            │ │            │
│   67/100   │ │   32/100   │ │    97%     │ │   65 min   │
│            │ │            │ │            │ │            │
│  Moyen ⚠️  │ │  Faible ✓  │ │  Bon ✓     │ │  Objectif  │
└────────────┘ └────────────┘ └────────────┘ └────────────┘
```

**Section 2 : Activités du Jour**
```
🏊 NATATION - Aujourd'hui 14:30
┌─────────────────────────────────────────────┐
│ Distance      1.5 km    │  Durée    60 min  │
│ FC moyenne    145 bpm   │  FC max   172 bpm │
│ Calories      450 kcal  │  Allure   1:40/100m│
│ Longueurs     60        │  SWOLF    35      │
└─────────────────────────────────────────────┘
[Détails] [Ajouter aux défis] [Supprimer]

🪢 CORDE À SAUTER - Aujourd'hui 09:00
┌─────────────────────────────────────────────┐
│ Durée         20 min    │  Sauts    2,400   │
│ FC moyenne    132 bpm   │  FC max   158 bpm │
│ Calories      180 kcal  │           │
└─────────────────────────────────────────────┘
[Détails] [Ajouter aux défis] [Supprimer]
```

**Section 3 : Graphiques**
```
Onglets : [FC 24h] [Body Battery] [Stress] [Activité]

Graphique FC 24h :
  (LineChart avec FC en temps réel, zones colorées)
  
Graphique Body Battery :
  (AreaChart montrant charge/décharge sur la journée)
```

**Section 4 : Historique (Timeline)**
```
📅 CETTE SEMAINE
  Lun 28 Oct : 🏊 1.2km | 👟 7,234 pas
  Mar 29 Oct : 🪢 15min | 👟 9,876 pas
  Mer 30 Oct : 🏊 1.5km | 🪢 20min | 👟 8,543 pas

⚙️ CONFIGURATION TECHNIQUE
Prérequis
Logiciels nécessaires :

Python 3.8+ : Pour exécuter le script de récupération
Node.js 16+ : Pour le serveur API local
npm/yarn : Gestionnaire de paquets
Navigateur moderne : Chrome, Firefox, Edge (pour React)

Dépendances Python :
```bash
pip3 install garminconnect
```
Dépendances Node.js :
```bash
npm install express cors
```
Dépendances React (déjà dans Momentum) :

recharts : Pour les graphiques
lucide-react : Pour les icônes

Configuration Initiale
1. Identifiants Garmin :

Email Garmin Connect
Mot de passe Garmin Connect
⚠️ Stockés de manière sécurisée (variables d'environnement). Le script Python charge depuis .env et persiste la session (session.json).

2. Ports :

Serveur Node.js : http://localhost:3001
Application React : http://localhost:5173 (Vite par défaut)

3. Fréquence de synchronisation :

• Par défaut: 1h.
• Configurable: 1h / 2h / Manuel (éviter 15/30min inutiles et plus risqués).
• Toujours possible de déclencher une sync manuelle pour test ou urgence.


🔐 SÉCURITÉ ET CONFIDENTIALITÉ
Mesures de Sécurité
Stockage des identifiants :

✅ Variables d'environnement (.env file)
✅ Jamais dans le code source
✅ .gitignore configuré pour exclure .env

Transmission des données :

✅ Localhost uniquement (pas d'exposition externe)
✅ Pas de serveur distant (tout en local)
✅ Données stockées dans IndexedDB (navigateur local)
✅ Cookies/session Garmin chiffrés au repos si possible (fichier session chiffré ou dossier protégé)

Respect de la vie privée :

✅ Aucune donnée envoyée à des tiers
✅ Pas de tracking externe
✅ Données santé restent privées


🚀 ÉTAPES DE DÉPLOIEMENT
Phase 1 : Installation et Configuration (1-2h)

Installer Python et garminconnect

bash   pip3 install garminconnect

Créer le script Python (fetch_garmin_data.py)

Copier le code fourni
Configurer les identifiants


Tester le script Python

bash   python3 fetch_garmin_data.py
   # Vérifier que garmin_data_today.json est généré

Créer le serveur Node.js (garmin-server.js)

bash   mkdir garmin-server
   cd garmin-server
   npm init -y
   npm install express cors
   # Copier le code du serveur

Tester le serveur

bash   node garmin-server.js
   # Vérifier : http://localhost:3001/api/garmin/sync
Phase 2 : Intégration dans Momentum (2-3h)

Créer le composant GarminTab.jsx

Dans src/components/tabs/
Copier le code fourni


Ajouter l'onglet dans App.jsx

javascript   import GarminTab from './components/tabs/GarminTab';
   
   const tabs = [
     // ... tabs existants
     { 
       id: 'garmin', 
       label: '⌚ Garmin', 
       component: GarminTab 
     }
   ];

Créer la database IndexedDB

• Ajouter GarminDataDB (stores: activities, dailyMetrics, deviceMeta) dans useWorkoutData.js ou un hook dédié (useGarminData.js).
• Mettre en place une politique de rétention (purge au-delà de 90 jours pour time-series).
• Garantir la déduplication au moment de l’insert (clé unique).


Tester l'intégration complète

Lancer le serveur Node.js
Lancer l'app React
Cliquer sur "Synchroniser" dans l'onglet Garmin
Vérifier l'affichage des données



Phase 3 : Automatisation (30min-1h)

Configurer le cron job (Mac/Linux)

bash    crontab -e
    # Ajouter :
    0 * * * * cd /chemin/vers/garmin-server && python3 fetch_garmin_data.py

OU Configurer Task Scheduler (Windows)

Planificateur de tâches
Nouvelle tâche : Toutes les heures
Action : python3 fetch_garmin_data.py


OU Auto-sync côté Node (recommandé)

```js
// Dans garmin-server.js
setInterval(() => {
  // déclencher la collecte Python + normalisation + cache statut
}, 60*60*1000);
```

Option front uniquement si besoin de simplicité (onglet ouvert).
Phase 4 : Tests et Optimisation (1-2h)

Tester tous les scénarios

Synchronisation manuelle
Synchronisation automatique
Import d'activités dans Endurance
Affichage des graphiques
Gestion d'erreurs


Optimiser les performances

Mise en cache des données
Lazy loading des graphiques
Pagination de l'historique


Documentation

Guide utilisateur
Troubleshooting




📈 FONCTIONNALITÉS FUTURES (Évolutions possibles)
Court Terme

✅ Notifications push quand nouvelle activité détectée
✅ Filtres avancés sur l'historique
✅ Export des données Garmin en CSV
✅ Comparaisons temporelles (semaine vs semaine)

Moyen Terme

✅ Dashboard personnalisable (widgets drag & drop)
✅ Objectifs personnalisés (ex: 10,000 pas/jour)
✅ Badges de progression
✅ Intégration avec les défis Endurance existants (ex: convertir activité Garmin en validation de défi selon la date du jour – ne pas marquer « fait » si la session est antérieure au jour courant)

Long Terme

✅ Analyse IA des tendances de santé
✅ Recommandations personnalisées
✅ Corrélations avancées (sommeil vs performance)
✅ Prédictions de récupération


❓ QUESTIONS FRÉQUENTES
Q : Est-ce que c'est vraiment gratuit ?
R : Oui, 100% gratuit. Aucun frais, pas d'abonnement.
Q : Est-ce que Garmin peut bloquer mon compte ?
R : Non, on utilise les mêmes mécanismes que l'app mobile. C'est comme si tu te connectais normalement.
Q : Quel est le délai de synchronisation ?
R : Avec un cron job toutes les heures, maximum 1h de délai. En manuel, instantané.
Q : Est-ce que ça fonctionne sur mobile ?
R : Le serveur Node.js doit tourner sur un ordinateur, mais l'interface React fonctionne sur mobile si tu accèdes en localhost.
Q : Et si je veux héberger ça sur un vrai serveur ?
R : Possible avec un petit VPS (5€/mois) ou un Raspberry Pi chez toi.
Q : Est-ce que je peux récupérer les données historiques ?
R : Oui, le script peut récupérer n'importe quelle période passée (90 derniers jours, 1 an, etc.).

🎯 RÉSUMÉ FINAL
Ce que cette solution m'apporte :
✅ Centralisation : Toutes mes données Garmin + mon entraînement Momentum dans une seule app
✅ Automatisation : Synchronisation automatique sans intervention
✅ Temps réel : Maximum 1h de délai (configurable à 15min si besoin)
✅ Complétude : TOUTES les métriques Garmin disponibles
✅ Intégration : Lien direct avec mes onglets Endurance, Charts, Stats existants
✅ Gratuit : 0€, pas de limitation
✅ Contrôle : Mes données restent chez moi (localhost)
✅ Évolutif : Facile d'ajouter de nouvelles fonctionnalités
Cette solution répond parfaitement à mon besoin : récupérer toutes les données de ma Garmin Forerunner 55 (activités, FC, calories, pas, sommeil, etc.) en temps réel dans mon application Momentum, sans frais, avec une synchronisation automatique et une intégration complète avec mon système existant.