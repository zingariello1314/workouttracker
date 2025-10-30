import React, { useState } from 'react';
import { Award, Target, Clock, CheckCircle, MessageSquare, Save, X } from 'lucide-react';
import Button from './Button';
import { Input } from './Input';

const ChallengeCard = ({ challenge, onComplete, onUpdate }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [reps, setReps] = useState('');
  const [duration, setDuration] = useState('');
  const [distance, setDistance] = useState('');
  const [notes, setNotes] = useState('');
  const [isCompleting, setIsCompleting] = useState(false);

  const handleComplete = async () => {
    // Validation minimale en fonction du type d'activité
    const type = challenge.activityType;
    const needReps = ['pushups', 'jumprope'].includes(type);
    const needDuration = ['boxing', 'running', 'jumprope', 'swimming'].includes(type);
    const needDistance = ['swimming', 'running'].includes(type);

    if (needReps && !reps) {
      alert('Veuillez renseigner le nombre de répétitions/sauts');
      return;
    }
    if (needDuration && !duration) {
      alert('Veuillez renseigner la durée (min)');
      return;
    }
    if (needDistance && !distance) {
      alert('Veuillez renseigner la distance');
      return;
    }

    setIsCompleting(true);
    try {
      await onComplete(challenge.id, {
        reps: parseInt(reps) || 0,
        duration: parseInt(duration) || 0,
        distance: parseFloat(distance) || 0,
        notes: notes.trim()
      });
      
      // Reset form
      setReps('');
      setDuration('');
      setNotes('');
      setDistance('');
      setIsExpanded(false);
    } catch (error) {
      console.error('Erreur lors de la validation du défi:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  const getChallengeTypeIcon = () => {
    switch (challenge.type) {
      case 'ponctuel':
        return <Target className="w-4 h-4" />;
      case 'recurrent':
        return <Clock className="w-4 h-4" />;
      case 'periode':
        return <Award className="w-4 h-4" />;
      default:
        return <Award className="w-4 h-4" />;
    }
  };

  const getChallengeTypeText = () => {
    switch (challenge.type) {
      case 'ponctuel':
        return `📅 Date cible: ${challenge.targetDate}`;
      case 'recurrent':
        return `🔄 ${challenge.frequency === 'daily' ? 'Quotidien' : 'Hebdomadaire'} - ${challenge.moment}`;
      case 'periode':
        return `📆 ${challenge.startDate} → ${challenge.endDate}`;
      default:
        return '';
    }
  };

  const getGoalText = () => {
    const parts = [];
    if (challenge.goalCount) parts.push(`${challenge.goalCount} reps`);
    if (challenge.goalDuration) parts.push(`${challenge.goalDuration} min`);
    if (challenge.goalDistance) parts.push(`${challenge.goalDistance} m`);
    return parts.join(' • ');
  };

  return (
    <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-4 hover:border-purple-400/50 transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {getChallengeTypeIcon()}
          <h4 className="font-bold text-lg text-white">{challenge.name}</h4>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-purple-500/30 text-purple-200 px-2 py-1 rounded-full">
            {challenge.activityType}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-purple-300 hover:text-white"
          >
            {isExpanded ? <X className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      <div className="space-y-2 text-sm text-slate-300">
        <p>{getChallengeTypeText()}</p>
        <p className="text-purple-200">🎯 Objectif: {getGoalText()}</p>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-4 p-4 bg-slate-800/50 rounded-xl border border-slate-600/50">
          <h5 className="font-semibold text-white flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Valider le défi
          </h5>
          
          <div className="grid grid-cols-2 gap-4">
            {(['pushups','jumprope'].includes(challenge.activityType)) && (
              <div>
                <label className="block text-sm text-slate-300 mb-1">{challenge.activityType === 'jumprope' ? 'Sauts' : 'Répétitions'}</label>
                <Input
                  type="number"
                  value={reps}
                  onChange={(e) => setReps(e.target.value)}
                  placeholder={challenge.activityType === 'jumprope' ? 'Nombre de sauts' : 'Nombre de reps'}
                  className="w-full"
                />
              </div>
            )}
            {(['boxing','running','jumprope','swimming'].includes(challenge.activityType)) && (
              <div>
                <label className="block text-sm text-slate-300 mb-1">Durée (min)</label>
                <Input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="Durée en minutes"
                  className="w-full"
                />
              </div>
            )}
            {(['swimming','running'].includes(challenge.activityType)) && (
              <div>
                <label className="block text-sm text-slate-300 mb-1">Distance ({challenge.activityType === 'swimming' ? 'm' : 'km'})</label>
                <Input
                  type="number"
                  step="0.01"
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                  placeholder={challenge.activityType === 'swimming' ? 'Distance en mètres' : 'Distance en km'}
                  className="w-full"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Comment s'est passé le défi ?"
              className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-purple-500 focus:outline-none"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => setIsExpanded(false)}
              className="text-slate-400 hover:text-white"
            >
              Annuler
            </Button>
            <Button
              onClick={handleComplete}
              disabled={isCompleting || (!reps && !duration)}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isCompleting ? 'Validation...' : 'Valider le défi'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChallengeCard;
