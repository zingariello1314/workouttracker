import React, { useState } from 'react';
import { Search, Plus, Filter, Dumbbell, Target, Clock, Flame } from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import { typography } from '../../styles/typography';

const ExercisesTab = () => {
  const { data } = useWorkout();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Données d'exemple des exercices
  const exercises = [
    {
      id: 1,
      name: 'Pompes',
      category: 'Pectoraux',
      difficulty: 'Débutant',
      equipment: 'Aucun',
      description: 'Exercice de base pour renforcer les pectoraux, triceps et épaules.',
      muscles: ['Pectoraux', 'Triceps', 'Épaules'],
      instructions: [
        'Placez-vous en position de planche',
        'Descendez en fléchissant les bras',
        'Remontez en poussant sur les bras'
      ]
    },
    {
      id: 2,
      name: 'Squats',
      category: 'Jambes',
      difficulty: 'Débutant',
      equipment: 'Aucun',
      description: 'Exercice fondamental pour les jambes et les fessiers.',
      muscles: ['Quadriceps', 'Fessiers', 'Ischio-jambiers'],
      instructions: [
        'Pieds écartés largeur d\'épaules',
        'Descendez comme pour vous asseoir',
        'Remontez en poussant sur les talons'
      ]
    },
    {
      id: 3,
      name: 'Planche',
      category: 'Core',
      difficulty: 'Intermédiaire',
      equipment: 'Aucun',
      description: 'Exercice isométrique pour renforcer le core.',
      muscles: ['Abdominaux', 'Dos', 'Épaules'],
      instructions: [
        'Position de pompe sur les avant-bras',
        'Corps aligné de la tête aux pieds',
        'Maintenez la position'
      ]
    }
  ];

  const categories = ['all', 'Pectoraux', 'Jambes', 'Core', 'Dos', 'Épaules', 'Bras'];

  const filteredExercises = exercises.filter(exercise => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exercise.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || exercise.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Débutant': return 'text-green-400';
      case 'Intermédiaire': return 'text-yellow-400';
      case 'Avancé': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="text-center space-y-2">
        <h1 className={typography.presets.h2Gradient}>
          Bibliothèque d'Exercices
        </h1>
        <p className={typography.presets.body}>
          Découvrez et apprenez de nouveaux exercices pour enrichir vos entraînements
        </p>
      </div>

      {/* Barre de recherche et filtres */}
      <Card className="p-6">
        <div className="space-y-4">
          {/* Recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher un exercice..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>

          {/* Filtres par catégorie */}
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="capitalize"
              >
                {category === 'all' ? 'Tous' : category}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Liste des exercices */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredExercises.map(exercise => (
          <Card key={exercise.id} className="hover:scale-105 transition-transform duration-200">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <Dumbbell className="w-5 h-5 text-blue-400" />
                  <CardTitle size="lg">{exercise.name}</CardTitle>
                </div>
                <span className={`text-sm font-medium ${getDifficultyColor(exercise.difficulty)}`}>
                  {exercise.difficulty}
                </span>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Description */}
              <p className={typography.presets.bodySmall}>
                {exercise.description}
              </p>

              {/* Informations */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-slate-400" />
                  <span className={typography.presets.caption}>
                    Catégorie: {exercise.category}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span className={typography.presets.caption}>
                    Équipement: {exercise.equipment}
                  </span>
                </div>
              </div>

              {/* Muscles ciblés */}
              <div>
                <h4 className={`${typography.presets.label} mb-2`}>Muscles ciblés:</h4>
                <div className="flex flex-wrap gap-1">
                  {exercise.muscles.map(muscle => (
                    <span
                      key={muscle}
                      className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full"
                    >
                      {muscle}
                    </span>
                  ))}
                </div>
              </div>

              {/* Instructions */}
              <div>
                <h4 className={`${typography.presets.label} mb-2`}>Instructions:</h4>
                <ol className="space-y-1">
                  {exercise.instructions.map((instruction, index) => (
                    <li key={index} className={`${typography.presets.caption} flex items-start`}>
                      <span className="text-blue-400 font-medium mr-2">{index + 1}.</span>
                      {instruction}
                    </li>
                  ))}
                </ol>
              </div>

              {/* Actions */}
              <div className="flex space-x-2 pt-2">
                <Button variant="primary" size="sm" className="flex-1">
                  <Plus className="w-4 h-4 mr-1" />
                  Ajouter
                </Button>
                <Button variant="outline" size="sm">
                  Détails
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Message si aucun exercice trouvé */}
      {filteredExercises.length === 0 && (
        <Card className="p-8 text-center">
          <div className="space-y-4">
            <Dumbbell className="w-12 h-12 text-slate-400 mx-auto" />
            <div>
              <h3 className={typography.presets.h4}>Aucun exercice trouvé</h3>
              <p className={typography.presets.body}>
                Essayez de modifier vos critères de recherche ou de filtrage.
              </p>
            </div>
            <Button variant="outline" onClick={() => {
              setSearchTerm('');
              setSelectedCategory('all');
            }}>
              Réinitialiser les filtres
            </Button>
          </div>
        </Card>
      )}

      {/* Statistiques */}
      <Card className="p-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Flame className="w-5 h-5 text-orange-400" />
            <span>Statistiques</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className={`${typography.presets.h3} text-blue-400`}>
                {exercises.length}
              </div>
              <div className={typography.presets.caption}>
                Exercices disponibles
              </div>
            </div>
            <div className="text-center">
              <div className={`${typography.presets.h3} text-green-400`}>
                {categories.length - 1}
              </div>
              <div className={typography.presets.caption}>
                Catégories
              </div>
            </div>
            <div className="text-center">
              <div className={`${typography.presets.h3} text-yellow-400`}>
                {exercises.filter(e => e.equipment === 'Aucun').length}
              </div>
              <div className={typography.presets.caption}>
                Sans équipement
              </div>
            </div>
            <div className="text-center">
              <div className={`${typography.presets.h3} text-purple-400`}>
                {filteredExercises.length}
              </div>
              <div className={typography.presets.caption}>
                Résultats actuels
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExercisesTab;