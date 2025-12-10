import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';

// Mock du service - doit être au top level
vi.mock('../../services/sidebar/moduleAlternationService', () => ({
  default: {
    getAlternatedModules: vi.fn(),
    getModuleById: vi.fn(),
    getModulesByType: vi.fn(),
    insertNewModule: vi.fn(),
    removeModule: vi.fn(),
    toggleModuleVisibility: vi.fn(),
    validateAlternationPattern: vi.fn(),
    getAlternationStats: vi.fn()
  }
}));

import { useModuleAlternation } from '../useModuleAlternation';
import moduleAlternationService from '../../services/sidebar/moduleAlternationService';

describe('useModuleAlternation', () => {
  const mockPattern = [
    {
      id: 'enregistrer-session',
      component: 'SessionRecorderModule',
      position: 1,
      type: 'historical',
      isVisible: true
    },
    {
      id: 'actions-rapides',
      component: 'ActionsRapidesSection',
      position: 2,
      type: 'legacy',
      isVisible: true
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    moduleAlternationService.getAlternatedModules.mockReturnValue(mockPattern);
    moduleAlternationService.getModuleById.mockImplementation(id => 
      mockPattern.find(m => m.id === id)
    );
    moduleAlternationService.getModulesByType.mockImplementation(type => 
      mockPattern.filter(m => m.type === type)
    );
    moduleAlternationService.validateAlternationPattern.mockReturnValue({
      isValid: true,
      errors: []
    });
    moduleAlternationService.getAlternationStats.mockReturnValue({
      totalModules: 2,
      legacyModules: 1,
      historicalModules: 1,
      alternationRatio: 1,
      pattern: mockPattern.map(m => ({ position: m.position, type: m.type, id: m.id }))
    });
  });

  it('should initialize with pattern from service', async () => {
    const { result } = renderHook(() => useModuleAlternation());

    // Attendre que le loading soit terminé
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.alternationPattern).toEqual(mockPattern);
    expect(moduleAlternationService.getAlternatedModules).toHaveBeenCalled();
  });

  it('should provide modules by type', async () => {
    const { result } = renderHook(() => useModuleAlternation());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.modulesByType.legacy).toHaveLength(1);
    expect(result.current.modulesByType.historical).toHaveLength(1);
    expect(result.current.modulesByType.legacy[0].type).toBe('legacy');
    expect(result.current.modulesByType.historical[0].type).toBe('historical');
  });

  it('should provide validation results', async () => {
    const { result } = renderHook(() => useModuleAlternation());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.validation.isValid).toBe(true);
    expect(result.current.validation.errors).toHaveLength(0);
  });

  it('should provide statistics', async () => {
    const { result } = renderHook(() => useModuleAlternation());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.stats.totalModules).toBe(2);
    expect(result.current.stats.legacyModules).toBe(1);
    expect(result.current.stats.historicalModules).toBe(1);
    expect(result.current.stats.alternationRatio).toBe(1);
  });

  it('should handle getModuleById', async () => {
    const { result } = renderHook(() => useModuleAlternation());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const module = result.current.getModuleById('enregistrer-session');
    expect(module).toBeDefined();
    expect(module.id).toBe('enregistrer-session');
    expect(moduleAlternationService.getModuleById).toHaveBeenCalledWith('enregistrer-session');
  });

  it('should handle getModulesByType', async () => {
    const { result } = renderHook(() => useModuleAlternation());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const legacyModules = result.current.getModulesByType('legacy');
    expect(legacyModules).toHaveLength(1);
    expect(moduleAlternationService.getModulesByType).toHaveBeenCalledWith('legacy');
  });

  it('should handle insertNewModule', async () => {
    const newModule = {
      id: 'test-module',
      component: 'TestModule',
      position: 3,
      type: 'historical'
    };

    const updatedPattern = [...mockPattern, newModule];
    moduleAlternationService.insertNewModule.mockReturnValue(newModule);
    moduleAlternationService.getAlternatedModules.mockReturnValue(updatedPattern);

    const { result } = renderHook(() => useModuleAlternation());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    let insertedModule;
    await act(async () => {
      insertedModule = result.current.insertNewModule(newModule);
    });

    expect(insertedModule).toEqual(newModule);
    expect(result.current.alternationPattern).toEqual(updatedPattern);
    expect(moduleAlternationService.insertNewModule).toHaveBeenCalledWith(newModule);
  });

  it('should handle removeModule', async () => {
    const updatedPattern = mockPattern.filter(m => m.id !== 'enregistrer-session');
    moduleAlternationService.removeModule.mockReturnValue(true);
    moduleAlternationService.getAlternatedModules.mockReturnValue(updatedPattern);

    const { result } = renderHook(() => useModuleAlternation());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    let success;
    await act(async () => {
      success = result.current.removeModule('enregistrer-session');
    });

    expect(success).toBe(true);
    expect(result.current.alternationPattern).toEqual(updatedPattern);
    expect(moduleAlternationService.removeModule).toHaveBeenCalledWith('enregistrer-session');
  });

  it('should handle toggleModuleVisibility', async () => {
    const updatedPattern = mockPattern.map(m => 
      m.id === 'enregistrer-session' ? { ...m, isVisible: false } : m
    );
    moduleAlternationService.toggleModuleVisibility.mockReturnValue(true);
    moduleAlternationService.getAlternatedModules.mockReturnValue(updatedPattern);

    const { result } = renderHook(() => useModuleAlternation());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    let success;
    await act(async () => {
      success = result.current.toggleModuleVisibility('enregistrer-session');
    });

    expect(success).toBe(true);
    expect(result.current.alternationPattern).toEqual(updatedPattern);
    expect(moduleAlternationService.toggleModuleVisibility).toHaveBeenCalledWith('enregistrer-session');
  });

  it('should handle errors gracefully', async () => {
    const errorMessage = 'Test error';
    moduleAlternationService.getAlternatedModules.mockImplementation(() => {
      throw new Error(errorMessage);
    });

    const { result } = renderHook(() => useModuleAlternation());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(errorMessage);
    expect(result.current.alternationPattern).toEqual([]);
  });

  it('should provide clearError function', async () => {
    const errorMessage = 'Test error';
    moduleAlternationService.getAlternatedModules.mockImplementation(() => {
      throw new Error(errorMessage);
    });

    const { result } = renderHook(() => useModuleAlternation());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.error).toBe(errorMessage);

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it('should provide refreshPattern function', async () => {
    const { result } = renderHook(() => useModuleAlternation());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Changer le mock pour simuler un nouveau pattern
    const newPattern = [...mockPattern, { id: 'new-module', position: 3, type: 'historical' }];
    moduleAlternationService.getAlternatedModules.mockReturnValue(newPattern);

    act(() => {
      result.current.refreshPattern();
    });

    expect(result.current.alternationPattern).toEqual(newPattern);
  });
});