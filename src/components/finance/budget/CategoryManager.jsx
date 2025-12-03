import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useBudget } from '../../../hooks/useBudget';
import { useToast } from '../../ui/Toast';
import CategoryCard from './CategoryCard';
import AddCategoryForm from './AddCategoryForm';

const CategoryManager = () => {
  const { categories, reorderCategories, addCategory, updateCategory, deleteCategory } = useBudget();
  const { showToast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(categories);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    reorderCategories(items);
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setShowAddForm(true);
  };

  const handleDelete = async (categoryId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) {
      try {
        await deleteCategory(categoryId);
        showToast('Catégorie supprimée', 'success');
      } catch (error) {
        showToast('Erreur lors de la suppression', 'error');
      }
    }
  };

  const handleSave = async (categoryData) => {
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, categoryData);
        showToast('Catégorie mise à jour', 'success');
      } else {
        await addCategory(categoryData);
        showToast('Catégorie ajoutée', 'success');
      }
      setShowAddForm(false);
      setEditingCategory(null);
    } catch (error) {
      showToast('Erreur lors de la sauvegarde', 'error');
    }
  };

  return (
    <div className="category-manager space-y-6">
      {/* Header avec bouton ajouter */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">Gestion des Catégories</h3>
        <button
          onClick={() => {
            setEditingCategory(null);
            setShowAddForm(true);
          }}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
        >
          <span>➕</span>
          <span>Ajouter Catégorie</span>
        </button>
      </div>

      {/* Formulaire ajout/modification */}
      {showAddForm && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <AddCategoryForm
            category={editingCategory}
            onSave={handleSave}
            onCancel={() => {
              setShowAddForm(false);
              setEditingCategory(null);
            }}
          />
        </div>
      )}

      {/* Liste catégories avec drag & drop */}
      {categories.length === 0 ? (
        <div className="text-center py-12 bg-slate-800/50 border border-slate-700/50 rounded-lg">
          <div className="text-6xl mb-4">📁</div>
          <p className="text-slate-400 mb-4">Aucune catégorie configurée</p>
          <p className="text-sm text-slate-500">Ajoutez votre première catégorie pour commencer</p>
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="categories">
            {(provided, snapshot) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className={`space-y-4 ${
                  snapshot.isDraggingOver ? 'bg-blue-900/10' : ''
                }`}
              >
                {categories.map((category, index) => (
                  <Draggable
                    key={category.id}
                    draggableId={category.id}
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`${
                          snapshot.isDragging
                            ? 'opacity-50 scale-95'
                            : 'transition-transform'
                        }`}
                      >
                        <div
                          {...provided.dragHandleProps}
                          className="cursor-grab active:cursor-grabbing"
                        >
                          <CategoryCard
                            category={category}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                          />
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
      )}
    </div>
  );
};

export default CategoryManager;

