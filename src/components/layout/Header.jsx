import React from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import Button from '../ui/Button';

const Header = () => {
  const { 
    workoutStarted, 
    startWorkout, 
    endWorkout,
    currentWorkout 
  } = useWorkout();

  return (
    <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo et titre */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <img 
                src="/logo.png" 
                alt="Momentum Logo" 
                className="w-12 h-12 rounded-lg"
              />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Momentum
              </h1>
            </div>
            <div className="text-sm text-slate-300">
              {new Date().toLocaleDateString('fr-FR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            {workoutStarted ? (
              <div className="flex items-center space-x-3">
                <div className="text-sm text-slate-300">
                  <span className="inline-flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                    Séance en cours
                  </span>
                </div>
                <Button 
                  variant="danger" 
                  size="sm"
                  onClick={endWorkout}
                >
                  Terminer
                </Button>
              </div>
            ) : (
              <Button 
                variant="primary" 
                size="sm"
                onClick={startWorkout}
              >
                Commencer
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;