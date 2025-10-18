import React from 'react';
import { TrendingUp, Calendar, Target, Award } from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import Button from '../ui/Button';
import Card from '../ui/Card';

const StatsTab = () => {
  const {
    statsPeriod,
    setStatsPeriod,
    getStats,
    getCurrentStreak,
    getLongestStreak,
    setShowAdvancedStats
  } = useWorkout();

  const stats = getStats(statsPeriod);
  const currentStreak = getCurrentStreak();
  const longestStreak = getLongestStreak();

  const periods = [
    { key: 'week', label: 'Semaine' },
    { key: 'month', label: 'Mois' },
    { key: 'year', label: 'Année' }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Sélecteur de période */}
      <div className="flex justify-center">
        <div className="flex bg-gray-800 rounded-lg p-1 border border-gray-700">
          {periods.map(period => (
            <Button
              key={period.key}
              variant={statsPeriod === period.key ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setStatsPeriod(period.key)}
              className={`px-4 py-2 ${
                statsPeriod === period.key 
                  ? 'bg-purple-600 text-white' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              {period.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="text-center">
          <Card.Content className="pt-6">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {stats.totalWorkouts}
            </div>
            <div className="text-sm text-gray-600">Séances</div>
          </Card.Content>
        </Card>

        <Card className="text-center">
          <Card.Content className="pt-6">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {stats.totalReps}
            </div>
            <div className="text-sm text-gray-600">Répétitions</div>
          </Card.Content>
        </Card>

        <Card className="text-center">
          <Card.Content className="pt-6">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {currentStreak}
            </div>
            <div className="text-sm text-gray-600">Série actuelle</div>
          </Card.Content>
        </Card>

        <Card className="text-center">
          <Card.Content className="pt-6">
            <div className="text-3xl font-bold text-orange-600 mb-2">
              {longestStreak}
            </div>
            <div className="text-sm text-gray-600">Meilleure série</div>
          </Card.Content>
        </Card>
      </div>

      {/* Statistiques détaillées */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <Card.Header>
            <Card.Title className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Performance
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Moyenne par séance</span>
                <span className="font-semibold">
                  {stats.totalWorkouts > 0 ? Math.round(stats.totalReps / stats.totalWorkouts) : 0} reps
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Jours actifs</span>
                <span className="font-semibold">{stats.activeDays}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Taux de régularité</span>
                <span className="font-semibold">
                  {stats.activeDays > 0 ? Math.round((stats.activeDays / 30) * 100) : 0}%
                </span>
              </div>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title className="flex items-center">
              <Award className="w-5 h-5 mr-2" />
              Réalisations
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">🔥 Série actuelle</span>
                <span className="font-semibold">{currentStreak} jours</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">🏆 Record personnel</span>
                <span className="font-semibold">{longestStreak} jours</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">💪 Total répétitions</span>
                <span className="font-semibold">{stats.totalReps}</span>
              </div>
            </div>
          </Card.Content>
        </Card>
      </div>

      {/* Bouton statistiques avancées */}
      <div className="text-center">
        <Button
          onClick={() => setShowAdvancedStats(true)}
          icon={Target}
          size="lg"
        >
          Voir les statistiques avancées
        </Button>
      </div>
    </div>
  );
};

export default StatsTab;