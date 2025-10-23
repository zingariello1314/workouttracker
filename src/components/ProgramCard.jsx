import React from 'react';
import Card, { CardHeader, CardTitle, CardContent } from './ui/Card';
import { Calendar, Target, Clock, CheckCircle, Play, Users } from 'lucide-react';

const ProgramCard = ({ program, isActive = false, onClick, exerciseCount = 0 }) => {
  const getStatusIcon = () => {
    if (isActive) {
      return <Play className="w-4 h-4 text-green-400" />;
    }
    if (program.status === 'completed') {
      return <CheckCircle className="w-4 h-4 text-blue-400" />;
    }
    return <Calendar className="w-4 h-4 text-slate-400" />;
  };

  const getStatusText = () => {
    if (isActive) return 'Actif';
    if (program.status === 'completed') return 'Terminé';
    if (program.status === 'inactive') return 'Inactif';
    return 'Disponible';
  };

  const getStatusColor = () => {
    if (isActive) return 'text-green-400 bg-green-400/10';
    if (program.status === 'completed') return 'text-blue-400 bg-blue-400/10';
    return 'text-slate-400 bg-slate-400/10';
  };

  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg ${
        isActive ? 'ring-2 ring-green-400/50 bg-gradient-to-br from-green-900/20 to-slate-800' : 'hover:bg-slate-700/50'
      }`}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-bold text-white flex-1 pr-2">
            {program.name}
          </CardTitle>
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
            {getStatusIcon()}
            <span>{getStatusText()}</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Description */}
        {program.description && (
          <p className="text-slate-300 text-sm line-clamp-2">
            {program.description}
          </p>
        )}
        
        {/* Statistiques */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-400" />
            <div>
              <div className="text-xs text-slate-400">Exercices</div>
              <div className="text-sm font-medium text-white">{exerciseCount}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-400" />
            <div>
              <div className="text-xs text-slate-400">Durée</div>
              <div className="text-sm font-medium text-white">
                {program.duration ? `${program.duration} sem.` : 'Variable'}
              </div>
            </div>
          </div>
        </div>
        
        {/* Objectif */}
        {program.goal && (
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-orange-400" />
            <div>
              <div className="text-xs text-slate-400">Objectif</div>
              <div className="text-sm font-medium text-white capitalize">
                {program.goal === 'strength' ? 'Force' : 
                 program.goal === 'endurance' ? 'Endurance' :
                 program.goal === 'muscle_building' ? 'Prise de masse' :
                 program.goal === 'weight_loss' ? 'Perte de poids' :
                 program.goal}
              </div>
            </div>
          </div>
        )}
        
        {/* Dates */}
        <div className="flex justify-between text-xs text-slate-400 pt-2 border-t border-slate-700">
          <span>
            Créé: {new Date(program.createdAt).toLocaleDateString()}
          </span>
          {program.startDate && (
            <span>
              Démarré: {new Date(program.startDate).toLocaleDateString()}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProgramCard;