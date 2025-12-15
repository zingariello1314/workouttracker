import React, { useState, useMemo } from 'react';
import {
  StackedAreaChart,
  CreativeBubbleChart,
  InteractiveTimeline,
  ThematicProgressBars
} from './index';

/**
 * CreativeChartsDemo - Démonstration des graphiques créatifs Phase 5
 * Montre les nouvelles capacités visuelles et interactives
 */
const CreativeChartsDemo = () => {
  const [selectedDemo, setSelectedDemo] = useState('stacked-area');

  // Données pour graphique en aires empilées
  const stackedAreaData = useMemo(() => [
    { date: '2024-01', Art: 120, Musique: 80, Écriture: 60, Design: 90 },
    { date: '2024-02', Art: 140, Musique: 95, Écriture: 75, Design: 110 },
    { date: '2024-03', Art: 160, Musique: 110, Écriture: 85, Design: 130 },
    { date: '2024-04', Art: 180, Musique: 125, Écriture: 100, Design: 145 },
    { date: '2024-05', Art: 200, Musique: 140, Écriture: 120, Design: 160 },
    { date: '2024-06', Art: 220, Musique: 155, Écriture: 135, Design: 175 }
  ], []);

  const stackedAreaSeries = [
    { key: 'Art', name: 'Projets Artistiques', color: '#FF6B9D' },
    { key: 'Musique', name: 'Compositions', color: '#4ECDC4' },
    { key: 'Écriture', name: 'Textes Créatifs', color: '#FFEAA7' },
    { key: 'Design', name: 'Créations Design', color: '#DDA0DD' }
  ];

  // Données pour graphique en bulles créatif
  const bubbleData = useMemo(() => [
    {
      id: 1,
      name: 'Album Photo Voyage',
      x: 7,
      y: 85,
      size: 45,
      category: 'Photo',
      icon: '📸',
      description: 'Collection de photos de voyage avec post-traitement artistique',
      tags: ['Voyage', 'Nature', 'Portrait'],
      nextSteps: ['Sélection finale', 'Impression', 'Exposition']
    },
    {
      id: 2,
      name: 'Composition Symphonique',
      x: 9,
      y: 60,
      size: 65,
      category: 'Musique',
      icon: '🎵',
      description: 'Œuvre orchestrale en 4 mouvements inspirée des saisons',
      tags: ['Classique', 'Orchestral', 'Nature'],
      nextSteps: ['Orchestration', 'Répétitions', 'Enregistrement']
    },
    {
      id: 3,
      name: 'Roman Fantastique',
      x: 6,
      y: 40,
      size: 80,
      category: 'Écriture',
      icon: '✍️',
      description: 'Trilogie fantasy avec système de magie original',
      tags: ['Fantasy', 'Aventure', 'Magie'],
      nextSteps: ['Révision tome 2', 'Recherche éditeur', 'Promotion']
    },
    {
      id: 4,
      name: 'App Mobile Design',
      x: 8,
      y: 90,
      size: 55,
      category: 'Design',
      icon: '📱',
      description: 'Interface utilisateur pour application de méditation',
      tags: ['UI/UX', 'Mobile', 'Bien-être'],
      nextSteps: ['Tests utilisateur', 'Itération', 'Développement']
    },
    {
      id: 5,
      name: 'Sculpture Moderne',
      x: 5,
      y: 25,
      size: 35,
      category: 'Art',
      icon: '🗿',
      description: 'Sculpture abstraite en métal recyclé',
      tags: ['Sculpture', 'Écologie', 'Abstrait'],
      nextSteps: ['Finitions', 'Vernissage', 'Galerie']
    }
  ], []);

  // Données pour timeline interactive
  const timelineData = useMemo(() => [
    {
      id: 1,
      title: 'Lancement Projet Photo',
      date: '2024-01-15',
      status: 'completed',
      type: 'milestone',
      importance: 'high',
      description: 'Début de la série photographique sur les paysages urbains',
      objectives: ['Définir le concept', 'Planifier les prises de vue', 'Acquérir le matériel'],
      deliverables: ['Moodboard', 'Planning de tournage', 'Liste matériel']
    },
    {
      id: 2,
      title: 'Première Composition',
      date: '2024-02-20',
      status: 'completed',
      type: 'achievement',
      importance: 'normal',
      description: 'Finalisation du premier mouvement de la symphonie',
      objectives: ['Composer le thème principal', 'Développer les variations', 'Orchestrer'],
      deliverables: ['Partition complète', 'Enregistrement démo', 'Notes de composition']
    },
    {
      id: 3,
      title: 'Révision Roman - Tome 1',
      date: '2024-03-10',
      status: 'in-progress',
      type: 'review',
      importance: 'high',
      description: 'Révision complète du premier tome avec éditeur',
      objectives: ['Corriger la structure', 'Améliorer les dialogues', 'Peaufiner le style'],
      deliverables: ['Manuscrit révisé', 'Notes éditoriales', 'Synopsis final']
    },
    {
      id: 4,
      title: 'Prototype App Mobile',
      date: '2024-04-05',
      status: 'in-progress',
      type: 'milestone',
      importance: 'normal',
      description: 'Développement du prototype interactif',
      objectives: ['Créer les wireframes', 'Designer les écrans', 'Prototyper les interactions'],
      deliverables: ['Prototype Figma', 'Guide de style', 'Spécifications techniques']
    },
    {
      id: 5,
      title: 'Exposition Sculpture',
      date: '2024-05-15',
      status: 'pending',
      type: 'deadline',
      importance: 'high',
      description: 'Première exposition personnelle en galerie',
      objectives: ['Finaliser les œuvres', 'Préparer le vernissage', 'Communication'],
      deliverables: ['Œuvres finalisées', 'Catalogue', 'Dossier de presse']
    }
  ], []);

  // Données pour barres de progression thématiques
  const progressData = useMemo(() => [
    {
      id: 1,
      name: 'Album Photo Voyage',
      value: 85,
      category: 'Photo',
      icon: '📸',
      description: 'Post-traitement et sélection des meilleures prises',
      deadline: '2024-07-15',
      priority: 'high',
      timeSpent: '45h',
      estimatedTime: '55h',
      milestones: [
        { name: 'Prise de vue', completed: true },
        { name: 'Tri et sélection', completed: true },
        { name: 'Post-traitement', completed: false },
        { name: 'Impression', completed: false }
      ]
    },
    {
      id: 2,
      name: 'Symphonie 4 Mouvements',
      value: 60,
      category: 'Musique',
      icon: '🎵',
      description: 'Composition orchestrale inspirée des saisons',
      deadline: '2024-09-20',
      priority: 'normal',
      timeSpent: '120h',
      estimatedTime: '200h',
      milestones: [
        { name: 'Thème principal', completed: true },
        { name: 'Premier mouvement', completed: true },
        { name: 'Deuxième mouvement', completed: false },
        { name: 'Orchestration complète', completed: false }
      ]
    },
    {
      id: 3,
      name: 'Roman Fantasy - Trilogie',
      value: 40,
      category: 'Écriture',
      icon: '✍️',
      description: 'Univers fantasy avec système de magie original',
      deadline: '2024-12-31',
      priority: 'high',
      timeSpent: '200h',
      estimatedTime: '500h',
      milestones: [
        { name: 'Tome 1 - Premier jet', completed: true },
        { name: 'Tome 1 - Révision', completed: false },
        { name: 'Tome 2 - Écriture', completed: false },
        { name: 'Recherche éditeur', completed: false }
      ]
    },
    {
      id: 4,
      name: 'App Méditation UI/UX',
      value: 90,
      category: 'Design',
      icon: '📱',
      description: 'Interface complète pour application mobile',
      deadline: '2024-06-30',
      priority: 'normal',
      timeSpent: '80h',
      estimatedTime: '90h',
      milestones: [
        { name: 'Recherche utilisateur', completed: true },
        { name: 'Wireframes', completed: true },
        { name: 'Design système', completed: true },
        { name: 'Prototype final', completed: false }
      ]
    }
  ], []);

  const demoOptions = [
    { id: 'stacked-area', name: 'Aires Empilées', icon: '📈' },
    { id: 'creative-bubbles', name: 'Bulles Créatives', icon: '🎨' },
    { id: 'interactive-timeline', name: 'Timeline Interactive', icon: '📅' },
    { id: 'thematic-progress', name: 'Barres Thématiques', icon: '📊' }
  ];

  return (
    <div className="creative-charts-demo">
      <div className="demo-header">
        <h2 className="demo-title">
          🎨 Graphiques Créatifs Phase 5
        </h2>
        <p className="demo-subtitle">
          Démonstration des nouveaux composants graphiques avec interactions ludiques
        </p>
      </div>

      <div className="demo-navigation">
        {demoOptions.map(option => (
          <button
            key={option.id}
            className={`demo-nav-button ${selectedDemo === option.id ? 'active' : ''}`}
            onClick={() => setSelectedDemo(option.id)}
          >
            <span className="nav-icon">{option.icon}</span>
            <span className="nav-text">{option.name}</span>
          </button>
        ))}
      </div>

      <div className="demo-content">
        {selectedDemo === 'stacked-area' && (
          <div className="demo-section">
            <h3>Graphique en Aires Empilées</h3>
            <p>Visualisation des tendances créatives avec légendes interactives et annotations.</p>
            <StackedAreaChart
              data={stackedAreaData}
              series={stackedAreaSeries}
              title="Évolution des Projets Créatifs"
              subtitle="Progression mensuelle par catégorie artistique"
              height={300}
              showLegend={true}
              allowToggleSeries={true}
              annotations={[
                {
                  date: '2024-03',
                  text: 'Exposition collective',
                  color: '#F59E0B'
                }
              ]}
            />
          </div>
        )}

        {selectedDemo === 'creative-bubbles' && (
          <div className="demo-section">
            <h3>Graphique en Bulles Créatif</h3>
            <p>Projets créatifs avec interactions ludiques et détails enrichis.</p>
            <CreativeBubbleChart
              data={bubbleData}
              title="Portfolio Créatif Interactif"
              subtitle="Complexité vs Progression - Taille = Impact"
              height={350}
              onBubbleClick={(data) => console.log('Projet sélectionné:', data)}
              onBubbleHover={(data) => console.log('Survol projet:', data)}
            />
          </div>
        )}

        {selectedDemo === 'interactive-timeline' && (
          <div className="demo-section">
            <h3>Timeline Interactive</h3>
            <p>Jalons créatifs avec progression et détails contextuels.</p>
            <InteractiveTimeline
              data={timelineData}
              title="Roadmap Créative 2024"
              subtitle="Jalons et réalisations artistiques"
              height={400}
              showProgress={true}
              colorScheme="creative"
              onMilestoneClick={(data) => console.log('Jalon sélectionné:', data)}
            />
          </div>
        )}

        {selectedDemo === 'thematic-progress' && (
          <div className="demo-section">
            <h3>Barres de Progression Thématiques</h3>
            <p>Progression des projets avec animations créatives et thèmes visuels.</p>
            <ThematicProgressBars
              data={progressData}
              title="Avancement des Projets Créatifs"
              subtitle="Progression détaillée avec jalons et échéances"
              theme="creative"
              animated={true}
              showLabels={true}
              showPercentages={true}
              showIcons={true}
              onBarClick={(data) => console.log('Projet sélectionné:', data)}
            />
          </div>
        )}
      </div>

      <div className="demo-footer">
        <div className="demo-stats">
          <div className="stat-card">
            <span className="stat-icon">🎨</span>
            <span className="stat-value">4</span>
            <span className="stat-label">Nouveaux Graphiques</span>
          </div>
          <div className="stat-card">
            <span className="stat-icon">✨</span>
            <span className="stat-value">12+</span>
            <span className="stat-label">Interactions</span>
          </div>
          <div className="stat-card">
            <span className="stat-icon">🎯</span>
            <span className="stat-value">100%</span>
            <span className="stat-label">Accessibilité</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .creative-charts-demo {
          padding: 24px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .demo-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .demo-title {
          font-size: 2rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 8px 0;
          background: linear-gradient(45deg, #FF6B9D, #4ECDC4);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .demo-subtitle {
          font-size: 1.1rem;
          color: var(--text-secondary);
          margin: 0;
        }

        .demo-navigation {
          display: flex;
          gap: 12px;
          margin-bottom: 32px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .demo-nav-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          border: 2px solid var(--border-light);
          border-radius: 12px;
          background: var(--card-bg);
          color: var(--text-primary);
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: 500;
        }

        .demo-nav-button:hover {
          border-color: var(--accent-color);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .demo-nav-button.active {
          border-color: #FF6B9D;
          background: linear-gradient(45deg, #FF6B9D20, #4ECDC420);
          color: var(--text-primary);
        }

        .nav-icon {
          font-size: 1.2rem;
        }

        .nav-text {
          font-size: 0.9rem;
        }

        .demo-content {
          margin-bottom: 32px;
        }

        .demo-section {
          background: var(--card-bg);
          border-radius: 16px;
          padding: 24px;
          border: 1px solid var(--border-light);
        }

        .demo-section h3 {
          margin: 0 0 8px 0;
          font-size: 1.3rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .demo-section p {
          margin: 0 0 24px 0;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        .demo-footer {
          text-align: center;
        }

        .demo-stats {
          display: flex;
          gap: 20px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .stat-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 20px;
          background: var(--card-bg);
          border-radius: 12px;
          border: 1px solid var(--border-light);
          min-width: 120px;
        }

        .stat-icon {
          font-size: 2rem;
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .stat-label {
          font-size: 0.8rem;
          color: var(--text-secondary);
          text-align: center;
        }

        @media (max-width: 768px) {
          .creative-charts-demo {
            padding: 16px;
          }

          .demo-title {
            font-size: 1.5rem;
          }

          .demo-navigation {
            gap: 8px;
          }

          .demo-nav-button {
            padding: 10px 16px;
          }

          .nav-text {
            display: none;
          }

          .demo-section {
            padding: 16px;
          }

          .demo-stats {
            gap: 12px;
          }

          .stat-card {
            min-width: 100px;
            padding: 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default CreativeChartsDemo;