import { useSearchParams } from 'react-router-dom';
import { useCallback, useMemo } from 'react';

interface LogSearchState {
  query: string;
  filter: string;
  from: string;
  to: string;
  size: number;
}

const DEFAULT_SIZE = 30;

export function useLogSearchParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  const state: LogSearchState = useMemo(() => ({
    query: searchParams.get('q') || '',
    filter: searchParams.get('filter') || '',
    from: searchParams.get('from') || '',
    to: searchParams.get('to') || '',
    size: parseInt(searchParams.get('size') || String(DEFAULT_SIZE), 10),
  }), [searchParams]);

  const hasFromParam = searchParams.has('from');

  const updateParams = useCallback((updates: Partial<LogSearchState>) => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);

      if (updates.query !== undefined) {
        if (updates.query) {
          params.set('q', updates.query);
        } else {
          params.delete('q');
        }
      }

      if (updates.filter !== undefined) {
        if (updates.filter) {
          params.set('filter', updates.filter);
        } else {
          params.delete('filter');
        }
      }

      if (updates.from !== undefined) {
        if (updates.from) {
          params.set('from', updates.from);
        } else {
          params.delete('from');
        }
      }

      if (updates.to !== undefined) {
        if (updates.to) {
          params.set('to', updates.to);
        } else {
          params.delete('to');
        }
      }

      if (updates.size !== undefined) {
        if (updates.size !== DEFAULT_SIZE) {
          params.set('size', String(updates.size));
        } else {
          params.delete('size');
        }
      }

      return params;
    });
  }, [setSearchParams]);

  const setQuery = useCallback((query: string) => updateParams({ query }), [updateParams]);
  const setFilter = useCallback((filter: string) => updateParams({ filter }), [updateParams]);
  const setFrom = useCallback((from: string) => updateParams({ from }), [updateParams]);
  const setTo = useCallback((to: string) => updateParams({ to }), [updateParams]);
  const setSize = useCallback((size: number) => updateParams({ size }), [updateParams]);

  return {
    ...state,
    hasFromParam,
    setQuery,
    setFilter,
    setFrom,
    setTo,
    setSize,
    updateParams,
  };
}
