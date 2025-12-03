import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useInvestissements } from '../../../hooks/useInvestissements';
import { useToast } from '../../ui/Toast/ToastProvider';

/**
 * Composant de drag & drop pour répartition visuelle des allocations
 */
const AllocationDragDrop = () => {
  const { allocation, updateAllocation } = useInvestissements();
  const { showToast } = useToast();

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Initialiser les allocations si nécessaire
  const [allocations, setAllocations] = useState(() => {
    if (!allocation) {
      return [
        { id: 'or', label: 'Or', pourcent: 30, couleur: '#eab308', icon: '🥇' },
        { id: 'liquidites', label: 'Liquidités', pourcent: 15, couleur: '#10b981', icon: '💰' },
        { id: 'bourseCrypto', label: 'Bourse & Crypto', pourcent: 55, couleur: '#3b82f6', icon: '📈' }
      ];
    }
    return [
      { id: 'or', label: 'Or', pourcent: allocation.or || 30, couleur: '#eab308', icon: '🥇' },
      { id: 'liquidites', label: 'Liquidités', pourcent: allocation.liquidites || 15, couleur: '#10b981', icon: '💰' },
      { id: 'bourseCrypto', label: 'Bourse & Crypto', pourcent: allocation.bourseCrypto || 55, couleur: '#3b82f6', icon: '📈' }
    ];
  });

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const items = Array.from(allocations);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setAllocations(items);
    showToast('Ordre des allocations mis à jour', 'success');
  };

  const handlePercentChange = async (id, newPercent) => {
    const updated = allocations.map(a => 
      a.id === id ? { ...a, pourcent: Math.max(0, Math.min(100, newPercent)) } : a
    );

    // Normaliser pour que la somme = 100%
    const total = updated.reduce((sum, a) => sum + a.pourcent, 0);
    if (total !== 100) {
      const factor = 100 / total;
      updated.forEach(a => {
        a.pourcent = Math.round(a.pourcent * factor * 10) / 10;
      });
    }

    setAllocations(updated);

    // Sauvegarder
    try {
      const newAllocation = {
        or: updated.find(a => a.id === 'or')?.pourcent || 30,
        liquidites: updated.find(a => a.id === 'liquidites')?.pourcent || 15,
        bourseCrypto: updated.find(a => a.id === 'bourseCrypto')?.pourcent || 55
      };
      await updateAllocation(newAllocation);
      showToast('Allocation mise à jour', 'success');
    } catch (error) {
      showToast('Erreur lors de la mise à jour', 'error');
    }
  };

  return (
    <div className="allocation-drag-drop bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
      <h4 className="text-lg font-semibold text-white mb-4">
        Répartition Visuelle (Drag & Drop)
      </h4>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="allocations">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-3"
            >
              {allocations.map((alloc, index) => (
                <Draggable key={alloc.id} draggableId={alloc.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`bg-slate-700/30 rounded-lg p-4 border ${
                        snapshot.isDragging
                          ? 'border-blue-500 shadow-lg'
                          : 'border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div
                            {...provided.dragHandleProps}
                            className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-white"
                          >
                            ⋮⋮
                          </div>
                          <span className="text-2xl">{alloc.icon}</span>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-white">
                              {alloc.label}
                            </div>
                            <div className="w-full bg-slate-800 rounded-full h-2 mt-2">
                              <div
                                className="h-2 rounded-full transition-all duration-300"
                                style={{
                                  width: `${alloc.pourcent}%`,
                                  backgroundColor: alloc.couleur
                                }}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <input
                            type="number"
                            value={alloc.pourcent}
                            onChange={(e) => handlePercentChange(alloc.id, parseFloat(e.target.value) || 0)}
                            className="w-20 px-2 py-1 bg-slate-800 border border-slate-600 rounded text-white text-sm text-center"
                            min="0"
                            max="100"
                            step="0.1"
                          />
                          <span className="text-sm text-slate-400">%</span>
                        </div>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <div className="mt-4 pt-4 border-t border-slate-700">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Total</span>
          <span className="text-white font-semibold">
            {allocations.reduce((sum, a) => sum + a.pourcent, 0).toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default AllocationDragDrop;

