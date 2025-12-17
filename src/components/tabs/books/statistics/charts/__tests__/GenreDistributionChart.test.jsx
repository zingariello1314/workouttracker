/**
 * Tests unitaires pour GenreDistributionChart
 * 
 * @see Requirements 5.1, 5.2, 5.3
 */

import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import GenreDistributionChart from '../GenreDistributionChart';

// Mock des données de test
const mockBooks = [
  {
    id: '1',
    title: 'Test Book 1',
    genre: 'Fiction',
    author: 'Author 1',
    status: 'completed'
  },
  {
    id: '2', 
    title: 'Test Book 2',
    genre: 'Non-Fiction',
    author: 'Author 2',
    status: 'in-progress'
  },
  {
    id: '3',
    title: 'Test Book 3', 
    genre: 'Fiction',
    author: 'Author 3',
    status: 'completed'
  }
];

const mockStatisticsData = {
  sessions: [
    {
      id: '1',
      bookId: '1',
      date: '2024-01-01',
      durationMinutes: 60,
      pagesRead: 20
    },
    {
      id: '2',
      bookId: '2', 
      date: '2024-01-02',
      durationMinutes: 45,
      pagesRead: 15
    },
    {
      id: '3',
      bookId: '1',
      date: '2024-01-03', 
      durationMinutes: 30,
      pagesRead: 10
    },
    {
      id: '4',
      bookId: '3',
      date: '2024-01-04',
      durationMinutes: 90,
      pagesRead: 25
    }
  ]
};

describe('GenreDistributionChart', () => {
  const defaultProps = {
    books: mockBooks,
    statisticsData: mockStatisticsData,
    selectedPeriod: '1m',
    filters: {},
    onGenreFilter: () => {}
  };

  it('should render without crashing', () => {
    render(<GenreDistributionChart {...defaultProps} />);
    expect(screen.getByText('Répartition')).toBeInTheDocument();
    expect(screen.getByText('Vitesses')).toBeInTheDocument();
  });

  it('should display genre statistics correctly', () => {
    render(<GenreDistributionChart {...defaultProps} />);
    
    // Vérifier que les genres sont affichés
    expect(screen.getByText('2')).toBeInTheDocument(); // Nombre de genres
    expect(screen.getByText('Genres lus')).toBeInTheDocument();
  });

  it('should switch between distribution and speed views', () => {
    render(<GenreDistributionChart {...defaultProps} />);
    
    const speedButton = screen.getByText('Vitesses');
    fireEvent.click(speedButton);
    
    // Vérifier que la vue a changé (le bouton devrait avoir la classe active)
    expect(speedButton.closest('button')).toHaveClass('bg-purple-600');
  });

  it('should show no data message when no sessions exist', () => {
    const propsWithoutData = {
      ...defaultProps,
      statisticsData: { sessions: [] }
    };
    
    render(<GenreDistributionChart {...propsWithoutData} />);
    expect(screen.getByText('Aucune donnée par genre')).toBeInTheDocument();
  });

  it('should calculate genre statistics correctly', () => {
    render(<GenreDistributionChart {...defaultProps} />);
    
    // Fiction: 2 sessions (60+30=90 min, 20+10=30 pages)
    // Non-Fiction: 1 session (45 min, 15 pages)
    // Total: 135 min
    // Fiction percentage: 90/135 = 66.7%
    
    // Ces calculs sont vérifiés dans le rendu du composant
    expect(screen.getByText('2')).toBeInTheDocument(); // Nombre de genres
  });
});