import React from 'react';
import { BarChart3 } from 'lucide-react';
import Card from '../ui/Card';

const ChartsTab = () => {
    return (
    <div className="p-6 space-y-6">
              <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <BarChart3 className="mr-3" size={28} />
          📈 Graphiques & Analyses
        </h2>
              </div>

      <Card>
          <div className="p-12 text-center">
            <div className="mb-4">
              <BarChart3 className="mx-auto text-gray-500" size={48} />
            </div>
            <h4 className="text-lg font-medium text-gray-400 mb-2">
            Module Graphiques en Développement
            </h4>
            <p className="text-gray-500 text-sm">
            Les graphiques et analyses avancées seront disponibles prochainement.
            </p>
          </div>
      </Card>
    </div>
  );
};

export default ChartsTab;