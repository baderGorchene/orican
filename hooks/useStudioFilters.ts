'use client';

import { useState, useMemo } from 'react';
import { GARMENT_MODELS } from '@/lib/constants';
import { GarmentCategory, ModelTier } from '@/lib/types';

export function useStudioFilters() {
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<'all' | ModelTier>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | GarmentCategory>('all');

  const filteredModels = useMemo(() => {
    return GARMENT_MODELS.filter((model) => {
      const matchesSearch =
        model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        model.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesTier = tierFilter === 'all' || model.tier === tierFilter;
      const matchesCategory = categoryFilter === 'all' || model.category === categoryFilter;
      return matchesSearch && matchesTier && matchesCategory;
    });
  }, [searchQuery, tierFilter, categoryFilter]);

  return {
    searchQuery,
    setSearchQuery,
    tierFilter,
    setTierFilter,
    categoryFilter,
    setCategoryFilter,
    filteredModels,
  };
}
