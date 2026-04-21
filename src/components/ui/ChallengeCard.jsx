import React, { useState } from 'react';
import { Award, Target, Clock, CheckCircle, MessageSquare, Save, X } from 'lucide-react';
import Button from './Button';
import { Input } from './Input';
import { useTranslation } from '../../utils/translations';

const ChallengeCard = ({ challenge, onComplete, onUpdate }) => {
  const t = useTranslation();
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
      alert(t('today.challenges.validation.repsRequired'));
      return;
    }
    if (needDuration && !duration) {
      alert(t('today.challenges.validation.durationRequired'));
      return;
    }
    if (needDistance && !distance) {
      alert(t('today.challenges.validation.distanceRequired'));
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
        return `📅 ${t('today.challenges.targetDate')}: ${challenge.targetDate}`;
      case 'recurrent':
        const frequency = challenge.frequency === 'daily' ? t('today.challenges.daily') : t('today.challenges.weekly');
        const moment = challenge.moment ? t(`today.stretchMoments.${challenge.moment.toLowerCase()}`, challenge.moment) : '';
        return `🔄 ${frequency}${moment ? ` - ${moment}` : ''}`;
      case 'periode':
        return `📆 ${challenge.startDate} → ${challenge.endDate}`;
      default:
        return '';
    }
  };

  const getGoalText = () => {
    const parts = [];
    if (challenge.goalCount) parts.push(`${challenge.goalCount} ${t('today.exercises.reps')}`);
    if (challenge.goalDuration) parts.push(`${challenge.goalDuration} ${t('today.exercises.minutesLabel')}`);
    if (challenge.goalDistance) parts.push(`${challenge.goalDistance} m`);
    return parts.join(' • ');
  };

  return (
    <div className="rounded-2xl border border-[#0F4C5C]/50 bg-black p-4 transition-all hover:border-[#0F5C45]/55">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3 text-teal-200">
          {getChallengeTypeIcon()}
          <h4 className="text-lg font-bold text-white">{challenge.name}</h4>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-[#0F5C45]/40 bg-[#0F4C5C]/25 px-2 py-1 text-xs text-teal-100">
            {challenge.activityType}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-teal-300 hover:text-white"
          >
            {isExpanded ? <X className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      <div className="space-y-2 text-sm text-teal-200/85">
        <p>{getChallengeTypeText()}</p>
        <p className="text-cyan-200/90">🎯 {t('today.challenges.goal')}: {getGoalText()}</p>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-4 rounded-xl border border-[#0F4C5C]/45 bg-black p-4">
          <h5 className="font-semibold text-white flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            {t('today.challenges.validate')}
          </h5>
          
          <div className="grid grid-cols-2 gap-4">
            {(['pushups','jumprope'].includes(challenge.activityType)) && (
              <div>
                <label className="block text-sm text-slate-300 mb-1">
                  {challenge.activityType === 'jumprope' ? t('today.endurance.jumps') : t('today.endurance.repetitions')}
                </label>
                <Input
                  type="number"
                  value={reps}
                  onChange={(e) => setReps(e.target.value)}
                  placeholder={challenge.activityType === 'jumprope' ? t('today.challenges.placeholders.jumps') : t('today.challenges.placeholders.reps')}
                  className="w-full"
                />
              </div>
            )}
            {(['boxing','running','jumprope','swimming'].includes(challenge.activityType)) && (
              <div>
                <label className="block text-sm text-slate-300 mb-1">
                  {t('today.endurance.duration')} ({t('today.exercises.minutesLabel')})
                </label>
                <Input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder={t('today.challenges.placeholders.duration')}
                  className="w-full"
                />
              </div>
            )}
            {(['swimming','running'].includes(challenge.activityType)) && (
              <div>
                <label className="block text-sm text-slate-300 mb-1">
                  {t('today.endurance.distance')} ({challenge.activityType === 'swimming' ? 'm' : 'km'})
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                  placeholder={challenge.activityType === 'swimming' ? t('today.challenges.placeholders.distanceMeters') : t('today.challenges.placeholders.distanceKm')}
                  className="w-full"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">{t('today.challenges.notes')}</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('today.challenges.placeholders.notes')}
              className="w-full rounded-lg border border-[#0F4C5C]/50 bg-black p-3 text-white placeholder-teal-800 focus:border-[#0F5C45] focus:outline-none focus:ring-1 focus:ring-teal-500/40"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => setIsExpanded(false)}
              className="text-slate-400 hover:text-white"
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleComplete}
              disabled={isCompleting || (!reps && !duration)}
              className="border border-[#0F5C45]/60 bg-[#0F4C5C] text-white hover:bg-[#0F4C5C]/90"
            >
              {isCompleting ? t('today.challenges.validating') : t('today.challenges.validate')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChallengeCard;
