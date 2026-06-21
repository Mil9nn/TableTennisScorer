import { useState, useCallback } from 'react';

export interface FilterState {
  type?: string;
  status?: string;
  format?: string;
  datePreset?: string;
  dateFrom?: string;
  dateTo?: string;
  query?: string;
  search?: string;
  sort?: string;
}

export interface UseModernFiltersOptions {
  initialFilters?: FilterState;
}

export interface UseModernFiltersReturn {
  // Current filters
  filters: FilterState;
  
  // Temporary filters (for modal)
  tempFilters: FilterState;
  
  // Update functions
  updateTempFilter: (key: keyof FilterState, value: string) => void;
  /** Batch-update temp filters (e.g. preset + date range together). */
  patchTempFilters: (patch: Partial<FilterState>) => void;
  /** Sync modal temp state from applied filters (e.g. when opening the sheet). */
  syncTempFrom: (patch: Partial<FilterState>) => void;
  resetTempFilters: () => void;
  
  // Apply temp filters to actual filters
  applyTempFilters: () => void;
  
  // Clear all filters
  clearAllFilters: () => void;
  
  // Check if filters are active
  hasActiveFilters: boolean;
  
  // Get filter display values
  getFilterDisplay: (key: keyof FilterState) => string;
}

export const useModernFilters = (options: UseModernFiltersOptions = {}): UseModernFiltersReturn => {
  const { initialFilters = {} } = options;
  
  // Actual filters (applied to the data)
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  
  // Temporary filters (for modal selection, will trigger re-render)
  const [tempFilters, setTempFilters] = useState<FilterState>({ ...initialFilters });

  // Update temporary filter (triggers re-render)
  const updateTempFilter = useCallback((key: keyof FilterState, value: string) => {
    setTempFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const patchTempFilters = useCallback((patch: Partial<FilterState>) => {
    setTempFilters((prev) => ({ ...prev, ...patch }));
  }, []);

  const syncTempFrom = useCallback((patch: Partial<FilterState>) => {
    setTempFilters((prev) => ({ ...prev, ...patch }));
  }, []);

  // Reset temporary filters to current applied filters
  const resetTempFilters = useCallback(() => {
    setTempFilters({ ...filters });
  }, [filters]);

  // Apply temporary filters to actual filters
  const applyTempFilters = useCallback(() => {
    setFilters({ ...tempFilters });
  }, [tempFilters]);

  // Clear all filters — restores each screen's `initialFilters` (e.g. sort default on tournaments).
  const clearAllFilters = useCallback(() => {
    const next = { ...initialFilters };
    setFilters(next);
    setTempFilters({ ...next });
  }, [initialFilters]);

  // Check if any filters are active
  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    return value !== undefined && value !== '' && value !== 'all';
  });

  // Get display value for a filter
  const getFilterDisplay = useCallback((key: keyof FilterState): string => {
    const value = filters[key];
    
    switch (key) {
      case 'type':
        return value === 'all' ? 'All' : value === 'singles' ? 'Singles' : value === 'doubles' ? 'Doubles' : value || 'All';
      case 'status':
        return value === 'all' ? 'All' : 
               value === 'scheduled' ? 'Scheduled' : 
               value === 'in_progress' ? 'Live' : 
               value === 'completed' ? 'Completed' :
               value === 'draft' ? 'Draft' :
               value === 'active' ? 'Active' :
               value === 'cancelled' ? 'Cancelled' : value || 'All';
      case 'format':
        return value === 'all' ? 'All' : 
               value === 'five_singles' ? 'Swaythling' : 
               value === 'single_double_single' ? 'S-D-S' :
               value === 'round_robin' ? 'Round Robin' :
               value === 'knockout' ? 'Knockout' :
               value === 'hybrid' ? 'Hybrid' :
               value === 'friendly' ? 'Friendly' :
               value === 'tournament' ? 'Tournament' : value || 'All';
      case 'sort':
        return value === 'recent' ? 'Most Recent' : 
               value === 'upcoming' ? 'Upcoming' :
               value === 'name' ? 'Name A-Z' :
               value === 'participants' ? 'Participants' : value || 'Most Recent';
      case 'dateFrom':
      case 'dateTo':
        return value || '';
      case 'query':
        return value || '';
      default:
        return value || '';
    }
  }, [filters]);

  return {
    filters,
    tempFilters,
    updateTempFilter,
    patchTempFilters,
    syncTempFrom,
    resetTempFilters,
    applyTempFilters,
    clearAllFilters,
    hasActiveFilters,
    getFilterDisplay,
  };
};